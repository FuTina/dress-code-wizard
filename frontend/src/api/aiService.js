import axios from 'axios';

// 🔹 Setze `USE_AI = false`, um OpenAI zu deaktivieren und nur Fallbacks zu nutzen
export const USE_AI = true; // Setze auf `false`, wenn AI nicht verwendet werden soll.

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
//const BACKEND_URL = 'http://localhost:8080/api/saveImage'; // Falls Backend auf anderem Port läuft, anpassen
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'; // Fallback zu localhost


// 🔹 Fallback Dresscodes
const fallbackDressCodes = [
  'Animal Pyjama Party 🦄',
  'Neverland Adventure 🏴‍☠️',
  'Anime Cosplay 🎌',
  'Gender Swap 💃🕺',
  'Superhero Night 🦸‍♂️',
  'Nineties Throwback 🎶',
  'Black and White 🖤🤍',
  'Futuristic Neon 🔮',
  'Beach Party 🌴',
  'Elegant Dinner 🥂',
];

// 🔹 Fallback-Bilder für verschiedene Dresscodes
const fallbackImages = {
  elegant: '/fallback/elegant.jpg',
  neverland: '/fallback/neverland.jpg',
  anime: '/fallback/anime.jpg',
  hero: '/fallback/hero.jpg',
  pyjama: '/fallback/pyjama.jpg',
  beach: '/fallback/beach.jpg',
  black: '/fallback/black.jpg',
  futuristic: '/fallback/futuristic.jpg',
  nineties: '/fallback/nineties.jpg',
  default: '/fallback/default.jpg',
};

// 🔹 Gibt einen zufälligen Dresscode zurück
const getFallbackDressCode = () => fallbackDressCodes[Math.floor(Math.random() * fallbackDressCodes.length)];

// 🔹 Passendes Fallback-Bild zum Dresscode zurückgeben
const getFallbackImage = (dressCode) => {
  if (!dressCode) return fallbackImages.default;
  const normalizedDressCode = dressCode.toLowerCase().trim();
  return Object.entries(fallbackImages).find(([key]) => normalizedDressCode.includes(key))?.[1] || fallbackImages.default;
};

/**
 *  🔹 Holt eine AI-generierte Dresscode-Idee oder nutzt das Fallback.
 */
export const getDressCodeSuggestion = async () => {
  if (!USE_AI) {
    console.warn('⚠️ AI deaktiviert – verwende Fallback-Dresscode.');
    return getFallbackDressCode();
  }

  try {
    console.log(`🔹 Requesting OpenAI dress code...`);

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: 'Give me a creative dress code for a date or dance event. Only return the dress code title without explanation.',
          },
        ],
        temperature: 1.8,
        max_tokens: 50,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const suggestion = response.data?.choices?.[0]?.message?.content?.trim().replace(/["']/g, '');
    return suggestion || getFallbackDressCode();
  } catch (error) {
    console.error('❌ OpenAI error:', error.response?.data || error.message);
    return getFallbackDressCode();
  }
};

/**
 *  🔹 Generiert ein AI-Bild oder nutzt ein Fallback.
 */
export const generateEventImage = async (dressCode, setLoading) => {
  if (!dressCode) {
    console.warn('⚠️ Kein Dresscode vorhanden – verwende Fallback.');
    return { imageUrl: getFallbackImage(null), error: 'Kein Dresscode vorhanden' };
  }

  if (!USE_AI) {
    console.warn('⚠️ AI deaktiviert – verwende Fallback-Bild.');
    return { imageUrl: getFallbackImage(dressCode), error: 'AI deaktiviert' };
  }

  try {
    console.log(`🎨 Generating event image for dress code: "${dressCode}"`);
    setLoading(true);

    const cleanDressCode = dressCode.replace(/["']/g, '').trim();

    const prompt = `Generate a high-quality image of **one man and one woman** wearing stylish outfits that fit the theme "${cleanDressCode}". 
    The man and woman should be posing together in a fashionable setting, wearing elegant attire or trendy outfits suitable for the theme. 
    Ensure the image features only these two individuals, with a clear focus on their clothing style.`;

    // 🔹 Timeout auf 45 Sekunden erhöhen
    const response = await Promise.race([
      axios.post(
        'https://api.openai.com/v1/images/generations',
        {
          model: 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: '1024x1024',
        },
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      ),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout: AI Image took too long')), 45000)),
    ]);

    const imageUrl = response.data?.data?.[0]?.url;
    if (!imageUrl) throw new Error('No image URL returned from OpenAI');

    console.log(`✅ AI image generated successfully: ${imageUrl}`);

    // 🔹 Speichert das generierte Bild in Supabase
    const savedImageUrl = await saveGeneratedImage(imageUrl, cleanDressCode);

    return { imageUrl: savedImageUrl, error: null };
  } catch (error) {
    console.error('❌ AI image generation failed:', error.message);
    return { imageUrl: getFallbackImage(dressCode), error: error.message };
  } finally {
    setLoading(false);
  }
};

/**
 *  🔹 Speichert das AI-generierte Bild über das Backend in Supabase.
 */
const saveGeneratedImage = async (imageUrl, dressCode) => {
  try {
    console.log(`💾 Sending image to backend for storage: ${imageUrl}`);

    const response = await fetch(
      `${BACKEND_URL}?imageUrl=${encodeURIComponent(imageUrl)}&dressCode=${encodeURIComponent(dressCode)}`,
      { method: 'POST' },
    );

    //  `${BACKEND_URL}/api/saveImage?imageUrl=${encodeURIComponent(imageUrl)}&dressCode=${encodeURIComponent(dressCode)}`,

    const data = await response.json();
    if (data.imageUrl) {
      console.log('✅ AI Image successfully saved:', data.imageUrl);
      return data.imageUrl;
    } else {
      throw new Error('Image save failed');
    }
  } catch (error) {
    console.error('❌ Error saving AI-generated image:', error);
    return getFallbackImage(dressCode);
  }
};
