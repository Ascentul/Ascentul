import { Request, Response, NextFunction } from "express";
import { z } from "zod";

/**
 * Middleware factory for validating request body with Zod schemas
 * @param schema Zod schema to validate against
 * @returns Express middleware function
 */
export function validateRequest<T extends z.ZodType>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate and transform the request body
      const validData = schema.parse(req.body);
      
      // Replace the request body with the validated data
      req.body = validData;
      
      // Continue to the next middleware/route handler
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Format and return Zod validation errors
        return res.status(400).json({
          message: "Validation failed",
          errors: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        });
      }
      
      // Handle other types of errors
      console.error("Request validation error:", error);
      return res.status(500).json({ message: "Internal server error during validation" });
    }
  };
}