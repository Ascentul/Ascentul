// filepath: /Users/andrew/dev/Ascentul/src/backend/career-path.ts
import { Express, Request, Response } from "express"
import { storage } from "./storage"
import { openai } from "./utils/openai-client"

// Session type declaration is now centralized in index.ts

if (!process.env.OPENAI_API_KEY) {

    if (process.env.NODE_ENV === "development") {

}
