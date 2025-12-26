import { useEffect, useRef } from "react";

const WebcamFeed = ({ onVideoReady }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    async function startCam() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 480, height: 360, facingMode: "user" },
          audio: false,
        });

        const video = videoRef.current;
        video.srcObject = stream;

        video.onloadedmetadata = () => {
          video.play().catch(() => {});
          if (onVideoReady) onVideoReady(video);
        };
      } catch (err) {
        console.error("Webcam error:", err);
      }
    }

    startCam();
  }, []);

  return (
    <video
  ref={videoRef}
  style={{
    width: 480,
    height: 360,
    borderRadius: 12,
    border: "2px solid #333",
    marginTop: 20,
  }}
/>


  );
};

export default WebcamFeed;
