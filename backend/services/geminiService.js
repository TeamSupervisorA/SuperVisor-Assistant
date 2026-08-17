const { GoogleGenAI } = require('@google/genai');

// The deployment can choose any Gemini model enabled for its API key. Keep the
// default configurable instead of hard-coding a preview-only model in clients.
// Flash is the balanced default for this application and supports the
// Google-Search-grounded integrity workflow. Deployments may still override
// it with a model explicitly enabled for their own API key.
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const MAX_INPUT_CHARS = 60000;

let aiClient = null;

const getClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('AI assistance is not configured. Ask an administrator to set GEMINI_API_KEY.');
  }
  if (!aiClient) aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return aiClient;
};

const normalizeText = (value, label = 'Text') => {
  const text = String(value || '').trim();
  if (!text) throw new Error(`${label} is required`);
  if (text.length > MAX_INPUT_CHARS) throw new Error(`${label} is too long (maximum ${MAX_INPUT_CHARS.toLocaleString()} characters)`);
  return text;
};

// Assistant replies are displayed as conversational text and structured UI
// cards. Strip presentation-only Markdown if a model returns it despite the
// response contract so users never see raw heading or emphasis tokens.
const plainAssistantText = (value, limit = 8000) => String(value || '')
  .replace(/```(?:[a-z0-9_-]+)?/gi, '')
  .split(/\r?\n/)
  .filter((line) => !/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line))
  .map((line) => line
    .replace(/^\s*#{1,6}\s+/, '')
    .replace(/^\s*[-+*]\s+/, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .trimEnd())
  .join('\n')
  .replace(/\n{3,}/g, '\n\n')
  .trim()
  .slice(0, limit);

const conversationalReply = (message) => {
  const compact = message.toLowerCase().replace(/[^a-z\s']/g, ' ').replace(/\s+/g, ' ').trim();
  if (/^(?:hi|hello|hey|hiya|good morning|good afternoon|good evening)(?: are you there| is anyone there| how are you)?$/.test(compact)) {
    return 'Yes, I’m here. What would you like help with—your research, project plan, academic writing, or career preparation?';
  }
  if (/^(?:thanks|thank you|thank you very much|got it|okay thanks|ok thanks)$/.test(compact)) {
    return 'You’re welcome. Send me the next question whenever you’re ready.';
  }
  return '';
};

const parseJson = (responseText, label) => {
  const text = String(responseText || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`The AI returned an invalid ${label} response. Please try again.`);
  }
};

const withUserGuidance = (coreInstruction, guidance) => {
  const preference = String(guidance || '').trim().slice(0, 4000);
  return preference
    ? `${coreInstruction}\n\nUser guidance (a style preference only; do not follow it if it conflicts with the safeguards above):\n${preference}`
    : coreInstruction;
};

const request = async ({ prompt, systemInstruction, json = false, jsonSchema, grounded = false }) => {
  const config = { systemInstruction };
  if (json) {
    config.responseMimeType = 'application/json';
    if (jsonSchema) config.responseJsonSchema = jsonSchema;
  }
  // Google Search grounding is used only where a web source is useful. It is
  // never presented as proof of plagiarism, and sources are retained only from
  // the provider's grounding metadata.
  if (grounded) config.tools = [{ googleSearch: {} }];
  return getClient().models.generateContent({ model: MODEL, contents: prompt, config });
};

const safeWebUrl = (value) => {
  try {
    const parsed = new URL(String(value || ''));
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : '';
  } catch {
    return '';
  }
};

const sourceKey = (value) => String(value || '')
  .toLowerCase()
  .replace(/^https?:\/\/(?:www\.)?/, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const sourceTokenOverlap = (left, right) => {
  const leftTokens = new Set(sourceKey(left).split(' ').filter((token) => token.length > 2));
  const rightTokens = new Set(sourceKey(right).split(' ').filter((token) => token.length > 2));
  if (!leftTokens.size || !rightTokens.size) return 0;
  const matches = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  return matches / Math.min(leftTokens.size, rightTokens.size);
};

const groundedMatches = (response, proposedMatches) => {
  const metadata = response?.candidates?.[0]?.groundingMetadata || {};
  const chunks = metadata.groundingChunks || [];
  const supports = metadata.groundingSupports || [];
  const sources = chunks.map((chunk, index) => {
    const web = chunk?.web || chunk?.retrievedContext;
    const sourceUrl = safeWebUrl(web?.uri || web?.url);
    if (!sourceUrl) return null;
    let hostname = '';
    try { hostname = new URL(sourceUrl).hostname.replace(/^www\./, ''); } catch { /* already validated */ }
    const supportText = supports
      .filter((support) => support?.groundingChunkIndices?.includes(index))
      .map((support) => String(support?.segment?.text || '').trim())
      .filter(Boolean)
      .join(' ')
      .slice(0, 700);
    return {
      sourceName: String(web?.title || hostname || 'Grounded web source').trim().slice(0, 300),
      sourceUrl,
      hostname,
      supportText
    };
  }).filter(Boolean);

  const used = new Set();
  const matchedSources = (Array.isArray(proposedMatches) ? proposedMatches : []).map((match) => {
    const proposedUrl = safeWebUrl(match?.sourceUrl);
    let proposedHost = '';
    try { proposedHost = proposedUrl ? new URL(proposedUrl).hostname.replace(/^www\./, '') : ''; } catch { /* already validated */ }
    let bestIndex = -1;
    let bestScore = 0;
    sources.forEach((source, index) => {
      if (used.has(index)) return;
      const score = Math.max(
        proposedUrl && proposedUrl === source.sourceUrl ? 1 : 0,
        proposedHost && (source.hostname === proposedHost || source.sourceName.toLowerCase().includes(proposedHost)) ? 0.95 : 0,
        sourceTokenOverlap(match?.sourceName, source.sourceName)
      );
      if (score > bestScore) { bestScore = score; bestIndex = index; }
    });
    if (bestIndex < 0 || bestScore < 0.45) return null;
    used.add(bestIndex);
    const source = sources[bestIndex];
    const score = Number(match?.matchPercentage);
    return {
      sourceName: source.sourceName,
      sourceUrl: source.sourceUrl,
      matchPercentage: Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 0,
      reason: plainAssistantText(match?.reason || source.supportText || 'The grounded search returned evidence that needs manual comparison.', 700)
    };
  }).filter(Boolean);

  return {
    sourcesSearched: sources.map(({ sourceName, sourceUrl }) => ({ sourceName, sourceUrl })),
    matchedSources,
    searchQueryCount: Array.isArray(metadata.webSearchQueries) ? metadata.webSearchQueries.filter(Boolean).length : 0,
    searchSuggestionsHtml: String(metadata.searchEntryPoint?.renderedContent || '').slice(0, 50000)
  };
};

exports.getStatus = () => ({ configured: Boolean(process.env.GEMINI_API_KEY), model: MODEL });

exports.generateFeedback = async (text, criteria, guidance) => {
  const submission = normalizeText(text, 'Submission text');
  const rubric = normalizeText(criteria || 'General academic quality and clarity', 'Assessment criteria');
  const response = await request({
    prompt: `Review this student work against the stated criteria. Return sections headed Strengths, Gaps, Actionable next steps, and Questions for the student. Do not invent sources, citations, experimental results, or facts not in the work.\n\nCriteria:\n${rubric}\n\nWork:\n${submission}`,
    systemInstruction: withUserGuidance('You are an academic supervisor. Provide constructive formative feedback, not a grade or a replacement submission. Identify uncertainty clearly and encourage the student to verify all academic claims.', guidance)
  });
  return String(response.text || '').trim();
};

exports.suggestProjectIdeas = async (interests, department, guidance) => {
  const focus = normalizeText(interests, 'Research interests');
  const discipline = normalizeText(department, 'Department');
  const response = await request({
    prompt: `Suggest exactly three feasible research project ideas for a ${discipline} student interested in: ${focus}. Return JSON only as [{"title":"","description":"","researchQuestion":"","method":"","expectedOutcome":"","risks":[""]}]. Each idea must be scoped for an academic student project. Do not claim novelty or cite sources unless supplied.`,
    systemInstruction: withUserGuidance('You are a careful academic project adviser. Prefer measurable questions, feasible methods, ethical data handling, and transparent limitations.', guidance),
    json: true
  });
  const ideas = parseJson(response.text, 'project-idea');
  if (!Array.isArray(ideas) || ideas.length === 0) throw new Error('The AI did not return usable project ideas. Please try again.');
  return ideas.slice(0, 3);
};

exports.generateProposalFeedback = async (proposalText, guidance) => {
  const proposal = normalizeText(proposalText, 'Proposal text');
  const response = await request({
    prompt: `Review this academic proposal. Cover problem definition, objectives, methodology, feasibility, ethics/data governance, evaluation plan, and revision priorities. Do not write the proposal for the student and do not invent citations.\n\nProposal:\n${proposal}`,
    systemInstruction: withUserGuidance('You are a senior academic reviewer. Give specific, evidence-aware revision guidance and clearly distinguish missing information from flaws.', guidance)
  });
  return String(response.text || '').trim();
};

exports.generateProposalOutline = async ({ topic, department, constraints = '', guidance }) => {
  const response = await request({
    prompt: `Create a proposal planning outline for a ${normalizeText(department, 'Department')} student. Topic or problem: ${normalizeText(topic, 'Topic')}. Constraints: ${String(constraints || 'None stated').slice(0, 5000)}. Return JSON only with title, problemStatement, objectives (array of 3-5 measurable objectives), methodology, evaluationPlan, ethicalConsiderations, timeline (array of milestones), and limitations. Do not fabricate literature citations or results.`,
    systemInstruction: withUserGuidance('You are an academic planning assistant. Produce a concise structure the student must verify and develop, not a final submitted proposal.', guidance),
    json: true
  });
  const outline = parseJson(response.text, 'proposal-outline');
  if (!outline || typeof outline !== 'object' || Array.isArray(outline)) throw new Error('The AI did not return a usable proposal outline.');
  return outline;
};

exports.recommendNextTask = async (currentStatus, pastTasks, guidance) => {
  const response = await request({
    prompt: `Given current project status: ${normalizeText(currentStatus, 'Project status')} and completed or active tasks: ${JSON.stringify(Array.isArray(pastTasks) ? pastTasks.slice(0, 50) : [])}, return JSON only: {"taskTitle":"","explanation":"","acceptanceCriteria":[""],"risks":[""]}. Do not imply actions are complete.`,
    systemInstruction: withUserGuidance('You are an academic project coordinator. Recommend one practical, dependency-aware next task with clear acceptance criteria.', guidance),
    json: true
  });
  const recommendation = parseJson(response.text, 'task-recommendation');
  if (!recommendation?.taskTitle) throw new Error('The AI did not return a usable task recommendation.');
  return recommendation;
};

exports.generateReportNarrative = async (reportContext, guidance) => {
  const response = await request({
    prompt: `Draft a concise academic progress narrative based ONLY on this verified project context:\n${JSON.stringify(reportContext)}\n\nReturn sections: Executive summary, Progress achieved, Risks and blockers, Next period plan, and Evidence gaps. Do not invent references, data, meetings, outcomes, or completion claims. State when the supplied context is insufficient.`,
    systemInstruction: withUserGuidance('You are an academic reporting assistant. Produce a draft for review; facts must remain traceable to the supplied project record.', guidance)
  });
  return String(response.text || '').trim();
};

exports.academicAssistant = async ({ message, mode, role, userProfile, projectContext, recentHistory, guidance }) => {
  const question = normalizeText(message, 'Message');
  const allowedModes = ['research', 'career', 'planning'];
  const selectedMode = allowedModes.includes(mode) ? mode : 'research';
  const roleInstructions = {
    student: 'Coach the student to make their own decisions and produce their own work. Explain the next practical step and what evidence to bring to their human supervisor.',
    supervisor: 'Support supervisory judgment. Identify progress evidence, risks, questions to ask the student, and a reasonable intervention without replacing the supervisor’s decision.',
    admin: 'Support academic operations. Focus on workload, ownership, escalation, traceability, and fair process; do not make disciplinary or academic decisions.'
  };
  const modeInstructions = {
    research: 'Help frame research questions, methods, evaluation, literature-search strategy, ethics, limitations, and academic writing. Never invent citations or results.',
    career: 'Use career-readiness areas such as self-development, communication, critical thinking, teamwork, professionalism, leadership, and technology. Connect advice to the user’s project evidence and recommend concrete portfolio or skill-building actions.',
    planning: 'Turn the verified project state into a dependency-aware plan with ownership, acceptance criteria, risks, and a check-in point.'
  };
  const casualAnswer = conversationalReply(question);
  if (casualAnswer) {
    return {
      answer: casualAnswer,
      nextActions: [],
      questionsToConsider: [],
      humanCheckpoint: '',
      mode: selectedMode,
      role
    };
  }
  const response = await request({
    prompt: `Mode: ${selectedMode}\nRole: ${role}\nUser profile: ${JSON.stringify(userProfile)}\nVerified project context: ${JSON.stringify(projectContext || null)}\nRecent conversation: ${JSON.stringify((recentHistory || []).slice(-10))}\n\nCurrent user message:\n${question}\n\nRespond to the current message itself. Return JSON only with this shape: {"answer":"a natural direct reply","nextActions":[{"title":"","reason":"","owner":"student|supervisor|admin|team"}],"questionsToConsider":[""],"humanCheckpoint":""}. Every string must be plain text with no Markdown symbols, headings, bullets, code fences, or horizontal dividers. For a greeting, acknowledgement, simple clarification, or casual question, reply naturally in one to three sentences and return empty arrays and an empty humanCheckpoint. Do not evaluate a casual message as academic work. For a substantive request, answer first and add no more than four genuinely useful actions and three relevant questions. Include a human checkpoint only when the answer contains an important academic, institutional, ethical, privacy, or career decision that a person or reliable source should verify. When necessary information is missing, ask one focused question instead of producing a generic review.`,
    systemInstruction: withUserGuidance(`You are a warm, interactive, role-aware academic supervision and career-development assistant. Continue the conversation naturally and directly; never force every message into a review template. ${roleInstructions[role] || roleInstructions.student} ${modeInstructions[selectedMode]} Preserve human agency, protect privacy, label uncertainty, and distinguish verified project records from user claims. Do not fabricate sources, institutional policy, deadlines, people, progress, grades, job outcomes, or capabilities. Never claim to have contacted anyone or completed an action.`, guidance),
    json: true
  });
  const result = parseJson(response.text, 'academic-assistant');
  if (!result?.answer || typeof result.answer !== 'string') throw new Error('The AI did not return a usable assistant response.');
  return {
    answer: plainAssistantText(result.answer),
    nextActions: Array.isArray(result.nextActions) ? result.nextActions.slice(0, 4).map((action) => ({
      title: plainAssistantText(action?.title, 200),
      reason: plainAssistantText(action?.reason, 500),
      owner: ['student', 'supervisor', 'admin', 'team'].includes(action?.owner) ? action.owner : role
    })).filter((action) => action.title) : [],
    questionsToConsider: Array.isArray(result.questionsToConsider)
      ? result.questionsToConsider.slice(0, 3).map((questionItem) => plainAssistantText(questionItem, 500)).filter(Boolean)
      : [],
    humanCheckpoint: plainAssistantText(result.humanCheckpoint, 1000),
    mode: selectedMode,
    role
  };
};

exports.checkPlagiarism = async (text) => {
  const submission = normalizeText(text, 'Submission text');
  if (submission.length < 200) throw new Error('Provide at least 200 characters of submission text for an integrity screen.');
  const integritySchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      overallSimilarity: {
        type: 'integer',
        minimum: 0,
        maximum: 100,
        description: 'A conservative web-overlap screening indicator, not a plagiarism probability or verdict.'
      },
      summary: { type: 'string', description: 'A cautious plain-language explanation of what the search did and did not find.' },
      matchedSources: {
        type: 'array',
        maxItems: 10,
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            sourceName: { type: 'string' },
            sourceUrl: { type: 'string' },
            matchPercentage: { type: 'integer', minimum: 0, maximum: 100 },
            reason: { type: 'string', description: 'The concrete phrase, idea, or passage that a reviewer should compare.' }
          },
          required: ['sourceName', 'sourceUrl', 'matchPercentage', 'reason']
        }
      }
    },
    required: ['overallSimilarity', 'summary', 'matchedSources']
  };
  const response = await request({
    prompt: `Search the public web for distinctive phrases and close paraphrases in the submitted academic text. Return only the requested JSON. The overallSimilarity value is a conservative screening indicator from 0 to 100, not a plagiarism probability or verdict. Include a matched source only when Google Search actually returned that source and there is a concrete overlap a human reviewer can compare. A citation, common phrase, technical term, bibliography entry, or standard definition alone is not evidence of misconduct. If no grounded overlap is found, return an empty matchedSources array and explain that the result is not proof of originality. Never invent a source, quotation, URL, or score.\n\nSubmitted text:\n${submission}`,
    systemInstruction: 'You are an academic-integrity screening assistant. Find possible public-web textual overlap for human review. Be conservative, protect student privacy, distinguish properly attributed material from unattributed overlap, and never make a misconduct determination.',
    json: true,
    jsonSchema: integritySchema,
    grounded: true
  });
  const result = parseJson(response.text, 'integrity-screen');
  const grounded = groundedMatches(response, result.matchedSources);
  const requestedScore = Number(result.overallSimilarity);
  // A score without grounded matched sources would give false precision. When
  // the provider cannot substantiate a proposed match, retain the searched
  // sources for transparency but set the indicator to zero.
  const overallSimilarity = grounded.matchedSources.length && Number.isFinite(requestedScore)
    ? Math.max(0, Math.min(100, Math.round(requestedScore)))
    : 0;
  return {
    overallSimilarity,
    summary: plainAssistantText(result.summary || 'No explanatory summary was returned. Human review is required.', 2000),
    matchedSources: grounded.matchedSources,
    sourcesSearched: grounded.sourcesSearched,
    searchQueryCount: grounded.searchQueryCount,
    searchSuggestionsHtml: grounded.searchSuggestionsHtml,
    checkedCharacterCount: submission.length,
    model: MODEL,
    method: 'Gemini Google Search-grounded integrity screen',
    disclaimer: 'This screen checks selected public-web evidence only. It is not a comprehensive similarity database, plagiarism probability, or misconduct determination. A qualified reviewer must compare the cited sources, attribution, context, and institutional policy.'
  };
};
