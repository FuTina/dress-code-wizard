import axios from 'axios'

// export const USE_AI = true // Setze auf `false`, wenn AI nicht verwendet werden soll.
export const USE_AI = import.meta.env.VITE_USE_AI === 'true'

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080' // Fallback zu localhost

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
]

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
}

const fallbackDescriptions = {
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

export const getFallbackDescription = (dressCode) => {
  if (!dressCode) return fallbackDescriptions.default
  const normalizedDressCode = dressCode.toLowerCase().trim()

  console.log('🔍 Checking Fallback Description for:', normalizedDressCode)

  return (
    Object.entries(fallbackDescriptions).find(([key]) => normalizedDressCode.includes(key))?.[1] ||
    fallbackDescriptions.default
  )
}

export const generateOutfitDescription = async (dressCode) => {
  if (!dressCode) return getFallbackDescription('default')
  if (!USE_AI) return getFallbackDescription(dressCode)

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: `Provide a concise, stylish, realistic and purchasable outfit recommendation for the theme "${dressCode}". 
            List specific garments, accessories, and footwear that one can buy today. Ensure gender-adapted options where applicable. 
            Keep it under 20 words and return only the outfit description without mentioning the dress code.
            
            Examples:
            - Women: Long satin evening gown, silver high heels, pearl earrings, matching clutch. 
            - Men: Tailored black tuxedo, silk bow tie, polished dress shoes, silver cufflinks. 
            - Women: Cozy pink unicorn onesie, fluffy slippers, plush sleep mask. 
            - Men: Green dinosaur pajama set, warm socks, matching hooded cap. 
            - Women: Neon crop top, high-waisted joggers, LED sneakers, mirrored sunglasses. 
            - Men: Reflective bomber jacket, black joggers, glow-in-the-dark bracelets. 
            - Women: Vintage polka-dot dress, cat-eye sunglasses, pearl earrings, Mary Jane shoes. 
            - Men: Retro striped suit, fedora hat, Oxford shoes, pocket watch. 
            - Women: Metallic silver bodysuit, LED sunglasses, neon leggings, platform boots. 
            - Men: Black tech-jacket with LED accents, slim-fit joggers, futuristic sneakers.`,
          },
        ],
        temperature: 1.1,
        max_tokens: 50,
      },
      {
        headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      },
    )

    const outfitDescription = response.data?.choices?.[0]?.message?.content
      ?.trim()
      .replace(/["']/g, '')
    return outfitDescription && USE_AI ? outfitDescription : getFallbackDescription(dressCode)
  } catch (error) {
    console.error('❌ AI error fetching outfit description:', error)
    return getFallbackDescription(dressCode)
  }
}

// 🔹 Gibt einen zufälligen Dresscode zurück
const getFallbackDressCode = () =>
  fallbackDressCodes[Math.floor(Math.random() * fallbackDressCodes.length)]

// 🔹 Passendes Fallback-Bild zum Dresscode zurückgeben
export const getFallbackImage = (dressCode) => {
  if (!dressCode) return fallbackImages.default
  const normalizedDressCode = dressCode.toLowerCase().trim()

  console.log('🔍 Checking Fallback Image for:', normalizedDressCode)

  return (
    Object.entries(fallbackImages).find(([key]) => normalizedDressCode.includes(key))?.[1] ||
    fallbackImages.default
  )
}

/**
 *  🔹 Holt eine AI-generierte Dresscode-Idee oder nutzt das Fallback.
 */
export const getDressCodeSuggestion = async () => {
  console.log('VITE_USE_AI:', import.meta.env.VITE_USE_AI)
  if (!USE_AI) {
    console.warn('⚠️ AI deaktiviert . verwende Fallback-Dresscode.')
    return getFallbackDressCode()
  }

  try {
    console.log(`🔹 Requesting OpenAI dress code...`)

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content:
              'Give me a unique, creative, and fun dress code idea for a date, party, or dance event. Make it exciting, unexpected, and humorous when possible. Only return the dress code title without explanation.',
          },
        ],
        temperature: 1.5,
        max_tokens: 20,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    )

    const suggestion = response.data?.choices?.[0]?.message?.content?.trim().replace(/["']/g, '')
    return suggestion && USE_AI ? suggestion : getFallbackDressCode()
  } catch (error) {
    console.error('❌ OpenAI error:', error.response?.data || error.message)
    return getFallbackDressCode()
  }
}

/**
 *  🔹 Generiert ein AI-Bild oder nutzt ein Fallback.
 */
