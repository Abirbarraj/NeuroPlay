import React, { useEffect } from "react";

export default function EndingStage({ finish }) {
  useEffect(() => {
    const audio = new Audio("/images/sounds/success.mp3");
    audio.volume = 1;
    audio.play();
  }, []);

  return (
    <div
      style={{
        height: "100vh",
        background: "transparent",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "30px",
        padding: "0 20px",
        textAlign: "center",
        overflow: "hidden",
      }}
    >
      <img
        src="/images/images-dora/confetti.gif"
        alt=""
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0.6,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <img
        src="/images/images-dora/dora-celebrating.png"
        alt="Dora"
        style={{
          width: "320px",
          height: "320px",
          objectFit: "contain",
          filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.3))",
          animation: "bounce 2s infinite",
          zIndex: 1,
        }}
      />

      <div style={{ zIndex: 1 }}>
        <h1
          style={{
            fontSize: "60px",
            fontWeight: "bold",
            color: "#ec4899",
            margin: "0 0 20px 0",
            textShadow: "0 6px 15px rgba(0,0,0,0.2)",
          }}
        >
          Thank you, friend!
        </h1>

        <p
          style={{
            fontSize: "18px",
            color: "#ec4899",
            margin: 0,
            opacity: 0.9,
          }}
        >
          You helped me so much today!
        </p>
      </div>

      <button
        onClick={finish}
        style={{
          padding: "15px 70px",
          fontSize: "20px",
          fontWeight: "bold",
          background: "white",
          color: "#ec4899",
          border: "none",
          borderRadius: "70px",
          cursor: "pointer",
          boxShadow: "0 15px 40px rgba(0,0,0,0.25)",
          transition: "all 0.3s ease",
          zIndex: 1,
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.transform = "scale(1.1)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.transform = "scale(1)")
        }
      >
        Next
      </button>

      <style jsx>{`
        @keyframes bounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-35px);
          }
        }
      `}</style>
    </div>
  );
}
