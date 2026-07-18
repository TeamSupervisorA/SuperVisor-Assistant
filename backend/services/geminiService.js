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

  const prompt = `Review the following student submission based on these criteria: "${criteria}". 
Please provide a highly structured, constructive, and nuanced feedback report. 

Student Submission:
${text}`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      systemInstruction: "You are an expert academic supervisor with a supportive, mentoring, yet rigorous tone. Always format your feedback with clear headings, bullet points for readability, and provide specific, actionable advice rather than generic statements. Vary your vocabulary and phrasing to avoid sounding robotic or repetitive.",
      temperature: 0.75
    }
  });

  return response.text;
};

exports.checkPlagiarism = async (text) => {
  const ai = getClient();

  const prompt = `Analyze the following text and indicate if there are highly suspicious patterns that resemble AI-generated text or widely plagiarized common phrases. Return a JSON object with 'overallSimilarity' (number 0-100) and an array of 'matchedSources' (each with 'sourceName', 'sourceUrl' and 'matchPercentage'). If none, return empty array. Do not return markdown, just pure JSON.

Text:
${text}`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      systemInstruction: "You are an advanced academic integrity AI. Perform a rigorous linguistic analysis to detect anomalies, AI signatures, or matching patterns. Be highly objective.",
      temperature: 0.2, // Lower temperature for more deterministic analysis
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
  
  const prompt = `Based on a student's interests: "${interests}" and their department: "${department}", suggest 3 highly innovative, cutting-edge research project ideas. 
Return a JSON array of objects, where each object has a 'title' (catchy and academic) and a 'description' (detailed, engaging, and outlining the potential impact). Do not return markdown, just pure JSON.`;
  
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      systemInstruction: "You are a visionary academic advisor known for thinking outside the box. Your goal is to inspire students with unique, interdisciplinary, and highly engaging project ideas that push the boundaries of their field. Use varied, inspiring language and avoid clichés.",
      temperature: 0.9, // Higher temperature for maximum creativity
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
  
  const prompt = `Evaluate the feasibility, clarity, and academic merit of the following academic project proposal. 
Provide a comprehensive, structured critique that highlights strong points and meticulously breaks down areas needing refinement.

Proposal:
${proposalText}`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      systemInstruction: "You are a senior academic reviewer. Your tone should be highly analytical, objective, and deeply insightful. Use professional academic language, provide varied and dynamic structural elements (like bolding key terms, using bulleted lists), and never give the exact same generic feedback twice.",
      temperature: 0.7
    }
  });

  return response.text;
};

exports.recommendNextTask = async (currentStatus, pastTasks) => {
  const ai = getClient();
  
  const prompt = `Based on the project's current status: "${currentStatus}" and the following past completed tasks: "${pastTasks.join(', ')}", recommend the absolute best logical next task for the student to tackle. 
Provide a brief, action-oriented task title and a concise but highly motivating explanation of why this step is critical right now. 
Return as a JSON object with 'taskTitle' and 'explanation'. Do not return markdown, just pure JSON.`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      systemInstruction: "You are a world-class agile project manager for academic research. You are extremely pragmatic, strategic, and motivating. Your advice should be highly context-aware, fresh, and uniquely tailored to the student's progress to keep their momentum high.",
      temperature: 0.8,
      responseMimeType: 'application/json'
    }
  });

  let responseText = response.text.trim();
  if (responseText.startsWith('```')) {
    responseText = responseText.replace(/^```(json)?/, '').replace(/```$/, '').trim();
  }
  return JSON.parse(responseText);
};