export const generateEventImage = async (dressCode, setLoading) => {
  console.log('VITE_USE_AI:', import.meta.env.VITE_USE_AI)
  if (!dressCode) {
    console.warn('⚠️ Kein Dresscode vorhanden - verwende Fallback.')
    return { imageUrl: getFallbackImage(null), error: 'Kein Dresscode vorhanden' }
  }

  if (!USE_AI) {
    console.warn('⚠️ AI deaktiviert - Fallback-Bild wird verwendet.')
    return {
      imageUrl: fallbackImages[dressCode.toLowerCase()] || fallbackImages.default,
      error: 'AI deaktiviert',
    }
  }

  try {
    console.log(`🎨 Generating event image for dress code: "${dressCode}"`)
    setLoading(true)

    const cleanDressCode = dressCode.replace(/["']/g, '').trim()

    const prompt = `Generate a high-resolution, full-body image of one man and one woman wearing purchasable outfits or costumes for the dress code "${cleanDressCode}". 

    The outfits should be based on real available clothing items. Focus on realistic fabrics, textures, and accessories. 
    Avoid surreal elements, exaggerated designs, or costumes that do not exist in real life. The background should be a neutral studio setting or a relevant event backdrop.
    Examples:  
- Elegant Night: The woman wears a floor-length satin evening gown, silver stiletto heels, a matching clutch, and pearl earrings. The man wears a tailored black tuxedo, a white dress shirt, a silk bow tie, polished leather Oxford shoes, and a silver watch.  
- Retro Disco Fever: The woman wears high-waisted sequined bell-bottom pants, a fitted metallic halter top, platform heels, and oversized round sunglasses. The man wears a white slim-fit leisure suit, a patterned silk shirt, a gold chain necklace, and patent leather dress shoes.  
- Glitter Overload: The woman wears a knee-length silver sequined dress, high-heeled sandals, chandelier earrings, and a metallic clutch. The man wears a navy blue sequined blazer, fitted black dress pants, a black turtleneck, and polished dress shoes.  
- Animal Pyjama Party: The woman wears a plush pink unicorn onesie with a hood and ears, fluffy slippers, and a satin sleep mask. The man wears a cozy green dinosaur onesie with a hood and tail, warm socks, and matching plush slippers.  
- Futuristic Cyberpunk: The woman wears a silver metallic cropped jacket, a black bodysuit, neon-accented leggings, LED sunglasses, and platform sneakers. The man wears a black tech-inspired bomber jacket with LED details, slim-fit joggers, a utility vest, and high-top sneakers with glowing soles.  
- Neon Party: The woman wears a neon pink crop top, high-waisted joggers, chunky sneakers, glow-in-the-dark hoop earrings, and an LED bracelet. The man wears a fluorescent green hoodie, reflective cargo pants, neon sneakers, and LED glasses.  
- Business Casual Chic: The woman wears a tailored beige blazer, a white silk blouse, straight-leg black trousers, nude pumps, and a structured leather handbag. The man wears a navy-blue blazer, a fitted white dress shirt, tailored khaki chinos, and brown leather loafers.  
- Black and White: The woman wears a knee-length black fitted dress with white trim, white ankle boots, a silver necklace, and a structured clutch. The man wears a white slim-fit suit, a black dress shirt, a matching belt, black leather dress shoes, and a silver wristwatch.  
- Neverland Adventure: The woman wears a green fairy dress with layered chiffon, detachable wings, ballet flats, and a tiara. The man wears a pirate costume with a ruffled white shirt, black slim-fit trousers, a leather belt with a gold buckle, knee-high boots, and a tricorn hat.  
- Summer Beach Party: The woman wears a white linen maxi dress, flat leather sandals, a wide-brim straw hat, and oversized sunglasses. The man wears a short-sleeve Hawaiian shirt, beige linen shorts, flip-flops, and aviator sunglasses.`

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

    // 🔹 Speichert das generierte Bild in Supabase
    const savedImageUrl = await saveGeneratedImage(imageUrl, cleanDressCode)

    return { imageUrl: savedImageUrl, error: null }
  } catch (error) {
    console.error('❌ AI image generation failed:', error.message)
    return { imageUrl: getFallbackImage(dressCode), error: error.message }
  } finally {
    setLoading(false)
  }
}

/**
 *  🔹 Speichert das AI-generierte Bild über das Backend in Supabase.
 */
const saveGeneratedImage = async (imageUrl, dressCode) => {
  try {
    console.log(`💾 Sending image to backend for storage: ${imageUrl}`)
    console.log('🛠️ BACKEND_URL:', BACKEND_URL)

    // 🔹 Sicherstellen, dass die URL immer korrekt aufgebaut ist
    const apiUrl = `${BACKEND_URL.replace(/\/$/, '')}/api/saveImage`
    console.log('🛠️ apiUrl:', apiUrl)

    console.log(
      `${apiUrl}?imageUrl=${encodeURIComponent(imageUrl)}&dressCode=${encodeURIComponent(dressCode)}`,
    )

    const response = await fetch(
      `${apiUrl}?imageUrl=${encodeURIComponent(imageUrl)}&dressCode=${encodeURIComponent(dressCode)}`,
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
    console.error('❌ Error fetching shopping results:', error)
    return []
  }
}
