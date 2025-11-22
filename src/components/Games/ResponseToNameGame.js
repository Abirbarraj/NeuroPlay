// src/components/Games/ResponseToNameGame.js
import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';

function ResponseToNameGame({ onComplete }) {
  const [gameState, setGameState] = useState('instructions');
  const [videoState, setVideoState] = useState('idle');
  const [responseDetected, setResponseDetected] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const [childName, setChildName] = useState('');
  const [detectionActive, setDetectionActive] = useState(false);
  
  const webcamRef = useRef(null);
  const timerRef = useRef(null);

  // Load child name from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('currentScreening');
    if (savedData) {
      const data = JSON.parse(savedData);
      setChildName(data.childName || 'your child');
    }
  }, []);

  const playBouncyInstruction = () => {
    setVideoState('playing');
    
    const segments = [
      { text: "Hello, I'm Bouncy!", duration: 2000 },
      { text: "We're going to play together!", duration: 2000 },
      { text: `If you are ${childName}, raise your hand like me!`, duration: 3000 }
    ];

    let currentSegment = 0;
    
    const playNextSegment = () => {
      if (currentSegment < segments.length) {
        setVideoState(`playing-${currentSegment}`);
        
        setTimeout(() => {
          currentSegment++;
          playNextSegment();
        }, segments[currentSegment].duration);
      } else {
        setVideoState('completed');
        startResponseTimer();
        startDetection();
      }
    };
    
    playNextSegment();
  };

  const startResponseTimer = () => {
    setTimeLeft(10);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setDetectionActive(false);
          setGameState('result');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startDetection = () => {
    setDetectionActive(true);
  };

  const startGame = () => {
    setGameState('playing');
    setResponseDetected(false);
    setVideoState('idle');
    setDetectionActive(false);
    
    setTimeout(() => {
      playBouncyInstruction();
    }, 1000);
  };

  const detectHandRaise = () => {
    if (detectionActive && !responseDetected) {
      setResponseDetected(true);
      setDetectionActive(false);
      clearInterval(timerRef.current);
      setTimeLeft(0);
      
      // Auto-proceed to result after 1 second
      setTimeout(() => {
        setGameState('result');
      }, 1000);
    }
  };

  const completeGame = () => {
    clearInterval(timerRef.current);
    
    // Save game result to localStorage
    const savedData = localStorage.getItem('currentScreening');
    if (savedData) {
      const data = JSON.parse(savedData);
      const updatedData = {
        ...data,
        gameResults: {
          ...data.gameResults,
          responseToName: responseDetected ? 1 : 0,
          responseToNameTimestamp: new Date().toISOString(),
          responseToNameTimeLeft: timeLeft
        }
      };
      localStorage.setItem('currentScreening', JSON.stringify(updatedData));
    }
    
    onComplete(responseDetected ? 1 : 0);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="game-container">
      <h2>Let's Play with Bouncy! 🎮</h2>
      
      {gameState === 'instructions' && (
        <div className="game-instructions">
          <h3>Response to Name Game</h3>
          
          <div className="tech-requirements">
            <div className="requirement-item">
              <span className="requirement-icon">📷</span>
              <span>Camera access required</span>
            </div>
            <div className="requirement-item">
              <span className="requirement-icon">💡</span>
              <span>Good lighting recommended</span>
            </div>
            <div className="requirement-item">
              <span className="requirement-icon">👶</span>
              <span>Child should be visible in camera</span>
            </div>
          </div>
          
          <div className="instruction-preview">
            <div className="bunny-demo">🐰</div>
            <div className="preview-text">
              <p>Bouncy will ask:</p>
              <p className="instruction-highlight">"If you're <strong>{childName}</strong>, raise your hand like me!"</p>
              <p className="tech-note">Watch for your child's response and click the button when they raise their hand!</p>
            </div>
          </div>
          
          <button className="btn" onClick={startGame}>
            Start Game with Bouncy!
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="game-playing">
          {/* Bouncy Video Area */}
          <div className="bunny-video-container">
            <div className={`bunny-character ${videoState.includes('playing') ? 'animated' : ''}`}>
              <div className="bunny-avatar">🐰</div>
              
              <div className="video-script">
                {videoState === 'playing-0' && (
                  <div className="speech-bubble show">"Hello, I'm Bouncy!"</div>
                )}
                {videoState === 'playing-1' && (
                  <div className="speech-bubble show">"We're going to play together!"</div>
                )}
                {videoState === 'playing-2' && (
                  <div className="speech-bubble show">
                    "If you're <strong>{childName}</strong>, raise your hand like me!"
                    <div className="bunny-demonstration">
                      <div className="bunny-arm">✋</div>
                    </div>
                  </div>
                )}
                {videoState === 'completed' && (
                  <div className="speech-bubble persistent">
                    {responseDetected ? 
                      "Yay! I see your hand! 🎉" : 
                      "Raise your hand like me! ✋"
                    }
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Webcam and Detection Area */}
          <div className="cv-detection-area">
            <div className="webcam-section">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                className="game-webcam"
                mirrored={true}
              />
              
              {/* Detection Overlay */}
              <div className="cv-overlay">
                <div className="detection-status">
                  {detectionActive && !responseDetected && (
                    <div className="detecting-indicator">
                      <span className="pulse-dot"></span>
                      Watching for hand raise...
                    </div>
                  )}
                  {responseDetected && (
                    <div className="detected-indicator">
                      ✅ Hand Raise Detected!
                    </div>
                  )}
                </div>
                
                {/* Visual guides for where to look */}
                <div className="body-guide"></div>
                <div className="hand-target left-hand"></div>
                <div className="hand-target right-hand"></div>
              </div>
            </div>

            <div className="response-info">
              <div className="timer-display">
                <span className="time-label">Time remaining:</span>
                <span className="time-count">{timeLeft}s</span>
              </div>
              
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${(timeLeft / 10) * 100}%` }}
                ></div>
              </div>

              <div className="detection-stats">
                <div className="stat">
                  <span className="stat-label">Status:</span>
                  <span className="stat-value">
                    {responseDetected ? 'Hand Raised!' : 
                     detectionActive ? 'Watching...' : 'Get Ready'}
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-label">Game:</span>
                  <span className="stat-value">Response to Name</span>
                </div>
              </div>
            </div>
          </div>

          {/* Manual Response Button */}
          <div className="observation-panel">
            <p>Click below when you see your child raise their hand:</p>
            <button 
              className={`response-btn ${responseDetected ? 'detected-btn' : 'yes-btn'}`}
              onClick={detectHandRaise}
              disabled={!detectionActive || responseDetected}
            >
              {responseDetected ? (
                "✅ Hand Raised!"
              ) : (
                "✋ Click when child raises hand"
              )}
            </button>
            
            {!detectionActive && videoState !== 'completed' && (
              <p className="wait-message">Wait for Bouncy to finish instructions...</p>
            )}
          </div>
        </div>
      )}

      {gameState === 'result' && (
        <div className="game-result">
          <h3>Game Complete! 🎉</h3>
          <div className="result-feedback">
            {responseDetected ? (
              <div className="success-feedback">
                <div className="feedback-icon">✅</div>
                <div className="feedback-text">
                  <p>Excellent! <strong>{childName}</strong> responded to their name!</p>
                  <p>They raised their hand when Bouncy asked! 🐰</p>
                  <p className="result-detail">Response detected with {timeLeft} seconds remaining.</p>
                </div>
              </div>
            ) : (
              <div className="neutral-feedback">
                <div className="feedback-icon">🤔</div>
                <div className="feedback-text">
                  <p>We didn't see <strong>{childName}</strong> raise their hand this time.</p>
                  <p>This is completely normal! Children respond differently in new situations.</p>
                  <p className="result-detail">No response detected within 10 seconds.</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="game-stats">
            <div className="stat-card">
              <div className="stat-number">{responseDetected ? '1' : '0'}</div>
              <div className="stat-label">Binary Result</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{10 - timeLeft}s</div>
              <div className="stat-label">Response Time</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{childName}</div>
              <div className="stat-label">Child's Name</div>
            </div>
          </div>
          
          <button className="btn" onClick={completeGame}>
            Continue to Next Game
          </button>
          
          <p className="data-notice">
            Result saved to local storage for analysis.
          </p>
        </div>
      )}
    </div>
  );
}

export default ResponseToNameGame;