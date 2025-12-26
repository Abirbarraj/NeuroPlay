// src/components/ImitationGame.jsx
import React, { useRef, useEffect, useState } from "react";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";
import waveGif from "../../assets/wave.gif";
import coverEyesGif from "../../assets/coverEyes.gif";

export default function ImitaGame({ onComplete }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null);
  const handsRef = useRef(null);

  const [phase, setPhase] = useState("ready");
  const [timeLeft, setTimeLeft] = useState(5);
  const [message, setMessage] = useState("");
  const [currentTask, setCurrentTask] = useState("wave");

  // Improved wave detection state
  const waveDetectionRef = useRef({
    xHistory: [],
    lastDirection: null,
    directionChanges: 0,
    lastChangeTime: 0,
    totalMovement: 0
  });

  // Peekaboo detection state
  const peekabooDetectionRef = useRef({
    consecutiveFrames: 0,
    lastHandPosition: null,
    handStable: false
  });

  const successTimerRef = useRef(null);
  const consecutiveDetectionsRef = useRef(0);
  const animationFrameRef = useRef(null);

  // ✅ ADDED: Helper function to save game results
  const saveGameResult = (success, taskCompleted) => {
    try {
      const saved = localStorage.getItem('currentScreening');
      if (saved) {
        const data = JSON.parse(saved);
        data.gameResults = data.gameResults || {};
        
        // Save wave game results
        data.gameResults.waveGame = success ? 1 : 0;
        data.gameResults.waveCompletedAt = new Date().toISOString();
        
        // Track which tasks were completed
        if (taskCompleted === 'both') {
          data.gameResults.waveTasks = 'wave-and-peekaboo';
        } else if (taskCompleted === 'wave') {
          data.gameResults.waveTasks = 'wave-only';
        } else if (taskCompleted === 'peekaboo') {
          data.gameResults.waveTasks = 'peekaboo-only';
        }
        
        localStorage.setItem('currentScreening', JSON.stringify(data));
        console.log(`Saved wave game: ${success ? 'Success' : 'Failure'}, tasks: ${taskCompleted}`);
      }
    } catch (error) {
      console.error('Error saving wave game result:', error);
    }
  };

  // 🔥 FIX: Safe canvas context access
  const getCanvasContext = () => {
    if (!canvasRef.current) {
      console.warn("Canvas element not available");
      return null;
    }
    
    try {
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) {
        console.warn("Canvas context not available");
        return null;
      }
      return ctx;
    } catch (error) {
      console.error("Error getting canvas context:", error);
      return null;
    }
  };

  const detectWave = (landmarks) => {
    if (!landmarks || landmarks.length === 0) return false;

    const indexTip = landmarks[0][8];
    const currentX = indexTip.x;
    const currentTime = Date.now();

    const detection = waveDetectionRef.current;

    detection.xHistory.push({ x: currentX, time: currentTime });
    detection.xHistory = detection.xHistory.filter(
      point => currentTime - point.time < 1000
    );

    if (detection.xHistory.length < 5) return false;

    const recentPoints = detection.xHistory.slice(-5);
    const minX = Math.min(...recentPoints.map(p => p.x));
    const maxX = Math.max(...recentPoints.map(p => p.x));
    const currentMovement = maxX - minX;

    const firstX = detection.xHistory[0].x;
    const lastX = detection.xHistory[detection.xHistory.length - 1].x;
    const currentDirection = lastX > firstX ? 'right' : 'left';

    if (detection.lastDirection && detection.lastDirection !== currentDirection) {
      if (currentMovement > 0.08) {
        const timeSinceLastChange = currentTime - detection.lastChangeTime;
        if (timeSinceLastChange > 200) {
          detection.directionChanges++;
          detection.lastChangeTime = currentTime;
        }
      }
    }

    detection.lastDirection = currentDirection;
    detection.totalMovement = currentMovement;

    const isWave = detection.directionChanges >= 2 && 
                   detection.totalMovement > 0.15;

    return isWave;
  };

  const detectCoverEyes = (landmarks) => {
    if (!landmarks || landmarks.length === 0) return false;

    const hand = landmarks[0];
    
    // Get key landmarks
    const wrist = hand[0];
    const indexTip = hand[8];
    const middleTip = hand[12];
    const thumbTip = hand[4];
    const pinkyTip = hand[20];

    // MULTIPLE DETECTION METHODS
    const isHandNearFace = wrist.y > 0.4 && indexTip.y < 0.6 && middleTip.y < 0.6;

    // Calculate distances between fingertips
    const indexMiddleDist = Math.sqrt(
      Math.pow(indexTip.x - middleTip.x, 2) + 
      Math.pow(indexTip.y - middleTip.y, 2)
    );
    
    const thumbIndexDist = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) + 
      Math.pow(thumbTip.y - indexTip.y, 2)
    );

    const fingersClustered = indexMiddleDist < 0.15 && thumbIndexDist < 0.25;
    const handInFaceArea = indexTip.x > 0.2 && indexTip.x < 0.8 && 
                          indexTip.y > 0.1 && indexTip.y < 0.6;
    const isPalmFacingFace = wrist.y > indexTip.y && wrist.y > middleTip.y;

    // Check if hand is relatively stable
    const detection = peekabooDetectionRef.current;
    const currentHandPos = { x: wrist.x, y: wrist.y };
    
    if (detection.lastHandPosition) {
      const movement = Math.sqrt(
        Math.pow(currentHandPos.x - detection.lastHandPosition.x, 2) +
        Math.pow(currentHandPos.y - detection.lastHandPosition.y, 2)
      );
      detection.handStable = movement < 0.05;
    }
    detection.lastHandPosition = currentHandPos;

    // COMBINE MULTIPLE DETECTION METHODS
    const conditions = [
      isHandNearFace,
      fingersClustered,
      handInFaceArea,
      isPalmFacingFace,
      detection.handStable
    ];

    const trueConditions = conditions.filter(Boolean).length;
    const isCoveringEyes = trueConditions >= 3;

    // Track consecutive frames for stability
    if (isCoveringEyes) {
      detection.consecutiveFrames++;
    } else {
      detection.consecutiveFrames = Math.max(0, detection.consecutiveFrames - 1);
    }

    // Require hand to be stable in covering position for a moment
    return detection.consecutiveFrames >= 5;
  };

  const stopCamera = () => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    if (handsRef.current) {
      handsRef.current.close();
      handsRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const resetWaveDetection = () => {
    waveDetectionRef.current = {
      xHistory: [],
      lastDirection: null,
      directionChanges: 0,
      lastChangeTime: 0,
      totalMovement: 0
    };
  };

  const resetPeekabooDetection = () => {
    peekabooDetectionRef.current = {
      consecutiveFrames: 0,
      lastHandPosition: null,
      handStable: false
    };
  };

  const startCamera = async () => {
    // Stop any existing camera first
    stopCamera();

    // 🔥 FIX: Check if video element exists
    if (!videoRef.current) {
      console.error("Video element not found");
      setMessage("Camera not available. Please refresh.");
      return;
    }

    try {
      const hands = new Hands({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });

      hands.onResults((results) => {
        // 🔥 FIX: Check if canvas exists
        if (!canvasRef.current) {
          console.warn("Canvas not available yet");
          return;
        }

        const ctx = getCanvasContext();
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        // Draw camera feed if available
        if (results.image) {
          try {
            ctx.drawImage(
              results.image,
              0,
              0,
              canvasRef.current.width,
              canvasRef.current.height
            );
          } catch (drawError) {
            console.warn("Error drawing image:", drawError);
          }
        }

        // Process hand detection
        if (results.multiHandLandmarks?.length > 0) {
          let detected = false;
          
          if (currentTask === "wave") {
            detected = detectWave(results.multiHandLandmarks);
          } else if (currentTask === "coverEyes") {
            detected = detectCoverEyes(results.multiHandLandmarks);
          }

          if (detected) {
            consecutiveDetectionsRef.current++;
            
            const requiredConsecutive = currentTask === "wave" ? 2 : 3;
            
            if (consecutiveDetectionsRef.current >= requiredConsecutive) {
              handleSuccess();
            } else {
              setMessage(`Almost! Keep going... (${consecutiveDetectionsRef.current}/${requiredConsecutive})`);
            }
          } else {
            consecutiveDetectionsRef.current = 0;
            if (currentTask === "wave") {
              const progress = waveDetectionRef.current.directionChanges;
              if (progress > 0) {
                setMessage(`Good! ${progress}/2 direction changes`);
              } else {
                setMessage("Move your hand left and right! 👋");
              }
            } else {
              const detection = peekabooDetectionRef.current;
              if (detection.consecutiveFrames > 0) {
                setMessage(`Good! Hold it there... (${detection.consecutiveFrames}/5)`);
              } else {
                setMessage("Cover your eyes with your hand! 🙈");
              }
            }
          }
        } else {
          consecutiveDetectionsRef.current = 0;
          setMessage(currentTask === "wave" ? "Show me your hand! 👋" : "Show me your hand! 🙈");
        }
      });

      // 🔥 FIX: Initialize camera with error handling
      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (!videoRef.current) return;
          try {
            await hands.send({ image: videoRef.current });
          } catch (error) {
            console.warn("Error sending frame to hands model:", error);
          }
        },
        width: 640,
        height: 480,
      });

      await camera.start();
      
      handsRef.current = hands;
      cameraRef.current = camera;
      
    } catch (error) {
      console.error("Error starting camera:", error);
      setMessage("Camera error. Please check permissions.");
    }
  };

  const handleSuccess = () => {
    setMessage("Good job!");
    setPhase("success");
    stopCamera();

    // ✅ ADDED: Save game result
    if (currentTask === "wave") {
      // Save wave success, but not complete yet (still need peekaboo)
      saveGameResult(true, 'wave');
    } else {
      // Both tasks completed (wave + peekaboo)
      saveGameResult(true, 'both');
    }

    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
    }

    if (currentTask === "wave") {
      successTimerRef.current = setTimeout(() => {
        setCurrentTask("coverEyes");
        setPhase("ready");
        setMessage("");
        setTimeLeft(15);
        resetWaveDetection();
        resetPeekabooDetection();
        consecutiveDetectionsRef.current = 0;
      }, 2000);
    } else {
      successTimerRef.current = setTimeout(() => {
        onComplete && onComplete();
      }, 1500);
    }
  };

  const handleFailure = () => {
    setPhase("fail");
    setMessage("Let's try again!");
    stopCamera();

    // ✅ ADDED: Save failure result
    if (currentTask === "wave") {
      saveGameResult(false, 'wave');
    } else {
      saveGameResult(false, 'peekaboo');
    }

    if (currentTask === "wave") {
      setTimeout(() => {
        setCurrentTask("coverEyes");
        setPhase("ready");
        setMessage("");
        setTimeLeft(15);
        resetWaveDetection();
        resetPeekabooDetection();
        consecutiveDetectionsRef.current = 0;
      }, 2000);
    } else {
      setTimeout(() => {
        setPhase("ready");
        setMessage("");
        setTimeLeft(15);
        resetPeekabooDetection();
        consecutiveDetectionsRef.current = 0;
      }, 2000);
    }
  };

  // Timer for game phase
  useEffect(() => {
    if (phase !== "playing") return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          handleFailure();
          return currentTask === "wave" ? 7 : 15;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, currentTask]);

  // Initialize canvas dimensions
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = 640;
      canvasRef.current.height = 480;
    }
  }, []);

  const startGame = () => {
    setPhase("playing");
    setTimeLeft(currentTask === "wave" ? 7 : 15);
    setMessage("");
    
    if (currentTask === "wave") {
      resetWaveDetection();
    } else {
      resetPeekabooDetection();
    }
    
    consecutiveDetectionsRef.current = 0;
    
    // 🔥 FIX: Small delay to ensure DOM elements are ready
    setTimeout(() => {
      startCamera();
    }, 100);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  const getTaskInstructions = () => {
    if (currentTask === "wave") {
      return "Wave your hand left and right! 👋";
    } else {
      return "Cover your eyes with your hand! 🙈";
    }
  };

  const getTaskGif = () => {
    return currentTask === "wave" ? waveGif : coverEyesGif;
  };

  const getTaskTitle = () => {
    return currentTask === "wave" ? "Wave Hello!" : "Peek-a-boo!";
  };

  // 🔥 FIX: If assets don't exist, use placeholders
  const safeWaveGif = waveGif || "https://media.giphy.com/media/l1J9RFoDzCDrkqtEc/giphy.gif";
  const safeCoverEyesGif = coverEyesGif || "https://media.giphy.com/media/3o7TKsQ8gTp3WqXq1q/giphy.gif";

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "linear-gradient(135deg, #ffe0f2 0%, #d0f4ff 100%)",
        fontFamily: "'Comic Neue', 'Comic Sans MS', cursive, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          maxWidth: 800,
          width: "100%",
          background: "rgba(255,255,255,0.98)",
          borderRadius: 40,
          padding: 40,
          border: "8px solid #ff99cc",
          textAlign: "center",
          boxShadow: "0 20px 40px rgba(255, 105, 180, 0.3)",
        }}
      >
        {phase === "ready" && (
          <>
            <h1
              style={{
                fontSize: "clamp(3rem, 8vw, 5rem)",
                background: "linear-gradient(90deg, #ff6ec4, #7873f5)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                marginBottom: "20px",
              }}
            >
              {getTaskTitle()}
            </h1>

            <img
              src={currentTask === "wave" ? safeWaveGif : safeCoverEyesGif}
              alt={currentTask}
              style={{ 
                width: 220, 
                height: 220,
                objectFit: 'contain',
                borderRadius: 20, 
                margin: "20px auto",
                display: "block"
              }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = currentTask === "wave" 
                  ? "https://media.giphy.com/media/l1J9RFoDzCDrkqtEc/giphy.gif"
                  : "https://media.giphy.com/media/3o7TKsQ8gTp3WqXq1q/giphy.gif";
              }}
            />

            <p style={{ fontSize: "2rem", marginTop: 20, color: "#555" }}>
              {getTaskInstructions()}
            </p>

            {currentTask === "wave" && (
              <div style={{ marginTop: 10, fontSize: "1.2rem", color: "#666" }}>
                <p>💡 Make clear left-right movements with your hand</p>
              </div>
            )}

            {currentTask === "coverEyes" && (
              <div style={{ marginTop: 10, fontSize: "1.2rem", color: "#666" }}>
                <p>💡 Put your hand in front of your face like peek-a-boo!</p>
                <p>💡 You can use one or two hands!</p>
                <p>💡 Hold it still for a moment</p>
              </div>
            )}

            <button
              onClick={startGame}
              style={{
                padding: "18px 50px",
                fontSize: "2rem",
                background: "linear-gradient(90deg, #ff6ec4, #7873f5)",
                color: "white",
                border: "none",
                borderRadius: 50,
                cursor: "pointer",
                marginTop: 30,
                fontWeight: "bold",
                boxShadow: "0 8px 20px rgba(255, 110, 196, 0.4)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "scale(1.05)";
                e.target.style.boxShadow = "0 12px 25px rgba(255, 110, 196, 0.6)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "scale(1)";
                e.target.style.boxShadow = "0 8px 20px rgba(255, 110, 196, 0.4)";
              }}
            >
              Start Game
            </button>
          </>
        )}

        {phase === "playing" && (
          <>
            <img
              src={currentTask === "wave" ? safeWaveGif : safeCoverEyesGif}
              alt={currentTask}
              style={{ 
                width: 180, 
                height: 180,
                objectFit: 'contain',
                borderRadius: 20, 
                margin: "0 auto 20px",
                display: "block"
              }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = currentTask === "wave" 
                  ? "https://media.giphy.com/media/l1J9RFoDzCDrkqtEc/giphy.gif"
                  : "https://media.giphy.com/media/3o7TKsQ8gTp3WqXq1q/giphy.gif";
              }}
            />
            <h2 style={{ fontSize: "2.8rem", margin: "10px 0", color: "#ff6ec4" }}>
              {currentTask === "wave" ? "Wave your hand!" : "Cover your eyes!"}
            </h2>

            <div
              style={{
                fontSize: "3rem",
                marginTop: 10,
                color: timeLeft <= 5 ? "#ff3333" : "#ff6ec4",
                fontWeight: "bold",
              }}
            >
              ⏱️ {timeLeft}s
            </div>

            {message && (
              <h3
                style={{
                  fontSize: "2rem",
                  color: message.includes("Almost") || message.includes("Good") ? "#ff9900" : "#00D4A0",
                  marginTop: 20,
                  minHeight: "60px",
                  padding: "10px",
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  borderRadius: "20px",
                }}
              >
                {message}
              </h3>
            )}

            <video 
              ref={videoRef} 
              style={{ display: "none" }} 
            />

            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              style={{
                width: "100%",
                maxWidth: 500,
                borderRadius: 30,
                marginTop: 20,
                border: "5px solid #ff99cc",
                backgroundColor: "#f0f0f0",
              }}
            />

            {currentTask === "coverEyes" && (
              <div style={{ marginTop: 20, fontSize: "1.5rem", color: "#666" }}>
                <p>💡 Try different ways: one hand, two hands, or peek-a-boo style!</p>
              </div>
            )}
          </>
        )}

        {phase === "success" && (
          <>
            <h1
              style={{
                fontSize: "4rem",
                background: "linear-gradient(90deg, #00D4A0, #7873f5)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                marginBottom: "20px",
              }}
            >
              🎉 Great job! 🎉
            </h1>
            <div style={{ fontSize: "6rem", margin: "20px 0" }}>
              {currentTask === "wave" ? "👋" : "🙈"}
            </div>
            <p style={{ fontSize: "2rem", marginTop: 20, color: "#555" }}>
              {currentTask === "wave" 
                ? "You waved perfectly!" 
                : "Peek-a-boo! Great job!"
              }
            </p>
            {currentTask === "wave" && (
              <p style={{ fontSize: "1.5rem", marginTop: 10, color: "#666" }}>
                Next: Peek-a-boo!
              </p>
            )}
          </>
        )}

        {phase === "fail" && (
          <>
            <h1 style={{ fontSize: "4rem", color: "#ff3333", marginBottom: "20px" }}>
              😅 Try again!
            </h1>
            <div style={{ fontSize: "6rem", margin: "20px 0" }}>
              ❤️
            </div>
            <p style={{ fontSize: "2rem", marginTop: 20, color: "#555" }}>
              {currentTask === "wave" 
                ? "Let's try peek-a-boo instead!" 
                : "Don't worry, let's try again!"
              }
            </p>
          </>
        )}
      </div>
    </div>
  );
}