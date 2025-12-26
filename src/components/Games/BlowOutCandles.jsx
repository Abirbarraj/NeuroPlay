// src/components/BlowOutCandles.jsx
import React, { useEffect, useRef, useState } from "react";
// ❌ REMOVED: import { useNavigate } from "react-router-dom";
import yaySound from "../../assets/yay.mp3";
import popSound from "../../assets/pop.mp3";
import bunnyNormal from "../../assets/bunny-normal.png";
import bunnyHandUp from "../../assets/bunny-hand-up.png";

// ✅ CHANGED: Added onComplete prop
export default function BlowOutCandles({ duration = 10, onComplete }) {
  const DEBUG = true; // Set to true to see detection logs

  const [phase, setPhase] = useState("intro"); // intro | celebrating | countdown | playing | success | fail
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(duration);

  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const rafRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const lastSpikeAt = useRef(0);

  const successPlayed = useRef(false);
  const successAudio = useRef(null);
  const failAudio = useRef(null);

  // For sustained detection
  const consecutiveRef = useRef(0);

  // Relaxed thresholds for better blow detection
  const HF_RATIO_THRESHOLD = 0.35; // Reduced for easier detection
  const HF_ENERGY_THRESHOLD = 5000; // Reduced threshold
  const TOTAL_ENERGY_THRESHOLD = 9000; // Minimum overall loudness
  const MIN_MS_BETWEEN_DETECTIONS = 300;
  const REQUIRED_CONSECUTIVE_FRAMES = 3;

  // Helper function to save game result
  const saveGameResult = (success) => {
    try {
      const saved = localStorage.getItem('currentScreening');
      if (saved) {
        const data = JSON.parse(saved);
        data.gameResults = data.gameResults || {};
        data.gameResults.blowOutCandles = success ? 1 : 0;
        localStorage.setItem('currentScreening', JSON.stringify(data));
        if (DEBUG) console.log(`Saved blowOutCandles: ${success ? 'Success' : 'Failure'}`);
      }
    } catch (error) {
      console.error('Error saving game result:', error);
    }
  };

  useEffect(() => {
    successAudio.current = new Audio(yaySound);
    failAudio.current = new Audio(popSound);
  }, []);

  // Celebrating -> countdown transition
  useEffect(() => {
    if (phase === "celebrating") {
      const t = setTimeout(() => setPhase("countdown"), 1500);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // Countdown 3 -> 2 -> 1 -> playing
  useEffect(() => {
    if (phase === "countdown" && countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    } else if (phase === "countdown" && countdown === 0) {
      setPhase("playing");
      setTimeLeft(duration);
    }
  }, [phase, countdown, duration]);

  // Game timer
  useEffect(() => {
    if (phase !== "playing") return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          setPhase("fail");
          failAudio.current?.play();
          stopAudio();
          
          // ✅ SAVE FAILURE RESULT
          saveGameResult(false);
          
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  // Start detection when entering playing
  useEffect(() => {
    if (phase === "playing") {
      startBlowDetection();
    } else {
      stopAudio();
    }
    return () => stopAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Clean stop with robust checks
  const stopAudio = () => {
    try {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      analyserRef.current = null;
      dataArrayRef.current = null;

      if (audioCtxRef.current) {
        const ac = audioCtxRef.current;
        if (ac.state && ac.state !== "closed") {
          ac.close().catch(() => {});
        }
        audioCtxRef.current = null;
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => {
          try {
            t.stop();
          } catch (e) {}
        });
        mediaStreamRef.current = null;
      }
    } catch (e) {
      if (DEBUG) console.warn("stopAudio error", e);
    } finally {
      consecutiveRef.current = 0;
    }
  };

  // On success
  const triggerSuccess = () => {
    if (successPlayed.current) return;
    successPlayed.current = true;
    stopAudio();
    setPhase("success");
    successAudio.current?.play();
    
    // ✅ SAVE SUCCESS RESULT
    saveGameResult(true);
  };

  const reset = () => {
    stopAudio();
    successPlayed.current = false;
    setPhase("intro");
    setCountdown(3);
    setTimeLeft(duration);
  };

  // ✅ CHANGED: Use onComplete prop instead of navigate
  const goToNextGame = () => {
    stopAudio();
    if (onComplete) {
      onComplete(); // Call the parent's callback
    } else {
      // Fallback if onComplete not provided
      console.log("Game completed! No onComplete prop provided.");
    }
  };

  // Prevent multiple start calls
  const isDetectionRunning = () =>
    !!(audioCtxRef.current || analyserRef.current || mediaStreamRef.current);

  // Start blow detection
  const startBlowDetection = async () => {
    if (isDetectionRunning()) {
      if (DEBUG) console.log("Detection already running");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      mediaStreamRef.current = stream;

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024; // Reduced for faster processing
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

      source.connect(analyser);

      const detect = () => {
        if (phase !== "playing") return;

        const freqData = dataArrayRef.current;
        analyser.getByteFrequencyData(freqData);

        // Calculate energy in different frequency bands
        let totalEnergy = 0;
        let lowEnergy = 0;    // 0-500 Hz (voice fundamentals)
        let midEnergy = 0;    // 500-2000 Hz (voice harmonics)
        let highEnergy = 0;   // 2000-8000 Hz (blowing noise)

        const sampleRate = audioCtx.sampleRate;
        const binCount = analyser.frequencyBinCount;

        for (let i = 0; i < binCount; i++) {
          const freq = (i * sampleRate) / (binCount * 2);
          const energy = freqData[i];

          totalEnergy += energy;

          if (freq < 500) {
            lowEnergy += energy;
          } else if (freq < 2000) {
            midEnergy += energy;
          } else if (freq < 8000) {
            highEnergy += energy;
          }
        }

        const highRatio = totalEnergy > 0 ? highEnergy / totalEnergy : 0;
        const now = performance.now();

        if (DEBUG) {
          console.log(`TOTAL: ${Math.round(totalEnergy)}, HIGH: ${Math.round(highEnergy)}, RATIO: ${highRatio.toFixed(2)}`);
        }

        // SIMPLIFIED BLOW DETECTION:
        // Blowing typically has high total energy and decent high-frequency content
        const isBlowing = totalEnergy > TOTAL_ENERGY_THRESHOLD && 
                         highRatio > HF_RATIO_THRESHOLD &&
                         (now - lastSpikeAt.current) > MIN_MS_BETWEEN_DETECTIONS;

        if (isBlowing) {
          consecutiveRef.current += 1;
          if (DEBUG) console.log(`Blow detected! Consecutive: ${consecutiveRef.current}`);
        } else {
          consecutiveRef.current = Math.max(0, consecutiveRef.current - 1);
        }

        if (consecutiveRef.current >= REQUIRED_CONSECUTIVE_FRAMES) {
          lastSpikeAt.current = now;
          consecutiveRef.current = 0;
          if (DEBUG) console.log("SUCCESS: Blowing confirmed!");
          triggerSuccess();
          return;
        }

        rafRef.current = requestAnimationFrame(detect);
      };

      rafRef.current = requestAnimationFrame(detect);
    } catch (err) {
      console.warn("Microphone error:", err);
      alert("Please allow microphone access to play this game!");
      setPhase("intro");
      stopAudio();
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        position: "fixed",
        top: 0,
        left: 0,
        background: "linear-gradient(135deg, #ffe0f2 0%, #d0f4ff 100%)",
        fontFamily: "'Comic Neue', 'Comic Sans MS', cursive, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 10,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: 700,
          width: "100%",
          background: "rgba(255,255,255,0.97)",
          borderRadius: 30,
          padding: "25px 20px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
          border: "6px solid #ff99cc",
          textAlign: "center",
        }}
      >
        {/* INTRO */}
        {phase === "intro" && (
          <div style={{ animation: "bounce 2s infinite" }}>
            <img src={bunnyNormal} alt="Bunny" style={{ width: 180, marginBottom: 15 }} />
            <div
              style={{
                position: "relative",
                display: "inline-block",
                background: "white",
                padding: "15px 20px",
                borderRadius: 25,
                border: "5px solid #ff99cc",
                fontSize: "1.3rem",
                maxWidth: "90%",
                margin: "15px auto",
                boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
              }}
            >
              <div style={{ position: "absolute", left: -15, top: 25, fontSize: 50 }}>◄</div>
              Today is my birthday! My friends prepared a huuuge cake with A LOT of candles! Can you help me blow out the candles? I can't do it alone!
            </div>

            <button
              onClick={() => setPhase("celebrating")}
              style={{
                marginTop: 20,
                fontSize: "1.5rem",
                padding: "14px 40px",
                background: "#ff6ec4",
                color: "white",
                border: "none",
                borderRadius: 40,
                cursor: "pointer",
                boxShadow: "0 10px 25px rgba(255,110,196,0.5)",
              }}
            >
              Yes!
            </button>
          </div>
        )}

        {/* CELEBRATING / COUNTDOWN */}
        {(phase === "celebrating" || phase === "countdown") && (
          <>
            <img src={bunnyHandUp} alt="Excited Bunny" style={{ width: 220, marginBottom: 15 }} />
            <h2 style={{ fontSize: "2.5rem", margin: "15px 0" }}>
              {phase === "celebrating" ? "Yay! Thank you!" : countdown === 0 ? "GO!" : countdown}
            </h2>
            {phase === "countdown" && countdown === 0 && (
              <p style={{ fontSize: "1.2rem", color: "#666" }}>
                Blow into your microphone now! 💨
              </p>
            )}
          </>
        )}

        {/* GAME */}
        {phase === "playing" && (
          <>
            <div
              style={{
                fontSize: "2.2rem",
                fontWeight: "bold",
                color: timeLeft <= 5 ? "#ff3333" : "#ff6ec4",
                marginBottom: 15,
              }}
            >
              {timeLeft}s
            </div>
            <img src={bunnyHandUp} alt="Bunny waiting" style={{ width: 200, marginBottom: 15 }} />
            <p style={{ fontSize: "1.4rem", marginTop: 15, color: "#444" }}>Blow into your microphone! 💨</p>
            <p style={{ fontSize: "1rem", color: "#666", marginTop: 10 }}>
              Make sure your microphone can pick up your breath
            </p>
            {DEBUG && (
              <div style={{ marginTop: 10, padding: 10, background: "#f0f0f0", borderRadius: 10 }}>
                <small>Debug: Check console for detection logs</small>
              </div>
            )}
          </>
        )}

        {/* SUCCESS */}
        {phase === "success" && (
          <>
            <h2 style={{ fontSize: "3.5rem", color: "#00D4A0" }}>You Did It!</h2>
            <img src={bunnyHandUp} alt="Happy Bunny" style={{ width: 240 }} />
            <p style={{ fontSize: "1.6rem", margin: "15px 0" }}>The candles are out! 🎉</p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={reset}
                style={{
                  padding: "12px 25px",
                  background: "#4CAF50",
                  color: "white",
                  borderRadius: 40,
                  fontSize: "1.2rem",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Play Again
              </button>
              <button
                onClick={goToNextGame}
                style={{
                  padding: "12px 25px",
                  background: "#ff6ec4",
                  color: "white",
                  borderRadius: 40,
                  fontSize: "1.2rem",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Next Game →
              </button>
            </div>
          </>
        )}

        {/* FAIL */}
        {phase === "fail" && (
          <>
            <h2 style={{ fontSize: "2.8rem", color: "#ff6b6b" }}>Oh no!</h2>
            <img src={bunnyNormal} alt="Sad Bunny" style={{ width: 200, opacity: 0.8 }} />
            <p style={{ fontSize: "1.4rem", margin: "15px 0" }}>The candles are still burning! Let's try again!</p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={reset}
                style={{
                  padding: "12px 25px",
                  background: "#4CAF50",
                  color: "white",
                  borderRadius: 40,
                  fontSize: "1.2rem",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Try Again
              </button>
              <button
                onClick={goToNextGame}
                style={{
                  padding: "12px 25px",
                  background: "#ff6b6b",
                  color: "white",
                  borderRadius: 40,
                  fontSize: "1.2rem",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Next Game →
              </button>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
      `}</style>
    </div>
  );
}