import React, { useState, useEffect } from "react";
import HandsPointing from "../utils-dora/HandsPointing";

export default function IceCreamStage({ next, onMessageShown }) {
  const [yay, setYay] = useState(false);

  useEffect(() => {
    if (yay) {
      onMessageShown?.();
    }
  }, [yay, onMessageShown]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: "5px",
        padding: "10px 0",
        position: "relative",
        width: "100%",
      }}
    >
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

      {/* Ice cream image */}
      <img
        src="/images/images-dora/ice-cream-truck.png"
        alt="Ice cream"
        style={{ maxWidth: "65%", borderRadius: "30px" }}
      />

      {/* Overlay container */}
      <div
        style={{
          position: "absolute",
          bottom: "10px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "2px",
        }}
      >
        {/* Dialogue bubble */}
        <div
          style={{
            background: "white",
            padding: "10px 15px",
            borderRadius: "50px",
            border: "6px solid #ec4899",
            fontSize: "24px",
            fontWeight: "bold",
            maxWidth: "100%",
            textAlign: "center",
          }}
        >
          can u help me point out the icecream truck!
        </div>

        {/* Button */}
        <button
          onClick={next}
          style={{
            padding: "10px 20px",
            fontSize: "24px",
            background: "#ec4899",
            color: "white",
            border: "none",
            borderRadius: "40px",
            cursor: "pointer",
            display: "block",
          }}
        >
          → End
        </button>
      </div>

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
