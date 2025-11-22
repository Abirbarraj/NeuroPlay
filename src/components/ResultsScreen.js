// src/components/ResultsScreen.js
import React, { useState, useEffect } from 'react';

function ResultsScreen() {
  const [screeningData, setScreeningData] = useState(null);

  useEffect(() => {
    const savedData = localStorage.getItem('currentScreening');
    if (savedData) {
      setScreeningData(JSON.parse(savedData));
    }
  }, []);

  const clearData = () => {
    localStorage.removeItem('currentScreening');
    setScreeningData(null);
  };

  if (!screeningData) {
    return (
      <div className="container">
        <h1>No Data Found</h1>
        <p>No screening data found in localStorage.</p>
        <button className="btn" onClick={() => window.location.reload()}>
          Start New Screening
        </button>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Screening Complete! 📊</h1>
      
      <div className="results-summary">
        <h2>Results for {screeningData.childName}</h2>
        <p>Age: {screeningData.childAge} | Gender: {screeningData.childGender}</p>
        
        <div className="form-results">
          <h3>Form Responses:</h3>
          <div className="responses-grid">
            {Object.entries(screeningData).map(([key, value]) => {
              if (key.startsWith('A') && (key === 'A1' || key === 'A2' || key === 'A3' || key === 'A4' || key === 'A5' || key === 'A6')) {
                return (
                  <div key={key} className="response-item">
                    <span className="question-id">{key}:</span>
                    <span className={`response-value ${value === 'yes' ? 'yes' : 'no'}`}>
                      {value}
                    </span>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>

        {screeningData.gameResults && (
          <div className="game-results">
            <h3>Game Results:</h3>
            <div className="game-scores">
              {Object.entries(screeningData.gameResults).map(([game, result]) => (
                <div key={game} className="game-result-item">
                  <span className="game-name">{game}:</span>
                  <span className={`game-score ${result === 1 ? 'success' : 'neutral'}`}>
                    {result === 1 ? '✅ Pass' : '❌ No response'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="actions">
          <button className="btn" onClick={clearData}>
            Clear Data & Start Over
          </button>
          <button className="btn secondary" onClick={() => console.log('Data for ML:', screeningData)}>
            Export Data for Analysis
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResultsScreen;