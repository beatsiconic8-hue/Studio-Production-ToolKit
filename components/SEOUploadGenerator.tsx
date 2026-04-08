

import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import {
  Copy, Music, Video, Sparkles, RefreshCw, Key, Globe, SearchCheck, User, Layout, CreditCard, Bug,
  Tag, MessageSquareText, ImageUp, ThumbsUp, Hash, AlignLeft
} from 'lucide-react';
import { generateSeoContent, proofreadSEO, researchMusicTrends } from '../services/geminiService';
import { GeneratePackage, ProofreadSuggestion, SEOMetadata, Track } from '../types';
import { Plus, Trash2, Search } from 'lucide-react';

const SEOUploadGenerator = () => {
  const [tracks, setTracks] = useState<Track[]>([{ title: '', artist: '' }]);
  const [youtubeChannelName, setYoutubeChannelName] = useState('');
  const [contextualMetaTags, setContextualMetaTags] = useState('');
  const [trendResearch, setTrendResearch] = useState<{text: string, sources: any[]} | null>(null);
  const [isResearching, setIsResearching] = useState(false);

  const primaryKeywords = [
    'remix 2026',
    'popular songs remix',
    'tiktok remix',
    'best remixes',
    'remix playlist',
    'club mix',
    'party remix',
    'mashup',
    'edm remix',
    'hits remix',
  ];
  const secondaryKeywords = [
    'slowed and reverb',
    'sped up songs',
    'bass boosted',
    'lofi flip',
    'trap remix',
    'house remix',
    'nightcore',
    '8d audio',
    'gym music',
    'chill remix',
    'dance cover',
  ];
  const longTailPhrases = [
    'popular songs remix for gym workout',
    'best english songs remix for party',
    'chill remixes of popular songs to study to',
    'tiktok trending songs sped up version',
    'popular songs but its lofi',
    'clean remixes for work playlist',
    'high energy gaming music remix',
    'remix mashup of popular songs 2024',
    'mood boosting remixes for driving',
  ];
  const engagementBait = [
    'better than the original',
    'use headphones',
    'pov you are the main character',
    '3am vibes',
    'you will not find this on spotify',
    'warning extreme bass',
    'full volume',
    'listen before it gets taken down',
    'the drop is illegal',
  ];
  
  const [generatedPackage, setGeneratedPackage] = useState<GeneratePackage | null>(null);
  const [copyStatus, setCopyStatus] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProofreading, setIsProofreading] = useState(false); // Keeping proofreading
  const [suggestions, setSuggestions] = useState<ProofreadSuggestion[]>([]);
  const [editingSuggestionId, setEditingSuggestionId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const [hasProKey, setHasProKey] = useState(false);
  const [devMode, setDevMode] = useState(false);

  // Derive the effectively active pro status
  const isEffectivePro = hasProKey || devMode;

  useEffect(() => {
    const checkKey = async () => {
      const aistudio = (window as any).aistudio;
      if (aistudio && typeof aistudio.hasSelectedApiKey === 'function') {
        const hasKey = await aistudio.hasSelectedApiKey();
        setHasProKey(hasKey);
      }
    };
    checkKey();
  }, []);

  const handleConnectKey = async () => {
    if (devMode) return; 
    const aistudio = (window as any).aistudio;
    if (aistudio && typeof aistudio.openSelectKey === 'function') {
      await aistudio.openSelectKey();
      setHasProKey(true);
    }
  };

  const handleError = (error: any) => {
    console.error("API Error:", error);
    const msg = error?.message || "";
    const status = error?.status || "";
    
    if (msg.includes("permission") || msg.includes("403") || status === "PERMISSION_DENIED") {
      if (devMode) {
        setCopyStatus('⚠️ 403 Forbidden: Standard key cannot access Pro models. Dev Mode active.');
      } else {
        setCopyStatus('⚠️ Access Denied: Paid API Key Required.');
        const aistudio = (window as any).aistudio;
        if (aistudio && typeof aistudio.openSelectKey === 'function') {
          aistudio.openSelectKey();
        }
      }
    } else {
      setCopyStatus(`❌ API Error: ${msg || 'Check Console'}`);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text || '');
      setCopyStatus(`✓ ${label} copied!`);
      setTimeout(() => setCopyStatus(''), 3000);
    } catch (err) {
      setCopyStatus('❌ Copy failed');
    }
  };

  const handleGenerateSEO = async () => {
    const hasEmptyTrack = tracks.some(t => !t.title.trim() || !t.artist.trim());
    if (hasEmptyTrack || !youtubeChannelName.trim()) {
      setCopyStatus('⚠️ Please fill in all Track Titles, Artist Names, and YouTube Channel Name.');
      return;
    }
    if (!isEffectivePro) {
      await handleConnectKey();
    }

    setIsGenerating(true);
    setGeneratedPackage(null);
    setSuggestions([]);
    setTrendResearch(null);
    setCopyStatus('✨ Forging High-Value SEO Package...');
    try {
      const pkg = await generateSeoContent(
        tracks,
        youtubeChannelName,
        contextualMetaTags,
        !devMode // isPro parameter: true if not in devMode
      );
      setGeneratedPackage(pkg);
      setCopyStatus('✅ SEO Package Forged!');
    } catch (error) {
      handleError(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleResearchTrends = async () => {
    const query = tracks.map(t => t.artist).filter(Boolean).join(', ') || contextualMetaTags;
    if (!query) {
      setCopyStatus('⚠️ Enter artist names or meta-tags to research.');
      return;
    }
    setIsResearching(true);
    setCopyStatus('🔍 Researching global music trends...');
    try {
      const result = await researchMusicTrends(query, isEffectivePro);
      setTrendResearch(result);
      setCopyStatus('✅ Trend Research Complete!');
    } catch (error) {
      handleError(error);
    } finally {
      setIsResearching(false);
    }
  };

  const handleProofread = async () => {
    if (!generatedPackage) return;
    setIsProofreading(true);
    setCopyStatus('🔍 Running SEO Audit...');
    try {
      const result = await proofreadSEO(generatedPackage, !devMode);
      setSuggestions(Array.isArray(result) ? result : []);
      setCopyStatus('✅ Audit Complete! See Suggestions.');
    } catch (error) {
      handleError(error);
    } finally {
      setIsProofreading(false);
    }
  };

  const applySuggestion = (id: string, customValue?: string) => {
    const s = suggestions.find(x => x.id === id);
    if (!s || !generatedPackage) return;
    const newPkg = JSON.parse(JSON.stringify(generatedPackage));
    let curr: any = newPkg;
    const valueToApply = customValue !== undefined ? customValue : s.suggested;
    try {
      for (let i = 0; i < s.targetPath.length - 1; i++) curr = curr[s.targetPath[i]];
      curr[s.targetPath[s.targetPath.length - 1]] = valueToApply;
      setGeneratedPackage(newPkg);
      setSuggestions(suggestions.map(x => x.id === id ? { ...x, applied: true, suggested: valueToApply } : x));
      setEditingSuggestionId(null);
    } catch (e) { console.error(e); setCopyStatus('❌ Failed to apply suggestion.'); }
  };

  const addTrack = () => setTracks([...tracks, { title: '', artist: '' }]);
  const removeTrack = (index: number) => {
    if (tracks.length > 1) {
      setTracks(tracks.filter((_, i) => i !== index));
    }
  };
  const updateTrack = (index: number, field: keyof Track, value: string) => {
    const newTracks = [...tracks];
    newTracks[index][field] = value;
    setTracks(newTracks);
  };

  const renderSEOMetadataBlock = (data: SEOMetadata, type: 'full' | 'shorts') => {
    const colorClass = type === 'full' ? 'blue' : 'pink';
    const icon = type === 'full' ? <Music size={24}/> : <Video size={24}/>;
    const typeLabel = type === 'full' ? 'YouTube Full Upload' : 'YouTube Shorts Upload';

    return (
      <div className={`bg-black/40 border-2 border-${colorClass}-600/50 p-6 rounded-2xl shadow-xl space-y-4`}>
        <h3 className={`text-xl font-black text-${colorClass}-400 uppercase tracking-tighter flex items-center gap-2 mb-4`}>
          {icon} {typeLabel}
        </h3>

        <div className="bg-black/60 p-4 rounded-xl border border-white/5 relative">
          <label className="block text-[9px] font-black uppercase text-gray-500 mb-1">Track Title</label>
          <p className="text-sm font-black text-white">{data.title}</p>
          <button onClick={() => copyToClipboard(data.title, 'Track Title')} className="absolute top-4 right-4 text-gray-500 hover:text-white"><Copy size={14}/></button>
        </div>

        <div className="bg-black/60 p-4 rounded-xl border border-white/5 relative">
          <label className="block text-[9px] font-black uppercase text-gray-500 mb-1">Video Description</label>
          <p className="text-xs text-gray-400 whitespace-pre-wrap">{data.description}</p>
          <button onClick={() => copyToClipboard(data.description, 'Video Description')} className="absolute top-4 right-4 text-gray-500 hover:text-white"><Copy size={14}/></button>
        </div>

        <div className="bg-black/60 p-4 rounded-xl border border-white/5 relative">
          <label className="block text-[9px] font-black uppercase text-gray-500 mb-1">Hashtags</label>
          <p className="text-sm text-yellow-400 font-bold">{data.hashtags}</p>
          <button onClick={() => copyToClipboard(data.hashtags, 'Hashtags')} className="absolute top-4 right-4 text-gray-500 hover:text-white"><Copy size={14}/></button>
        </div>

        {/* Thumbnail Prompts Section */}
        <div className="space-y-3 pt-2 border-t border-white/10">
          <label className="block text-[9px] font-black uppercase text-gray-500">Thumbnail Prompts (AI-Optimized for High CTR)</label>
          {Object.entries(data.thumbnailPrompts).map(([key, promptText]) => (
            <div key={key} className="bg-black/60 p-3 rounded-xl border border-white/5 relative">
              <p className="text-[10px] font-black uppercase text-purple-300 mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
              <p className="text-xs text-green-400 font-mono italic whitespace-pre-wrap">{promptText}</p>
              <button onClick={() => copyToClipboard(promptText, `Thumbnail Prompt: ${key}`)} className="absolute top-3 right-3 text-gray-500 hover:text-white"><Copy size={12}/></button>
            </div>
          ))}
        </div>

        <div className="bg-black/60 p-4 rounded-xl border border-white/5 relative">
          <label className="block text-[9px] font-black uppercase text-gray-500 mb-1">Pinned Comment</label>
          <p className="text-sm text-purple-400">{data.pinnedComment}</p>
          <button onClick={() => copyToClipboard(data.pinnedComment, 'Pinned Comment')} className="absolute top-4 right-4 text-gray-500 hover:text-white"><Copy size={14}/></button>
        </div>
      </div>
    );
  };

  return (
    <div className="relative z-10 min-h-screen bg-black p-6 font-sans text-white border-t border-white/10">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* PRO LICENSE BANNER */}
        {!isEffectivePro && (
          <div className="bg-gradient-to-r from-orange-600/20 to-purple-600/20 border-2 border-orange-500/50 p-6 rounded-3xl backdrop-blur-3xl flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-in shadow-[0_0_30px_rgba(249,115,22,0.2)]">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-orange-500/20 rounded-2xl">
                <CreditCard className="text-orange-400" size={32} />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter text-white">Advanced Studio Features Locked</h3>
                <p className="text-sm text-gray-400 font-medium">To use Gemini 3 Pro features, connect an API key from a <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-orange-400 underline hover:text-orange-300">Paid Billing Project</a>.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setDevMode(true)}
                className="px-4 py-2 border border-white/20 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all"
                title="Bypass key selection for local testing (uses Flash models)"
              >
                <Bug size={14} /> Dev Test
              </button>
              <button onClick={handleConnectKey} className="px-8 py-4 bg-orange-600 hover:bg-orange-500 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl flex items-center gap-3 transition-all active:scale-95">
                <Key size={18} /> Connect Paid Key
              </button>
            </div>
          </div>
        )}

        {/* SEO FORGE PANEL */}
        <section className="bg-gray-900/40 rounded-3xl p-8 border-2 border-purple-500/30 backdrop-blur-3xl shadow-2xl relative">
          {/* Trending Data Section */}
          <div className="mb-10 bg-black/60 backdrop-blur-xl p-6 rounded-2xl border-2 border-purple-600/30 shadow-[0_0_50px_rgba(168,85,247,0.1)]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[10px] font-black uppercase text-purple-400 tracking-[0.3em] flex items-center gap-2">
                <Globe size={14} className="animate-pulse" /> Trending Data (AI Context)
              </h3>
              <button 
                onClick={handleResearchTrends}
                disabled={isResearching}
                className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-xl active:scale-95 transition-all disabled:opacity-50"
              >
                {isResearching ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                Live Trend Research
              </button>
            </div>
            
            {trendResearch && (
              <div className="mb-6 p-4 bg-purple-900/20 rounded-xl border border-purple-500/30 animate-fade-in">
                <p className="text-xs text-purple-200 leading-relaxed italic">{trendResearch.text}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <p className="font-bold text-white mb-1">Primary Keywords:</p>
                <p className="text-gray-400">{primaryKeywords.join(', ')}</p>
              </div>
              <div>
                <p className="font-bold text-white mb-1">Secondary Keywords:</p>
                <p className="text-gray-400">{secondaryKeywords.join(', ')}</p>
              </div>
              <div>
                <p className="font-bold text-white mb-1">Long-Tail Phrases:</p>
                <p className="text-gray-400">{longTailPhrases.join(', ')}</p>
              </div>
              <div>
                <p className="font-bold text-white mb-1">Engagement Bait:</p>
                <p className="text-gray-400">{engagementBait.join(', ')}</p>
              </div>
            </div>
          </div>
          <div className="absolute top-6 right-8 flex items-center gap-2">
            <span className={`text-[8px] font-black uppercase tracking-tighter ${devMode ? 'text-orange-500' : 'text-gray-600'}`}>Developer Mode</span>
            <button 
              onClick={() => setDevMode(!devMode)}
              className={`w-10 h-5 rounded-full relative transition-colors ${devMode ? 'bg-orange-600' : 'bg-gray-800'}`}
            >
              <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${devMode ? 'right-1' : 'left-1'}`} />
            </button>
          </div>
          <div className="text-center mb-10">
            <h2 className="text-4xl font-black uppercase tracking-tighter text-purple-400 flex justify-center items-center gap-4">
              <SearchCheck size={40} /> SEO FORGE V15
            </h2>
            <p className="text-gray-500 text-xs font-black uppercase tracking-[0.5em] mt-2">Santiago Green Productions™️ High-Value Forge</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-10">
            {/* Input Column */}
            <div className="space-y-6">
              <div className="bg-black/40 p-6 rounded-2xl border border-white/5 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-purple-300">Tracks Configuration</h3>
                  <button 
                    onClick={addTrack}
                    className="flex items-center gap-2 px-3 py-1 bg-purple-600/20 border border-purple-500/50 rounded-lg text-[10px] font-black uppercase hover:bg-purple-600 transition-all"
                  >
                    <Plus size={12} /> Add Track
                  </button>
                </div>

                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {tracks.map((track, index) => (
                    <div key={index} className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-3 relative group">
                      {tracks.length > 1 && (
                        <button 
                          onClick={() => removeTrack(index)}
                          className="absolute top-2 right-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[8px] font-black uppercase text-gray-500">Track Title</label>
                          <input 
                            type="text" 
                            value={track.title} 
                            onChange={(e) => updateTrack(index, 'title', e.target.value)} 
                            placeholder="Track Title..." 
                            className="w-full p-3 rounded-lg bg-black border border-white/10 focus:border-purple-500 outline-none text-xs font-bold transition-all" 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[8px] font-black uppercase text-gray-500">Artist Name</label>
                          <input 
                            type="text" 
                            value={track.artist} 
                            onChange={(e) => updateTrack(index, 'artist', e.target.value)} 
                            placeholder="Artist Name..." 
                            className="w-full p-3 rounded-lg bg-black border border-white/10 focus:border-purple-500 outline-none text-xs font-bold transition-all" 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[8px] font-black uppercase text-gray-500">Duration (m:ss)</label>
                          <input 
                            type="text" 
                            value={track.duration || ''} 
                            onChange={(e) => updateTrack(index, 'duration', e.target.value)} 
                            placeholder="e.g. 3:45" 
                            className="w-full p-3 rounded-lg bg-black border border-white/10 focus:border-purple-500 outline-none text-xs font-bold transition-all" 
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-purple-300">YouTube Channel Name (for branding)</label>
                  <input type="text" value={youtubeChannelName} onChange={(e) => setYoutubeChannelName(e.target.value)} placeholder="e.g., Iconic Beats Official (Your Channel Name)" className="w-full p-4 rounded-xl bg-black border-2 border-white/5 focus:border-purple-500 outline-none font-black transition-all" />

                  <label className="block text-[10px] font-black uppercase tracking-widest text-purple-300">Contextual Meta-Tags</label>
                  <textarea value={contextualMetaTags} onChange={(e) => setContextualMetaTags(e.target.value)} placeholder="e.g., G-Funk, West Coast, Chill, Synthwave, 80s Vibe, Gaming Music, Study Beats..." className="w-full p-4 rounded-xl bg-black border-2 border-white/5 focus:border-purple-500 outline-none h-24 resize-none transition-all" />
                  
                  <button onClick={handleGenerateSEO} disabled={isGenerating} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 p-5 rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                    {isGenerating ? <RefreshCw className="animate-spin" /> : <Sparkles />} 
                    {isEffectivePro ? (devMode ? 'FORGE SEO (FLASH)' : 'FORGE SEO PROMPTS') : 'CONNECT KEY TO FORGE'}
                  </button>
                </div>
              </div>
            </div>

            {/* Output Column (Global Keyword Bank & Proofreading) */}
            <div className="bg-black/60 p-8 rounded-3xl border border-white/5 h-full overflow-y-auto custom-scrollbar shadow-inner">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest flex items-center gap-3"><Globe size={16} className="text-purple-400" /> SEO Analyst Results</h3>
                 {generatedPackage && (
                   <button 
                     onClick={() => copyToClipboard(JSON.stringify(generatedPackage, null, 2), 'All SEO Data')}
                     className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-xl active:scale-95 transition-all"
                   >
                     <Copy size={14} /> Copy All
                   </button>
                 )}
               </div>
               {generatedPackage ? (
                 <div className="space-y-6 animate-fade-in">
                    <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
                      <h4 className="text-[10px] font-black text-purple-300 uppercase mb-2">Global High-Value Keyword Bank</h4>
                      <div className="relative">
                        <p className="text-[10px] font-mono leading-relaxed text-gray-400 break-all pr-10">{generatedPackage.globalKeywordBank}</p>
                        <button onClick={() => copyToClipboard(generatedPackage.globalKeywordBank, 'Keyword Bank')} className="absolute top-0 right-0 p-2 text-gray-500 hover:text-white"><Copy size={14}/></button>
                      </div>
                      <div className="mt-2 flex justify-between items-center">
                        <span className={`text-[9px] font-black ${generatedPackage.globalKeywordBank.length >= 491 && generatedPackage.globalKeywordBank.length <= 500 ? 'text-green-400' : 'text-orange-400'}`}>
                          {generatedPackage.globalKeywordBank.length} / 500 CHARS
                        </span>
                      </div>
                    </div>
                    
                    <button onClick={handleProofread} disabled={isProofreading} className="w-full py-3 bg-indigo-600/20 border border-indigo-500/50 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600 transition-all">
                      {isProofreading ? <RefreshCw className="animate-spin" /> : <AlignLeft size={14} className="inline mr-2" />} Proofread Refinements
                    </button>

                    {suggestions.length > 0 && (
                      <div className="space-y-4 mt-6">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-orange-400">Audit Suggestions</h4>
                        {suggestions.map(s => (
                          <div key={s.id} className={`bg-black/40 p-4 rounded-lg border ${s.applied ? 'border-green-500/50' : 'border-orange-500/50'} relative`}>
                            <p className="text-[9px] text-gray-500 mb-1">{s.targetPath.join(' > ')} - {s.field}</p>
                            <p className="text-xs text-gray-300 italic mb-2">Reason: {s.reason}</p>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-gray-400">Original: <span className="line-through">{s.original}</span></span>
                              {editingSuggestionId === s.id ? (
                                <textarea
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="w-full bg-gray-700 text-white text-xs p-2 rounded resize-none"
                                  rows={2}
                                />
                              ) : (
                                <span className="text-[10px] text-green-400">Suggested: {s.suggested}</span>
                              )}
                            </div>
                            <div className="mt-3 flex gap-2 justify-end">
                              {editingSuggestionId === s.id ? (
                                <button onClick={() => applySuggestion(s.id, editValue)} className="px-3 py-1 bg-green-600 rounded text-xs hover:bg-green-500 transition-all">Save</button>
                              ) : (
                                <button onClick={() => { setEditingSuggestionId(s.id); setEditValue(s.suggested); }} className="px-3 py-1 bg-yellow-600 rounded text-xs hover:bg-yellow-500 transition-all">Edit</button>
                              )}
                              <button onClick={() => applySuggestion(s.id)} disabled={s.applied || editingSuggestionId === s.id} className={`px-3 py-1 ${s.applied ? 'bg-gray-700' : 'bg-blue-600 hover:bg-blue-500'} rounded text-xs transition-all`}>
                                {s.applied ? 'Applied' : 'Apply'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center h-full opacity-10">
                   <Layout size={64} />
                   <p className="text-[10px] mt-4 font-black uppercase tracking-widest text-center">Awaiting Forge Signal...</p>
                 </div>
               )}
            </div>
          </div>

          {/* DUAL ASSET SEO OUTPUT */}
          {generatedPackage && (
            <div className="mt-12 grid lg:grid-cols-2 gap-10 animate-fade-in">
               {renderSEOMetadataBlock(generatedPackage.full, 'full')}
               {renderSEOMetadataBlock(generatedPackage.shorts, 'shorts')}
            </div>
          )}
          {copyStatus && <p className="text-center mt-6 font-black uppercase text-sm text-yellow-400 animate-pulse">{copyStatus}</p>}
        </section>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,165,0,0.3); border-radius: 10px; }
        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default SEOUploadGenerator;