const cleanText = (value) => String(value || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
const safeExternalUrl = (value) => {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
};

const toCrossrefItem = (item) => ({
  id: item.DOI || item.URL || `${item.title?.[0]}-${item.published?.['date-parts']?.[0]?.[0]}`,
  source: 'Crossref',
  title: cleanText(item.title?.[0]) || 'Untitled work',
  authors: (item.author || []).slice(0, 4).map((author) => [author.given, author.family].filter(Boolean).join(' ')).filter(Boolean),
  year: item.published?.['date-parts']?.[0]?.[0] || item.issued?.['date-parts']?.[0]?.[0] || '',
  venue: cleanText(item['container-title']?.[0]),
  doi: item.DOI || '',
  url: safeExternalUrl(item.URL) || (item.DOI ? `https://doi.org/${item.DOI}` : ''),
  citedBy: item['is-referenced-by-count'] || 0,
  abstract: cleanText(item.abstract)
});

const toOpenAlexItem = (item) => ({
  id: item.id,
  source: 'OpenAlex',
  title: item.title || item.display_name || 'Untitled work',
  authors: (item.authorships || []).slice(0, 4).map((author) => author.author?.display_name).filter(Boolean),
  year: item.publication_year || '',
  venue: item.primary_location?.source?.display_name || '',
  doi: (item.doi || '').replace(/^https?:\/\/doi.org\//, ''),
  url: safeExternalUrl(item.doi) || safeExternalUrl(item.primary_location?.landing_page_url) || safeExternalUrl(item.id),
  citedBy: item.cited_by_count || 0,
  abstract: ''
});

exports.searchWorks = async (req, res) => {
  const query = String(req.query.q || '').trim();
  if (query.length < 2) return res.status(422).json({ success: false, error: 'Use at least 2 characters to search research literature' });
  if (query.length > 160) return res.status(422).json({ success: false, error: 'Search query is too long' });

  const encoded = encodeURIComponent(query);
  try {
    const [openAlexResult, crossrefResult] = await Promise.allSettled([
      fetch(`https://api.openalex.org/works?search=${encoded}&per-page=6`, { headers: { 'User-Agent': 'AcademicAI/1.0 (research workspace)' } }),
      fetch(`https://api.crossref.org/works?query.bibliographic=${encoded}&rows=6&select=DOI,title,author,published,issued,container-title,URL,is-referenced-by-count,abstract`, { headers: { 'User-Agent': 'AcademicAI/1.0 (research workspace)' } })
    ]);

    const results = [];
    if (openAlexResult.status === 'fulfilled' && openAlexResult.value.ok) {
      const json = await openAlexResult.value.json();
      results.push(...(json.results || []).map(toOpenAlexItem));
    }
    if (crossrefResult.status === 'fulfilled' && crossrefResult.value.ok) {
      const json = await crossrefResult.value.json();
      results.push(...(json.message?.items || []).map(toCrossrefItem));
    }
    if (!results.length) return res.status(502).json({ success: false, error: 'Research providers are temporarily unavailable. Please try again shortly.' });
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(502).json({ success: false, error: 'Unable to search research literature right now' });
  }
};
