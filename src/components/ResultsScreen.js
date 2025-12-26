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

  // Game name mapping for better display
  const gameDisplayNames = {
    responseToName: "Response to Name",
    blowOutCandles: "Blow Out Candles",
    imitationGame: "Imitation Game",
    waveGame: "Wave Game",
    // Add more as needed
  };

  // Filter game results to remove timestamp and metadata fields
  const getFilteredGameResults = () => {
    if (!screeningData.gameResults) return {};
    
    const unwantedFields = [
      'Timestamp', 'Time Left', 'Completed At', 'CompletedAt',
      'Tasks', 'waveTasks', 'waveCompletedAt', 'responseToNameTimestamp',
      'responseToNameTimeLeft', 'waveCompletedAt', 'waveTasks'
    ];
    
    const filtered = {};
    
    Object.entries(screeningData.gameResults).forEach(([gameKey, result]) => {
      // Skip unwanted fields entirely
      if (unwantedFields.some(field => 
        gameKey.toLowerCase().includes(field.toLowerCase()) ||
        gameKey.toLowerCase().endsWith('timestamp') ||
        gameKey.toLowerCase().endsWith('timeleft') ||
        gameKey.toLowerCase().endsWith('completedat') ||
        gameKey.toLowerCase().endsWith('tasks')
      )) {
        return; // Skip this field
      }
      
      // Handle the result value
      if (typeof result === 'object' && result !== null) {
        // If it's an object, check if it has a 'score' property
        if (result.score !== undefined) {
          filtered[gameKey] = result.score;
        } else {
          // Otherwise use the whole object but filter out metadata
          const cleanResult = { ...result };
          delete cleanResult.timestamp;
          delete cleanResult.completedAt;
          delete cleanResult.timeLeft;
          delete cleanResult.Tasks;
          delete cleanResult.waveTasks;
          delete cleanResult.waveCompletedAt;
          filtered[gameKey] = cleanResult;
        }
      } else {
        // It's a simple value (like 1 or 0)
        filtered[gameKey] = result;
      }
    });
    
    return filtered;
  };

  const filteredGameResults = getFilteredGameResults();

  return (
    <div className="container">
      <h1>Screening Complete! 📊</h1>
      
      <div className="results-summary">
        <h2>Child Information</h2>
        <p><strong>Name:</strong> {screeningData.childName || 'Not provided'}</p>
        <p><strong>Age:</strong> {screeningData.childAge || 'Not provided'}</p>
        <p><strong>Gender:</strong> {screeningData.childGender || 'Not provided'}</p>
        
        {/* Question Answers (A1-A6 only) */}
        <div className="form-results">
          <h3>Questionnaire Results:</h3>
          <div className="responses-grid">
            {['A1', 'A2', 'A3', 'A4', 'A5', 'A6'].map((question) => (
              screeningData[question] !== undefined && (
                <div key={question} className="response-item">
                  <span className="question-id">Question {question.replace('A', '')}:</span>
                  <span className={`response-value ${screeningData[question] === 'yes' ? 'yes' : 'no'}`}>
                    {screeningData[question] === 'yes' ? 'Yes ✅' : 'No ❌'}
                  </span>
                </div>
              )
            ))}
          </div>
        </div>

        {/* Game Results - Only show if we have actual game results */}
        {Object.keys(filteredGameResults).length > 0 && (
          <div className="game-results">
            <h3>Game Performance:</h3>
            <div className="game-scores">
              {Object.entries(filteredGameResults).map(([gameKey, result]) => {
                // Get display name or format the key
                const displayName = gameDisplayNames[gameKey] || 
                  gameKey.replace(/([A-Z])/g, ' $1')
                    .replace(/^./, str => str.toUpperCase())
                    .replace(/Timestamp$/i, '')
                    .replace(/Time Left$/i, '')
                    .replace(/Completed At$/i, '')
                    .replace(/Tasks$/i, '')
                    .trim();
                
                // Determine if passed (1 = pass, 0 = fail)
                const score = typeof result === 'object' ? result.score : result;
                const passed = score === 1;
                
                return (
                  <div key={gameKey} className="game-result-item">
                    <span className="game-name">{displayName}:</span>
                    <span className={`game-score ${passed ? 'success' : 'fail'}`}>
                      {passed ? '✅ Passed' : '❌ Not Passed'}
                    </span>
                  </div>
                );
              })}
            </div>
            
            {/* Summary Statistics */}
            <div className="summary-stats">
              <h4>Summary:</h4>
              <p>
                Games Passed: {
                  Object.values(filteredGameResults).filter(result => {
                    const score = typeof result === 'object' ? result.score : result;
                    return score === 1;
                  }).length
                } out of {Object.keys(filteredGameResults).length}
              </p>
            </div>
          </div>
        )}

        <div className="actions">
          <button className="btn" onClick={clearData}>
            Clear Data & Start Over
          </button>
          <button className="btn secondary" onClick={() => {
            // Export clean data without timestamps
            const exportData = {
              childInfo: {
                name: screeningData.childName,
                age: screeningData.childAge,
                gender: screeningData.childGender
              },
              questionnaire: Object.fromEntries(
                Object.entries(screeningData)
                  .filter(([key]) => key.match(/^A[1-6]$/))
                  .map(([key, value]) => [key, value])
              ),
              games: filteredGameResults
            };
            console.log('Clean Data for Analysis:', exportData);
            alert('Data logged to console. Check Developer Tools (F12) → Console tab.');
          }}>
            Export Clean Data
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResultsScreen;