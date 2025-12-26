// src/components/WelcomeBunny.js
import React, { useEffect } from 'react';
import bunny from '../images/bunny.png';
import '../styles/components/WelcomeBunny.css';

function WelcomeBunny({ onNext }) {
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

  useEffect(() => {
    speak("I'm Bouncy, your fluffy friend! Let's play some fun games together! If you want to play with me, press let's start!");
  }, []);

  return (
    <div className="welcome-bunny">
        <img src="https://cdn.jsdelivr.net/gh/eksch/pegjs-online@master/examples/star.svg" className="floating star" alt="" />
        <img src="https://cdn.jsdelivr.net/gh/eksch/pegjs-online@master/examples/heart.svg" className="floating heart" alt="" />
        <img src="https://cdn.jsdelivr.net/gh/eksch/pegjs-online@master/examples/cloud.svg" className="floating cloud" alt="" />

        <div className="container">
          <h1>✨ Hi Little Friend! ✨</h1>
          <img src={bunny} alt="Bouncy the bunny" className="bunny" />
          <p>I'm Bouncy, your fluffy friend!<br />Let's play some fun games together!</p>
          <button className="btn" onClick={onNext}>Let's Start! 🚀</button>
        </div>
    </div>
  );
}

export default WelcomeBunny;