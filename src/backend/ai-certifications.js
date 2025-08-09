import { openai } from "./utils/openai-client";
export async function generateCertificationRecommendations(role, level, skills) {
    try {
        // Create a detailed prompt about the role
        const skillsString = skills.map((s) => `${s.name} (${s.level})`).join(", ");
        const systemPrompt = `You are a career advisor specializing in professional certifications and training programs.
    Provide highly specific certification recommendations for professionals based on their job roles and skill levels.`;
        const userPrompt = `Provide certification recommendations for a ${level} level ${role}.
    
    Their current skills include: ${skillsString}
    
    Return exactly 3-4 certifications formatted as a JSON array with the following properties per certification:
    - name: The full certification name (be specific, use real certification names)
    - provider: The organization offering the certification 
    - difficulty: One of ["beginner", "intermediate", "advanced"]
    - estimatedTimeToComplete: Time to prepare and obtain the certification (e.g., "2-3 months")
    - relevance: One of ["highly relevant", "relevant", "somewhat relevant"]
    
    Focus on real, recognized certifications that would be valuable for career advancement.`;
        // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" }
        });
        const jsonString = response.choices[0].message.content;
        if (!jsonString) {
            throw new Error("Failed to generate certification recommendations");
        }
        const parsedResults = JSON.parse(jsonString);
        if (Array.isArray(parsedResults.certifications)) {
            return parsedResults.certifications;
        }
        else if (Array.isArray(parsedResults)) {
            return parsedResults;
        }
        else {
            throw new Error("Unexpected response format from OpenAI");
        }
    }
    catch (error) {
        console.error("Error generating certification recommendations:", error);
        return [];
    }
}
