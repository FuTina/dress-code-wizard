import axios from 'axios'

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY
const BACKEND_URL = 'http://localhost:8080/api/saveImage' // Falls Backend auf einem anderen Port läuft, anpassen

/**
 * Fetches an AI-generated dress code suggestion using OpenAI.
 * Falls OpenAI fehlschlägt, wird ein Standard-Dresscode zurückgegeben.
 */
export const getDressCodeSuggestion = async () => {
  try {
    console.log(`🔹 Requesting OpenAI dress code...`)

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
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
      },
    )

    const suggestion = response.data?.choices?.[0]?.message?.content?.trim().replace(/["']/g, '')
    return suggestion || getFallbackDressCode()
  } catch (error) {
    console.error('❌ OpenAI error:', error.response?.data || error.message)
    return getFallbackDressCode()
  }
}

/**
 * Returns a random fallback dress code if OpenAI API is unavailable.
 */
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
]

const getFallbackDressCode = () =>
  fallbackDressCodes[Math.floor(Math.random() * fallbackDressCodes.length)]

/**
 * Generates an AI-powered event invitation image based on the given dress code.
 * Uses OpenAI's DALL·E 3. Falls OpenAI fehlschlägt, wird ein Standardbild zurückgegeben.
 */
export const generateEventImage = async (dressCode, setLoading) => {
  if (!dressCode) {
    console.warn('⚠️ No dress code provided – using fallback.')
    return { imageUrl: '/fallback/default-event.jpg', error: 'No dress code provided' }
  }

  try {
    console.log(`🎨 Generating event image for dress code: "${dressCode}"`)
    setLoading(true)

    const cleanDressCode = dressCode.replace(/["']/g, '').trim()

    const prompt = `Generate a high-quality image of **one man and one woman** wearing stylish outfits that fit the theme "${cleanDressCode}". 
    The man and woman should be posing together in a fashionable setting, wearing elegant attire or trendy outfits suitable for the theme. 
    Ensure the image features only these two individuals, with a clear focus on their clothing style.`

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
        },
      ),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout: AI Image took too long')), 45000),
      ), // ⬅ Erhöht auf 45 Sekunden
    ])

    const imageUrl = response.data?.data?.[0]?.url
    if (!imageUrl) throw new Error('No image URL returned from OpenAI')

    console.log(`✅ AI image generated successfully: ${imageUrl}`)

    // 🔹 Bild an das Backend senden, um es in Supabase zu speichern
    const savedImageUrl = await saveGeneratedImage(imageUrl, cleanDressCode)

    return { imageUrl: savedImageUrl, error: null }
  } catch (error) {
    console.error('❌ AI image generation failed:', error.message)
    return { imageUrl: '/fallback/default-event.jpg', error: error.message }
  } finally {
    setLoading(false)
  }
}

/**
 * Speichert das generierte AI-Bild über das Backend in Supabase.
 *
 * @param {string} imageUrl - Die OpenAI-URL des Bildes.
 * @param {string} dressCode - Der Dresscode für das Bild.
 * @returns {Promise<string>}
 */
const saveGeneratedImage = async (imageUrl, dressCode) => {
  try {
    console.log(`💾 Sending image to backend for storage: ${imageUrl}`)

    const response = await fetch(
      `${BACKEND_URL}?imageUrl=${encodeURIComponent(imageUrl)}&dressCode=${encodeURIComponent(dressCode)}`,
      { method: 'POST' },
    )

    const data = await response.json()
    if (data.imageUrl) {
      console.log('✅ AI Image successfully saved:', data.imageUrl)
      return data.imageUrl
    } else {
      throw new Error('Image save failed')
    }
  } catch (error) {
    console.error('❌ Error saving AI-generated image:', error)
    return '/fallback/default-event.jpg'
  }
}
