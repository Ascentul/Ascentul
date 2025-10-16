/**
 * Server-only OpenAI client
 *
 * WARNING: Do NOT import this in client components!
 * This module reads process.env and will fail at build time in client code.
 */

import "server-only";
import OpenAI from "openai";

const key = process.env.OPENAI_API_KEY;

if (!key) {
  throw new Error(
    "Missing OPENAI_API_KEY environment variable. " +
    "Add it to .env.local for development or configure in your deployment environment."
  );
}

export const openai = new OpenAI({ apiKey: key });
