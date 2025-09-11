import OpenAI from "openai"
import { ChatCompletionMessageParam } from "openai/resources/chat/completions"
import { validateModelAndGetId, DEFAULT_MODEL } from "./models-config"
import { openai } from "./openai-client"

// Check for OpenAI API key and use mock mode if missing
const apiKey = process.env.OPENAI_API_KEY
let useMockOpenAI = !apiKey

if (!apiKey) {

    }
  }
}
