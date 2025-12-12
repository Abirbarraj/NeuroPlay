import React, { useState, useEffect } from "react";
import HandsPointing from "../utils-dora/HandsPointing";

export default function MapStage({ next, onMessageShown }) {
  const [yay, setYay] = useState(false);

  useEffect(() => {
    if (yay) {
      onMessageShown?.();
    }
  }, [yay, onMessageShown]);

  return (
    <div style={{ position: "relative" }}>
      
      {/* SMALL webcam detector in the corner */}
      <div
        style={{
          position: "fixed",
          top: "20px",
          left: "20px",
          width: "120px",
          height: "90px",
          zIndex: 200,
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 0 10px rgba(0,0,0,0.2)",
        }}
      >
        <HandsPointing onPointing={setYay} small />
      </div>

      {/* Map image */}
      <img
        src="/images/images-dora/map-background.png"
        alt="Map"
        style={{
          maxWidth: "66%",
          borderRadius: "30px",
          display: "block",
          margin: "0 auto",
        }}
      />

      {/* Dialogue bubble */}
      <div
        style={{
          background: "white",
          padding: "20px 30px",
          borderRadius: "35px",
          border: "8px solid #ec4899",
          fontSize: "24px",
          fontWeight: "bold",
          maxWidth: "90%",
          textAlign: "center",
          position: "absolute",
          bottom: "70px",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        can u point at the Amusement parck!
      </div>

      {/* Button */}
      <button
        onClick={next}
        style={{
          padding: "10px 30px",
          fontSize: "24px",
          background: "#f50bd6ff",
          color: "white",
          border: "none",
          borderRadius: "30px",
          cursor: "pointer",
          position: "absolute",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        Found the park!
      </button>

      {/* YAY notification */}
      {yay && (
        <div
          style={{
            position: "fixed",
            bottom: "30px",
            right: "30px",
            background: "#ff69b4",
            color: "white",
            padding: "25px 40px",
            fontSize: "40px",
            borderRadius: "40px",
            zIndex: 300,
            boxShadow: "0 0 20px rgba(255,105,180,0.5)",
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          YAY!
        </div>
      )}
    </div>
  );
}
