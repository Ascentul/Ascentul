// Simple test script using console.log to capture API response
console.log("Starting API test...");
const url = "http://localhost:3000/api/save-cleaned-cover-letter";
const data = {
  optimizedLetter: `new name test
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
Vincent Holm`,
  jobTitle: "CRM Analytics Analyst",
  companyName: "Grubhub",
  userEmail: "vincentholm@gmail.com"
};

// Log request
console.log("Sending request to:", url);
console.log("With data:", JSON.stringify(data, null, 2));

fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data),
})
.then(response => {
  // Log raw response
  console.log("Response status:", response.status);
  console.log("Response headers:", JSON.stringify([...response.headers.entries()], null, 2));
  
  // Get the raw text first
  return response.text().then(text => {
    console.log("Raw response text:", text);
    
    // Try to parse as JSON if possible
    try {
      const json = JSON.parse(text);
      console.log("Parsed JSON response:", JSON.stringify(json, null, 2));
      
      // If we got the cleanedFinalBody, check what was removed
      if (json.cleanedFinalBody) {
        console.log("\nElements Removed:");
        console.log("- Header with name:", !json.cleanedFinalBody.includes("new name test") ? "✅" : "❌");
        console.log("- Job title:", !json.cleanedFinalBody.includes("CRM Analytics Analyst") ? "✅" : "❌");
        console.log("- Email:", !json.cleanedFinalBody.includes("vincentholm@gmail.com") ? "✅" : "❌");
        console.log("- LinkedIn:", !json.cleanedFinalBody.includes("LinkedIn") ? "✅" : "❌");
        console.log("- Date:", !json.cleanedFinalBody.includes("5/8/2025") ? "✅" : "❌");
        console.log("- Company name at top:", !json.cleanedFinalBody.includes("Grubhub\n\n") ? "✅" : "❌");
        console.log("- Greeting:", !json.cleanedFinalBody.includes("Dear Hiring Manager") ? "✅" : "❌");
        console.log("- Closing:", !json.cleanedFinalBody.includes("Sincerely") ? "✅" : "❌");
        console.log("- Name in signature:", !json.cleanedFinalBody.includes("Vincent Holm") ? "✅" : "❌");
      }
    } catch (e) {
      console.log("Failed to parse response as JSON:", e.message);
    }
  });
})
.catch(error => {
  console.error("Fetch error:", error);
});