/**
 * Simple test script for the /api/save-cleaned-cover-letter endpoint
 * 
 * This script sends a test cover letter with various elements that should be cleaned:
 * - Header with name, job title, contact info
 * - Date and company name
 * - Greeting and salutation
 * - Body content
 * 
 * It will display what was returned from the API.
 */

// Using global fetch (available in Node.js since v17.5.0)

// Sample letter with header, greeting, body, and closing
const testLetter = `new name test
CRM Analytics Analyst
vincentholm@gmail.com | LinkedIn
5/8/2025
Grubhub

Dear Hiring Manager,

With my strong background in CRM systems and analytics, I am excited to apply for the CRM Analytics Analyst position at Grubhub. My experience in leveraging customer data to drive business decisions and my proficiency in CRM platforms make me a well-qualified candidate for this role.

Throughout my career, I have developed expertise in analyzing customer data to identify trends, optimize marketing campaigns, and enhance customer experience. At my previous position, I implemented data-driven strategies that resulted in a 20% increase in customer retention and a 15% improvement in campaign conversion rates.

I am skilled in using various analytics tools and CRM systems, including Salesforce, Tableau, and SQL. My ability to translate complex data into actionable insights has consistently helped companies make informed business decisions.

I am particularly drawn to Grubhub's innovative approach to food delivery and your commitment to enhancing the customer experience through data analytics. I believe my skills and experience would allow me to make significant contributions to your team and help drive continued growth and success.

Thank you for considering my application. I look forward to the opportunity to discuss how my background and skills align with your needs.

Sincerely,
Vincent Holm`;

async function testEndpoint() {
  console.log("Testing /api/save-cleaned-cover-letter endpoint...");
  console.log("\nOriginal Letter:");
  console.log("--------------");
  console.log(testLetter);
  
  try {
    const response = await fetch('http://localhost:3000/api/save-cleaned-cover-letter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        optimizedLetter: testLetter,
        jobTitle: "CRM Analytics Analyst",
        companyName: "Grubhub",
        userEmail: "vincentholm@gmail.com"
      }),
    });
    
    const data = await response.json();
    
    console.log("\nCleaned Letter:");
    console.log("--------------");
    console.log(data.cleanedFinalBody);
    
    console.log("\nUsed Fallback?", data.usedFallback ? "Yes" : "No");
    
    // Check what was removed
    console.log("\nElements Removed:");
    console.log("- Header with name:", !data.cleanedFinalBody.includes("new name test") ? "✅" : "❌");
    console.log("- Job title:", !data.cleanedFinalBody.includes("CRM Analytics Analyst") ? "✅" : "❌");
    console.log("- Email:", !data.cleanedFinalBody.includes("vincentholm@gmail.com") ? "✅" : "❌");
    console.log("- LinkedIn:", !data.cleanedFinalBody.includes("LinkedIn") ? "✅" : "❌");
    console.log("- Date:", !data.cleanedFinalBody.includes("5/8/2025") ? "✅" : "❌");
    console.log("- Company name at top:", !data.cleanedFinalBody.includes("Grubhub\n\n") ? "✅" : "❌");
    console.log("- Greeting:", !data.cleanedFinalBody.includes("Dear Hiring Manager") ? "✅" : "❌");
    console.log("- Closing:", !data.cleanedFinalBody.includes("Sincerely") ? "✅" : "❌");
    console.log("- Name in signature:", !data.cleanedFinalBody.includes("Vincent Holm") ? "✅" : "❌");
    
  } catch (error) {
    console.error('Error testing endpoint:', error);
  }
}

testEndpoint();