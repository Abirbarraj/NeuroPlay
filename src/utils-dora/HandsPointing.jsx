// src/utils-dora/HandsPointing.jsx   ← Your file, now slightly upgraded
import React, { useEffect, useRef, useState } from "react";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

export default function HandsPointing({ 
  onPointing,      // ← NEW: tells parent when pointing
  showPreview = true  // ← NEW: hide preview in final game if you want
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isPointing, setIsPointing] = useState(false);

  // This buffer makes it feel 100% smooth
  const recentFrames = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");

    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults((results) => {
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

      let rawPointing = false;

      if (results.multiHandLandmarks?.[0]) {
        const lm = results.multiHandLandmarks[0];
        const w = canvas.width;
        const h = canvas.height;

        const indexMcp = lm[5];
        const middleMcp = lm[9];
        const ringMcp = lm[13];
        const pinkyMcp = lm[17];

        const dist = (tip, mcp) => Math.hypot(tip.x - mcp.x, tip.y - mcp.y);

        const indexLen = dist(lm[8], indexMcp);
        const middleLen = dist(lm[12], middleMcp);
        const ringLen = dist(lm[16], ringMcp);
        const pinkyLen = dist(lm[20], pinkyMcp);

        const indexIsLongest = indexLen > middleLen * 1.1 && indexLen > ringLen * 1.1 && indexLen > pinkyLen * 1.1;
        const othersShorter = middleLen < indexLen * 0.9 && ringLen < indexLen * 0.9 && pinkyLen < indexLen * 0.9;

        if (indexIsLongest && othersShorter) {
          rawPointing = true;

          ctx.strokeStyle = "#00ff88";
          ctx.lineWidth = 14;
          ctx.shadowBlur = 20;
          ctx.shadowColor = "#00ff88";
          ctx.beginPath();
          ctx.moveTo(lm[5].x * w, lm[5].y * h);
          ctx.lineTo(lm[8].x * w, lm[8].y * h);
          ctx.stroke();

          const angle = Math.atan2(lm[8].y * h - lm[5].y * h, lm[8].x * w - lm[5].x * w);
          const len = 50;
          ctx.fillStyle = "#00ff88";
          ctx.beginPath();
          ctx.moveTo(lm[8].x * w, lm[8].y * h);
          ctx.lineTo(lm[8].x * w - len * Math.cos(angle - 0.5), lm[8].y * h - len * Math.sin(angle - 0.5));
          ctx.lineTo(lm[8].x * w - len * Math.cos(angle + 0.5), lm[8].y * h - len * Math.sin(angle + 0.5));
          ctx.closePath();
          ctx.fill();
        }
      }

      // Smooth detection
      recentFrames.current.push(rawPointing);
      if (recentFrames.current.length > 20) recentFrames.current.shift();
      const smoothPointing = recentFrames.current.some(Boolean);

      setIsPointing(smoothPointing);
      onPointing?.(smoothPointing);   // ← This tells MapStage

      ctx.restore();
    });

    const camera = new Camera(video, {
      onFrame: async () => await hands.send({ image: video }),
      width: 640,
      height: 480,
      facingMode: "user",
    });
    camera.start();

    return () => camera.stop();
  }, [onPointing]);

  return (
    <>
      <video ref={videoRef} style={{ display: "none" }} playsInline />
      {showPreview && (
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          style={{
            
            
            maxWidth: "100%",
            height: "auto",
            
          }}
        />
      )}
      {showPreview && (
        <h2 style={{
          marginTop: "20px",
          fontSize: "70px",
          fontWeight: "bold",
          color: isPointing ? "#00ff88" : "#ff4444",
          textShadow: isPointing ? "0 0 40px #00ff88" : "none",
        }}>
          {isPointing ? "POINTING!" : "Point anywhere!"}
        </h2>
      )}
    </>
  );
}