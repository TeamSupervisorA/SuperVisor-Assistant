import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { apiFetch } from '../lib/api';
import { useAuth } from '../components/AuthContext';

// Keep Monaco fully inside the Vite bundle. The default CDN loader can remain
// on "Loading…" when a production Content-Security-Policy blocks injected
// third-party scripts.
loader.config({ monaco });

const paperStarter = `\\documentclass[11pt]{article}
\\usepackage[margin=1in]{geometry}
\\usepackage{graphicx}
\\usepackage{hyperref}
\\title{Working paper title}
\\author{Author name}
\\date{\\today}

\\begin{document}
\\maketitle

\\begin{abstract}
Write a concise abstract: problem, method, results, and contribution.
\\end{abstract}

\\section{Introduction}
State the research problem, why it matters, and your contribution.

\\section{Methodology}
Describe the design, data, and analysis plan.

\\section{Results}
Add evidence, figures, and interpretation here.

\\section{Conclusion}
Summarise the contribution and next steps.

\\bibliographystyle{plain}
\\bibliography{references}
\\end{document}`;

const codeStarter = `// Research implementation notebook\n// Keep experiments reproducible: document inputs, outputs, and assumptions.\n\nfunction main() {\n  console.log('Start your research implementation here');\n}\n\nmain();`;

const languageFor = (document) => document?.kind === 'paper' ? 'latex' : (document?.language || 'javascript');

const latexSections = (content = '') => [...content.matchAll(/\\(?:sub)*section\*?\{([^}]+)\}/g)].map((match) => match[1]);

const citationKey = (work) => {
  const surname = (work.authors?.[0] || 'source').split(' ').at(-1).replace(/[^a-z0-9]/gi, '').toLowerCase();
  const titleWord = (work.title || 'work').split(/\s+/)[0].replace(/[^a-z0-9]/gi, '').toLowerCase();
  return `${surname}${work.year || ''}${titleWord}`;
};

const bibtexFor = (work) => {
  const key = citationKey(work);
  return `@article{${key},\n  title = {${work.title}},\n  author = {${(work.authors || []).join(' and ')}},\n  year = {${work.year || 'n.d.'}},\n  journal = {${work.venue || 'Unknown venue'}},\n  doi = {${work.doi || ''}},\n  url = {${work.url || ''}}\n}`;
};

const relativeTime = (date) => {
  if (!date) return 'Not saved yet';
  const minutes = Math.round((Date.now() - new Date(date).getTime()) / 60000);
  if (minutes < 1) return 'Saved just now';
  if (minutes < 60) return `Saved ${minutes}m ago`;
  return `Saved ${new Date(date).toLocaleDateString()}`;
};

const EmptyProject = ({ workspace = 'research' }) => (
  <div className="min-h-[calc(100vh-64px)] grid place-items-center bg-background p-6">
    <div className="max-w-lg rounded-[28px] border border-outline-variant/30 bg-surface p-10 text-center shadow-[0_24px_80px_rgba(25,32,70,.08)]">
      <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary"><span className="material-symbols-outlined text-[30px]">folder_open</span></div>
      <h1 className="text-2xl font-extrabold text-on-surface">Choose a project to begin</h1>
      <p className="mt-3 leading-relaxed text-secondary">Choose a project to open its {workspace} workspace.</p>
    </div>
  </div>
);

