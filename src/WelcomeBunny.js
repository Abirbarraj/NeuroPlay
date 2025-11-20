// src/WelcomeBunny.js
import React from 'react';
import bunny from './images/bunny.png';

function WelcomeBunny() {
  return (
    <div className="App">
      <div className="background">
        <img src="https://cdn.jsdelivr.net/gh/eksch/pegjs-online@master/examples/star.svg" className="floating star" alt="" />
        <img src="https://cdn.jsdelivr.net/gh/eksch/pegjs-online@master/examples/heart.svg" className="floating heart" alt="" />
        <img src="https://cdn.jsdelivr.net/gh/eksch/pegjs-online@master/examples/cloud.svg" className="floating cloud" alt="" />

        <div className="container">
          <h1>Hi Little Friend! ✨</h1>
          <img src={bunny} alt="Bouncy the bunny" className="bunny" />
          <p>I'm Bouncy, your fluffy friend!<br />Let's play some fun games together!</p>
          <button className="btn">Let's Start! 🚀</button>
        </div>
      </div>
    </div>
  );
}

export default WelcomeBunny;   