

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Download, Copy, RefreshCw, FileText, Sparkles, Volume2, User, Mic, MicOff, BrainCircuit, LayoutTemplate, Music, Ghost, Zap, Globe, Search, Edit3, ShieldCheck, Save } from 'lucide-react';
import { LyricSection, VocalStylesMap, PresetChoice, TemplateType } from '../types';
import { generateVocalStyles, structureLyrics, generateStylePreviewAudio, transcribeAudio, generateTemplateFormattedLyrics, researchAndGenerateVocalStyles, generateIntroOutroSuggestion } from '../services/geminiService';

const DEFAULT_STYLES: VocalStylesMap = {
  'pristine-analog-soul': 'Elite studio-grade soulful male vocal. Signal Chain: Sony C800G -> Neve 1073 Preamp -> Tube-Tech CL1B. Warm mid-range with rich harmonic saturation and intimate proximity effect. Ambient Soundscape: Subtle vinyl crackle and distant city hum.',
  'ultra-hd-rnb': 'High-definition female R&B vocal. Signal Chain: Telefunken ELA M 251 -> Avalon VT-737sp. Crystal clear high-end, breathy texture, processed with smooth optical compression and wide stereo imaging. Ambient Soundscape: Soft ocean waves and distant seagulls.',
  'gritty-studio-rap': 'Aggressive professional rap vocal. Signal Chain: Neumann U87 -> API 512C -> 1176LN (4:1 ratio). High-energy delivery, crisp transients, slight tube distortion, centered mono focus. Ambient Soundscape: Gritty urban street noise and distant sirens.',
  'cinematic-ethereal': 'Ethereal cinematic female vocal. Signal Chain: Manley Reference Gold -> Pultec EQP-1A. Layered harmonic textures, expansive 10-second reverb tail, airy frequency response. Ambient Soundscape: Deep space drones and celestial wind textures.',
  'vintage-g-funk': 'Classic West Coast G-Funk vocal. Signal Chain: AKG C12 -> Universal Audio 610. Laid-back slick delivery, analog tape warmth, processed with vintage Roland Chorus. Ambient Soundscape: Lowrider engine idle and distant West Coast party chatter.',
  'boom-bap-gritty': 'Raw NYC Boom Bap vocal. Signal Chain: Shure SM7B -> Great River ME-1NV. Rhythmic precision, gritty mid-range, dusty 12-bit texture. Ambient Soundscape: Subway train screech and bustling NYC sidewalk conversations.',
  'modern-autotune-pro': 'Professional modern trap vocal. Signal Chain: Sony C800G -> Antares Auto-Tune Pro (Retune Speed: 0). Polished metallic resonance, high-speed rhythmic runs, hyper-bright clarity. Ambient Soundscape: Distant club bass and muffled VIP lounge laughter.',
  'velvet-jazz-studio': 'Deep velvet jazz vocal. Signal Chain: RCA 44-BX Ribbon -> AEA RPQ2. Rolled-off highs, incredibly smooth and warm tone, intimate detail. Ambient Soundscape: Quiet jazz club atmosphere with subtle glass clinking and soft applause.',
  'hyper-aggressive-hd': 'Hyper-aggressive studio vocal. Signal Chain: EV RE20 -> Distressor (Nuke mode). Extreme energy, gravelly texture, multi-band transient shaping for maximum impact. Ambient Soundscape: Thunderous storm and heavy rain hitting a metal roof.',
  'whisper-studio-pro': 'Intimate studio whisper vocal. Signal Chain: DPA 4006 -> Millennia HV-3C. Extreme proximity effect, high-frequency breath detail, wide binaural feel. Ambient Soundscape: Gentle forest rustling and soft birdsong.',
  'soulful-gospel-choir': 'Massive soulful gospel vocal. Signal Chain: Decca Tree Array (Neumann M50s). Stacked harmonies, church-like natural ambience, powerful dynamic range. Ambient Soundscape: Grand cathedral reverb and soft organ hum.',
  'smooth-operator-pro': 'Sultry professional male vocal. Signal Chain: Brauner VM1 -> GML 8304. Deep resonance, melodic swagger, subtle room ambience, refined and polished. Ambient Soundscape: Luxury penthouse balcony with distant city traffic and soft wind.',
  'industrial-distorted': 'Heavy industrial vocal. Signal Chain: Bullet Mic -> Thermionic Culture Vulture. Artistic distortion, aggressive compression, cold digital grit. Ambient Soundscape: Factory machinery clanking and industrial steam vents.',
  'lofi-vintage-tube': 'Lofi vintage tube vocal. Signal Chain: Carbon Mic -> Vintage Radio Transmitter. Narrow frequency response, warm saturation, nostalgic texture. Ambient Soundscape: Old radio static and distant 1940s ballroom music.',
  'latin-pop-pristine': 'Pristine Latin pop vocal. Signal Chain: Manley Cardioid Reference -> SSL 4000E Channel Strip. Vibrant and energetic, forward-leaning mix presence, rhythmic swing. Ambient Soundscape: Bustling tropical market and distant salsa music.',
  'urban-night-drive': 'Late-night urban vocal. Signal Chain: Neumann M149 -> Manley Voxbox. Smooth, compressed, and intimate. Ambient Soundscape: Distant freeway hum and occasional passing cars.',
  'coffee-shop-unplugged': 'Raw acoustic coffee shop vocal. Signal Chain: AKG C414 -> Focusrite ISA One. Natural, warm, and transparent. Ambient Soundscape: Soft clinking of cups and faint background chatter.',
  'mountain-wind-folk': 'Airy mountain folk vocal. Signal Chain: Schoeps Colette -> Millennia Media. Breathy, wide, and natural. Ambient Soundscape: Howling mountain wind and distant eagle cries.',
  'subway-station-echo': 'Echoey subway station vocal. Signal Chain: Sennheiser MD441 -> Neve 1073. Gritty, rhythmic, and resonant. Ambient Soundscape: Approaching train rumble and echoing footsteps.',
  'rainy-window-lofi': 'Cozy rainy window lofi vocal. Signal Chain: Shure 55SH -> Warm Audio WA-2A. Muffled, warm, and nostalgic. Ambient Soundscape: Gentle rain tapping on glass and distant thunder rumbles.'
};

