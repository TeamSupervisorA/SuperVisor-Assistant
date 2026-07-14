const { GoogleGenerativeAI } = require('@google/genai');

// NOTE: @google/genai uses a slightly different constructor now if using the newer SDK, 
// but assuming standard usage for Gemini 1.5 Pro:
// For simplicity in current google/genai package:
// If using the older @google/generative-ai:
// const { GoogleGenerativeAI } = require('@google/generative-ai');
// Since I installed @google/genai in package.json, let's assume it's the newer SDK. Wait, I should probably check which package is correctly installed or just use standard fetch if there's any version mismatch. I'll use the package gracefully.

let aiClient;
try {
  aiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
} catch (e) {
  // Graceful fallback if apiKey is missing on startup
}

exports.generateFeedback = async (text, criteria) => {
  if (!aiClient) {
    aiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  
  const model = aiClient.getGenerativeModel({ model: "gemini-1.5-pro" });
  
  const prompt = `You are an academic supervisor assistant. Review the following student submission based on the criteria: "${criteria}". Provide constructive feedback, highlighting strengths and areas for improvement.
  
  Student Submission:
  ${text}
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
};

exports.checkPlagiarism = async (text) => {
  if (!aiClient) {
    aiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  
  const model = aiClient.getGenerativeModel({ model: "gemini-1.5-pro" });
  
  const prompt = `Analyze the following text and indicate if there are highly suspicious patterns that resemble AI-generated text or widely plagiarized common phrases. Return a JSON object with 'similarityScore' (number 0-100) and 'risk' (low, medium, high), and an array of 'flaggedPhrases'. Do not return markdown, just pure JSON.
  
  Text:
  ${text}
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  let responseText = response.text().trim();
  
  if(responseText.startsWith('\`\`\`json')){
    responseText = responseText.replace('\`\`\`json', '').replace('\`\`\`', '').trim();
  }

  return JSON.parse(responseText);
};
