

import { GoogleGenAI, Type, Modality } from "@google/genai";
import { GeneratedStyle, LyricSection, VocalStylesMap, GeneratePackage, ProofreadSuggestion, SEOMetadata, Track } from "../types";

// Helper to get model based on pro status
const getModel = (isPro: boolean, type: 'text' | 'image' = 'text') => {
  if (type === 'image') return isPro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
  return isPro ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
};

export const researchAndGenerateVocalStyles = async (isPro: boolean = false): Promise<GeneratedStyle[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Research and synthesize 8 unique, ultra-detailed "Master Vocal Presets" for a music production suite, focusing on cutting-edge trends for 2024-2026.
    
    Each preset MUST include:
    1. A short slug-style 'key' (e.g., 'cyber-soul-2077', 'ethereal-drift-pop').
    2. A 'description' using sophisticated, studio-quality terminology. 
    
    CRITICAL REQUIREMENTS for Descriptions:
    - Include specific high-end hardware chains (e.g., Sony C800G -> Neve 1073 -> CL1B -> Pultec EQP-1A).
    - Integrate "Ambient Soundscapes": Intelligently suggest background textures like city traffic, distant sirens, laughing, conversations, seagulls, or nature sounds to add depth and "studio craftsmanship".
    - Mention advanced effects like parallel harmonic saturation, multi-band transient shaping, and custom convolution reverbs.
    - Focus on diverse genres: Hyperpop, Afrobeats, Modern Drill, Ethereal R&B, Cyberpunk Soul, etc.
    - Ensure the descriptions read like elite engineering notes for a multi-platinum production.`;

    const response = await ai.models.generateContent({
      model: getModel(isPro),
      contents: prompt,
      config: {
        tools: isPro ? [{ googleSearch: {} }] : undefined,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              key: { type: Type.STRING },
              description: { type: Type.STRING },
            },
            required: ["key", "description"],
          },
        },
      },
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text) as GeneratedStyle[];
  } catch (error) {
    console.error("Failed to research vocal styles:", error);
    throw error;
  }
};

export const generateVocalStyles = async (isPro: boolean = false): Promise<GeneratedStyle[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: getModel(isPro),
      contents: "Create 3 unique, studio-grade vocal style descriptions.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              key: { type: Type.STRING },
              description: { type: Type.STRING },
            },
            required: ["key", "description"],
          },
        },
      },
    });
    const text = response.text;
    if (!text) return [];
    return JSON.parse(text) as GeneratedStyle[];
  } catch (error) {
    throw error;
  }
};

export const generateStylePreviewAudio = async (styleDescription: string, lyrics: string): Promise<string | undefined> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Perform lyrics in style: ${styleDescription}. Lyrics: "${lyrics}"` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    return undefined;
  }
};

