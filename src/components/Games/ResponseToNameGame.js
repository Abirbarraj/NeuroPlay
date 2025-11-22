// src/components/Games/ResponseToNameGame.js
import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import '@tensorflow/tfjs';
import bunnyNormal from '../../images/bunny-normal.png';
import bunnyHandUp from '../../images/bunny-hand-up.png';

function ResponseToNameGame({ onComplete }) {
  const [gameState, setGameState] = useState('instructions');
  const [videoState, setVideoState] = useState('idle');
  const [responseDetected, setResponseDetected] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [childName, setChildName] = useState('');
  const [detectionActive, setDetectionActive] = useState(false);
  const [currentBunny, setCurrentBunny] = useState(bunnyNormal);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [detector, setDetector] = useState(null);
  const [detectionStats, setDetectionStats] = useState({
    framesProcessed: 0,
    handsDetected: 0,
    lastHandRaise: null
  });
  
  const webcamRef = useRef(null);
  const timerRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Load child name from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('currentScreening');
    if (savedData) {
      const data = JSON.parse(savedData);
      setChildName(data.childName || 'your child');
    }
  }, []);

  // Initialize hand detector
  useEffect(() => {
    const initializeDetector = async () => {
      try {
        console.log('Initializing hand detector...');
        const model = handPoseDetection.SupportedModels.MediaPipeHands;
        const detectorConfig = {
          runtime: 'tfjs',
          modelType: 'full',
          maxHands: 2,
        };
        
        const handDetector = await handPoseDetection.createDetector(model, detectorConfig);
        setDetector(handDetector);
        console.log('Hand detector initialized successfully');
      } catch (error) {
        console.error('Error initializing hand detector:', error);
      }
    };

    initializeDetector();
  }, []);

  const speak = (text, onEndCallback = null) => {
    if ('speechSynthesis' in window) {
      setIsSpeaking(true);
      
      const speech = new SpeechSynthesisUtterance();
      speech.text = text;
      speech.rate = 0.9;
      speech.pitch = 1.2;
      speech.volume = 1;
      
      speech.onend = () => {
        setIsSpeaking(false);
        if (onEndCallback) onEndCallback();
      };
      
      speech.onerror = () => {
        setIsSpeaking(false);
        if (onEndCallback) onEndCallback();
      };
      
      window.speechSynthesis.speak(speech);
    } else {
      if (onEndCallback) {
        setTimeout(onEndCallback, 2000);
      }
    }
  };

  const detectHandRaise = async () => {
    if (!detector || !webcamRef.current || !detectionActive || responseDetected) return;

    try {
      const video = webcamRef.current.video;
      if (video && video.readyState === 4) {
        const hands = await detector.estimateHands(video);
        
        setDetectionStats(prev => ({
          ...prev,
          framesProcessed: prev.framesProcessed + 1,
          handsDetected: prev.handsDetected + (hands.length > 0 ? 1 : 0)
        }));

        // Check for raised hands
        for (const hand of hands) {
          const keypoints = hand.keypoints;
          
          // Get wrist and middle finger tip positions
          const wrist = keypoints.find(kp => kp.name === 'wrist');
          const middleFingerTip = keypoints.find(kp => kp.name === 'middle_finger_tip');
          
          if (wrist && middleFingerTip) {
            // Check if hand is raised (middle finger tip is above wrist by a threshold)
            const isHandRaised = middleFingerTip.y < wrist.y - 50; // Adjust threshold as needed
            
            if (isHandRaised) {
              console.log('Hand raise detected!');
              setDetectionStats(prev => ({
                ...prev,
                lastHandRaise: new Date().toISOString()
              }));
              
              handleHandRaiseDetected();
              break;
            }
          }
        }

        // Continue detection loop
        if (detectionActive && !responseDetected) {
          animationFrameRef.current = requestAnimationFrame(detectHandRaise);
        }
      }
    } catch (error) {
      console.error('Error in hand detection:', error);
      // Continue detection even if there's an error
      if (detectionActive && !responseDetected) {
        animationFrameRef.current = requestAnimationFrame(detectHandRaise);
      }
    }
  };

  const handleHandRaiseDetected = () => {
    if (detectionActive && !responseDetected) {
      setResponseDetected(true);
      setDetectionActive(false);
      clearInterval(timerRef.current);
      
      // Stop detection loop
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // Play success sound
      speak("Yay! I see your hand! Great job!");
      
      // Auto-proceed to result after 2 seconds
      setTimeout(() => {
        setGameState('result');
      }, 2000);
    }
  };

  const playBouncyInstruction = () => {
    setVideoState('playing');
    setCurrentBunny(bunnyNormal);
    
    const segments = [
      { 
        text: "Hello, I'm Bouncy!", 
        duration: 2000,
        image: bunnyNormal
      },
      { 
        text: "We're going to play together!", 
        duration: 2000,
        image: bunnyNormal
      },
      { 
        text: `If you are ${childName}, raise your hand like me!`, 
        duration: 3000,
        image: bunnyHandUp,
        speak: true
      }
    ];

    let currentSegment = 0;
    
    const playNextSegment = () => {
      if (currentSegment < segments.length) {
        const segment = segments[currentSegment];
        setVideoState(`playing-${currentSegment}`);
        setCurrentBunny(segment.image);
        
        if (segment.speak) {
          speak(segment.text, () => {
            currentSegment++;
            setTimeout(playNextSegment, 500);
          });
        } else {
          setTimeout(() => {
            currentSegment++;
            playNextSegment();
          }, segment.duration);
        }
      } else {
        setVideoState('completed');
        setCurrentBunny(bunnyHandUp);
        startResponseTimer();
        startDetection();
      }
    };
    
    playNextSegment();
  };

  const startResponseTimer = () => {
    setTimeLeft(30);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setDetectionActive(false);
          
          // Stop detection loop
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }
          
          setGameState('result');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startDetection = () => {
    setDetectionActive(true);
    // Start the detection loop
    if (detector) {
      animationFrameRef.current = requestAnimationFrame(detectHandRaise);
    } else {
      console.warn('Hand detector not ready yet');
    }
  };

  const startGame = () => {
    setGameState('playing');
    setResponseDetected(false);
    setVideoState('idle');
    setDetectionActive(false);
    setCurrentBunny(bunnyNormal);
    setDetectionStats({
      framesProcessed: 0,
      handsDetected: 0,
      lastHandRaise: null
    });
    
    setTimeout(() => {
      playBouncyInstruction();
    }, 1000);
  };

  const completeGame = () => {
    clearInterval(timerRef.current);
    window.speechSynthesis.cancel();
    
    // Stop detection loop
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
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
          responseToNameTimeLeft: timeLeft,
          responseToNameResponseTime: responseDetected ? (30 - timeLeft) : null,
          detectionStats: detectionStats
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
      window.speechSynthesis.cancel();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
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
              <span className="requirement-icon">🔊</span>
              <span>Sound on for voice instructions</span>
            </div>
            <div className="requirement-item">
              <span className="requirement-icon">⏱️</span>
              <span>30 seconds response time</span>
            </div>
            <div className="requirement-item">
              <span className="requirement-icon">✋</span>
              <span>Automatic hand detection</span>
            </div>
            <div className="requirement-item">
              <span className="requirement-icon">💡</span>
              <span>Good lighting recommended</span>
            </div>
          </div>
          
          <div className="instruction-preview">
            <div className="bunny-preview">
              <img src={bunnyHandUp} alt="Bouncy with hand up" className="preview-bunny" />
            </div>
            <div className="preview-text">
              <p>Bouncy will say:</p>
              <p className="instruction-highlight">"If you're <strong>{childName}</strong>, raise your hand like me!"</p>
              <p className="tech-note">The system will automatically detect when your child raises their hand!</p>
            </div>
          </div>
          
          <div className="detection-status-info">
            <h4>Hand Detection Status: <span className={detector ? 'status-ready' : 'status-loading'}>
              {detector ? '✅ Ready' : '🔄 Loading...'}
            </span></h4>
            {!detector && (
              <p className="tech-note">Please wait while the hand detection model loads...</p>
            )}
          </div>
          
          <button 
            className="btn" 
            onClick={startGame}
            disabled={!detector}
          >
            {detector ? 'Start Game with Bouncy!' : 'Loading Detection Model...'}
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="game-playing">
          {/* Bouncy Video Area */}
          <div className="bunny-video-container">
            <div className={`bunny-character ${videoState.includes('playing') ? 'animated' : ''}`}>
              <div className="bunny-avatar">
                <img src={currentBunny} alt="Bouncy" className="bunny-image" />
                {isSpeaking && <div className="speaking-indicator">🎤</div>}
              </div>
              
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
                  </div>
                )}
                {videoState === 'completed' && (
                  <div className="speech-bubble persistent">
                    {responseDetected ? 
                      "Yay! I see your hand! 🎉" : 
                      `Raise your hand like me! ✋ (${timeLeft}s left)`
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
                onUserMedia={() => console.log('Webcam ready')}
                onUserMediaError={(error) => console.error('Webcam error:', error)}
              />
              
              <div className="cv-overlay">
                <div className="detection-status">
                  {!detector ? (
                    <div className="detection-loading">
                      <span className="pulse-dot"></span>
                      Loading hand detection...
                    </div>
                  ) : detectionActive && !responseDetected ? (
                    <div className="detecting-indicator">
                      <span className="pulse-dot"></span>
                      Watching for hand raise... {timeLeft}s left
                      <br />
                      <small>Frames processed: {detectionStats.framesProcessed}</small>
                    </div>
                  ) : responseDetected ? (
                    <div className="detected-indicator">
                      ✅ Hand Raise Detected Automatically!
                    </div>
                  ) : (
                    <div className="waiting-indicator">
                      Waiting for instructions...
                    </div>
                  )}
                </div>
                
                <div className="body-guide"></div>
                <div className="hand-target left-hand"></div>
                <div className="hand-target right-hand"></div>
              </div>
            </div>

            <div className="response-info">
              <div className="timer-display">
                <span className="time-label">Time remaining:</span>
                <span className={`time-count ${timeLeft <= 10 ? 'time-warning' : ''}`}>
                  {timeLeft}s
                </span>
              </div>
              
              <div className="progress-bar">
                <div 
                  className={`progress-fill ${timeLeft <= 10 ? 'progress-warning' : ''}`}
                  style={{ width: `${(timeLeft / 30) * 100}%` }}
                ></div>
              </div>

              <div className="detection-stats">
                <div className="stat">
                  <span className="stat-label">Detection Status:</span>
                  <span className="stat-value">
                    {!detector ? 'Loading...' : 
                     responseDetected ? 'Hand Raised!' : 
                     detectionActive ? 'Active' : 'Ready'}
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-label">Frames Processed:</span>
                  <span className="stat-value">{detectionStats.framesProcessed}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Hands Detected:</span>
                  <span className="stat-value">{detectionStats.handsDetected}</span>
                </div>
                {responseDetected && (
                  <div className="stat">
                    <span className="stat-label">Response Time:</span>
                    <span className="stat-value success">{30 - timeLeft} seconds</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Manual Fallback Button */}
          <div className="observation-panel">
            <p>If automatic detection doesn't work, you can manually register the response:</p>
            <button 
              className={`response-btn ${responseDetected ? 'detected-btn' : 'yes-btn'}`}
              onClick={handleHandRaiseDetected}
              disabled={!detectionActive || responseDetected || isSpeaking}
            >
              {responseDetected ? (
                "✅ Hand Raised!"
              ) : isSpeaking ? (
                "🎤 Bouncy is speaking..."
              ) : (
                `✋ Manual: Click if child raises hand (${timeLeft}s left)`
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
                  <p className="result-detail">
                    Response detected in <strong>{30 - timeLeft} seconds</strong> out of 30 seconds total.
                    {detectionStats.lastHandRaise && ' (Automatically detected)'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="neutral-feedback">
                <div className="feedback-icon">🤔</div>
                <div className="feedback-text">
                  <p>We didn't see <strong>{childName}</strong> raise their hand this time.</p>
                  <p>This is completely normal! Children respond differently in new situations.</p>
                  <p className="result-detail">No response detected within 30 seconds.</p>
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
              <div className="stat-number">
                {responseDetected ? `${30 - timeLeft}s` : 'N/A'}
              </div>
              <div className="stat-label">Response Time</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{detectionStats.framesProcessed}</div>
              <div className="stat-label">Frames Analyzed</div>
            </div>
          </div>
          
          <div className="technical-details">
            <h4>Technical Details:</h4>
            <p>Frames processed: {detectionStats.framesProcessed}</p>
            <p>Hands detected in frames: {detectionStats.handsDetected}</p>
            <p>Detection model: TensorFlow.js + MediaPipe Hands</p>
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