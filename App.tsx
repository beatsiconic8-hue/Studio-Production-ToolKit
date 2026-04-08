import React from 'react';
import LyricsFormatter from './components/LyricsFormatter';
import InstrumentalPromptGenerator from './components/InstrumentalPromptGenerator';
import SEOUploadGenerator from './components/SEOUploadGenerator';

export default function App() {
  return (
    <div className="w-full flex flex-col">
      <LyricsFormatter />
      <InstrumentalPromptGenerator />
      <SEOUploadGenerator />
    </div>
  );
}