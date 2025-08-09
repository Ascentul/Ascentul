import OpenAI from "openai";
import { ENV } from "../../config/env";
// Check if OpenAI API key is available
const hasOpenAIKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 0;
// Create a mock OpenAI client for development mode
class MockOpenAI {
    constructor() {
        console.warn("⚠️ Using MockOpenAI - all OpenAI calls will return sample responses");
    }
    chat = {
        completions: {
            create: async ({ messages, model, response_format }) => {
                console.log(`🔍 MockOpenAI: would have called gpt-4o-mini (was: ${model}) with ${messages.length} messages`);
                // Return a sample response based on the requested format
                const isJsonFormat = response_format?.type === "json_object";
                if (isJsonFormat) {
                    return {
                        choices: [
                            {
                                message: {
                                    content: JSON.stringify({
                                        message: "This is mock data from MockOpenAI. The OPENAI_API_KEY is not set.",
                                        requestedModel: "gpt-4o-mini",
                                        mockData: true,
                                        status: "Development mode fallback response"
                                    })
                                }
                            }
                        ]
                    };
                }
                // Text format fallback
                return {
                    choices: [
                        {
                            message: {
                                content: "This is mock data from MockOpenAI. The OPENAI_API_KEY is not set. You are in development mode."
                            }
                        }
                    ]
                };
            }
        }
    };
}
// Determine which client to use
let client;
if (hasOpenAIKey) {
    // Use real OpenAI client if API key is available
    client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });
    console.log("✅ OpenAI client initialized with API key");
}
else if (ENV.NODE_ENV !== "production") {
    // Use mock client in development mode
    client = new MockOpenAI();
    console.warn("⚠️ Using mock OpenAI client in development mode");
}
else {
    // In production, we need a real API key
    console.error("❌ OpenAI API key is missing in production mode");
    throw new Error("OPENAI_API_KEY must be set in production mode");
}
export const openai = client;
