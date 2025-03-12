import axios from 'axios';
import { supabase } from '@/lib/supabase';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const SUPABASE_BUCKET = 'event-images';

const openAiModels = ['gpt-3.5-turbo', 'gpt-3.5-turbo-instruct', 'babbage-002', 'davinci-002'];

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

/**
 * Returns a random fallback dress code if OpenAI API is unavailable.
 */
const getFallbackDressCode = () => {
  return fallbackDressCodes[Math.floor(Math.random() * fallbackDressCodes.length)];
};

/**
 * Fetches an AI-generated dress code suggestion using OpenAI.
 * Falls back to a default dress code if all API attempts fail.
 */
export const getDressCodeSuggestion = async () => {
  for (const model of openAiModels) {
    try {
      console.log(`🔹 Requesting OpenAI with model: ${model}...`);

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: model,
          messages: [
            {
              role: 'user',
              content:
                'Give me a creative dress code for a date or dance event. Only return the dress code title without explanation.',
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

      console.log('🔹 OpenAI response received:', response.data);
      let suggestion = response.data?.choices?.[0]?.message?.content?.trim();

      if (suggestion) {
        suggestion = suggestion.replace(/["']/g, '');
        return suggestion;
      }
    } catch (error) {
      console.error(`❌ OpenAI error with model ${model}:`, error.response?.data || error.message);

      if (error.response?.data?.error?.code === 'insufficient_quota') {
        console.warn(`⚠️ No remaining quota for ${model}, trying next model...`);
        continue;
      }

      if (error.response?.status === 429) {
        console.warn(`⚠️ Rate limit reached for ${model}, trying next model...`);
        continue;
      }

      break;
    }
  }

  console.warn('⚠️ All OpenAI models failed. Using a fallback dress code.');
  return getFallbackDressCode();
};

/**
 * Generates an AI-powered event invitation image based on the given dress code.
 * Uses DALL·E 3, with fallback logic if OpenAI fails.
 *
 * @param {string} dressCode - The dress code theme for the event.
 * @returns {Promise<{ imageUrl: string | null, error: string | null }>}}
 */
export const generateEventImage = async (dressCode, setLoading) => {
  if (!dressCode) {
    console.warn('⚠️ No dress code provided – using fallback.');
    return { imageUrl: '/fallback/default-event.jpg', error: 'No dress code provided' };
  }

  try {
    console.log(`🎨 Generating event image for dress code: "${dressCode}"`);

    setLoading(true);

    const cleanDressCode = dressCode.replace(/["']/g, '').trim();

    const prompt = `Generate a high-quality image of **people wearing stylish outfits** that fit the theme "${cleanDressCode}". 
    The image should include fashionable clothing, elegant attire, or trendy outfits suitable for the theme.`;

    const response = await axios.post(
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
    );

    const imageUrl = response.data?.data?.[0]?.url;
    if (!imageUrl) throw new Error('No image URL returned from OpenAI');

    console.log(`✅ AI image generated successfully: ${imageUrl}`);

    // **Save image to Supabase**
    const savedImageUrl = await saveImageToSupabase(imageUrl, cleanDressCode);

    return { imageUrl: savedImageUrl, error: null };
  } catch (error) {
    console.error('❌ AI image generation failed:', error.message);

    if (error.response?.data?.error?.code === 'billing_hard_limit_reached') {
      console.warn('⚠️ OpenAI billing limit reached – using fallback image.');
      return { imageUrl: '/fallback/default-event.jpg', error: 'Billing limit reached' };
    }

    return { imageUrl: null, error: error.response?.data?.error?.message || error.message };
  } finally {
    setLoading(false);
  }
};

/**
 * Saves an AI-generated image to Supabase Storage and returns its public URL.
 *
 * @param {string} imageUrl - The AI-generated image URL from OpenAI.
 * @param {string} dressCode - The dress code name for storage reference.
 * @returns {Promise<string>}
 */
const saveImageToSupabase = async (imageUrl, dressCode) => {
  try {
    console.log(`💾 Fetching image from OpenAI: ${imageUrl}`);

    // 🔹 OpenAI-Bild abrufen als Blob
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Failed to fetch AI-generated image: ${response.statusText}`);

    const blob = await response.blob();
    const fileExt = 'png';

    // 🔹 Datei erstellen (Fix für Supabase)
    const file = new File([blob], `${dressCode}.${fileExt}`, { type: 'image/png' });

    // 🔹 Sicherer Dateiname für Storage
    const timestamp = Date.now();
    const safeDressCode = dressCode.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 15);
    const fileName = `event-images/${timestamp}-${safeDressCode}.${fileExt}`;

    console.log(`🖼 Uploading image to Supabase Storage: ${fileName}`);

    // 🔹 Supabase Storage Upload nutzen
    const { data, error } = await supabase.storage.from(SUPABASE_BUCKET).upload(fileName, file);

    if (error) throw new Error(`Supabase upload failed: ${error.message}`);

    // 🔹 Öffentliche URL abrufen
    const publicUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${fileName}`;

    console.log(`✅ Image successfully saved to Supabase: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error('❌ Failed to store image in Supabase:', error.message);
    return '/fallback/default-event.jpg'; // Falls Hochladen fehlschlägt, Fallback-Bild setzen
  }
};
