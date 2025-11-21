import React from 'react';
import './styles/components/ParentForm.css';

function ParentForm({ onNext }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onNext(); // passe à la page Bouncy
  };

  const questions = [
    { id: "A1", title: "Social pointing / shared attention", text: "Does the child point or gesture to direct someone’s attention to something they find interesting?" },
    { id: "A2", title: "Eye contact", text: "Does the child naturally make eye contact when interacting?" },
    { id: "A3", title: "Interest in peers", text: "Is the child curious about other children and tries to initiate interaction?" },
    { id: "A4", title: "Showing / sharing experiences", text: "Does the child bring or show objects to others as a way of sharing an experience?" },
    { id: "A5", title: "Social smiling", text: "Does the child smile socially (in response to others, not just randomly)?" },
    { id: "A6", title: "Overstimulation / sensory concerns", text: "Does the child become overly upset by everyday noises or sensory input?" },
  ];

  return (
    <div className="parent-form">
        <img src="https://cdn.jsdelivr.net/gh/eksch/pegjs-online@master/examples/star.svg" className="floating star" alt="" />
        <img src="https://cdn.jsdelivr.net/gh/eksch/pegjs-online@master/examples/heart.svg" className="floating heart" alt="" />
        <img src="https://cdn.jsdelivr.net/gh/eksch/pegjs-online@master/examples/cloud.svg" className="floating cloud" alt="" />

        <div className="container">
          <h1 style={{ fontSize: '3.4rem', color: '#555' }}>Parent Questionnaire</h1>

          <form onSubmit={handleSubmit} className="mchat-form">

            <div className="info-section">
              <input type="text" placeholder="Child's first name" required className="info-input" />
              <input type="number" placeholder="Child's age" min="1" max="18" required className="info-input" />
              <input type="text" placeholder="Your first name (parent)" required className="info-input" />
              <input type="email" placeholder="Your email (optional)" className="info-input" />
            </div>

            <p style={{ fontSize: '1.6rem', color: '#666', marginBottom: '40px' }}>
            Please fill in the information and answer <strong>Yes</strong> or <strong>No</strong> ✨
            </p>


            {questions.map(q => (
              <div key={q.id} className="question-block">
                <p className="question-title">{q.id}. {q.title}</p>
                <p className="question-text">{q.text}</p>
                <div className="yes-no-buttons">
                  <label className="choice yes">
                    <input type="radio" name={q.id} value="yes" required />
                    <span>Yes</span>
                  </label>
                  <label className="choice no">
                    <input type="radio" name={q.id} value="no" required />
                    <span>No</span>
                  </label>
                </div>
              </div>
            ))}

            <button type="submit" className="btn" style={{ marginTop: '50px', padding: '20px 100px' }}>
              Meet Bouncy & Start Games 🚀
            </button>
          </form>

          <p style={{ marginTop: '30px', fontSize: '1.1rem', color: '#888' }}>
            All your answers are private and only used for this session.
          </p>
        </div>
    </div>
  );
}

export default ParentForm;