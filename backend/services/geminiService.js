const { GoogleGenAI } = require('@google/genai');

const MODEL = 'gemini-2.5-flash';

let aiClient = null;

const getClient = () => {
  if (!aiClient) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
};

exports.generateFeedback = async (text, criteria) => {
  const ai = getClient();

  const prompt = `You are an academic supervisor assistant. Review the following student submission based on the criteria: "${criteria}". Provide constructive feedback, highlighting strengths and areas for improvement.

Student Submission:
${text}
`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt
  });

  return response.text;
};

exports.checkPlagiarism = async (text) => {
  const ai = getClient();

  const prompt = `Analyze the following text and indicate if there are highly suspicious patterns that resemble AI-generated text or widely plagiarized common phrases. Return a JSON object with 'similarityScore' (number 0-100), 'risk' (low, medium, high), and an array of 'flaggedPhrases'. Do not return markdown, just pure JSON.

Text:
${text}
`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      responseMimeType: 'application/json'
    }
  });

  let responseText = response.text.trim();

  // Strip markdown code fences if the model added them anyway
  if (responseText.startsWith('```')) {
    responseText = responseText.replace(/^```(json)?/, '').replace(/```$/, '').trim();
  }

  return JSON.parse(responseText);
};
