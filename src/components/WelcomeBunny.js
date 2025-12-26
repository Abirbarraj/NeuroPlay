// src/components/WelcomeBunny.js
import React from 'react';
import bunny from '../images/bunny.png';
import '../styles/components/WelcomeBunny.css';

function WelcomeBunny({ onNext }) {
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