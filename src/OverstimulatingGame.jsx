// src/OverstimulatingGame.jsx
import React, { useState, useEffect, useRef } from "react";
import Confetti from "react-confetti";
import { motion } from "framer-motion";
import bunnyImg from "./images/bunny-normal.png"; // <-- Import the image properly

const shapesData = [
  { id: 1, type: "triangle", startX: 50, startY: 80, targetXPercent: 90, targetY: 100, color: "#FF6B6B" },
  { id: 2, type: "circle", startX: 50, startY: 220, targetXPercent: 90, targetY: 220, color: "#FFD93D" },
  { id: 3, type: "rectangle", startX: 50, startY: 360, targetXPercent: 90, targetY: 360, color: "#6BCB77" },
  { id: 4, type: "star", startX: 50, startY: 500, targetXPercent: 90, targetY: 500, color: "#4D96FF" },
];

const floatingEmojis = ["✨", "🌈", "💖", "🎉", "🦄", "⭐", "🍭", "🎀", "🌸", "💫", "🔥", "⚡", "🌙", "🐱", "🌺", "🍩", "🍓"];
const neonColors = ["#FF00FF", "#00FFFF", "#FFFF00", "#FF0000", "#00FF00", "#FFA500", "#FF1493", "#7FFF00"];
const nyanEmojis = ["🐱🌈", "🌈🐱", "🐱💫"];

