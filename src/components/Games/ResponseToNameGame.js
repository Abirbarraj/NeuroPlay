// src/components/Games/ResponseToNameGame.js
import React, { useEffect, useRef, useState } from 'react';
import bunnyNormal from '../../images/bunny-normal.png';
import { useYesDetection } from '../../hooks/useYesDetection';

function ResponseToNameGame({ onComplete }) {
  const [gameState, setGameState] = useState('instructions');
  const [timeLeft, setTimeLeft] = useState(20);
  const [childName, setChildName] = useState('');
  const [detectionActive, setDetectionActive] = useState(false);
  const [responseDetected, setResponseDetected] = useState(false);

  const timerRef = useRef(null);

  const { isListening, yesDetected, reset } = useYesDetection({
    active: detectionActive,
    languages: ['en'],
  });

  useEffect(() => {
    const saved = localStorage.getItem('currentScreening');
    if (saved) {
      const data = JSON.parse(saved);
      setChildName(data.childName || 'your child');
    }
  }, []);

  useEffect(() => {
    if (gameState === 'result' && responseDetected) {
      // Play success messages when result screen shows
      speak("Great job! lets move to the next game")
    }
  }, [gameState, responseDetected]);

  useEffect(() => {
    if (!yesDetected) return;

    // 1️⃣ Publish success
    setResponseDetected(true);
    setGameState('result');

    // 2️⃣ Stop timer
    clearInterval(timerRef.current);

    // 3️⃣ Play immediate feedback
    speak("Yes detected!");

    // 4️⃣ Stop detection AFTER success is shown
    setTimeout(() => {
      setDetectionActive(false);
    }, 100);

  }, [yesDetected]);

  const speak = (text, onEndCallback = null) => {
    if ('speechSynthesis' in window) {
      const speech = new SpeechSynthesisUtterance();
      speech.text = text;
      speech.rate = 1.2; // Faster rate
      speech.pitch = 1.6; // Higher pitch for kid-like voice
      speech.volume = 1;
      
      // Try to select a kid/child voice if available
      const voices = speechSynthesis.getVoices();
      const kidVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('child') || 
        voice.name.toLowerCase().includes('kid') ||
        voice.name.toLowerCase().includes('zira') || // Windows female voice
        voice.name.toLowerCase().includes('samantha') // Mac voice
      );
      if (kidVoice) {
        speech.voice = kidVoice;
      }
      
      speech.onend = () => {
        if (onEndCallback) onEndCallback();
      };
      
      speech.onerror = () => {
        if (onEndCallback) onEndCallback();
      };
      
      window.speechSynthesis.speak(speech);
    } else {
      if (onEndCallback) {
        setTimeout(onEndCallback, 1500); // Shorter fallback
      }
    }
  };

  const playBouncyInstruction = (onComplete) => {
    const segments = [
      { text: "Hello, I'm Bouncy!", duration: 800 },
      { text: "We're going to play together!", duration: 800 },
      { text: `If you are ${childName}, say yes!`, duration: 1200, speak: true }
    ];

    let currentSegment = 0;
    
    const playNextSegment = () => {
      if (currentSegment < segments.length) {
        const segment = segments[currentSegment];
        
        if (segment.speak) {
          speak(segment.text, () => {
            currentSegment++;
            setTimeout(playNextSegment, 300);
          });
        } else {
          setTimeout(() => {
            currentSegment++;
            playNextSegment();
          }, segment.duration);
        }
      } else {
        setDetectionActive(true);
        if (onComplete) onComplete();
      }
    };
    
    playNextSegment();
  };

  const startGame = () => {
    reset();
    setResponseDetected(false);
    setGameState('playing');
    
    setTimeout(() => {
      playBouncyInstruction(() => {
        setTimeLeft(20);
        timerRef.current = setInterval(() => {
          setTimeLeft((t) => {
            if (t <= 1) {
              clearInterval(timerRef.current);
              setDetectionActive(false);
              setGameState('result');
              return 0;
            }
            return t - 1;
          });
        }, 1000);
      });
    }, 500);
  };

  const completeGame = () => {
    clearInterval(timerRef.current);

    const saved = localStorage.getItem('currentScreening');
    if (saved) {
      const data = JSON.parse(saved);
      localStorage.setItem(
        'currentScreening',
        JSON.stringify({
          ...data,
          gameResults: {
            ...data.gameResults,
            responseToName: responseDetected ? 1 : 0,
          },
        })
      );
    }

    onComplete(responseDetected ? 1 : 0);
  };

  return (
    <div className="game-container">
      <h2>Let's Play with Bouncy! 🎮</h2>
      
      {gameState === 'instructions' && (
        <div className="game-instructions">
          <h3>Response to Name Game</h3>
          
          <div className="bunny-preview">
            <img src={bunnyNormal} alt="Bouncy" className="preview-bunny" />
          </div>
          <div className="preview-text">
            <p>Bouncy will say:</p>
            <p className="instruction-highlight">"If you're <strong>{childName}</strong>, say yes!"</p>
            <p className="tech-note">The system will automatically detect when your child says yes!</p>
          </div>
          
          <button className="btn" onClick={startGame}>
            Start Game with Bouncy!
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="game-playing">
          <div className="bunny-video-container">
            <div className="bunny-character">
              <div className="bunny-avatar">
                <img src={bunnyNormal} alt="Bouncy" className="bunny-image" />
              </div>
              
              <div className="video-script">
                <div className="speech-bubble persistent">
                  {responseDetected ? 
                    "Yay! I heard you say yes! 🎉" : 
                    `Say yes! (${timeLeft}s left)`
                  }
                </div>
              </div>
            </div>
          </div>

          <div className="cv-detection-area">
            <div className="microphone-section">
              <div className="microphone-visual">
                <div className={`microphone-icon ${isListening ? 'listening' : ''}`}>
                  🎤
                </div>
                <div className="microphone-label">
                  {isListening ? 'Listening...' : 'Microphone Ready'}
                </div>
              </div>
              
              <div className="cv-overlay">
                <div className="detection-status">
                  {detectionActive && !responseDetected ? (
                    <div className="detecting-indicator">
                      <span className="pulse-dot"></span>
                      Listening for "yes"... {timeLeft}s left
                    </div>
                  ) : responseDetected ? (
                    <div className="detected-indicator">
                      ✅ "Yes" Detected Automatically!
                    </div>
                  ) : (
                    <div className="waiting-indicator">
                      Waiting for instructions...
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="response-info">
              <div className="timer-display">
                <span className="time-label">Time remaining:</span>
                <span className={`time-count ${timeLeft <= 5 ? 'time-warning' : ''}`}>
                  {timeLeft}s
                </span>
              </div>
              
              <div className="progress-bar">
                <div 
                  className={`progress-fill ${timeLeft <= 5 ? 'progress-warning' : ''}`}
                  style={{ width: `${(timeLeft / 20) * 100}%` }}
                ></div>
              </div>
            </div>
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
                  <p>They said "yes" when Bouncy asked! 🐰</p>
                  <p className="result-detail">
                    Response detected in <strong>{20 - timeLeft} seconds</strong> out of 20 seconds total.
                  </p>
                </div>
              </div>
            ) : (
              <div className="neutral-feedback">
                <div className="feedback-icon">🤔</div>
                <div className="feedback-text">
                  <p>We didn't hear <strong>{childName}</strong> say "yes" this time.</p>
                  <p>This is completely normal! Children respond differently in new situations.</p>
                  <p className="result-detail">No response detected within 20 seconds.</p>
                </div>
              </div>
            )}
          </div>
          
          <button className="btn" onClick={completeGame}>
            Continue to Next Game
          </button>
        </div>
      )}
    </div>
  );
}

export default ResponseToNameGame;