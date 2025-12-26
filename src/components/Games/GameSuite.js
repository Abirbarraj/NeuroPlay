import React, { useState, useEffect, useRef } from 'react';
import ResponseToNameGame from './ResponseToNameGame';
// ❌ REMOVE these (App.js handles them as separate pages)
// import ImitationGame from './ImitationGame';
// import BlowOutCandles from './BlowOutCandles';

function GameSuite({ onComplete }) {
  const [currentGame, setCurrentGame] = useState(0);
  const [gameResults, setGameResults] = useState({});
  const [childName, setChildName] = useState('');

  // ✅ prevents double finishing
  const finishedRef = useRef(false);

  useEffect(() => {
    const savedData = localStorage.getItem('currentScreening');
    if (savedData) {
      const data = JSON.parse(savedData);
      setChildName(data.childName || '');
    }
  }, []);

  // ✅ ONLY games that belong inside the suite
  const games = [
    {
      component: ResponseToNameGame,
      name: "Response to Name",
      key: "responseToName",
    },
    // Add more suite-only games here (NOT imitation/candles)
  ];

  const finishSuite = (updatedResults) => {
    if (finishedRef.current) return;
    finishedRef.current = true;

    // Save results (optional but fine)
    try {
      const savedData = localStorage.getItem('currentScreening');
      if (savedData) {
        const data = JSON.parse(savedData);
        const finalData = {
          ...data,
          gameResults: {
            ...(data.gameResults || {}),
            ...updatedResults,
          },
          suiteCompletedAt: new Date().toISOString(),
        };
        localStorage.setItem('currentScreening', JSON.stringify(finalData));
      }
    } catch (e) {
      console.error("Error saving suite results:", e);
    }

    onComplete?.(updatedResults);
  };

  const handleGameComplete = (result) => {
    const currentGameKey = games[currentGame]?.key;
    const updatedResults = {
      ...gameResults,
      [currentGameKey]: result,
    };

    setGameResults(updatedResults);

    if (currentGame < games.length - 1) {
      setCurrentGame((prev) => prev + 1);
    } else {
      finishSuite(updatedResults);
    }
  };

  const CurrentGameComponent = games[currentGame]?.component;

  // Edge case: if games array becomes empty
  useEffect(() => {
    if (!games.length) finishSuite({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!games.length) return null;

  return (
    <div className="game-suite">
      <div className="game-progress">
        <h3>Playing with {childName} 🎮</h3>
        <p>
          Game {currentGame + 1} of {games.length}: {games[currentGame].name}
        </p>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${((currentGame + 1) / games.length) * 100}%` }}
          />
        </div>
      </div>

      <CurrentGameComponent onComplete={handleGameComplete} />
    </div>
  );
}

export default GameSuite;
