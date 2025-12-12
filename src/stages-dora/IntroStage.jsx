import React, { useEffect, useState } from "react";

export default function IntroStage({ next }) {
  const [screen, setScreen] = useState("transition"); // NEW

  // Play sound ONLY on Dora intro (not on transition)
  useEffect(() => {
    if (screen === "intro") {
      const audio = new Audio("/images/sounds/intro-dora.mp3");
      audio.volume = 1;
      audio.play();
    }
  }, [screen]);

  // -------------------------
// 1️⃣ TRANSITION SCREEN
// -------------------------
if (screen === "transition") {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "20px",
        fontFamily: "'Poppins', sans-serif",
        background: "linear-gradient(135deg, #E0F7FA 0%, #F8F0FF 100%)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center"
      }}
    >

      <h2
        style={{
          color: "#ec4899",
          fontSize: "clamp(1.8rem, 5vw, 3rem)",
          marginBottom: "25px",
          textShadow: "0 0 10px rgba(236, 72, 153, 0.4)",
          fontWeight: "700"
        }}
      >
        Next Game: Pointing with Dora! 👉🌟
      </h2>

      <div
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          padding: "30px 35px",
          borderRadius: "35px",
          maxWidth: "600px",
          margin: "0 auto 30px",
          fontSize: "20px",
          fontWeight: "600",
          boxShadow: "0 25px 60px rgba(0,0,0,0.18)",
          border: "5px solid #FFC5D0",
        }}
      >
        In this game, Dora will ask your child<br />
        to <strong>point at objects</strong> just like she does on her show!
        <br /><br />
        Please make sure:
        <ul
          style={{
            textAlign: "left",
            marginTop: "10px",
            fontSize: "18px",
            lineHeight: "1.5",
            paddingLeft: "20px"
          }}
        >
          <li>📷 The child is visible to the camera</li>
          <li>💡 The room has good lighting</li>
          <li>👉 Their hands can be seen clearly</li>
        </ul>
      </div>

      <button
        onClick={() => setScreen("intro")}
        style={{
          padding: "18px 80px",
          fontSize: "clamp(1.5rem, 4vw, 2.2rem)",
          background: "linear-gradient(45deg, #FFC5D0, #B2F2BB)",
          color: "white",
          border: "none",
          borderRadius: "60px",
          cursor: "pointer",
          boxShadow: "0 15px 35px rgba(255,193,208,.5)",
          transition: "0.3s",
          fontWeight: "700",
          fontFamily: "'Poppins', sans-serif",
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = "translateY(-8px)";
          e.target.style.boxShadow = "0 25px 50px rgba(255,193,208,.6)";
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = "translateY(0)";
          e.target.style.boxShadow = "0 15px 35px rgba(255,193,208,.5)";
        }}
      >
        Continue
      </button>
    </div>
  );
}


  // -------------------------
  // 2️⃣ YOUR ORIGINAL DORA INTRO
  // -------------------------
  return (
    <div>
      <img
        src="/images/images-dora/dora-wavingg.png"
        alt="Dora"
        style={{
          width: "340px",
          display: "block",
          margin: "0 auto"
        }}
      />

      <div
        style={{
          background: "white",
          padding: "20px 30px",
          borderRadius: "50px",
          border: "12px solid #ec4899",
          fontSize: "24px",
          fontWeight: "bold",
          maxWidth: "90%",
          textAlign: "center"
        }}
      >
        Hi ! can u help to go to the amusement park to meet my friend?
      </div>

      <button
        onClick={next}
        style={{
          padding: "15px 50px",
          fontSize: "36px",
          background: "#ec4899",
          color: "white",
          border: "none",
          cursor: "pointer",
          borderRadius: "40px",
          margin: "15px auto 0 auto",
          display: "block"
        }}
      >
        YES!
      </button>
    </div>
  );
}
