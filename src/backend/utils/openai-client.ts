import OpenAI from "openai"
import { ENV } from "../../config/env"

// Check if OpenAI API key is available
const hasOpenAIKey =
  process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 0

// Create a mock OpenAI client for development mode
class MockOpenAI {
  constructor() {

  }

  chat = {
    completions: {
      create: async ({ messages, model, response_format }: any) => {

}

export const openai = client
