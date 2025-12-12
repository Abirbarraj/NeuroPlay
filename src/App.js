import React, { useState, useEffect } from 'react';
import ParentForm from './components/ParentForm';        
import WelcomeBunny from './components/WelcomeBunny'; 
import GameSuite from './components/Games/GameSuite';
import ResultsScreen from './components/ResultsScreen';
import AppDora from './AppDora'; 
import OverstimulatingGameWithTimer from './OverstimulatingGame';
import './styles/App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('form');

  useEffect(() => {
    const savedData = localStorage.getItem('currentScreening');
    if (savedData) console.log('Found saved screening data');
  }, []);

  return (
    <>
      {currentPage === 'form' && (
        <ParentForm onNext={() => setCurrentPage('bunny')} />
      )}
      {currentPage === 'bunny' && (
        <WelcomeBunny onNext={() => setCurrentPage('games')} />
      )}
      {currentPage === 'games' && (
        <GameSuite onComplete={() => setCurrentPage('dora')} />
      )}
      {currentPage === 'dora' && (
        <AppDora onNext={() => setCurrentPage('overstim')} />
      )}
      {currentPage === 'overstim' && (
        <OverstimulatingGameWithTimer finish={() => setCurrentPage('results')} />
      )}
      {currentPage === 'results' && <ResultsScreen />}
    </>
  );
}

export default App;
