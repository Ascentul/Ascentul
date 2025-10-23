/**
 * Server-only OpenAI client
 *
 * WARNING: Do NOT import this in client components!
 * This module reads process.env and will fail at build time in client code.
 */

import "server-only";
import OpenAI from "openai";

const key = process.env.OPENAI_API_KEY ?? null;

export const openai: OpenAI | null = key ? new OpenAI({ apiKey: key }) : null;
