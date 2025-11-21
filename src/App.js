import React, { useState } from 'react';
import ParentForm from './ParentForm';
import WelcomeBunny from './WelcomeBunny';
import './styles/App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('form');

  return (
    <>
      {currentPage === 'form' ? (
        <ParentForm onNext={() => setCurrentPage('bunny')} />
      ) : (
        <WelcomeBunny />
      )}
    </>
  );
}

export default App;