export default function OverstimulatingGameWithTimer({ finish }) {
  const [screen, setScreen] = useState("transition"); // transition -> game -> result
  const [shapes, setShapes] = useState(shapesData.map(s => ({ ...s, placed: false })));
  const [draggingId, setDraggingId] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [showConfetti, setShowConfetti] = useState(false);
  const [flash, setFlash] = useState(false);
  const [shake, setShake] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState(neonColors[0]);
  const [activeEmojis, setActiveEmojis] = useState([]);
  const [activeNyans, setActiveNyans] = useState([]);
  const [timeLeft, setTimeLeft] = useState(60);

  const bgAudio = useRef(new Audio("/images/sounds/backround.mp3"));
  const stabAudio = useRef(new Audio("/images/sounds/stab.mp3"));
  const bgAudioPlayed = useRef(false);
  const timerInterval = useRef(null);

  // -------------------- TIMER --------------------
  useEffect(() => {
    if (screen !== "game") return;
    timerInterval.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerInterval.current);
          stopBackgroundMusic();
          setScreen("result");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerInterval.current);
  }, [screen]);

  const stopBackgroundMusic = () => {
    bgAudio.current.pause();
    bgAudio.current.currentTime = 0;
    bgAudioPlayed.current = false;
  };

  // -------------------- GAME ANIMATIONS --------------------
  useEffect(() => {
    if (screen !== "game") return;

    const interval = setInterval(() => {
      setShapes(prev => prev.map(s => ({ ...s, x: s.x ? s.x + Math.random() * 10 - 5 : s.startX, y: s.y ? s.y + Math.random() * 10 - 5 : s.startY })));
    }, 300);

    const emojiInterval = setInterval(() => {
      const emoji = floatingEmojis[Math.floor(Math.random() * floatingEmojis.length)];
      setActiveEmojis(prev => [...prev, { id: Math.random(), emoji, x: Math.random() * window.innerWidth, y: window.innerHeight + 40 }]);
      if (Math.random() < 0.2) {
        const nyan = nyanEmojis[Math.floor(Math.random() * nyanEmojis.length)];
        setActiveNyans(prev => [...prev, { id: Math.random(), nyan, x: Math.random() * window.innerWidth, y: window.innerHeight + 40 }]);
      }
    }, 150);

    const neonInterval = setInterval(() => {
      setBackgroundColor(neonColors[Math.floor(Math.random() * neonColors.length)]);
    }, 80);

    return () => {
      clearInterval(interval);
      clearInterval(emojiInterval);
      clearInterval(neonInterval);
    };
  }, [screen]);

  // -------------------- DRAG HANDLERS --------------------
  const handleMouseDown = (e, shape) => {
    setDraggingId(shape.id);
    setOffset({ x: e.clientX - (shape.x || shape.startX), y: e.clientY - (shape.y || shape.startY) });

    if (!bgAudioPlayed.current) {
      bgAudio.current.loop = true;
      bgAudio.current.volume = 0.2;
      bgAudio.current.play().catch(() => {});
      bgAudioPlayed.current = true;
    }
  };

  const handleMouseMove = (e) => {
    if (!draggingId) return;
    setShapes(prev => prev.map(s => s.id === draggingId ? { ...s, x: e.clientX - offset.x, y: e.clientY - offset.y } : s));
  };

  const handleMouseUp = () => {
    if (!draggingId) return;
    setShapes(prev => {
      let newShapes = prev.map(s => {
        if (s.id === draggingId) {
          const targetX = window.innerWidth * (s.targetXPercent / 100);
          const dx = (s.x || s.startX) - targetX;
          const dy = (s.y || s.startY) - s.targetY;
          const distance = Math.hypot(dx, dy);

          if (distance < 60) {
            stabAudio.current.currentTime = 0;
            stabAudio.current.play();
            return { ...s, x: targetX, y: s.targetY, placed: true };
          }

          setShake(true);
          setFlash(true);
          setTimeout(() => setShake(false), 250);
          setTimeout(() => setFlash(false), 100);
          return { ...s, x: s.startX, y: s.startY };
        }
        return s;
      });

      if (newShapes.every(s => s.placed)) {
        clearInterval(timerInterval.current);
        stopBackgroundMusic();
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2500);
        setScreen("result");
      }

      return newShapes;
    });

    setDraggingId(null);
  };

  const shapeSymbols = { triangle: "▲", circle: "●", rectangle: "▭", star: "★" };

  // -------------------- SAVE RESULT --------------------
  useEffect(() => {
    if (screen === "result") {
      const allPlaced = shapes.every(s => s.placed);
      const currentScreening = JSON.parse(localStorage.getItem("currentScreening")) || {};
      currentScreening.gameResults = { ...currentScreening.gameResults, overstim: allPlaced ? 1 : 0 };
      localStorage.setItem("currentScreening", JSON.stringify(currentScreening));
    }
  }, [screen, shapes]);

  // -------------------- RENDER --------------------
  if (screen === "transition") {
    return (
      <div style={{ textAlign: "center", padding: "20px", fontFamily: "'Poppins', sans-serif", background: "linear-gradient(135deg, #E0F7FA 0%, #F8F0FF 100%)", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <h2 style={{ color: "#ec4899", fontSize: "clamp(1.8rem, 5vw, 3rem)", marginBottom: "25px", fontWeight: "700", textShadow: "0 0 10px rgba(236, 72, 153, 0.4)" }}>Get Ready: Overstimulated Shapes! ⚡🎉</h2>
        <div style={{ background: "rgba(255, 255, 255, 0.95)", padding: "30px 35px", borderRadius: "35px", maxWidth: "600px", margin: "0 auto 30px", fontSize: "20px", fontWeight: "600", boxShadow: "0 25px 60px rgba(0,0,0,0.18)", border: "5px solid #FFC5D0" }}>
          In this game, your child will:
          <ul style={{ textAlign: "left", marginTop: "10px", fontSize: "18px", lineHeight: "1.5", paddingLeft: "20px" }}>
            <li>🖱 Drag colorful shapes to their matching targets</li>
            <li>⚡ Watch out for flashing lights, moving shapes, and fun chaos!</li>
            <li>⏱ Try to finish all shapes within 1 minute</li>
          </ul>
        </div>
        <button onClick={() => { setShapes(shapesData.map(s => ({ ...s, placed: false }))); setTimeLeft(60); setScreen("game"); }} style={{ padding: "18px 80px", fontSize: "clamp(1.5rem, 4vw, 2.2rem)", background: "linear-gradient(45deg, #FFC5D0, #B2F2BB)", color: "white", border: "none", borderRadius: "60px", cursor: "pointer", boxShadow: "0 15px 35px rgba(255,193,208,.5)", fontWeight: "700", fontFamily: "'Poppins', sans-serif" }}>Start Game</button>
      </div>
    );
  }

  if (screen === "result") {
    const allPlaced = shapes.every(s => s.placed);
    const message = allPlaced ? "🎉 You Won!" : "😢 Oops, you didn’t finish in time!";

    return (
      <div style={{ textAlign: "center", padding: "20px", fontFamily: "'Poppins', sans-serif", background: "linear-gradient(135deg, #E0F7FA 0%, #F8F0FF 100%)", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <h2 style={{ color: "#ec4899", fontSize: "clamp(2rem, 6vw, 3rem)", marginBottom: "20px", fontWeight: "700", textShadow: "0 0 10px rgba(236, 72, 153, 0.4)" }}>{message}</h2>
        <img src={bunnyImg} alt="bunny" style={{ width: "200px", marginBottom: "25px" }} /> {/* <-- Fixed image */}
        <button onClick={() => { setShapes(shapesData.map(s => ({ ...s, placed: false }))); setTimeLeft(60); setScreen("transition"); stopBackgroundMusic(); finish(); }} style={{ padding: "18px 80px", fontSize: "clamp(1.5rem, 4vw, 2.2rem)", background: "linear-gradient(45deg, #FFC5D0, #B2F2BB)", color: "white", border: "none", borderRadius: "60px", cursor: "pointer", boxShadow: "0 15px 35px rgba(255,193,208,.5)", fontWeight: "700", fontFamily: "'Poppins', sans-serif" }}>Next</button>
      </div>
    );
  }

  return (
    <div onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} style={{ width: "100vw", height: "100vh", position: "relative", overflow: "hidden", background: flash ? neonColors[Math.floor(Math.random() * neonColors.length)] : backgroundColor, transition: "background 0.05s", transform: shake ? `translate(${Math.random() * 30 - 15}px, ${Math.random() * 30 - 15}px)` : "none" }}>
      <div style={{ position: "absolute", top: "15px", left: "50%", transform: "translateX(-50%)", fontSize: "2rem", fontWeight: "700", color: "#fff", textShadow: "0 0 10px #000", zIndex: 1000 }}>⏱ {timeLeft}s</div>
      {showConfetti && <Confetti numberOfPieces={600} recycle={false} gravity={1.5} />}
      {activeEmojis.map(e => <motion.div key={e.id} initial={{ x: e.x, y: e.y, scale: 0.5, opacity: 0.8 }} animate={{ y: -120, rotate: Math.random() * 1080 }} transition={{ duration: 3 + Math.random() * 2, ease: "easeOut" }} style={{ position: "absolute", fontSize: `${30 + Math.random() * 60}px`, pointerEvents: "none" }}>{e.emoji}</motion.div>)}
      {activeNyans.map(n => <motion.div key={n.id} initial={{ x: n.x, y: n.y, scale: 0.7, opacity: 0.9 }} animate={{ y: -200, rotate: Math.random() * 1080 }} transition={{ duration: 4 + Math.random() * 2, ease: "linear" }} style={{ position: "absolute", fontSize: `${50 + Math.random() * 40}px`, pointerEvents: "none" }}>{n.nyan}</motion.div>)}
      {shapes.map(shape => (
        <motion.div key={shape.id} onMouseDown={e => handleMouseDown(e, shape)} animate={{ scale: draggingId === shape.id ? 1.4 : 1, rotate: draggingId === shape.id ? Math.random() * 30 - 15 : Math.random() * 6 - 3, filter: draggingId === shape.id ? "drop-shadow(0 0 20px white)" : "none" }} transition={{ type: "spring", stiffness: 500 }} style={{ position: "absolute", left: shape.x || shape.startX, top: shape.y || shape.startY, width: 140, height: 140, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "66px", background: shape.color, borderRadius: shape.type === "circle" ? "50%" : "20px", cursor: "grab", color: "white", fontWeight: "bold", boxShadow: "0 16px 30px rgba(0,0,0,0.4)", userSelect: "none" }}>{shapeSymbols[shape.type]}</motion.div>
      ))}
      {shapes.map(shape => {
        const targetX = window.innerWidth * (shape.targetXPercent / 100);
        return <div key={`target-${shape.id}`} style={{ position: "absolute", left: targetX, top: shape.targetY, width: 140, height: 140, border: "6px dashed white", borderRadius: shape.type === "circle" ? "50%" : "20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "64px", color: "white", opacity: 0.7, pointerEvents: "none" }}>{shapeSymbols[shape.type]}</div>;
      })}
    </div>
  );
}
