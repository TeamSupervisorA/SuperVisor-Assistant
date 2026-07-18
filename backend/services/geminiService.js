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

  const styles = [
    "Be highly structured, direct, and slightly formal.",
    "Use a very encouraging, mentoring tone, focusing on growth.",
    "Adopt a rigorous, deeply analytical perspective, probing for weaknesses.",
    "Be concise, bullet-point heavy, and extremely action-oriented.",
    "Use an inspiring, visionary tone that challenges the student to think bigger."
  ];
  const randomStyle = styles[Math.floor(Math.random() * styles.length)];

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      systemInstruction: `You are an expert academic supervisor. ${randomStyle} Always format your feedback clearly. Provide specific, actionable advice rather than generic statements. Never use the exact same phrasing for different submissions.`,
      temperature: 0.9
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

  const styles = [
    "Focus heavily on methodological soundness and logical flow.",
    "Focus on the novelty and impact of the proposed ideas.",
    "Adopt a devil's advocate persona, challenging the core assumptions.",
    "Be very pragmatic, focusing on the feasibility and timeline of the proposal.",
    "Use a highly academic, traditional review style, looking for scholarly grounding."
  ];
  const randomStyle = styles[Math.floor(Math.random() * styles.length)];

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      systemInstruction: `You are a senior academic reviewer. ${randomStyle} Your tone should be highly analytical and objective. Provide varied and dynamic structural elements (like bolding key terms, using bulleted lists), and never give the exact same generic feedback twice.`,
      temperature: 0.85
    }
  });

  return response.text;
};

exports.recommendNextTask = async (currentStatus, pastTasks) => {
  const ai = getClient();
  
  const prompt = `Based on the project's current status: "${currentStatus}" and the following past completed tasks: "${pastTasks.join(', ')}", recommend the absolute best logical next task for the student to tackle. 
Provide a brief, action-oriented task title and a concise but highly motivating explanation of why this step is critical right now. 
Return as a JSON object with 'taskTitle' and 'explanation'. Do not return markdown, just pure JSON.`;

  const styles = [
    "Be punchy, energetic, and highly motivating.",
    "Be calm, strategic, and focused on risk mitigation.",
    "Focus on quick wins to build momentum.",
    "Emphasize deep work and tackling the hardest problem next.",
    "Be extremely concise, just stating the facts and the most logical next step."
  ];
  const randomStyle = styles[Math.floor(Math.random() * styles.length)];

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      systemInstruction: `You are a world-class agile project manager for academic research. ${randomStyle} Your advice should be highly context-aware, fresh, and uniquely tailored to the student's progress to keep their momentum high. Do not repeat the same advice format.`,
      temperature: 0.9,
      responseMimeType: 'application/json'
    }
  });

  let responseText = response.text.trim();
  if (responseText.startsWith('```')) {
    responseText = responseText.replace(/^```(json)?/, '').replace(/```$/, '').trim();
  }
  return JSON.parse(responseText);
};
