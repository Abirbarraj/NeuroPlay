import React, { useEffect, useRef, useState } from "react";
import { GestureRecognizer, FilesetResolver } from "@mediapipe/tasks-vision";

export default function PointingDetector({ onPoint }) {
  const videoRef = useRef(null);
  const [recognizer, setRecognizer] = useState(null);

  useEffect(() => {
    async function init() {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      const gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
        },
        runningMode: "VIDEO",
      });

      setRecognizer(gestureRecognizer);
    }

    init();
  }, []);

  useEffect(() => {
    if (!recognizer) return;

    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      videoRef.current.srcObject = stream;
    });

    const interval = setInterval(async () => {
      if (!videoRef.current) return;

      const result = recognizer.recognizeForVideo(
        videoRef.current,
        performance.now()
      );

      const gesture = result?.gestures?.[0]?.[0]?.categoryName;

      if (gesture === "pointing_up") {
        onPoint(); // call the callback
      }
    }, 100);

    return () => clearInterval(interval);
  }, [recognizer, onPoint]);

  return (
    <div>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{ width: "300px", borderRadius: "20px" }}
      />
    </div>
  );
}
