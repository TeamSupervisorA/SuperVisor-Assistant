const WORD_SHINGLE_SIZE = 8;

const words = (value) => String(value || '')
  .toLocaleLowerCase('en')
  .match(/[\p{L}\p{N}]+/gu) || [];

const shingles = (value, size = WORD_SHINGLE_SIZE) => {
  const tokens = words(value);
  if (tokens.length < size) return new Set();
  const result = new Set();
  for (let index = 0; index <= tokens.length - size; index += 1) {
    result.add(tokens.slice(index, index + size).join(' '));
  }
  return result;
};

const compareAgainstSubmissionCorpus = (targetText, submissions = []) => {
  const targetShingles = shingles(targetText);
  if (!targetShingles.size) return [];

  return submissions.map((submission) => {
    const sourceShingles = shingles(submission.content);
    if (!sourceShingles.size) return null;
    let shared = 0;
    targetShingles.forEach((shingle) => {
      if (sourceShingles.has(shingle)) shared += 1;
    });
    const score = Math.round((shared / targetShingles.size) * 100);
    // Two matching eight-word sequences filters isolated common phrases while
    // still surfacing meaningful copied passages in the minimum-size input.
    if (shared < 2 || score < 2) return null;
    return {
      sourceName: `Project submission: ${String(submission.title || 'Untitled submission').slice(0, 240)}`,
      sourceUrl: '',
      sourceType: 'project-corpus',
      sourceSubmission: submission._id,
      matchPercentage: Math.max(0, Math.min(100, score)),
      reason: `Found ${shared.toLocaleString()} shared ${WORD_SHINGLE_SIZE}-word sequence${shared === 1 ? '' : 's'} in the stored project text. Compare both submissions to determine whether the overlap is quoted, cited, templated, or requires follow-up.`
    };
  }).filter(Boolean).sort((left, right) => right.matchPercentage - left.matchPercentage).slice(0, 10);
};

module.exports = { compareAgainstSubmissionCorpus, shingles, WORD_SHINGLE_SIZE };
