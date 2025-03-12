import axios from 'axios'

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY

const openAiModels = [
  'gpt-4o',
  'gpt-3.5-turbo',
  'gpt-3.5-turbo-instruct',
  'babbage-002',
  'davinci-002',
]

const fallbackDressCodes = [
  'Animal Pyjama Party 🦄',
  'Neverland Adventure 🏴‍☠️',
  'Anime Cosplay 🎌',
  'Gender Swap 💃🕺',
  'Superhero Night 🦸‍♂️',
  '90s Throwback 🎶',
  'Black & White 🖤🤍',
  'Futuristic Neon 🔮',
  'Beach Party 🌴',
  'Elegant Dinner 🥂',
]

const getFallbackDressCode = () => {
  return fallbackDressCodes[Math.floor(Math.random() * fallbackDressCodes.length)]
}

export const getDressCodeSuggestion = async () => {
  for (const model of openAiModels) {
    try {
      console.log(`🔹 OpenAI wird mit Modell \`${model}\` aufgerufen...`)

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: model,
          messages: [
            {
              role: 'user',
              content:
                'Gib mir einen kreativen Dresscode für ein Date oder eine Tanzveranstaltung. Bitte antworte nur mit dem Dresscode-Titel ohne Erklärung.',
            },
          ],
          temperature: 0.7,
          max_tokens: 50,
        },
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        },
      )

      console.log('🔹 OpenAI Antwort erhalten:', response.data)
      const suggestion = response.data?.choices?.[0]?.message?.content?.trim()

      if (suggestion) return suggestion
    } catch (error) {
      console.error(`❌ OpenAI Fehler mit Modell ${model}:`, error.response?.data || error.message)

      if (error.response?.data?.error?.code === 'insufficient_quota') {
        console.warn(`⚠️ Kein Guthaben für ${model}, versuche nächstes Modell...`)
        continue
      }

      if (error.response?.status === 429) {
        console.warn(`⚠️ Rate Limit für ${model} erreicht, versuche nächstes Modell...`)
        continue
      }

      break
    }
  }

  console.warn('⚠️ Alle OpenAI-Modelle fehlgeschlagen. Nutze Fallback-Dresscode.')
  return getFallbackDressCode()
}

export const generateEventImage = async (dressCode) => {
  try {
    console.log(`🎨 Generiere Event-Bild für Dresscode: ${dressCode}`)

    const response = await axios.post(
      'https://api.openai.com/v1/images/generations',
      {
        model: 'dall-e-3',
        prompt: `Create a stylish event poster for a theme called "${dressCode}".`,
        n: 1,
        size: '1024x1024',
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    )

    return { imageUrl: response.data?.data?.[0]?.url, error: null }
  } catch (error) {
    console.error('❌ Fehler bei der AI-Bildgenerierung:', error)
    return { imageUrl: null, error: error.message }
  }
}
