
import React, { useState } from 'react';
import { Sparkles, Copy, RotateCcw, RefreshCw, List, Music, FileText, Settings, BrainCircuit } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface SavedPrompt {
  timestamp: string;
  genre: string;
  mood: string;
  lyricsBox: string;
  stylesBox: string;
}

export default function InstrumentalPromptGenerator() {
  const [formData, setFormData] = useState({
    genre: '',
    mood: '',
    additionalMoods: '',
    tempo: '',
    instruments: '',
    theme: '',
    additionalStyles: '',
    producerTag: ''
  });

  const [results, setResults] = useState({
    lyricsBox: '',
    stylesBox: ''
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [showSavedPanel, setShowSavedPanel] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');

  const genres = [
    'G-Funk', 'Boom Bap', 'Industrial', 'Glitch', 'Chicago Rap', 'Chicago Blues & Soul', 
    'West Coast G-Funk X East Coast Boom Bap', 'Phonk', 'Drill', 'Lo-fi Hip Hop', 
    'Electronic', 'Trip Hop', 'Synthwave', 'Dark Ambient', 'R&B', 'Neo-Soul'
  ];

  const moods = [
    'Energetic', 'Melancholic', 'Chill', 'Dark', 'Aggressive', 'Dreamy', 
    'Nostalgic', 'Epic', 'Mysterious', 'Playful', 'Intense', 'Peaceful'
  ];

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text || '');
    setCopyStatus(`✓ ${label} copied!`);
    setTimeout(() => setCopyStatus(''), 2000);
  };

  const generatePrompt = async () => {
    const { genre, mood, additionalMoods, tempo, instruments, theme, additionalStyles, producerTag } = formData;
    
    if (!genre) {
      setCopyStatus('⚠️ Select a genre first');
      setTimeout(() => setCopyStatus(''), 2000);
      return;
    }

    setIsGenerating(true);
    setResults({ lyricsBox: '', stylesBox: '' });

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const systemInstruction = `You are a high-end music production assistant for "Iconic Beats".
      Input Data:
      Genre: ${genre}
      Mood: ${mood} (${additionalMoods})
      Tempo: ${tempo}
      Instruments: ${instruments}
      Theme: ${theme}
      Extra Styles/Keywords: ${additionalStyles}
      Producer Tag: ${producerTag || 'None'}

      TASK 1: Create a [LYRICS BOX] template. Follow this structure EXACTLY:
      [Instrumental Only]
      Fusion of [GENRE DETAILS]. No vocals, no ad-libs.
      [Global Production Cues]
      [Production: list 3-4 specific production techniques related to the genre/mood]
      [Drums: list specific drum textures and patterns]
      [Texture: list atmospheric qualities]
      [Mix: list audio engineering traits]
      [Structure: Intro – Groove A – Switch-Up – Breakdown – Groove B – Outro]
      [Intro – 4 bars]
      [Production: describe intro sounds]
      [Groove A – 16 bars]
      [Production: describe main groove]
      [bassline: describe bass movement]
      [Switch-Up – 8 bars]
      [Production: describe transition/variation]
      [Breakdown – 4 bars]
      [Production: describe the stripped back section]
      [Groove B – 16 bars]
      [Production: describe the evolved groove]
      [Outro – fade]
      [Production: describe final exit]
      (If a producer tag is provided, integrate it tastefully into the Intro or Outro cues).

      TASK 2: Create a [STYLES BOX] summary.
      Condense ALL the input information (Genre, Mood, Tempo, Instruments, Theme, Styles) into a single, extremely dense string of comma-separated keywords.
      CRITICAL CONSTRAINT: The final string MUST be between 990 and 1000 characters long.
      Do not repeat words. Use high-quality filler terms like 'high-definition-audio', 'audiophile-grade-mastering', 'pristine-transient-response', 'professional-studio-tracking' to reach the 990-1000 character length if the input is short.
      No sentences, only tags/keywords.

      Return the response as JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Generate the music production prompts.",
        config: {
          systemInstruction,
          responseMimeType: "application/json",
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        setResults({
          lyricsBox: parsed.lyricsBox || parsed.lyrics_box || "",
          stylesBox: (parsed.stylesBox || parsed.styles_box || "").substring(0, 1000)
        });
        setShowResults(true);
      }
    } catch (error) {
      console.error(error);
      setCopyStatus('❌ AI Generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      genre: '',
      mood: '',
      additionalMoods: '',
      tempo: '',
      instruments: '',
      theme: '',
      additionalStyles: '',
      producerTag: ''
    });
    setShowResults(false);
  };

  const backgroundStyle = {
    background: `linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)`
  };

  return (
    <div className="relative min-h-screen p-6 text-white font-sans" style={backgroundStyle}>
      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/10 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/20 rounded-xl border border-purple-500/30">
                <Music className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tighter uppercase">Iconic Beat Architect</h1>
                <p className="text-purple-300 text-sm font-medium">Next-Gen Suno Prompt Engineering V2</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowSavedPanel(!showSavedPanel)} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg flex items-center gap-2 transition-all">
                <List size={18} /> Saved ({savedPrompts.length})
              </button>
              <button onClick={resetForm} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg flex items-center gap-2 transition-all">
                <RotateCcw size={18} /> Reset
              </button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Inputs Section */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl space-y-5">
              <h2 className="text-xl font-bold flex items-center gap-2 text-purple-400">
                <Settings size={20} /> Production Parameters
              </h2>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5 ml-1">Genre / Fusion</label>
                <select 
                  value={formData.genre}
                  onChange={(e) => setFormData({...formData, genre: e.target.value})}
                  className="w-full p-3 rounded-xl bg-black/40 border border-white/10 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                >
                  <option value="">Select Primary Genre...</option>
                  {genres.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5 ml-1">Vibe</label>
                  <select 
                    value={formData.mood}
                    onChange={(e) => setFormData({...formData, mood: e.target.value})}
                    className="w-full p-3 rounded-xl bg-black/40 border border-white/10 focus:border-purple-500 outline-none"
                  >
                    <option value="">Select Mood...</option>
                    {moods.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5 ml-1">Speed</label>
                  <select 
                    value={formData.tempo}
                    onChange={(e) => setFormData({...formData, tempo: e.target.value})}
                    className="w-full p-3 rounded-xl bg-black/40 border border-white/10 focus:border-purple-500 outline-none"
                  >
                    <option value="">Tempo...</option>
                    <option value="Slow (60-80 BPM)">Slow (60-80)</option>
                    <option value="Mid (85-115 BPM)">Mid (85-115)</option>
                    <option value="Fast (120-145 BPM)">Fast (120-145)</option>
                    <option value="Club (150+ BPM)">Club (150+)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5 ml-1">Additional Emotions</label>
                <input 
                  type="text" 
                  value={formData.additionalMoods}
                  onChange={(e) => setFormData({...formData, additionalMoods: e.target.value})}
                  placeholder="e.g., Gritty, Cinematic, Underwater..." 
                  className="w-full p-3 rounded-xl bg-black/40 border border-white/10 focus:border-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5 ml-1">Core Instruments</label>
                <input 
                  type="text" 
                  value={formData.instruments}
                  onChange={(e) => setFormData({...formData, instruments: e.target.value})}
                  placeholder="e.g., Moog Synth, MPC Drums, Rhodes..." 
                  className="w-full p-3 rounded-xl bg-black/40 border border-white/10 focus:border-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5 ml-1">Narrative Theme</label>
                <textarea 
                  value={formData.theme}
                  onChange={(e) => setFormData({...formData, theme: e.target.value})}
                  placeholder="e.g., A rainy night in Chicago, 1994..." 
                  rows={2}
                  className="w-full p-3 rounded-xl bg-black/40 border border-white/10 focus:border-purple-500 outline-none resize-none"
                />
              </div>

              <div className="pt-2 border-t border-white/5">
                <label className="block text-xs font-bold uppercase text-purple-400 mb-1.5 ml-1">Custom Styles & Keywords (Deep Query)</label>
                <textarea 
                  value={formData.additionalStyles}
                  onChange={(e) => setFormData({...formData, additionalStyles: e.target.value})}
                  placeholder="Paste references, specific hardware names, or specialized sub-genres here..." 
                  rows={3}
                  className="w-full p-3 rounded-xl bg-black/40 border border-white/10 focus:border-purple-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5 ml-1">Producer Tag (Optional)</label>
                <input 
                  type="text" 
                  value={formData.producerTag}
                  onChange={(e) => setFormData({...formData, producerTag: e.target.value})}
                  placeholder="e.g., Iconic Beats Production..." 
                  className="w-full p-3 rounded-xl bg-black/40 border border-white/10 focus:border-purple-500 outline-none"
                />
              </div>

              <button 
                onClick={generatePrompt}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 py-4 rounded-xl font-black text-lg uppercase tracking-widest shadow-lg shadow-purple-500/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isGenerating ? <RefreshCw className="animate-spin" /> : <Sparkles />}
                {isGenerating ? "Architecting..." : "Forge Iconic Prompt"}
              </button>
              
              {copyStatus && (
                <div className="text-center text-sm font-bold text-green-400 animate-pulse">
                  {copyStatus}
                </div>
              )}
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-7 space-y-6">
            {showResults ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Lyrics Box Result */}
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl border-l-4 border-l-purple-500">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <FileText className="text-purple-400" />
                      <h3 className="text-xl font-bold uppercase">Suno Lyrics Box Prompt</h3>
                    </div>
                    <button 
                      onClick={() => handleCopy(results.lyricsBox, 'Lyrics Template')}
                      className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-lg"
                    >
                      <Copy size={16} /> Copy Template
                    </button>
                  </div>
                  <div className="bg-black/60 p-5 rounded-xl border border-white/5 font-mono text-sm leading-relaxed text-gray-300 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {results.lyricsBox}
                  </div>
                </div>

                {/* Styles Box Result */}
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl border-l-4 border-l-blue-500">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <BrainCircuit className="text-blue-400" />
                      <h3 className="text-xl font-bold uppercase">Suno Styles Box Prompt</h3>
                    </div>
                    <div className="flex flex-col items-end">
                      <button 
                        onClick={() => handleCopy(results.stylesBox, 'Style Summary')}
                        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-lg"
                      >
                        <Copy size={16} /> Copy Styles
                      </button>
                      <span className={`text-[10px] mt-1 font-mono ${(results.stylesBox || '').length >= 990 ? 'text-green-400' : 'text-yellow-400'}`}>
                        {(results.stylesBox || '').length} / 1000 Chars
                      </span>
                    </div>
                  </div>
                  <div className="bg-black/60 p-5 rounded-xl border border-white/5 font-mono text-xs leading-relaxed text-blue-200 break-all select-all">
                    {results.stylesBox}
                  </div>
                  <p className="mt-3 text-[10px] text-gray-500 italic">
                    AI Analysis: Condensed genre fusion, mood descriptors, and instrument textures into a high-density 1k keyword block.
                  </p>
                </div>

              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-12 bg-white/5 backdrop-blur-md rounded-2xl border border-dashed border-white/20">
                <div className="p-6 bg-white/5 rounded-full mb-4 animate-pulse">
                  <Sparkles className="w-12 h-12 text-gray-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-500 uppercase tracking-widest">Awaiting Input</h3>
                <p className="text-gray-600 text-sm text-center max-w-xs mt-2">
                  Populate the parameters and forge the prompt to see the structured production templates.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showSavedPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 w-full max-w-2xl rounded-2xl border border-white/10 p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold uppercase">Saved Production Blueprints</h2>
              <button onClick={() => setShowSavedPanel(false)} className="text-gray-400 hover:text-white">✕ Close</button>
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {savedPrompts.length === 0 ? (
                <div className="text-center py-12 text-gray-500 italic">No blueprints saved yet.</div>
              ) : (
                savedPrompts.map((p, i) => (
                  <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/10 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-purple-400">{p.genre}</h4>
                      <p className="text-xs text-gray-500">{p.timestamp}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setResults({ lyricsBox: p.lyricsBox, stylesBox: p.stylesBox }); setShowResults(true); setShowSavedPanel(false); }} className="px-3 py-1 bg-blue-600 rounded text-xs">Load</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
