import './styles-dora/dora-pointing.css';
import React, { useState, useEffect } from "react";

import IntroStage from "./stages-dora/IntroStage";
import MapStage from "./stages-dora/MapStage";
import ArrivalStage from "./stages-dora/ArrivalStage";
import IceCreamStage from "./stages-dora/IceCreamStage";
import EndingStage from "./stages-dora/EndingStage";

export default function AppDora({ onNext }) {
  const [page, setPage] = useState(0);
  const [messageShown, setMessageShown] = useState(0);

  const goNext = () => setPage(page + 1);
  const handleMessageShown = () => {
    if (messageShown === 0) setMessageShown(1);
  };

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
              const currentScreening = JSON.parse(localStorage.getItem("currentScreening")) || {};
              currentScreening.gameResults = {
                ...currentScreening.gameResults,
                pointing: messageShown,
              };
              localStorage.setItem("currentScreening", JSON.stringify(currentScreening));
              onNext(); // go to OverstimulatingGame
            }}
          />
        )}
      </div>
    </div>
  );
}