export const ResearchStudio = ({ workspace = 'research' }) => {
  const { activeProject } = useAuth();
  const isPaperWorkspace = workspace === 'paper';
  const isCodeWorkspace = workspace === 'code';
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [loading, setLoading] = useState(Boolean(activeProject));
  const [status, setStatus] = useState('');
  const [dirty, setDirty] = useState(false);
  const [literatureQuery, setLiteratureQuery] = useState('');
  const [literature, setLiterature] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [utilityPanel, setUtilityPanel] = useState('');
  const [splitRatio, setSplitRatio] = useState(50);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimer = useRef(null);
  const selectedDocumentRef = useRef(null);

  const loadDocuments = useCallback(async (keepId) => {
    if (!activeProject?._id) return;
    setLoading(true);
    try {
      const result = await apiFetch(`/api/workspace/projects/${activeProject._id}/documents`);
      const nextDocuments = (result.data || []).filter((item) => !isPaperWorkspace && !isCodeWorkspace || (isPaperWorkspace ? item.kind === 'paper' : item.kind === 'code'));
      setDocuments(nextDocuments);
      const preferred = nextDocuments.find((item) => item._id === keepId) || nextDocuments[0];
      if (preferred) {
        const detail = await apiFetch(`/api/workspace/documents/${preferred._id}`);
        setSelectedDocument(detail.data);
      } else {
        setSelectedDocument(null);
      }
    } catch (requestError) {
      setError(requestError.message || 'Unable to load the research workspace.');
    } finally {
      setLoading(false);
    }
  }, [activeProject?._id, isCodeWorkspace, isPaperWorkspace]);

  useEffect(() => {
    setDocuments([]);
    setSelectedDocument(null);
    setDirty(false);
    setError('');
    if (activeProject?._id) loadDocuments();
    else setLoading(false);
  }, [activeProject?._id, loadDocuments]);

  useEffect(() => () => clearTimeout(saveTimer.current), []);
  useEffect(() => { selectedDocumentRef.current = selectedDocument; }, [selectedDocument]);

  const selectDocument = async (documentId) => {
    if (!documentId || documentId === selectedDocument?._id) return;
    try {
      setStatus('Loading document…');
      const result = await apiFetch(`/api/workspace/documents/${documentId}`);
      setSelectedDocument(result.data);
      setDirty(false);
      setStatus('');
    } catch (requestError) {
      setError(requestError.message);
      setStatus('');
    }
  };

  const saveDocument = useCallback(async (documentToSave, silent = false) => {
    if (!documentToSave?._id) return;
    try {
      if (!silent) setStatus('Saving…');
      setIsSaving(true);
      const result = await apiFetch(`/api/workspace/documents/${documentToSave._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: documentToSave.title,
          kind: documentToSave.kind,
          language: documentToSave.language,
          content: documentToSave.content,
          overleafUrl: documentToSave.overleafUrl || ''
        })
      });
      setDocuments((current) => current.map((item) => item._id === result.data._id ? { ...item, ...result.data } : item));
      const currentDocument = selectedDocumentRef.current;
      const changedWhileSaving = currentDocument?._id === result.data._id && (
        currentDocument.content !== documentToSave.content ||
        currentDocument.title !== documentToSave.title ||
        currentDocument.overleafUrl !== documentToSave.overleafUrl
      );
      if (currentDocument?._id === result.data._id && !changedWhileSaving) {
        setSelectedDocument(result.data);
        setDirty(false);
      }
      setStatus(relativeTime(result.data.updatedAt));
      return result.data;
    } catch (requestError) {
      setStatus('Save failed');
      setError(requestError.message || 'Your changes could not be saved.');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, []);

  useEffect(() => {
    if (!dirty || !selectedDocument?._id) return undefined;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveDocument(selectedDocument, true), 900);
    return () => clearTimeout(saveTimer.current);
  }, [selectedDocument, dirty, saveDocument]);

  useEffect(() => {
    const handleSaveShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        const currentDocument = selectedDocumentRef.current;
        if (currentDocument) saveDocument(currentDocument);
      }
    };
    window.addEventListener('keydown', handleSaveShortcut);
    return () => window.removeEventListener('keydown', handleSaveShortcut);
  }, [saveDocument]);

  const updateSelected = (updates) => {
    setSelectedDocument((current) => current ? { ...current, ...updates } : current);
    setDirty(true);
  };

  const saveAndRefreshPreview = async () => {
    const saved = await saveDocument(selectedDocumentRef.current);
    if (saved) setStatus('Saved and preview refreshed');
  };

  const createDocument = async (kind) => {
    if (!activeProject?._id) return;
    const fallback = kind === 'paper' ? 'Untitled paper' : 'Experiment notebook';
    const title = window.prompt(`Name this ${kind === 'paper' ? 'paper draft' : 'code workspace'}:`, fallback)?.trim();
    if (!title) return;
    try {
      const result = await apiFetch(`/api/workspace/projects/${activeProject._id}/documents`, {
        method: 'POST',
        body: JSON.stringify({
          title,
          kind,
          language: kind === 'paper' ? 'latex' : 'javascript',
          content: kind === 'paper' ? paperStarter : codeStarter
        })
      });
      setDocuments((current) => [result.data, ...current]);
      setSelectedDocument(result.data);
      setDirty(false);
      setStatus('New workspace ready');
    } catch (requestError) {
      setError(requestError.message || 'Unable to create a workspace document.');
    }
  };

  const deleteDocument = async () => {
    if (!selectedDocument || !window.confirm(`Delete “${selectedDocument.title}”? This cannot be undone.`)) return;
    try {
      await apiFetch(`/api/workspace/documents/${selectedDocument._id}`, { method: 'DELETE' });
      const remaining = documents.filter((document) => document._id !== selectedDocument._id);
      setDocuments(remaining);
      setSelectedDocument(null);
      setStatus('Document deleted');
      if (remaining[0]) selectDocument(remaining[0]._id);
    } catch (requestError) {
      setError(requestError.message || 'Unable to delete this document.');
    }
  };

  const searchLiterature = async (event) => {
    event?.preventDefault();
    const query = literatureQuery.trim();
    if (query.length < 2) return setError('Enter at least two characters to search the literature.');
    setSearching(true);
    setError('');
    try {
      const result = await apiFetch(`/api/research/search?q=${encodeURIComponent(query)}`);
      const deduped = result.data.filter((work, index, all) => index === all.findIndex((candidate) => candidate.doi && candidate.doi === work.doi || (!candidate.doi && candidate.title === work.title)));
      setLiterature(deduped);
    } catch (requestError) {
      setError(requestError.message || 'Unable to search the literature right now.');
    } finally {
      setSearching(false);
    }
  };

  const addCitation = (work) => {
    if (!selectedDocument || selectedDocument.kind !== 'paper') {
      setError('Open a paper draft before adding a citation.');
      return;
    }
    const key = citationKey(work);
    const citation = `% Reference to add in references.bib:\n${bibtexFor(work)}\n\n`;
    const content = selectedDocument.content.includes(`\\cite{${key}}`)
      ? selectedDocument.content
      : `${selectedDocument.content.replace(/\\end\{document\}\s*$/, '')}\n\nThis work builds on related research \\cite{${key}}.\n\n${citation}\\end{document}\n`;
    updateSelected({ content });
    setActivePanel('editor');
    setStatus(`Citation ${key} added`);
  };

  const downloadSource = () => {
    if (!selectedDocument) return;
    const extension = selectedDocument.kind === 'paper' ? 'tex' : selectedDocument.language === 'python' ? 'py' : 'js';
    const blob = new Blob([selectedDocument.content || ''], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${selectedDocument.title.replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '') || 'research-workspace'}.${extension}`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const openOverleaf = () => {
    const target = selectedDocument?.overleafUrl || 'https://www.overleaf.com/project/new';
    try {
      const parsed = new URL(target);
      if (parsed.protocol !== 'https:') throw new Error('Only HTTPS links are allowed');
      window.open(parsed.href, '_blank', 'noopener,noreferrer');
    } catch {
      setError('Use a valid HTTPS Overleaf project link.');
    }
  };

  const startPaneResize = (event) => {
    event.preventDefault();
    const container = event.currentTarget.parentElement;
    const onMove = (moveEvent) => {
      const bounds = container.getBoundingClientRect();
      const next = ((moveEvent.clientX - bounds.left) / bounds.width) * 100;
      setSplitRatio(Math.min(72, Math.max(28, next)));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const sections = useMemo(() => latexSections(selectedDocument?.content), [selectedDocument?.content]);
  const textPreview = useMemo(() => (selectedDocument?.content || '')
    .replace(/\\documentclass(?:\[[^\]]*\])?\{[^}]*\}/g, '')
    .replace(/\\usepackage(?:\[[^\]]*\])?\{[^}]*\}/g, '')
    .replace(/\\(?:begin|end|title|author|date|maketitle|bibliographystyle|bibliography)\{[^}]*\}/g, '')
    .replace(/\\section\*?\{([^}]+)\}/g, '\n$1\n')
    .replace(/\\cite\{([^}]+)\}/g, '[$1]')
    .replace(/\\[a-zA-Z]+(?:\{([^}]*)\})?/g, '$1')
    .replace(/%.*$/gm, '').trim(), [selectedDocument?.content]);
  const wordCount = useMemo(() => (textPreview.match(/\S+/g) || []).length, [textPreview]);
  const citationCount = useMemo(() => (selectedDocument?.content.match(/\\cite\{[^}]+\}/g) || []).length, [selectedDocument?.content]);
  const codeStats = useMemo(() => {
    const content = selectedDocument?.content || '';
    return { lines: content ? content.split('\n').length : 0, todos: (content.match(/\bTODO\b/gi) || []).length, logs: (content.match(/console\.log|print\(/g) || []).length };
  }, [selectedDocument?.content]);
  const readiness = useMemo(() => {
    const content = selectedDocument?.content || '';
    return [
      ['Abstract', /\\begin\{abstract\}/.test(content)],
      ['Introduction', /\\section\{Introduction\}/i.test(content)],
      ['Methodology', /\\section\{Methodology\}/i.test(content)],
      ['Results', /\\section\{Results\}/i.test(content)],
      ['References', /\\bibliography\{/.test(content)]
    ];
  }, [selectedDocument?.content]);

  if (!activeProject) return <EmptyProject workspace={isPaperWorkspace ? 'paper editor' : isCodeWorkspace ? 'code IDE' : 'research'} />;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f4f6fb] text-slate-900 dark:bg-background dark:text-on-surface">
      <div className="w-full px-3 py-3 md:px-4 md:py-4">
        <header className="mb-3 flex flex-col justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm dark:border-outline-variant/30 dark:bg-surface md:flex-row md:items-center">
          <div className="flex items-start gap-4">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-lg shadow-indigo-600/20"><span className="material-symbols-outlined">auto_stories</span></div>
            <div>
              <div className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.16em] text-indigo-600 dark:text-primary"><span>{isPaperWorkspace ? 'Paper editor' : isCodeWorkspace ? 'Code IDE' : 'Research Studio'}</span><span className="size-1 rounded-full bg-current"/><span className="truncate">{activeProject.title}</span></div>
              <h1 className="text-lg font-extrabold tracking-tight text-slate-950 dark:text-on-surface md:text-xl">{isPaperWorkspace ? 'Paper Editor' : isCodeWorkspace ? 'Code IDE' : 'Research Studio'}</h1>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-secondary">{activeProject.title} · {isPaperWorkspace ? 'LaTeX source and preview' : isCodeWorkspace ? 'Implementation workspace' : 'Project research workspace'}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {!isCodeWorkspace && <button onClick={() => createDocument('paper')} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-px hover:bg-slate-800 dark:bg-primary dark:text-on-primary"><span className="material-symbols-outlined text-[18px]">article</span> New paper</button>}
            {!isPaperWorkspace && <button onClick={() => createDocument('code')} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700 dark:border-outline-variant/50 dark:bg-surface dark:text-on-surface"><span className="material-symbols-outlined text-[18px]">terminal</span> New code file</button>}
          </div>
        </header>

        {error && <div role="alert" className="mb-5 flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-error/30 dark:bg-error-container/30 dark:text-error"><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss message" className="material-symbols-outlined text-[18px]">close</button></div>}

        {selectedDocument && <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-2 shadow-sm dark:border-outline-variant/30 dark:bg-surface"><div className="flex min-w-0 items-center gap-1 overflow-x-auto"><button onClick={() => setUtilityPanel(utilityPanel === 'outline' ? '' : 'outline')} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${utilityPanel === 'outline' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-secondary dark:hover:bg-surface-container'}`}><span className="material-symbols-outlined mr-1 align-[-3px] text-[15px]">account_tree</span>Outline</button><button onClick={() => setUtilityPanel(utilityPanel === 'quality' ? '' : 'quality')} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${utilityPanel === 'quality' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-secondary dark:hover:bg-surface-container'}`}><span className="material-symbols-outlined mr-1 align-[-3px] text-[15px]">fact_check</span>{selectedDocument.kind === 'paper' ? 'Checks' : 'IDE status'}</button>{selectedDocument.kind === 'paper' && <button onClick={() => setUtilityPanel(utilityPanel === 'overleaf' ? '' : 'overleaf')} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${utilityPanel === 'overleaf' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-secondary dark:hover:bg-surface-container'}`}><span className="material-symbols-outlined mr-1 align-[-3px] text-[15px]">open_in_new</span>Overleaf</button>}</div><div className="flex shrink-0 gap-1.5 text-[11px] font-bold text-slate-500 dark:text-secondary">{selectedDocument.kind === 'paper' ? <><span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-surface-container">{wordCount.toLocaleString()} words</span><span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-surface-container">{sections.length} sections</span><span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-surface-container">{citationCount} cites</span></> : <><span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-surface-container">{codeStats.lines} lines</span><span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-surface-container">{codeStats.todos} TODOs</span></>}</div></div>}
        {selectedDocument && utilityPanel && <div className="mb-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-outline-variant/30 dark:bg-surface">{utilityPanel === 'outline' && <div className="flex flex-wrap gap-2">{sections.length ? sections.map((section, index) => <span key={`${section}-${index}`} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 dark:bg-surface-container dark:text-on-surface">{index + 1}. {section}</span>) : <span className="text-xs text-slate-500 dark:text-secondary">{selectedDocument.kind === 'paper' ? 'Add \\section headings to create an outline.' : 'Use comments and clear function names to keep the implementation easy to navigate.'}</span>}</div>}{utilityPanel === 'quality' && (selectedDocument.kind === 'paper' ? <div className="flex flex-wrap gap-2">{readiness.map(([label, complete]) => <span key={label} className={`rounded-lg px-3 py-2 text-xs font-semibold ${complete ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-surface-container dark:text-secondary'}`}>{complete ? '✓' : '○'} {label}</span>)}</div> : <p className="text-xs leading-relaxed text-slate-600 dark:text-secondary">{codeStats.logs} output call(s) and {codeStats.todos} TODO marker(s) detected. Download the source and run it only in an approved development environment.</p>)}{utilityPanel === 'overleaf' && <div className="flex flex-col gap-2 sm:flex-row"><input value={selectedDocument.overleafUrl || ''} onChange={(event) => updateSelected({ overleafUrl: event.target.value })} placeholder="https://www.overleaf.com/project/…" className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-400 dark:border-outline-variant/50 dark:bg-surface-container-lowest"/><button onClick={openOverleaf} className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700">{selectedDocument.overleafUrl ? 'Open linked project' : 'Create Overleaf project'}</button></div>}</div>}

        <div className="min-h-[calc(100vh-178px)]">
          <aside className="hidden">
            <div className="mb-3 flex items-center justify-between px-2 pt-2"><span className="text-xs font-bold uppercase tracking-[.14em] text-slate-500 dark:text-secondary">Project files</span><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500 dark:bg-surface-container">{documents.length}</span></div>
            <div className="space-y-1">
              {loading ? <div className="p-5 text-center text-sm text-slate-500">Loading workspace…</div> : documents.length === 0 ? <div className="px-3 py-6 text-center text-sm leading-relaxed text-slate-500">{isPaperWorkspace ? 'Create a LaTeX paper to begin drafting.' : isCodeWorkspace ? 'Create a code file to begin documenting implementation work.' : 'Create a paper draft or code lab to start your project record.'}</div> : documents.map((document) => {
                const selected = document._id === selectedDocument?._id;
                return <button key={document._id} onClick={() => selectDocument(document._id)} className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition ${selected ? 'bg-indigo-50 text-indigo-900 dark:bg-primary/15 dark:text-primary' : 'text-slate-700 hover:bg-slate-50 dark:text-on-surface dark:hover:bg-surface-container-low'}`}>
                  <span className={`material-symbols-outlined mt-0.5 text-[18px] ${selected ? 'text-indigo-600 dark:text-primary' : 'text-slate-400'}`}>{document.kind === 'paper' ? 'description' : 'code'}</span>
                  <span className="min-w-0"><span className="block truncate text-[13px] font-semibold">{document.title}</span><span className="mt-0.5 block text-[11px] text-slate-500 dark:text-secondary">{document.kind === 'paper' ? 'LaTeX paper' : document.language || 'Code'} · {relativeTime(document.updatedAt).replace('Saved ', '')}</span></span>
                </button>;
              })}
            </div>
            <div className="mt-5 border-t border-slate-100 px-2 pt-4 dark:border-outline-variant/30">
              <p className="text-[11px] leading-relaxed text-slate-500 dark:text-secondary">All workspace files are visible to your project team. Autosave creates a dependable project record.</p>
            </div>
          </aside>

          <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-outline-variant/30 dark:bg-surface">
            {!selectedDocument && !loading ? <div className="grid min-h-[680px] place-items-center p-8 text-center"><div><span className="material-symbols-outlined text-[52px] text-indigo-500">edit_note</span><h2 className="mt-4 text-xl font-bold">Your research workspace is ready</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-secondary">Start a structured LaTeX paper, or keep experiments and implementation notes in a code lab.</p></div></div> : selectedDocument && <>
              <div className="flex min-h-[40px] items-end overflow-x-auto border-b border-slate-200 bg-slate-50 dark:border-outline-variant/30 dark:bg-surface-container-low">{documents.map((document) => <button key={document._id} onClick={() => selectDocument(document._id)} className={`inline-flex shrink-0 items-center gap-2 border-r border-slate-200 px-3 py-2 text-xs font-semibold dark:border-outline-variant/30 ${document._id === selectedDocument._id ? 'bg-white text-indigo-700 dark:bg-surface dark:text-primary' : 'text-slate-500 hover:bg-white/70 dark:text-secondary dark:hover:bg-surface'}`}><span className="material-symbols-outlined text-[16px]">{document.kind === 'paper' ? 'description' : 'code'}</span>{document.title}{document._id === selectedDocument._id && dirty && <span className="size-1.5 rounded-full bg-amber-500"/>}</button>)}</div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-2.5 dark:border-outline-variant/30"><div className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-secondary"><span className="material-symbols-outlined text-[16px] text-indigo-600 dark:text-primary">description</span>{selectedDocument.kind === 'paper' ? 'Paper document' : 'Implementation file'} · {dirty ? 'Unsaved changes' : status || relativeTime(selectedDocument.updatedAt)}<button onClick={() => { const title = window.prompt('Rename document', selectedDocument.title)?.trim(); if (title) updateSelected({ title }); }} title="Rename document" className="ml-1 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-surface-container"><span className="material-symbols-outlined text-[15px]">edit</span></button></div><div className="flex items-center gap-1.5"><button onClick={() => saveDocument(selectedDocument)} className="rounded-lg px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-50 dark:text-primary dark:hover:bg-primary/10"><span className="material-symbols-outlined mr-1 align-[-3px] text-[16px]">save</span>Save</button><button onClick={downloadSource} title="Download source" className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-secondary dark:hover:bg-surface-container"><span className="material-symbols-outlined text-[18px]">download</span></button><button onClick={deleteDocument} title="Delete document" className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 dark:text-secondary dark:hover:bg-error-container/30"><span className="material-symbols-outlined text-[18px]">delete</span></button></div></div>
              <div className="flex min-h-[calc(100vh-290px)] flex-col overflow-hidden xl:flex-row">
                <section className="min-w-0 w-full bg-[#1e1e1e] xl:w-[var(--pane-width)] xl:shrink-0" style={{ '--pane-width': `${splitRatio}%` }}>
                  <div className="flex items-center justify-between border-b border-white/10 bg-[#252526] px-4 py-2.5 text-xs font-semibold text-slate-300"><span className="inline-flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-indigo-300">code</span>{selectedDocument.kind === 'paper' ? 'main.tex' : selectedDocument.language || 'source'}</span><span className="text-[10px] uppercase tracking-wider text-slate-500">Editable source</span></div>
                  <div className="h-[calc(100vh-360px)] min-h-[560px]"><Editor height="100%" language={languageFor(selectedDocument)} value={selectedDocument.content} theme="vs-dark" onChange={(value) => updateSelected({ content: value || '' })} options={{ minimap: { enabled: true }, fontSize: 14, lineNumbersMinChars: 3, wordWrap: 'on', padding: { top: 18 }, scrollBeyondLastLine: false, automaticLayout: true, stickyScroll: { enabled: true } }} /></div>
                </section>
                <div role="separator" aria-orientation="vertical" onMouseDown={startPaneResize} className="hidden w-2 shrink-0 cursor-col-resize bg-slate-200 transition hover:bg-indigo-500 dark:bg-outline-variant/40 dark:hover:bg-primary xl:block" title="Drag to resize panes" />
                <section className="min-w-0 flex-1 bg-slate-100 p-3 dark:bg-surface-container-low">
                  {selectedDocument.kind === 'paper' ? <div className="mx-auto flex h-[calc(100vh-390px)] min-h-[560px] max-w-[900px] flex-col overflow-hidden rounded-sm bg-white shadow-[0_4px_18px_rgba(15,23,42,.14)]"><div className="flex items-center justify-between border-b border-slate-200 px-5 py-3"><span className="inline-flex items-center gap-2 text-xs font-bold text-slate-700"><span className="material-symbols-outlined text-[16px] text-indigo-600">picture_as_pdf</span>Typeset reading preview</span><div className="flex items-center gap-2"><span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Live preview</span><button onClick={saveAndRefreshPreview} disabled={isSaving} className="rounded-md bg-indigo-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60"><span className="material-symbols-outlined mr-1 align-[-3px] text-[14px]">save</span>{isSaving ? 'Saving…' : 'Save & refresh'}</button></div></div><article className="overflow-y-auto px-7 py-8 text-slate-800 sm:px-10"><h2 className="border-b border-slate-200 pb-5 text-center font-serif text-2xl font-bold leading-tight">{selectedDocument.title}</h2><p className="mb-8 mt-3 text-center text-xs text-slate-500">LaTeX draft reading view · updates while you type</p><div className="whitespace-pre-wrap font-serif text-[15px] leading-8 text-slate-700">{textPreview || 'Start writing to see the reading preview.'}</div></article></div> : <div className="flex h-[calc(100vh-390px)] min-h-[560px] flex-col overflow-hidden rounded-sm bg-[#111827] font-mono text-sm text-slate-200 shadow-[0_4px_18px_rgba(15,23,42,.14)]"><div className="flex items-center justify-between border-b border-white/10 px-4 py-3"><span className="inline-flex items-center gap-2 font-sans text-xs font-bold"><span className="material-symbols-outlined text-[16px] text-emerald-400">terminal</span>Development output</span><span className="font-sans text-[10px] uppercase tracking-wider text-slate-500">Safe workspace</span></div><pre className="flex-1 overflow-auto whitespace-pre-wrap p-5 text-xs leading-6 text-slate-300">$ project-notebook status\nFile: {selectedDocument.title}\nLanguage: {selectedDocument.language || 'javascript'}\nLines: {codeStats.lines}\nTODO markers: {codeStats.todos}\n\nRun code in your approved local or cloud development environment. This academic workspace intentionally does not execute arbitrary code in the browser.</pre><div className="border-t border-white/10 px-4 py-3 text-[11px] text-slate-500">Save source here, then download it for local execution or your institution’s approved compute environment.</div></div>}
                </section>
              </div>
              <section className="border-t border-slate-200 p-5 dark:border-outline-variant/30 md:p-6">
                <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center"><div><h2 className="text-sm font-bold text-slate-900 dark:text-on-surface">Literature desk</h2><p className="mt-1 text-xs text-slate-500 dark:text-secondary">Search OpenAlex and Crossref, then add a BibTeX-ready citation to this draft.</p></div><span className="text-[11px] font-medium text-slate-500 dark:text-secondary">Verify original sources before citing.</span></div>
                <form onSubmit={searchLiterature} className="flex gap-2"><input value={literatureQuery} onChange={(event) => setLiteratureQuery(event.target.value)} placeholder="Search scholarly works, methods, or datasets…" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-outline-variant/50 dark:bg-surface-container-lowest dark:focus:border-primary dark:focus:ring-primary/10"/><button disabled={searching} className="rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white disabled:opacity-60 dark:bg-primary dark:text-on-primary">{searching ? 'Searching…' : 'Search'}</button></form>
                {literature.length > 0 && <div className="mt-4 grid max-h-[290px] gap-3 overflow-y-auto pr-1"><>{literature.map((work) => <div key={`${work.source}-${work.id}`} className="rounded-xl border border-slate-200 p-3 dark:border-outline-variant/30"><div className="flex flex-col justify-between gap-3 sm:flex-row"><div className="min-w-0"><div className="mb-1 flex flex-wrap gap-2"><span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:bg-primary/10 dark:text-primary">{work.source}</span>{work.year && <span className="text-xs text-slate-500 dark:text-secondary">{work.year}</span>}</div><a href={work.url} target="_blank" rel="noreferrer" className="text-sm font-bold leading-snug text-slate-900 hover:text-indigo-700 hover:underline dark:text-on-surface dark:hover:text-primary">{work.title}</a><p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-secondary">{work.authors?.join(', ') || 'Authors unavailable'}{work.venue ? ` · ${work.venue}` : ''}{work.citedBy ? ` · ${work.citedBy.toLocaleString()} citations` : ''}</p></div>{selectedDocument.kind === 'paper' && <button type="button" onClick={() => addCitation(work)} className="h-8 shrink-0 rounded-lg border border-indigo-200 px-3 text-xs font-bold text-indigo-700 hover:bg-indigo-50 dark:border-primary/30 dark:text-primary dark:hover:bg-primary/10">Add citation</button>}</div></div>)}</></div>}
              </section>
            </>}
          </section>

          <aside className="hidden">
            <section className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_12px_40px_rgba(36,48,84,.05)] dark:border-outline-variant/30 dark:bg-surface"><div className="mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-indigo-600 dark:text-primary">account_tree</span><h2 className="text-sm font-bold">Writing map</h2></div>{selectedDocument?.kind === 'paper' ? <div className="space-y-2">{sections.length ? sections.map((section, index) => <div key={`${section}-${index}`} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 dark:bg-surface-container-low dark:text-on-surface"><span className="size-1.5 rounded-full bg-indigo-500"/>{section}</div>) : <p className="text-sm leading-relaxed text-slate-500 dark:text-secondary">Use <code className="rounded bg-slate-100 px-1 dark:bg-surface-container">\\section&#123;…&#125;</code> headings to shape your paper.</p>}</div> : <p className="text-sm leading-relaxed text-slate-500 dark:text-secondary">Treat this code lab as an experiment record: state the question, input, method, and output alongside implementation.</p>}</section>
            {selectedDocument?.kind === 'paper' && <section className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_12px_40px_rgba(36,48,84,.05)] dark:border-outline-variant/30 dark:bg-surface"><div className="mb-3 flex items-center justify-between gap-2"><div className="flex items-center gap-2"><span className="material-symbols-outlined text-emerald-600">fact_check</span><h2 className="text-sm font-bold">Paper readiness</h2></div><span className="text-xs font-bold text-slate-500 dark:text-secondary">{readiness.filter(([, complete]) => complete).length}/{readiness.length}</span></div><div className="space-y-2">{readiness.map(([label, complete]) => <div key={label} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs dark:bg-surface-container-low"><span className="text-slate-700 dark:text-on-surface">{label}</span><span className={`material-symbols-outlined text-[17px] ${complete ? 'text-emerald-600' : 'text-slate-300 dark:text-secondary'}`}>{complete ? 'check_circle' : 'radio_button_unchecked'}</span></div>)}</div><p className="mt-3 text-[11px] leading-relaxed text-slate-500 dark:text-secondary">This checks structure only. Confirm academic quality, evidence, and citation accuracy before submission.</p></section>}
            {selectedDocument?.kind === 'paper' ? <section className="rounded-[24px] border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5 shadow-[0_12px_40px_rgba(36,48,84,.04)] dark:border-primary/20 dark:from-primary/10 dark:to-surface"><div className="flex items-center gap-2"><span className="material-symbols-outlined text-indigo-600 dark:text-primary">open_in_new</span><h2 className="text-sm font-bold">Overleaf handoff</h2></div><p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-secondary">Link an Overleaf project for native compiling, collaboration, and PDF download. It opens securely in a new tab.</p><input value={selectedDocument.overleafUrl || ''} onChange={(event) => updateSelected({ overleafUrl: event.target.value })} placeholder="https://www.overleaf.com/project/…" className="mt-4 w-full rounded-lg border border-indigo-100 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-400 dark:border-outline-variant/50 dark:bg-surface-container-lowest"/><button onClick={openOverleaf} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 dark:bg-primary dark:text-on-primary"><span className="material-symbols-outlined text-[16px]">rocket_launch</span>{selectedDocument.overleafUrl ? 'Open linked project' : 'Create Overleaf project'}</button><a href="https://docs.overleaf.com/integrations-and-add-ons/git-integration-and-github-synchronization/git" target="_blank" rel="noreferrer" className="mt-3 block text-center text-[11px] font-bold text-indigo-700 hover:underline dark:text-primary">Learn about Git integration ↗</a></section> : <section className="rounded-[24px] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-[0_12px_40px_rgba(36,48,84,.04)] dark:border-primary/20 dark:from-primary/10 dark:to-surface"><div className="flex items-center gap-2"><span className="material-symbols-outlined text-emerald-600">terminal</span><h2 className="text-sm font-bold">IDE workflow</h2></div><ol className="mt-3 space-y-2 text-xs leading-relaxed text-slate-600 dark:text-secondary"><li>1. Write and autosave implementation notes.</li><li>2. Download the source file.</li><li>3. Run it only in an approved local or cloud environment.</li><li>4. Record outcomes, assumptions, and limitations in the source.</li></ol></section>}
            <section className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_12px_40px_rgba(36,48,84,.05)] dark:border-outline-variant/30 dark:bg-surface"><div className="flex items-center gap-2"><span className="material-symbols-outlined text-emerald-600">verified_user</span><h2 className="text-sm font-bold">Academic safeguard</h2></div><p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-secondary">Literature search supplies metadata, not evidence. Read the original work, confirm DOI and author details, and respect your institution’s AI policy.</p></section>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default ResearchStudio;