export const structureLyrics = async (lyrics: string, isPro: boolean = false): Promise<any[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Analyze the provided raw lyrics and intelligently structure them into distinct professional song sections.
    
    **CRITICAL DIFFERENTIATION RULES:**
    1. **Spoken Word Sections**: These are longer narrative passages, dialogues, or spoken interjections that convey a clear message or story. They are NOT rhythmic or melodic.
    2. **Ad-Libs**: These are short (usually 1-4 words), spontaneous vocalizations, emphasis words, or background interjections (e.g., "Yeah!", "Skrrt!", "Let's go!"). 
       - **MANDATORY**: Ad-libs must NOT be integrated into the main lyrical flow of a Verse or Chorus. They must be their own distinct sections.
       - **MANDATORY**: Ad-libs must be concise. If a section is longer than a few words and conveys a complete thought, it is likely 'Spoken Word' or part of a Verse.
    
    **CATEGORIZATION REFINEMENT:**
    - **Artist Name**: Intelligently infer the artist's name from context clues (e.g., "It's [Name] on the track", "Santiago Green Production"). If multiple artists are present, identify them accurately for each section. If unknown, leave as null.
    - **Gender**: Determine the likely gender (male, female, or duet) based on vocal cues, names, or lyrical content.
    - **Vocal Style**: Suggest a studio-grade vocal style key (e.g., 'vintage-g-funk', 'smooth-operator-pro') that fits the mood.

    **SECTIONS TO IDENTIFY:**
    - Verses, Choruses, Pre-Choruses, Bridges, Outros, Spoken Word, Ad-Libs.

    Return the output as a JSON array of objects:
    {
      "type": "verse" | "chorus" | "pre-chorus" | "bridge" | "outro" | "spoken" | "adlib",
      "lyrics": "The actual lyrics",
      "artistName": "Name or null",
      "gender": "male" | "female" | "duet",
      "vocalStyle": "style-key"
    }

    Lyrics to structure: ${lyrics}`;

    const response = await ai.models.generateContent({
      model: getModel(isPro),
      contents: prompt, // Use the enhanced prompt
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              lyrics: { type: Type.STRING },
              artistName: { type: Type.STRING, nullable: true },
              gender: { type: Type.STRING },
              vocalStyle: { type: Type.STRING }
            },
            required: ["type", "lyrics", "gender", "vocalStyle"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    throw error;
  }
};

export const generateTemplateFormattedLyrics = async (
  templateType: 'gfunk-boombap' | 'cinematic',
  sections: LyricSection[],
  vocalStyles: VocalStylesMap,
  intro: string,
  outro: string,
  isPro: boolean = false
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const productionTag = `[Another Musical Masterpiece (Hit em with the hot) Iconic......(An Evolution of) Santiago Green Production]`;
  const prompt = `Sculpt a professional production script.
  Intro: ${intro}
  Outro: ${outro}
  Sections: ${JSON.stringify(sections.map(s => ({ ...s, style: vocalStyles[s.vocalStyle] })))}
  Tag: ${productionTag}`;
  const response = await ai.models.generateContent({
    model: getModel(isPro),
    contents: prompt,
    config: isPro ? { thinkingConfig: { thinkingBudget: 15000 } } : undefined
  });
  return response.text || "";
};

export const transcribeAudio = async (base64Data: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    // Fix: Corrected typo from `base64data` to `base64Data` to match function parameter
    contents: [{ parts: [{ text: "Transcribe these lyrics precisely." }, { inlineData: { mimeType: "audio/webm", data: base64Data } }] }]
  });
  return response.text || "";
};

// New function for generating SEO content
export const generateSeoContent = async (
  tracks: Track[],
  youtubeChannelName: string,
  contextualMetaTags: string,
  isPro: boolean = false
): Promise<GeneratePackage> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = getModel(isPro);

  const tracksInfo = tracks.map(t => `"${t.title}" by ${t.artist}${t.duration ? ` (Duration: ${t.duration})` : ''}`).join(', ');
  
  // Calculate timestamps if durations are provided
  let currentSeconds = 0;
  const tracksWithTimestamps = tracks.map((t) => {
    const m = Math.floor(currentSeconds / 60);
    const s = currentSeconds % 60;
    const timestamp = `${m}:${s.toString().padStart(2, '0')}`;
    
    let durationSec = 0;
    if (t.duration) {
      if (t.duration.includes(':')) {
        const [mins, secs] = t.duration.split(':').map(Number);
        durationSec = (mins * 60) + (secs || 0);
      } else {
        durationSec = Number(t.duration);
      }
    }
    
    const entry = `${timestamp} ${t.title} - ${t.artist}`;
    currentSeconds += durationSec;
    return entry;
  }).join('\n');

  const tracksList = tracks.map((t, i) => `${i + 1}. ${t.title} - ${t.artist}`).join('\n');
  const mainTrack = tracks[0]; // For title generation focus if multiple
  const isCompilation = tracks.length > 1;
  const hasDurations = tracks.some(t => !!t.duration);

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

  const prompt = `You are an elite YouTube SEO strategist and content generator for a music production house named "Iconic Beats".
  Your task is to generate high-performing, optimized SEO metadata for a music ${isCompilation ? 'compilation/mix' : 'track'}, suitable for both YouTube Full uploads and YouTube Shorts.
  Actively search for trending patterns, thumbnail designs, trending artists, keywords, hashtags, and any other relevant data that will allow the user unparalleled advantages over competitors relative to music niche and targeted audience.

  **Input Data:**
  Tracks: ${tracksInfo}
  ${isCompilation ? `Tracklist with Accurate Timestamps:\n${hasDurations ? tracksWithTimestamps : tracksList}` : ''}
  YouTube Channel Name (Branding): "${youtubeChannelName}"
  Contextual Meta-Tags / Mood / References: "${contextualMetaTags}"
  Trending Primary Keywords: ${primaryKeywords.join(', ')}
  Trending Secondary Keywords: ${secondaryKeywords.join(', ')}
  Trending Long-Tail Phrases: ${longTailPhrases.join(', ')}
  Trending Engagement Bait: ${engagementBait.join(', ')}

  **Generate the following outputs in JSON format, adhering to all instructions:**

  **1. Global Keyword Bank (for universal application across platforms):**
    *   A single, comma-separated string of high-intent keywords, intelligently incorporating the provided trending terms and additional researched trends.
    *   **CRITICAL CONSTRAINT:** The total length MUST be more than 491 characters and less than 500 characters.
    *   NO line breaks.
    *   Optimize for: High-intent search queries, algorithmic discoverability, music niche relevance, platform-specific ranking behavior.
    *   Example fillers to meet length: "high-definition-audio-production", "industry-standard-sound", "viral-music-strategy", "top-tier-audio-engineering", "chart-topping-potential", "trending-soundscapes", "global-music-reach"

  **2. YouTube Full Upload Metadata (Object: "full"):**
    *   **title:** SEO-primed track title (max 100 characters), designed for high click-through rates (CTR), leveraging trending keywords. ${isCompilation ? 'Make it sound like a premium mix or compilation.' : ''}
    *   **description:** A detailed, SEO-rich video description (minimum 3 paragraphs). This must NOT be a generic "copy & paste" style description. Instead, it must be intelligent, engaging, and deeply integrated with trending keywords related to the tracks, artists, genre, and overall music trends, while also encouraging interaction. Incorporate relevant long-tail phrases and engagement bait. ${isCompilation ? `Include the accurate tracklist with timestamps clearly: \n${hasDurations ? tracksWithTimestamps : tracksList}` : ''}
    *   **hashtags:** A block of 10-15 highly relevant and trending hashtags (e.g., "#Gfunk #WestCoastHipHop #NewMusic2024"), dynamically generated based on current trends and the provided keywords.
    *   **thumbnailPrompts:** An object containing 4 distinct, high-CTR thumbnail prompts for an external 8K image generator. Each prompt MUST leverage trending concepts, trigger human psychological points (curiosity, controversy, problem-solving, outrage), and include the following visual elements while also intelligently varying them across the 4 prompts:
        *   A breathtaking, high-definition 8K hyper-realistic image. For each prompt, choose a unique, dynamic **camera angle** (e.g., cinematic drone view, street-level wide shot, low-angle perspective, wide-angle anamorphic lens view, elevated cityscape perspective) of the Los Angeles skyline, featuring iconic LA landmarks like the Hollywood Sign, palm trees, and classic lowriders.
        *   Capture the scene with a distinct **lighting/weather condition** (e.g., vibrant golden hour glow, dramatic rainy night with glistening reflections, bustling neon-lit dusk, clear sunny day with subtle lens flare, foggy morning with diffused light).
        *   Integrate stylized text in a **trending font style** (e.g., bold graffiti art font, sleek neon sign lettering, grungy distressed typography, elegant script, futuristic holographic script).
        *   Ensure dazzling gold and diamond-encrusted materials and lettering.
        *   Subtle "${youtubeChannelName}" branding integrated into the scene.
        *   All text correctly spelled.
        *   The prompts are:
            *   **artistCentered**: "High definition, 8K, hyper realistic 3D avatar image of ${isCompilation ? 'multiple artists' : `track ${mainTrack.artist}`} in likeness, standing confidently centered in the image. [AI CHOOSES UNIQUE CAMERA ANGLE & LIGHTING/WEATHER OF LA SKYLINE]. Across the top of the image in [AI CHOOSES TRENDING FONT STYLE] the ${isCompilation ? 'Elite Artists' : mainTrack.artist}. Across the bottom in the same font ${isCompilation ? 'Ultimate Mix' : mainTrack.title} (Iconic Fusion) and directly below that in slightly smaller text Sonic Crossover Series. Additional unique, high-CTR image elements intelligently populated by powerful AI related to the music. Incorporate subtle ${youtubeChannelName} branding. Ensure graffiti art, dazzling gold and diamond encrusted materials and lettering. This prompt is designed to trigger curiosity."
            *   **trackNameOnly**: "[AI CHOOSES UNIQUE CAMERA ANGLE & LIGHTING/WEATHER OF LA SKYLINE]. Across the top of the image in [AI CHOOSES TRENDING FONT STYLE] the text ${isCompilation ? 'THE ULTIMATE MIX' : mainTrack.title}. Across the bottom in the same font Subscribe to keep listening!!! Incorporate subtle ${youtubeChannelName} branding. Ensure graffiti art, dazzling gold and diamond encrusted materials and lettering. Additional unique, high-CTR image elements intelligently populated by powerful AI, relevant to the track's mood. This prompt is designed for problem-solving curiosity."
            *   **brandFocus**: "[AI CHOOSES UNIQUE CAMERA ANGLE & LIGHTING/WEATHER OF LA SKYLINE]. Across the top of the image in [AI CHOOSES TRENDING FONT STYLE] the text ICONIC BEATS. Across the bottom in the same font Sonic Crossover Series. Incorporate subtle ${youtubeChannelName} branding. Ensure graffiti art, dazzling gold and diamond encrusted materials and lettering. Additional unique, high-CTR image elements intelligently populated by powerful AI, reflecting the brand's aesthetic. This prompt is designed for brand recognition and intrigue."
            *   **productionFocus**: "[AI CHOOSES UNIQUE CAMERA ANGLE & LIGHTING/WEATHER OF LA SKYLINE]. Across the top of the image in [AI CHOOSES TRENDING FONT STYLE] the text An Evolution Of Santiago Green Production. Across the bottom in the same font ${isCompilation ? 'Ultimate Sonic Experience' : mainTrack.title} (Iconic Fusion) and directly below that in slightly smaller text Sonic Crossover Series. Incorporate subtle ${youtubeChannelName} branding. Ensure graffiti art, dazzling gold and diamond encrusted materials and lettering. Additional unique, high-CTR image elements intelligently populated by powerful AI, emphasizing cinematic quality. This prompt is designed to highlight production value."
    *   **pinnedComment:** An engaging, call-to-action comment to be pinned, encouraging viewer interaction (e.g., "What's your favorite track from this mix? Let us know! 👇").

  **3. YouTube Shorts Upload Metadata (Object: "shorts"):**
    *   **title:** SEO-primed track title (max 60 characters for Shorts, concise, high CTR), leveraging trending keywords.
    *   **description:** A concise yet SEO-rich description (1-2 paragraphs), optimized for short-form video algorithms and engagement. Not a "copy & paste" style. Incorporate relevant long-tail phrases and engagement bait.
    *   **hashtags:** A block of 5-8 highly relevant and trending hashtags, specifically for Shorts (e.g., "#YouTubeShorts #ViralMusic #ShortsMusic"), dynamically generated based on current trends and the provided keywords.
    *   **thumbnailPrompts:** An object containing 4 distinct, high-CTR thumbnail prompts for an external 8K image generator, optimized for vertical aspect ratios. Each prompt MUST leverage trending concepts, trigger human psychological points (curiosity, controversy, problem-solving, outrage), and include the following visual elements while also intelligently varying them across the 4 prompts:
        *   A breathtaking, high-definition 8K hyper-realistic image. For each prompt, choose a unique, dynamic **camera angle** (e.g., cinematic drone view, street-level wide shot, low-angle perspective, wide-angle anamorphic lens view, elevated cityscape perspective) of the Los Angeles skyline, featuring iconic LA landmarks like the Hollywood Sign, palm trees, and classic lowriders.
        *   Capture the scene with a distinct **lighting/weather condition** (e.g., vibrant golden hour glow, dramatic rainy night with glistening reflections, bustling neon-lit dusk, clear sunny day with subtle lens flare, foggy morning with diffused light).
        *   Integrate stylized text in a **trending font style** (e.g., bold graffiti art font, sleek neon sign lettering, grungy distressed typography, elegant script, futuristic holographic script).
        *   Ensure dazzling gold and diamond-encrusted materials and lettering.
        *   Subtle "${youtubeChannelName}" branding integrated into the scene.
        *   All text correctly spelled.
        *   The prompts are:
            *   **artistCentered**: "High definition, 8K, hyper realistic 3D avatar image of ${isCompilation ? 'artists' : mainTrack.artist} in likeness, standing confidently centered in the image. [AI CHOOSES UNIQUE CAMERA ANGLE & LIGHTING/WEATHER OF LA SKYLINE]. Across the top of the image in [AI CHOOSES TRENDING FONT STYLE] the ${isCompilation ? 'Elite Artists' : mainTrack.artist}. Across the bottom in the same font ${isCompilation ? 'Ultimate Mix' : mainTrack.title} (Iconic Fusion) and directly below that in slightly smaller text Sonic Crossover Series. Additional unique, high-CTR image elements intelligently populated by powerful AI. Incorporate subtle ${youtubeChannelName} branding. Ensure graffiti art, dazzling gold and diamond encrusted materials and lettering. Optimized for vertical Shorts aspect ratio. This prompt is designed to trigger curiosity."
            *   **teaser**: "[AI CHOOSES UNIQUE CAMERA ANGLE & LIGHTING/WEATHER OF LA SKYLINE]. Across the top of the image in [AI CHOOSES TRENDING FONT STYLE] the text TEASER. Across the bottom in the same font Subscribe to keep listening!!! Incorporate subtle ${youtubeChannelName} branding. Ensure graffiti art, dazzling gold and diamond encrusted materials and lettering. Additional unique, high-CTR image elements intelligently populated by powerful AI, hinting at unresolved conflict. Optimized for vertical Shorts aspect ratio. This prompt is designed for problem-solving curiosity."
            *   **brandFocus**: "[AI CHOOSES UNIQUE CAMERA ANGLE & LIGHTING/WEATHER OF LA SKYLINE]. Across the top of the image in [AI CHOOSES TRENDING FONT STYLE] the text ICONIC BEATS. Across the bottom in the same font Sonic Crossover Series. Incorporate subtle ${youtubeChannelName} branding. Ensure graffiti art, dazzling gold and diamond encrusted materials and lettering. Additional unique, high-CTR image elements intelligently populated by powerful AI, reflecting the brand's dynamic presence. Optimized for vertical Shorts aspect ratio. This prompt is designed for brand recognition and intrigue."
            *   **productionFocus**: "[AI CHOOSES UNIQUE CAMERA ANGLE & LIGHTING/WEATHER OF LA SKYLINE]. Across the top of the image in [AI CHOOSES TRENDING FONT STYLE] the text An Evolution Of Santiago Green Production. Across the bottom in the same font ${isCompilation ? 'Ultimate Sonic Experience' : mainTrack.title} (Iconic Fusion) and directly below that in slightly smaller text Sonic Crossover Series. Incorporate subtle ${youtubeChannelName} branding. Ensure graffiti art, dazzling gold and diamond encrusted materials and lettering. Additional unique, high-CTR image elements intelligently populated by powerful AI, emphasizing cinematic scale. Optimized for vertical Shorts aspect ratio. This prompt is designed to highlight production value."
    *   **pinnedComment:** A short, punchy, call-to-action comment for Shorts.

  **CRITICAL:** Ensure the final output is **ONLY** the JSON object. Do not include any other text or formatting.
  Adjust descriptions and hashtags based on the provided input and current trends.
  Strictly adhere to the keyword bank character count. If the length is outside bounds, regenerate internally until compliant.
  `;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      tools: isPro ? [{ googleSearch: {} }] : undefined, // Enable Google Search only if Pro key
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          globalKeywordBank: { type: Type.STRING },
          full: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              hashtags: { type: Type.STRING },
              thumbnailPrompts: {
                type: Type.OBJECT,
                properties: {
                  artistCentered: { type: Type.STRING },
                  trackNameOnly: { type: Type.STRING },
                  brandFocus: { type: Type.STRING },
                  productionFocus: { type: Type.STRING },
                },
                required: ["artistCentered", "trackNameOnly", "brandFocus", "productionFocus"],
              },
              pinnedComment: { type: Type.STRING },
            },
            required: ["title", "description", "hashtags", "thumbnailPrompts", "pinnedComment"],
          },
          shorts: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              hashtags: { type: Type.STRING },
              thumbnailPrompts: {
                type: Type.OBJECT,
                properties: {
                  artistCentered: { type: Type.STRING },
                  teaser: { type: Type.STRING },
                  brandFocus: { type: Type.STRING },
                  productionFocus: { type: Type.STRING },
                },
                required: ["artistCentered", "teaser", "brandFocus", "productionFocus"],
              },
              pinnedComment: { type: Type.STRING },
            },
            required: ["title", "description", "hashtags", "thumbnailPrompts", "pinnedComment"],
          },
        },
        required: ["globalKeywordBank", "full", "shorts"],
      },
      thinkingConfig: isPro ? { thinkingBudget: 25000 } : undefined, // Higher thinking budget for Pro model
    },
  });

  const parsedResponse = JSON.parse(response.text || "{}");
  return parsedResponse as GeneratePackage;
};


// researchMusicTrends is not directly called by SEOUploadGenerator.tsx after refactor,
// but proofreadSEO could potentially use it. For now, keep as is.
export const researchMusicTrends = async (query: string, isPro: boolean = false): Promise<{text: string, sources: any[]}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: getModel(isPro),
    contents: `Trending SEO research for: ${query}`,
    config: isPro ? { tools: [{ googleSearch: {} }] } : undefined
  });
  return { text: response.text || "", sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] };
};

export const proofreadSEO = async (pkg: GeneratePackage, isPro: boolean = false): Promise<ProofreadSuggestion[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: getModel(isPro),
      contents: `Perform an elite SEO audit on this metadata package for CTR efficiency. Suggest refinements.
      Package: ${JSON.stringify(pkg)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              field: { type: Type.STRING },
              targetPath: { type: Type.ARRAY, items: { type: Type.STRING } },
              reason: { type: Type.STRING },
              original: { type: Type.STRING },
              suggested: { type: Type.STRING }
            },
            required: ["id", "field", "targetPath", "reason", "original", "suggested"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]").map((s: any) => ({ ...s, applied: false }));
  } catch (error) {
    console.error("Proofread failed", error);
    return [];
  }
};

export const generateIntroOutroSuggestion = async (
  type: 'intro' | 'outro',
  sections: LyricSection[],
  vocalStyles: VocalStylesMap,
  isPro: boolean = false
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = getModel(isPro);

  const sectionDetails = sections.map(s => ({
    type: s.type,
    artistName: s.artistName,
    gender: s.gender,
    vocalStyle: vocalStyles[s.vocalStyle],
    lyricsSnippet: s.lyrics.substring(0, 50) + '...'
  }));

  const prompt = `Generate a compelling and professional ${type} for a song. Consider the following song structure and vocal styles:
  Sections: ${JSON.stringify(sectionDetails)}

  The ${type} should be concise, impactful, and set the tone for the song. If it's an intro, it should build anticipation. If it's an outro, it should provide a strong conclusion. Do not include any tags like [Intro] or [Outro]. Just the raw text.`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: isPro ? { thinkingConfig: { thinkingBudget: 10000 } } : undefined,
  });

  return response.text || "";
};