const SOUNDSCAPES: Record<string, string> = {
  'none': 'None',
  'city-traffic': 'City Traffic & Horns',
  'freeway': 'Freeway Speed',
  'traffic-jam': 'Traffic Jam Gridlock',
  'sirens': 'Distant Emergency Sirens',
  'conversations': 'Faint Conversations',
  'laughter': 'Background Laughter',
  'coffee-shop': 'Coffee Shop Ambience',
  'wind': 'Howling Wind',
  'birds': 'Morning Birds',
  'trains': 'Subway/Train Rumble'
};

/**
 * Studio Sanitizer: Automatically censors explicit language for radio-safe scripts
 * Updated with specific requested censor patterns.
 */
const sanitizeLyrics = (text: string): string => {
  const profanityMap: Record<string, string> = {
    'mother fucker': 'm*ther fucker',
    'mother-fucker': 'm*ther-fucker',
    'motherfucker': 'm*therfucker',
    'motherfuckin': 'm*therfuckin',
    'nigger': 'n*gga',
    'nigga': 'n*gga',
    'bitch': 'b*tch',
    'bitches': 'b*tches',
    'fag': 'f*g',
    'fuck': 'f*ck',
    'shit': 'sh*t',
    'pussy': 'p*ssy',
    'dick': 'd*ck',
    'asshole': 'a**hole',
    'cunt': 'c*nt',
  };
  
  let sanitized = text;
  // Sort keys by length in descending order to handle longer profanities first
  const sortedKeys = Object.keys(profanityMap).sort((a, b) => b.length - a.length);

  sortedKeys.forEach(key => {
    // Case-insensitive boundary match
    const regex = new RegExp(`\\b${key}\\b`, 'gi');
    sanitized = sanitized.replace(regex, profanityMap[key]);
  });
  return sanitized;
};

