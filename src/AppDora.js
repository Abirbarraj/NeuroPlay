import './styles-dora/dora-pointing.css';

// src/App.js
import React, { useState, useEffect } from "react";

// Import the 5 stages
import IntroStage from "./stages-dora/IntroStage";
import MapStage from "./stages-dora/MapStage";
import ArrivalStage from "./stages-dora/ArrivalStage";
import IceCreamStage from "./stages-dora/IceCreamStage";
import EndingStage from "./stages-dora/EndingStage";

export default function AppDora({ onNext }) {
  // Current page
  const [page, setPage] = useState(0);

  // Track if the YAY message ever appeared
  const [messageShown, setMessageShown] = useState(0); // 0 = not yet, 1 = appeared

  // Move to the next page
  const goNext = () => setPage(page + 1);

  // Called by stages when YAY appears
  const handleMessageShown = () => {
    if (messageShown === 0) setMessageShown(1);
  };

  // Optional: debug
  useEffect(() => {
    console.log("YAY appeared flag:", messageShown);
  }, [messageShown]);

  return (
    <div className="centered">
      <div>
        {page === 0 && <IntroStage next={goNext} />}
        {page === 1 && <MapStage next={goNext} onMessageShown={handleMessageShown} />}
        {page === 2 && <ArrivalStage next={goNext} />}
        {page === 3 && <IceCreamStage next={goNext} onMessageShown={handleMessageShown} />}
        {page === 4 && (
  <EndingStage
    finish={() => {
      // Save the pointing game result
      const currentScreening = JSON.parse(localStorage.getItem("currentScreening")) || {};
      currentScreening.gameResults = {
        ...currentScreening.gameResults,
        pointing: messageShown, // 1 if YAY appeared, 0 if not
      };
      localStorage.setItem("currentScreening", JSON.stringify(currentScreening));

      // Move to ResultsScreen
      onNext();
    }}
  />
)}

      </div>
    </div>
  );
}
