import React, { useEffect } from "react";  

export default function ParkStage({ next }) {
  // --- ADD THIS PART ---
  useEffect(() => {
    const audio = new Audio("/images/sounds/celebration.wav");  // ← your file path
    audio.volume = 1;  // optional
    audio.play();
  }, []);
  // ----------------------
  return (
    <div style={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "5px"
    }}>
      <img 
        src="/images/images-dora/park-scene.png" 
        alt="Amusement park"
        style={{ maxWidth: "50%" }} 
      />
      

      {/* Bulle de dialogue */}
      <div style={{
        background: "white",
        padding: "20px 30px",
        borderRadius: "50px",
        border: "12px solid #ec4899",
        fontSize: "24px",
        fontWeight: "bold",
        maxWidth: "90%",
        textAlign: "center"
      }}>
       thank u! i found my friend and now  i want to get ice-cream 
      </div>

      <button onClick={next} style={{
        padding: "15px 30px",
        fontSize: "24px",
        background: "#10b981",
        color: "white",
        border: "none",
        borderRadius: "40px",
        margin: "8px auto 0 auto" ,// adjust spacing
        cursor: "pointer"
      }}>
        Next → Ice Cream!
      </button>
    </div>
  );
}