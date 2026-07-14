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

exports.suggestProjectIdeas = async (interests, department) => {
  const ai = getClient();
  const prompt = `You are an academic advisor. Based on a student's interests: "${interests}" and their department: "${department}", suggest 3 innovative research project ideas. Return a JSON array of objects, where each object has a 'title' and 'description'. Do not return markdown, just pure JSON.`;
  
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      responseMimeType: 'application/json'
    }
  });

  let responseText = response.text.trim();
  if (responseText.startsWith('```')) {
    responseText = responseText.replace(/^```(json)?/, '').replace(/```$/, '').trim();
  }
  return JSON.parse(responseText);
};

exports.generateProposalFeedback = async (proposalText) => {
  const ai = getClient();
  const prompt = `Review the following academic project proposal. Evaluate its feasibility, clarity, and academic merit. Provide structured feedback.

Proposal:
${proposalText}
`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt
  });

  return response.text;
};

exports.recommendNextTask = async (currentStatus, pastTasks) => {
  const ai = getClient();
  const prompt = `You are an academic project manager AI. Based on the project's current status: "${currentStatus}" and the following past completed tasks: "${pastTasks.join(', ')}", recommend the logical next task the student should focus on to keep the project on track. Provide a brief task title and a short explanation. Return as a JSON object with 'taskTitle' and 'explanation'. Do not return markdown, just pure JSON.`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      responseMimeType: 'application/json'
    }
  });

  let responseText = response.text.trim();
  if (responseText.startsWith('```')) {
    responseText = responseText.replace(/^```(json)?/, '').replace(/```$/, '').trim();
  }
  return JSON.parse(responseText);
};
