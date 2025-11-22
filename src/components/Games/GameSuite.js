// src/components/Games/GameSuite.js
import React, { useState, useEffect } from 'react';
import ResponseToNameGame from './ResponseToNameGame';

function GameSuite({ onComplete }) {
  const [currentGame, setCurrentGame] = useState(0);
  const [gameResults, setGameResults] = useState({});
  const [childName, setChildName] = useState('');

  // Load child name from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('currentScreening');
    if (savedData) {
      const data = JSON.parse(savedData);
      setChildName(data.childName);
    }
  }, []);

  const games = [
    {
      component: ResponseToNameGame,
      name: "Response to Name",
      key: "responseToName"
    },
    // We'll add more games here later
  ];

  const handleGameComplete = (result) => {
    const currentGameKey = games[currentGame].key;
    const updatedResults = {
      ...gameResults,
      [currentGameKey]: result
    };
    
    setGameResults(updatedResults);

    // For now, we'll complete after the first game
    // Later we'll add more games
    const savedData = localStorage.getItem('currentScreening');
    if (savedData) {
      const data = JSON.parse(savedData);
      const finalData = {
        ...data,
        gameResults: updatedResults,
        completedAt: new Date().toISOString()
      };
      localStorage.setItem('currentScreening', JSON.stringify(finalData));
    }
    
    onComplete(updatedResults);
  };

  const CurrentGameComponent = games[currentGame].component;

  return (
    <div className="game-suite">
      <div className="game-progress">
        <h3>Playing with {childName} 🎮</h3>
        <p>Game {currentGame + 1} of {games.length}: {games[currentGame].name}</p>
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${((currentGame + 1) / games.length) * 100}%` }}
          ></div>
        </div>
      </div>
      
      <CurrentGameComponent onComplete={handleGameComplete} />
    </div>
  );
}

export default GameSuite;