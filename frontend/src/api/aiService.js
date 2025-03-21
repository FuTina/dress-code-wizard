import axios from 'axios'

export const USE_AI = import.meta.env.VITE_USE_AI === 'true'

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080' // Fallback zu localhost

// TODO edit event in same style as create event

// TODO write and get dresscodes and images from previous events to the database
// fallbackdropdown nach event type eingrenzen
// TODO clean up code, add comments

// TODO delete account
// TODO fix go api
// TODO do invitations
// TODO update readme
// TODO add tests

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

const fallbackDressCodesByType = {
  party: [
    'Neon Glow 🌟',
    'Great Gatsby 🎩',
    'Masquerade Ball 🎭',
    'Disco Fever 🕺',
    'Jungle Party 🌿',
  ],
  business: [
    'Elegant Formal 🤵',
    'Corporate Chic 👔',
    'Smart Casual 👖',
    'Luxury Black Tie 🎩',
    'Classic Blue Suit 🏢',
  ],
  date: [
    'Romantic Red ❤️',
    'Elegant Black 🖤',
    'Vintage Love 🎶',
    'Cozy Autumn 🍂',
    'Moonlight Dinner 🌙',
  ],
  default: ['Black and White 🖤🤍', 'Futuristic Neon 🔮', 'Elegant Dinner 🥂'],
}

const fallbackImages = {
  elegant: '/fallback/elegant.png',
  neverland: '/fallback/neverland.png',
  anime: '/fallback/anime.png',
  hero: '/fallback/hero.png',
  pyjama: '/fallback/pyjama.png',
  beach: '/fallback/beach.png',
  black: '/fallback/black.png',
  futuristic: '/fallback/futuristic.png',
  nineties: '/fallback/nineties.png',
  default: '/fallback/default0.jpg',
}

const fallbackOutfitSuggestions = {
  neverland:
    'Think Peter Pan vibes! Dress as a pirate, fairy, or even a lost boy. A mix of adventure and whimsy.',
  nineties:
    'Baggy jeans, crop tops, and bucket hats. Bring back the 90s with bold colors and retro sneakers.',
  elegant:
    'Classic suits, cocktail dresses, and sophisticated accessories. A night of glamour awaits.',
  superhero: 'Capes, masks, and heroic outfits. Dress like your favorite comic book legend.',
  anime: 'Cosplay as your favorite anime character or wear Japanese street fashion styles.',
  futuristic: 'Metallic tones, LED glasses, and cyberpunk aesthetics. The future is now!',
  beach: 'Floral shirts, bikinis, sandals, and sunglasses. Perfect for a tropical party.',
  black: 'Monochrome outfits in stylish black and white tones. Minimalist and chic.',
  default: 'Express yourself with a creative outfit matching the theme!',
}

export const getFallbackOutfitSuggestion = (dressCode) => {
  if (!dressCode) return fallbackOutfitSuggestions.default
  const normalizedDressCode = dressCode.toLowerCase().trim()

  console.log('🔍 Checking Fallback outfit suggestion for:', normalizedDressCode)

  return (
    Object.entries(fallbackOutfitSuggestions).find(([key]) =>
      normalizedDressCode.includes(key),
    )?.[1] || fallbackOutfitSuggestions.default
  )
}

