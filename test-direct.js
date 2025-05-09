// Try accessing the endpoint through the API route directly
console.log("Testing direct API endpoint");

const testLetter = `new name test
CRM Analytics Analyst
vincentholm@gmail.com | LinkedIn
5/8/2025
Grubhub

Dear Hiring Manager,

With my strong background in CRM systems and analytics, I am excited to apply for the CRM Analytics Analyst position at Grubhub. 

Throughout my career, I have developed expertise in analyzing customer data to identify trends, optimize marketing campaigns, and enhance customer experience.

Sincerely,
Vincent Holm`;

// Use the direct API route with the corrected path
fetch('http://localhost:3000/api/save-cleaned-cover-letter', {
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
})
.then(res => {
  console.log("Status:", res.status);
  console.log("Headers:", [...res.headers.entries()]);
  return res.text();
})
.then(text => {
  console.log("Response:", text);
})
.catch(err => {
  console.error("Error:", err);
});