export default function LyricsFormatter() {
  const [sections, setSections] = useState<LyricSection[]>([
    { id: 1, type: 'verse', artistName: '', gender: 'male', vocalStyle: 'vintage-g-funk', lyrics: '' }
  ]);
  const [formattedOutput, setFormattedOutput] = useState('');
  const [vocalStyles, setVocalStyles] = useState<VocalStylesMap>(DEFAULT_STYLES);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [isResearchingStyles, setIsResearchingStyles] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  const [templateType, setTemplateType] = useState<TemplateType>('off');
  const [customIntro, setCustomIntro] = useState('');
  const [customOutro, setCustomOutro] = useState('');
  const [bulkLyrics, setBulkLyrics] = useState('');
  const [showBulkInput, setShowBulkInput] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [isSanitizing, setIsSanitizing] = useState(true);
  const [isGeneratingIntro, setIsGeneratingIntro] = useState(false);
  const [isGeneratingOutro, setIsGeneratingOutro] = useState(false);
  const [selectedSoundscape, setSelectedSoundscape] = useState('none');
  const [subscribePreset, setSubscribePreset] = useState(0);
  const [showProducerTagline, setShowProducerTagline] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // New producer taglines based on user request
  const verseTagline = '[Iconic... (An Evolution Of.....)]';
  const chorusTagline = '[Another Musical Masterpiece (hahahahahaha) Iconic... (An Evolution Of.....) Santiago Green Production (hahahahahahaha)]';

  useEffect(() => {
    try {
      const saved = localStorage.getItem('vocal-styles');
      if (saved) {
        setVocalStyles({ ...DEFAULT_STYLES, ...JSON.parse(saved) });
      }
    } catch (error) {
      setVocalStyles(DEFAULT_STYLES);
    }
  }, []);

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        chunksRef.current = [];
        recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
        recorder.onstop = async () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = async () => {
            const base64data = reader.result?.toString().split(',')[1];
            if (base64data) {
              setUpdateMessage("🎙️ Transcribing...");
              const text = await transcribeAudio(base64data);
              setBulkLyrics(prev => prev + (prev ? "\n" : "") + text);
              setUpdateMessage("✅ Transcribed!");
              setTimeout(() => setUpdateMessage(""), 2000);
            }
          };
        };
        recorder.start();
        setIsRecording(true);
      } catch (err) {
        setUpdateMessage("❌ Mic access denied.");
      }
    }
  };

  const getIntro = () => customIntro.trim() || `"you thought u could move to Los Angeles, and become rich and famous huh??" (Hahahahahahaha)\nIconic (Iconic Beats)`;
  const getOutro = () => customOutro.trim() || getIntro();

  const generateIntroSuggestion = async () => {
    setIsGeneratingIntro(true);
    setUpdateMessage('🧠 AI crafting intro...');
    try {
      const suggestion = await generateIntroOutroSuggestion('intro', sections, vocalStyles);
      setCustomIntro(suggestion);
      setUpdateMessage('✅ Intro crafted!');
    } catch (error) {
      setUpdateMessage('❌ Failed to generate intro.');
    } finally {
      setIsGeneratingIntro(false);
      setTimeout(() => setUpdateMessage(''), 3000);
    }
  };

  const generateOutroSuggestion = async () => {
    setIsGeneratingOutro(true);
    setUpdateMessage('🧠 AI crafting outro...');
    try {
      const suggestion = await generateIntroOutroSuggestion('outro', sections, vocalStyles);
      setCustomOutro(suggestion);
      setUpdateMessage('✅ Outro crafted!');
    } catch (error) {
      setUpdateMessage('❌ Failed to generate outro.');
    } finally {
      setIsGeneratingOutro(false);
      setTimeout(() => setUpdateMessage(''), 3000);
    }
  };

  const addSection = () => {
    const newId = Math.max(0, ...sections.map(s => s.id)) + 1;
    setSections([...sections, { id: newId, type: 'verse', artistName: '', gender: 'male', vocalStyle: activePreset || 'vintage-g-funk', lyrics: '' }]);
  };

  const removeSection = (id: number) => {
    if (sections.length > 1) setSections(sections.filter(s => s.id !== id));
  };

  const updateSection = (id: number, field: keyof LyricSection, value: string) => {
    setSections(sections.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const applyPresetToAll = (styleKey: string) => {
    setActivePreset(styleKey);
    setSections(sections.map(s => ({ ...s, vocalStyle: styleKey })));
    setUpdateMessage(`✨ Applied ${styleKey.replace(/-/g, ' ')} to all sections`);
    setTimeout(() => setUpdateMessage(''), 2000);
  };

  const updateVocalStylesViaAI = async () => {
    setIsResearchingStyles(true);
    setUpdateMessage('🔍 Sniffing the web for trending vocal chains...');
    try {
      const newStyles = await researchAndGenerateVocalStyles();
      const updatedMap = { ...vocalStyles };
      newStyles.forEach(s => {
        updatedMap[s.key] = s.description;
      });
      setVocalStyles(updatedMap);
      localStorage.setItem('vocal-styles', JSON.stringify(updatedMap));
      setUpdateMessage('✅ Palette updated with industry-grade trends!');
    } catch (error) {
      setUpdateMessage('❌ AI Research failed.');
    } finally {
      setIsResearchingStyles(false);
      setTimeout(() => setUpdateMessage(''), 3000);
    }
  };

  const autoSplitLyrics = async () => {
    if (!bulkLyrics.trim()) return;
    setIsAnalyzing(true);
    setUpdateMessage('🧠 AI is structuring sections...');
    try {
      const analyzed = await structureLyrics(bulkLyrics);
      setSections(analyzed.map((s, i) => ({
        id: i + 1,
        type: s.type.toLowerCase(),
        artistName: s.artistName || '',
        gender: s.gender || 'male',
        vocalStyle: vocalStyles[s.vocalStyle] ? s.vocalStyle : 'vintage-g-funk',
        lyrics: s.lyrics.trim()
      })));
      setShowBulkInput(false);
    } catch (error) {
      setUpdateMessage('❌ Analysis failed.');
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => setUpdateMessage(''), 3000);
    }
  };

  const generateFormatted = async () => {
    setIsFormatting(true);
    setUpdateMessage(`✨ Sculpting Professional Script...`);
    
    let finalOutput = '';

    try {
      if (templateType !== 'off') {
        // If templated output, use AI to generate with the chorusTagline provided as general tag
        const result = await generateTemplateFormattedLyrics(
          templateType as 'gfunk-boombap' | 'cinematic',
          sections,
          vocalStyles,
          getIntro(),
          getOutro()
        );
        finalOutput = result;
      } else {
        let output = `[Intro - ${getIntro()}]\n\n`;

        sections.forEach((section) => {
          const gender = section.gender.charAt(0).toUpperCase() + section.gender.slice(1);
          const style = vocalStyles[section.vocalStyle] || vocalStyles['vintage-g-funk'];
          const artist = section.artistName || 'Artist';
          const type = section.type.charAt(0).toUpperCase() + section.type.slice(1);
          
          output += `[${type} - ${artist}, ${gender}, ${style}${selectedSoundscape !== 'none' ? ` + ${SOUNDSCAPES[selectedSoundscape]}` : ''}]\n`;
          output += `${section.lyrics.trim()}\n`; // Add lyrics and one newline

          if (subscribePreset === 1) {
            output += `Subscribe if your vibin'\n`;
          } else if (subscribePreset === 2) {
            output += `Subscribe for the next sonic fusion\n`;
          }

          if (showProducerTagline) {
            if (section.type === 'verse') {
              output += `[Producer Tagline - ${section.vocalStyle.replace(/-/g, ' ').toUpperCase()}]Iconic     (An Evolution Of)\n`;
            } else if (section.type === 'chorus') {
              output += `[Producer Tagline - ${section.vocalStyle.replace(/-/g, ' ').toUpperCase()}]Another Musical Masterpiece (hit em with the hot) Iconic     (An Evolution Of) Santiago Green Production.\n`;
            }
          }

          if (section.type === 'verse' && !showProducerTagline) {
            output += `${verseTagline}\n\n`; // Add verse tag, then two newlines
          } else if (section.type === 'chorus' && !showProducerTagline) {
            output += `${chorusTagline}\n\n`; // Add chorus tag, then two newlines
          } else {
            output += `\n`; // Add one more newline for other sections to make it two newlines total after lyrics
          }
        });

        output += `[Outro - ${getOutro()}]`;
        finalOutput = output;
      }

      // Apply Studio Sanitizer if enabled
      if (isSanitizing) {
        finalOutput = sanitizeLyrics(finalOutput);
        setUpdateMessage('🛡️ Sanitized for Radio Play!');
      } else {
        setUpdateMessage('✅ Script Sculpted!');
      }

      setFormattedOutput(finalOutput);
    } catch (err) {
      setUpdateMessage('❌ Formatting failed.');
    } finally {
      setIsFormatting(false);
      setTimeout(() => setUpdateMessage(''), 3000);
    }
  };

  return (
    <div className="relative min-h-screen p-6 overflow-hidden font-sans">
      <div className="fixed inset-0 z-0 bg-black" style={{backgroundImage: 'url("https://i.postimg.cc/NMqfH4jQ/Iconic-Beats-Skin.jpg")', backgroundSize: 'cover', backgroundPosition: 'center'}} />
      <div className="fixed inset-0 z-0 bg-black/50" />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 mb-2 uppercase tracking-tighter shadow-black drop-shadow-2xl">
            ICONIC BEATS Production Suite
          </h1>
          <p className="text-yellow-100 text-lg font-bold tracking-widest uppercase opacity-80">Industry-Grade Script Sculpting</p>
        </div>

        {/* Vocal Style Presets Bar */}
        <div className="mb-8 bg-black/60 backdrop-blur-xl p-4 rounded-2xl border-2 border-yellow-600/30 shadow-[0_0_50px_rgba(234,179,8,0.1)]">
          <div className="flex justify-between items-center mb-4 px-2">
            <h3 className="text-[10px] font-black uppercase text-yellow-500 tracking-[0.3em] flex items-center gap-2">
              <Zap size={14} className="animate-pulse" /> Master Vocal Presets (Quick Apply All)
            </h3>
            <button 
              onClick={updateVocalStylesViaAI}
              disabled={isResearchingStyles}
              className="bg-yellow-600 hover:bg-yellow-500 text-black px-4 py-2 rounded-lg font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-xl active:scale-95 transition-all disabled:opacity-50"
            >
              {isResearchingStyles ? <RefreshCw size={14} className="animate-spin" /> : <Globe size={14} />}
              AI Research: Trending Chains
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-3 custom-scrollbar">
            {Object.keys(vocalStyles).map((styleKey) => (
              <button
                key={styleKey}
                onClick={() => applyPresetToAll(styleKey)}
                className={`group relative flex flex-col items-start p-3 rounded-xl border-2 transition-all min-w-[180px] max-w-[180px] text-left ${activePreset === styleKey ? 'bg-yellow-600/20 border-yellow-500' : 'bg-white/5 border-white/10 hover:border-yellow-600/50'}`}
              >
                <span className="text-[10px] font-black uppercase text-white mb-1 truncate w-full">{styleKey.replace(/-/g, ' ')}</span>
                <p className="text-[8px] text-gray-400 line-clamp-2 leading-tight group-hover:text-gray-300">{vocalStyles[styleKey]}</p>
                {activePreset === styleKey && <div className="absolute top-2 right-2 w-2 h-2 bg-yellow-500 rounded-full animate-ping" />}
              </button>
            ))}
          </div>

          {/* Soundscape Selection */}
          <div className="mt-4 pt-4 border-t border-yellow-600/20">
            <h3 className="text-[10px] font-black uppercase text-yellow-500 tracking-[0.3em] flex items-center gap-2 mb-3">
              <Volume2 size={14} /> Layered Ambient Soundscapes
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
              {Object.keys(SOUNDSCAPES).map((key) => (
                <button
                  key={key}
                  onClick={() => setSelectedSoundscape(key)}
                  className={`px-4 py-2 rounded-lg border-2 text-[9px] font-black uppercase transition-all whitespace-nowrap ${selectedSoundscape === key ? 'bg-yellow-600 text-black border-yellow-500' : 'bg-white/5 border-white/10 text-white/50 hover:border-white/30'}`}
                >
                  {SOUNDSCAPES[key]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white/20 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border-2 border-yellow-600/50">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
                <Mic size={24} className="text-yellow-400"/> Vocal Staging
              </h2>
              <div className="flex gap-2">
                <button onClick={() => setShowBulkInput(!showBulkInput)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-black uppercase text-xs hover:bg-blue-500 transition-all flex items-center gap-2">
                   <BrainCircuit size={14}/> AI Architect
                </button>
                <button onClick={addSection} className="bg-yellow-600 text-white px-4 py-2 rounded-lg font-black uppercase text-xs hover:bg-yellow-500 transition-all"><Plus size={16}/></button>
              </div>
            </div>

            {showBulkInput && (
              <div className="mb-4 p-5 bg-blue-900/40 rounded-xl border-2 border-blue-400 animate-fade-in">
                <textarea value={bulkLyrics} onChange={(e) => setBulkLyrics(e.target.value)} placeholder="Paste raw lyrics here for AI analysis..." rows={6} className="w-full p-4 rounded-lg mb-3 text-black font-bold focus:ring-4 focus:ring-blue-500 outline-none" />
                <div className="flex gap-2">
                  <button onClick={autoSplitLyrics} disabled={isAnalyzing} className="flex-grow bg-blue-600 text-white py-3 rounded-lg font-black uppercase hover:bg-blue-500 transition-all">Analyze Sections</button>
                  <button onClick={toggleRecording} className={`px-5 py-3 rounded-lg font-black uppercase transition-all ${isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-white text-black'}`}>{isRecording ? 'Stop' : 'Mic'}</button>
                </div>
              </div>
            )}

            {updateMessage && <div className="mb-4 p-3 bg-yellow-400 text-black rounded-lg text-xs font-black uppercase animate-pulse shadow-lg">{updateMessage}</div>}

            <div className="mb-6 flex flex-col gap-4">
              <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar items-center">
                <span className="text-[9px] font-black uppercase text-white/50 mr-2">Template:</span>
                {['off', 'gfunk-boombap', 'cinematic'].map(t => (
                  <button key={t} onClick={() => setTemplateType(t as any)} className={`px-5 py-2.5 rounded-full border-2 text-[10px] font-black uppercase whitespace-nowrap transition-all ${templateType === t ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'bg-white/10 text-white border-white/20 hover:border-white/50'}`}>
                    {t.replace('-', ' ')}
                  </button>
                ))}
                <div className="flex-grow"></div>
                <button 
                  onClick={() => setIsSanitizing(!isSanitizing)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-[9px] font-black uppercase transition-all ${isSanitizing ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' : 'bg-white/5 border-white/10 text-white/50'}`}>
                  <ShieldCheck size={14} /> {isSanitizing ? 'Sanitizer Active' : 'Sanitizer Off'}
                </button>
              </div>

              {/* Subscribe & Tagline Toggles */}
              <div className="flex gap-4 flex-wrap">
                <div className="flex flex-col gap-2">
                  <span className="text-[9px] font-black uppercase text-white/50">Subscribe Feature:</span>
                  <div className="flex gap-2">
                    {[0, 1, 2].map(p => (
                      <button key={p} onClick={() => setSubscribePreset(p)} className={`px-4 py-2 rounded-lg border-2 text-[9px] font-black uppercase transition-all ${subscribePreset === p ? 'bg-blue-600 text-white border-blue-400' : 'bg-white/5 border-white/10 text-white/50'}`}>
                        {p === 0 ? 'Off' : `Preset #${p}`}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[9px] font-black uppercase text-white/50">Producer Tagline:</span>
                  <button onClick={() => setShowProducerTagline(!showProducerTagline)} className={`px-4 py-2 rounded-lg border-2 text-[9px] font-black uppercase transition-all ${showProducerTagline ? 'bg-yellow-600 text-black border-yellow-500' : 'bg-white/5 border-white/10 text-white/50'}`}>
                    {showProducerTagline ? 'Tagline Active' : 'Tagline Off'}
                  </button>
                </div>
              </div>

              {/* Custom Intro/Outro Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <textarea
                    value={customIntro}
                    onChange={(e) => setCustomIntro(e.target.value)}
                    placeholder="Custom Intro (optional)"
                    rows={3}
                    className="w-full p-3 pr-12 rounded-lg bg-black/60 border border-white/10 text-xs text-white font-bold focus:border-yellow-500 outline-none resize-none"
                  />
                  <button
                    onClick={generateIntroSuggestion}
                    disabled={isGeneratingIntro}
                    className="absolute right-2 top-2 bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-md transition-all disabled:opacity-50"
                    title="AI Suggest Intro"
                  >
                    {isGeneratingIntro ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  </button>
                </div>
                <div className="relative">
                  <textarea
                    value={customOutro}
                    onChange={(e) => setCustomOutro(e.target.value)}
                    placeholder="Custom Outro (optional)"
                    rows={3}
                    className="w-full p-3 pr-12 rounded-lg bg-black/60 border border-white/10 text-xs text-white font-bold focus:border-yellow-500 outline-none resize-none"
                  />
                  <button
                    onClick={generateOutroSuggestion}
                    disabled={isGeneratingOutro}
                    className="absolute right-2 top-2 bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-md transition-all disabled:opacity-50"
                    title="AI Suggest Outro"
                  >
                    {isGeneratingOutro ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  </button>
                </div>
              </div>
            </div>





            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {sections.map((section, idx) => (
                <div key={section.id} className="bg-black/40 p-5 rounded-xl border border-yellow-600/30 backdrop-blur-sm relative group">
                   <div className="flex justify-between items-center mb-3">
                     <span className="text-[10px] font-black uppercase text-yellow-400 tracking-widest">PROD SECTION {idx+1}</span>
                     <button onClick={() => removeSection(section.id)} className="text-red-500 hover:text-white p-1 rounded transition-colors"><Trash2 size={16}/></button>
                   </div>
                   <div className="grid grid-cols-2 gap-3 mb-3">
                     <div className="relative">
                        <User size={12} className="absolute left-3 top-3.5 text-gray-500" />
                        <input value={section.artistName} onChange={(e) => updateSection(section.id, 'artistName', e.target.value)} placeholder="Artist Name" className="w-full p-3 pl-8 rounded-lg bg-black/60 border border-white/10 text-xs text-white font-bold focus:border-yellow-500 outline-none" />
                     </div>
                     <select value={section.type} onChange={(e) => updateSection(section.id, 'type', e.target.value)} className="p-3 rounded-lg bg-black/60 border border-white/10 text-xs text-white font-bold focus:border-yellow-500 outline-none">
                       <option value="verse">Verse</option>
                       <option value="chorus">Chorus</option>
                       <option value="bridge">Bridge</option>
                       <option value="spoken">Spoken</option>
                       <option value="pre-chorus">Pre-Chorus</option>
                       <option value="adlib">Ad-Lib</option> {/* Ensure adlib is an option */}
                     </select>
                   </div>
                   <div className="grid grid-cols-2 gap-3 mb-3">
                      <select value={section.gender} onChange={(e) => updateSection(section.id, 'gender', e.target.value)} className="p-3 rounded-lg bg-black/60 border border-white/10 text-xs text-white font-bold focus:border-yellow-500 outline-none">
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="duet">Duet</option>
                      </select>
                      <select value={section.vocalStyle} onChange={(e) => updateSection(section.id, 'vocalStyle', e.target.value)} className="p-3 rounded-lg bg-black/60 border border-white/10 text-xs text-white font-bold focus:border-yellow-500 outline-none">
                        {Object.keys(vocalStyles).map(key => (
                          <option key={key} value={key}>{key.replace(/-/g, ' ').toUpperCase()}</option>
                        ))}
                      </select>
                   </div>
                   <textarea value={section.lyrics} onChange={(e) => updateSection(section.id, 'lyrics', e.target.value)} placeholder="Enter lyrics for this section..." className="w-full p-4 rounded-lg bg-black/60 border border-white/10 text-xs text-white font-bold h-24 focus:border-yellow-500 outline-none resize-none" />
                   <p className="mt-2 text-[8px] text-gray-500 italic uppercase">Style: {vocalStyles[section.vocalStyle]}</p>
                </div>
              ))}
            </div>

            <button onClick={generateFormatted} disabled={isFormatting} className="w-full mt-8 bg-gradient-to-r from-yellow-500 to-yellow-700 text-white py-5 rounded-2xl font-black text-xl uppercase tracking-widest shadow-2xl border-b-8 border-yellow-900 active:border-b-0 active:translate-y-2 transition-all flex items-center justify-center gap-3">
               <Sparkles /> Forge Production Script
            </button>
          </div>

          <div className="bg-white/10 backdrop-blur-3xl rounded-2xl shadow-2xl p-6 border-2 border-yellow-600/50 flex flex-col h-full relative group">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
                 Sculpted Script Output
                 {formattedOutput && <Edit3 size={18} className="text-yellow-500 animate-pulse" />}
               </h2>
               {formattedOutput && (
                 <div className="flex gap-2">
                    <button onClick={() => {
                        const sanitized = isSanitizing ? sanitizeLyrics(formattedOutput) : formattedOutput;
                        setFormattedOutput(sanitized);
                        setUpdateMessage('🛡️ Applying Final Sanitizer Check...');
                        setTimeout(() => setUpdateMessage(''), 2000);
                    }} className="bg-orange-600 p-2 rounded-lg hover:bg-orange-500 transition-all shadow-lg text-white" title="Re-Sanitize Current Text"><ShieldCheck size={16} /></button>
                    <button onClick={() => navigator.clipboard.writeText(formattedOutput)} className="bg-emerald-600 p-2 rounded-lg hover:bg-emerald-500 transition-all shadow-lg text-white" title="Copy Script"><Copy size={16} /></button>
                    <button onClick={() => {
                      const blob = new Blob([formattedOutput], {type: 'text/plain'});
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url; a.download = 'Iconic-Beats-Script.txt';
                      a.click();
                    }} className="bg-blue-600 p-2 rounded-lg hover:bg-blue-500 transition-all shadow-lg text-white" title="Save Script"><Download size={16} /></button>
                 </div>
               )}
            </div>
            <div className="bg-black/80 rounded-xl flex-grow border-2 border-yellow-600/30 shadow-inner relative overflow-hidden flex flex-col">
              {formattedOutput ? (
                <textarea 
                  value={formattedOutput}
                  onChange={(e) => setFormattedOutput(e.target.value)}
                  spellCheck={false}
                  className="w-full flex-grow p-6 bg-transparent text-yellow-200 font-mono font-bold leading-relaxed selection:bg-yellow-500 selection:text-black outline-none resize-none custom-scrollbar"
                  placeholder="Script is editable here..."
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full opacity-10">
                  <Ghost size={80} className="animate-bounce" />
                  <p className="font-black uppercase text-sm mt-4 tracking-[0.4em]">Engine Standby</p>
                </div>
              )}
              {formattedOutput && (
                <div className="p-3 bg-black/40 border-t border-yellow-600/20 flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-yellow-500 tracking-widest">Live Editor Suite Active</span>
                  <div className="flex items-center gap-3">
                     <span className="text-[8px] text-gray-500 uppercase">{formattedOutput.split(/\s+/).length} Words</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 4px; width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(234, 179, 8, 0.4); border-radius: 10px; }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}