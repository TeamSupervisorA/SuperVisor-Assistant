const geminiService = require('./geminiService');
const { compareAgainstSubmissionCorpus } = require('../utils/integritySimilarity');

const providerNoticeFor = (error) => {
  const message = String(error?.message || '');
  if (/RESOURCE_EXHAUSTED|quota|\b429\b/i.test(message)) {
    return 'The Google Gemini quota is currently exhausted, so this report covers the stored project corpus only. Ask an administrator to restore quota, then run the screen again for public-web evidence.';
  }
  if (/not configured|GEMINI_API_KEY/i.test(message)) {
    return 'Google Search grounding is not configured, so this report covers the stored project corpus only. An administrator can add GEMINI_API_KEY to enable public-web screening.';
  }
  return 'Google Search grounding was temporarily unavailable, so this report covers the stored project corpus only. Run it again later to add public-web evidence.';
};

const screenIntegrity = async ({ text, comparisonSubmissions = [] }) => {
  const internalMatches = compareAgainstSubmissionCorpus(text, comparisonSubmissions);
  let webResult = null;
  let providerNotice = '';

  try {
    webResult = await geminiService.checkPlagiarism(text);
  } catch (error) {
    if (/required|at least|too long/i.test(String(error?.message || ''))) throw error;
    providerNotice = providerNoticeFor(error);
  }

  const webMatches = (webResult?.matchedSources || []).map((source) => ({
    ...source,
    sourceType: 'public-web'
  }));
  const matchedSources = [...internalMatches, ...webMatches]
    .sort((left, right) => right.matchPercentage - left.matchPercentage)
    .slice(0, 20);
  const internalScore = internalMatches[0]?.matchPercentage || 0;
  const webScore = webResult?.overallSimilarity || 0;
  const coverage = ['Stored submissions in the selected project'];
  if (webResult) coverage.push('Selected public-web evidence from Google Search grounding');

  return {
    overallSimilarity: Math.max(internalScore, webScore),
    summary: webResult?.summary || (internalMatches.length
      ? 'The local comparison found overlapping word sequences in other stored submissions for this project. Review the listed submissions before drawing any conclusion.'
      : 'The local comparison did not find a substantial overlap with other stored submissions in this project. Public-web coverage was unavailable, and this is not proof of originality.'),
    matchedSources,
    sourcesSearched: webResult?.sourcesSearched || [],
    searchQueryCount: webResult?.searchQueryCount || 0,
    searchSuggestionsHtml: webResult?.searchSuggestionsHtml || '',
    checkedCharacterCount: webResult?.checkedCharacterCount || String(text || '').length,
    model: webResult?.model || '',
    method: webResult
      ? 'Project-corpus comparison + Gemini Google Search-grounded integrity screen'
      : 'Project-corpus eight-word sequence comparison',
    coverage,
    providerNotice,
    disclaimer: 'This is a similarity screen, not a plagiarism probability or misconduct determination. It cannot establish authorship or intent. A qualified reviewer must compare the source text, quotations, citations, templates, context, and institutional policy.'
  };
};

module.exports = { screenIntegrity };