export const generateOutfitSuggestion = async (dressCode) => {
  if (!dressCode) return getFallbackOutfitSuggestion('default')
  if (!USE_AI) return getFallbackOutfitSuggestion(dressCode)

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: `Generate a concise, realistic, and purchasable outfit for costume recommendation for the theme "${dressCode}". 
            Include detailed clothing pieces, accessories, and footwear that can be realistically purchased today. Ensure gender-adapted options where applicable. 
            Keep it under 20 words and return only the outfit description without mentioning the dress code. Use clear descriptions that resemble product listings. Avoid abstract, futuristic, or AI-distorted suggestions.
            
            Provide separate outfit descriptions for a woman and a man, formatted as two separate lines without bullet points, dashes, or symbols. 
            Do not mention the dress code name in your response, only return the outfit descriptions.

            The following are reference styles to guide your answer. Use them as a template, but tailor the response to fit the requested theme.

            Woman: Long satin evening gown, silver high heels, pearl earrings, matching clutch.  
            Man: Tailored black tuxedo, silk bow tie, polished dress shoes, silver cufflinks.  

            Woman: Cozy pink unicorn onesie, fluffy slippers, plush sleep mask.  
            Man: Green dinosaur pajama set, warm socks, matching hooded cap.  

            Woman: Neon crop top, high-waisted joggers, LED sneakers, mirrored sunglasses.  
            Man: Reflective bomber jacket, black joggers, glow-in-the-dark bracelets.  

            Woman: Green fairy dress with detachable wings, ballet flats, silver tiara, delicate fairy wand.  
            Man: Pirate costume with a white ruffled shirt, black vest, slim trousers, knee-high boots, tricorn hat.  

            Woman: White linen maxi dress, flat leather sandals, wide-brim straw hat, oversized sunglasses.  
            Man: Short-sleeve Hawaiian shirt, beige linen shorts, flip-flops, aviator sunglasses.  

            Follow this structure and provide a high-quality, realistic, and purchasable outfit recommendation that fits the theme.

            Use similar styling to return a high-quality outfit description.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 50,
      },
      {
        headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      },
    )

    const outfitSuggestion = response.data?.choices?.[0]?.message?.content
      ?.trim()
      .replace(/["']/g, '')
    return outfitSuggestion && USE_AI ? outfitSuggestion : getFallbackOutfitSuggestion(dressCode)
  } catch (error) {
    console.error('❌ AI error fetching outfit Suggestion:', error)
    return getFallbackOutfitSuggestion(dressCode)
  }
}

const getFallbackDressCode = (eventType) => {
  const dressCodes = fallbackDressCodesByType[eventType] || fallbackDressCodesByType.default
  return dressCodes[Math.floor(Math.random() * dressCodes.length)]
}

export const getFallbackImage = (dressCode) => {
  if (!dressCode) return fallbackImages.default
  const normalizedDressCode = dressCode.toLowerCase().trim()

  console.log('🔍 Checking Fallback Image for:', normalizedDressCode)

  return (
    Object.entries(fallbackImages).find(([key]) => normalizedDressCode.includes(key))?.[1] ||
    fallbackImages.default
  )
}

export const getDressCodeSuggestion = async (eventType) => {
  console.log('VITE_USE_AI:', import.meta.env.VITE_USE_AI)

  if (!USE_AI) {
    console.warn('⚠️ AI deaktiviert – verwende Fallback-Dresscode.')
    return getFallbackDressCode(eventType)
  }

  try {
    console.log(`🔹 Requesting OpenAI dress code for event type: ${eventType}`)

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: `Suggest a short, stylish, and creative dress code idea specifically for an event of type "${eventType}". 
            Ensure that the theme is appropriate for the event type. For example:  
            - Party: "Neon Glow", "Great Gatsby", "Masquerade"  
            - Business Meeting: "Elegant Formal", "Corporate Chic", "Smart Casual"  
            - Date: "Romantic Red", "Elegant Black", "Vintage Love"  
            
            Return only the dress code title, no explanations. Keep it between **1-5 words**.`,
          },
        ],
        temperature: 1.3,
        max_tokens: 10,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    )

    const suggestion = response.data?.choices?.[0]?.message?.content?.trim().replace(/["']/g, '')
    return suggestion && USE_AI ? suggestion : getFallbackDressCode(eventType)
  } catch (error) {
    console.error('❌ OpenAI error:', error.response?.data || error.message)
    return getFallbackDressCode(eventType)
  }
}
const fetchExistingImage = async (dressCode, eventType) => {
  try {
    console.log('📡 Checking for existing image in database:', dressCode, eventType)

    const { data } = await axios.get(
      `${BACKEND_URL}/api/getImage?dressCode=${encodeURIComponent(dressCode)}&eventType=${encodeURIComponent(eventType)}`,
    )

    if (data.error) {
      console.warn('⚠️ No image found in database:', dressCode, eventType)
      return null
    }

    console.log('✅ Found existing image:', data.imageUrl)
    return data.imageUrl
  } catch (error) {
    console.warn('⚠️ No image found (API error). Generating new image...')
    return null
  }
}

async function fetchDressCodes() {
  const { data } = await axios.get(`${BACKEND_URL}/api/dresscodes`)
  return data || []
}
export const fetchSavedDressCodes = async (eventType = '') => {
  try {
    const url = eventType
      ? `${BACKEND_URL}/api/dresscodes?eventType=${eventType}`
      : `${BACKEND_URL}/api/dresscodes`

    const { data } = await axios.get(url)

    if (!Array.isArray(data)) {
      console.error('❌ Unexpected response format for dress codes:', data)
      return []
    }

    return data
  } catch (error) {
    console.error('❌ Error fetching the dress codes:', error)
    return []
  }
}

export default {
  data() {
    return {
      availableDressCodes: [],
    }
  },
  async mounted() {
    this.availableDressCodes = await fetchDressCodes()
  },
}

export const generateEventImage = async (dressCode, eventType, setLoading = (val) => {}) => {
  console.log('VITE_USE_AI:', import.meta.env.VITE_USE_AI)
  if (!dressCode) {
    console.warn('⚠️ No dress code provided - using fallback.')
    return { imageUrl: getFallbackImage(null), error: 'No dress code provided' }
  }

  setLoading(true)

  const existingImage = await fetchExistingImage(dressCode, eventType)
  if (existingImage) {
    console.log('✅ Reusing existing image:', existingImage)
    return { imageUrl: existingImage, error: null }
  }

  if (!USE_AI) {
    console.warn('⚠️ AI disabled - using fallback image.')
    return {
      imageUrl: fallbackImages[dressCode.toLowerCase()] || fallbackImages.default,
      error: 'AI disabled',
    }
  }

  try {
    console.log(`🎨 Generating event image for dress code: "${dressCode}"`)
    setLoading(true)

    const cleanDressCode = dressCode.replace(/["']/g, '').trim()

    //Generate an image of exactly one man and one woman standing side by side, dressed in theme-appropriate outfits
    const prompt = `Generate a high-resolution, realistic, full-body image of exactly one european man and one woman standing side by side, wearing purchasable outfits or costumes for the dress code "${cleanDressCode}" and the event type "${eventType}". The outfits should be realistic and appropriate for the dress code and event type.
    The outfits should be based on real, available clothing items. Focus on realistic fabrics, textures, and accessories.  
    Avoid surreal elements, exaggerated designs, or costumes that do not exist in real life.  
    If the dress code is unknown or no clear example exists, generate an outfit that follows a similar known theme from the examples below.  
    Examples:  
    - Elegant Night: The woman wears a floor-length satin evening gown, silver stiletto heels, a matching clutch, and pearl earrings.  
      The man wears a tailored black tuxedo, a white dress shirt, a silk bow tie, polished leather Oxford shoes, and a silver watch.  
    - Retro Disco Fever: The woman wears high-waisted sequined bell-bottom pants, a fitted metallic halter top, platform heels, and oversized round sunglasses.  
      The man wears a white slim-fit leisure suit, a patterned silk shirt, a gold chain necklace, and patent leather dress shoes.  
    - Animal Pyjama Party: The woman wears a plush pink unicorn onesie with a hood and ears, fluffy slippers, and a satin sleep mask.  
      The man wears a cozy green dinosaur onesie with a hood and tail, warm socks, and matching plush slippers.  
    - Neverland Adventure: The woman wears a green fairy dress with layered chiffon, detachable wings, ballet flats, and a tiara.  
      The man wears a pirate costume with a ruffled white shirt, black slim-fit trousers, a leather belt with a gold buckle, knee-high boots, and a tricorn hat.  
    - Gender Swap: The woman wears a fitted navy suit, a white dress shirt, a silk tie, and polished dress shoes.  
      The man wears a knee-length satin dress, high heels, pearl earrings, and carries a clutch.  
    - Beach Party: The woman wears a floral bikini with a sheer white beach skirt, flat sandals, oversized sunglasses, and a straw hat.  
      The man wears colorful swim shorts, a short-sleeve Hawaiian shirt, flip-flops, and aviator sunglasses.  
    - Black & Gold: The woman wears a fitted gold cocktail dress, black high heels, a matching black clutch, and golden hoop earrings.  
      The man wears a classic black suit with a gold bow tie, a white dress shirt, polished dress shoes, and a gold pocket square.  
    - Gatsby 1920s: The woman wears a knee-length flapper dress with fringe, a beaded headband, pearl earrings, and T-strap heels.  
      The man wears a three-piece pinstripe suit, a fedora hat, suspenders, and two-tone Oxford shoes.  
    - Pajama Party: The woman wears a silk two-piece pajama set, fuzzy slippers, and a satin robe.  
      The man wears plaid flannel pajama pants, a white t-shirt, warm socks, and a hoodie.  
    - All-White Party: The woman wears a white jumpsuit with lace details, nude heels, and a pearl bracelet.  
      The man wears white linen trousers, a fitted white button-up shirt, white loafers, and a silver wristwatch.  
    - Hawaiian Luau: The woman wears a floral wrap dress, flat sandals, a flower lei, and a tropical headpiece.  
      The man wears a red floral Hawaiian shirt, beige cargo shorts, flip-flops, and a straw fedora.  
    Follow this structure to generate a stylish, realistic, and purchasable outfit recommendation for the given theme.`

    // 🔹 Timeout  45 s
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
      ),
    ])

    const imageUrl = response.data?.data?.[0]?.url
    if (!imageUrl && USE_AI) {
      console.error(
        '❌ AI image generation failed but AI is active. Returning an error instead of fallback.',
      )
      return { imageUrl: null, error: 'AI image generation failed' }
    }

    if (!imageUrl && !USE_AI) {
      console.warn('⚠️ AI is disabled - using fallback image.')
      return {
        imageUrl: fallbackImages[dressCode.toLowerCase()] || fallbackImages.default,
        error: 'Fallback used',
      }
    }

    console.log(`✅ AI image generated successfully: ${imageUrl}`)

    const savedImageUrl = await saveGeneratedImage(imageUrl, cleanDressCode, eventType)

    return { imageUrl: savedImageUrl, error: null }
  } catch (error) {
    console.error('❌ AI image generation failed:', error.message)
    return { imageUrl: getFallbackImage(dressCode), error: error.message }
  } finally {
    setLoading(false)
  }
}

/**
 *  Saves the AI-generated image to Supabase via the backend.
 **/
const saveGeneratedImage = async (imageUrl, dressCode, eventType) => {
  try {
    console.log(`💾 Sending image to backend for storage: ${imageUrl}`)
    console.log('🛠️ BACKEND_URL:', BACKEND_URL)

    const apiUrl = `${BACKEND_URL.replace(/\/$/, '')}/api/saveImage`
    console.log('🛠️ apiUrl:', apiUrl)

    console.log(
      `${apiUrl}?imageUrl=${encodeURIComponent(imageUrl)}&dressCode=${encodeURIComponent(dressCode)}&eventType=${encodeURIComponent(eventType)}`,
    )

    const response = await fetch(
      `${apiUrl}?imageUrl=${encodeURIComponent(imageUrl)}&dressCode=${encodeURIComponent(dressCode)}&eventType=${encodeURIComponent(eventType)}`,
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
    return getFallbackImage(dressCode)
  }
}

const fetchShoppingResults = async (query) => {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY
  const searchUrl = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&key=${apiKey}&cx=YOUR_SEARCH_ENGINE_ID`

  try {
    const response = await axios.get(searchUrl)
    return (
      response.data.items?.map((item) => ({
        title: item.title,
        link: item.link,
        image: item.pagemap?.cse_image?.[0]?.src,
      })) || []
    )
  } catch (error) {
    return []
  }
}
