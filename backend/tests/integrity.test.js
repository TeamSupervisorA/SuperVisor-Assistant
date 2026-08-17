const test = require('node:test');
const assert = require('node:assert/strict');
const { integrityFingerprint, normalizeIntegrityText } = require('../utils/integrity');
const { compareAgainstSubmissionCorpus, shingles } = require('../utils/integritySimilarity');
const PlagiarismReport = require('../models/PlagiarismReport');

test('integrity fingerprints are stable across whitespace and line endings', () => {
  const left = 'First line\r\nSecond   line';
  const right = 'First line\nSecond line';
  assert.equal(normalizeIntegrityText(left), normalizeIntegrityText(right));
  assert.equal(integrityFingerprint(left), integrityFingerprint(right));
});

test('eight-word shingles do not report isolated common phrases', () => {
  assert.equal(shingles('one two three four five six seven').size, 0);
  const matches = compareAgainstSubmissionCorpus(
    'this research project uses a careful mixed methods evaluation with anonymous participants and transparent limitations',
    [{ _id: '000000000000000000000001', title: 'Different paper', content: 'this research project discusses a completely separate question using interviews' }]
  );
  assert.deepEqual(matches, []);
});

test('an exact stored-project duplicate is surfaced for human review', () => {
  const text = 'a reproducible research workflow records every dataset transformation and evaluation decision so another researcher can inspect the evidence and repeat the analysis';
  const matches = compareAgainstSubmissionCorpus(text, [
    { _id: '000000000000000000000001', title: 'Earlier draft', content: text }
  ]);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].matchPercentage, 100);
  assert.equal(matches[0].sourceType, 'project-corpus');
});

test('report validation rejects impossible similarity values and unsafe source types', async () => {
  const report = new PlagiarismReport({
    submission: '000000000000000000000001',
    project: '000000000000000000000002',
    overallSimilarity: 101,
    status: 'Completed',
    matchedSources: [{ sourceName: 'x', sourceType: 'untrusted', matchPercentage: 10 }]
  });
  await assert.rejects(report.validate());
});
