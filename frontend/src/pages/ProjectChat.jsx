import React, { useEffect, useRef, useState } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';

const messageId = (message) => String(message?._id || '');
const sameUser = (left, right) => String(left || '') === String(right || '');

const ProjectChat = () => {
  const { activeProject, user } = useAuth();
  const [activeTab, setActiveTab] = useState('team');
  const [aiMode, setAiMode] = useState('research');
  const [teamMessages, setTeamMessages] = useState([]);
  const [aiMessages, setAiMessages] = useState([
    {
      sender: { _id: 'ai', name: 'Academic AI' },
      content: 'Tell me the decision you are trying to make. I will use your role and verified project record to suggest practical next steps, questions, and a human checkpoint.',
      createdAt: new Date().toISOString()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isSendingTeamMessage, setIsSendingTeamMessage] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [aiError, setAiError] = useState('');
  const [teamError, setTeamError] = useState('');
  const [refreshIndex, setRefreshIndex] = useState(0);

  const messagesEndRef = useRef(null);
  const projectId = activeProject?._id;
  const currentUserId = user?._id || user?.id;
  const assistantName = user?.role === 'supervisor'
    ? 'Supervision Copilot'
    : user?.role === 'admin' ? 'Academic Operations Assistant' : 'Research & Career Coach';

  // Serverless deployments cannot maintain a dependable Socket.IO connection.
  // Persist messages through the API, then use small, visibility-aware polling
  // so multiple members still receive current project chat without ghost messages.
  useEffect(() => {
    if (!projectId) {
      setTeamMessages([]);
      setTeamError('');
      return undefined;
    }

    let cancelled = false;
    const loadMessages = async (initial = false) => {
      if (initial) setIsLoadingMessages(true);
      try {
        const response = await apiFetch(`/api/messages/${projectId}`);
        if (!cancelled) {
          setTeamMessages(response.data || []);
          setTeamError('');
        }
      } catch (error) {
        if (!cancelled) {
          setTeamError(error.message || 'Unable to load project messages.');
        }
      } finally {
        if (!cancelled && initial) setIsLoadingMessages(false);
      }
    };

    loadMessages(true);
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') loadMessages();
    }, 15000);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') loadMessages();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [projectId, refreshIndex]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [teamMessages, aiMessages, activeTab, isAiTyping]);

  const handleSendMessage = async (event) => {
    event.preventDefault();
    const content = inputMessage.trim();
    if (!content || !projectId) return;

    if (activeTab === 'team') {
      setTeamError('');
      setIsSendingTeamMessage(true);
      try {
        const response = await apiFetch('/api/messages', {
          method: 'POST',
          body: JSON.stringify({ project: projectId, content })
        });
        const savedMessage = response.data;
        setTeamMessages((current) => current.some((message) => messageId(message) === messageId(savedMessage))
          ? current
          : [...current, savedMessage]);
        setInputMessage('');
      } catch (error) {
        setTeamError(error.message || 'Your message was not sent. Please try again.');
      } finally {
        setIsSendingTeamMessage(false);
      }
      return;
    }

    const userMessage = {
      _id: `local-${Date.now()}`,
      sender: { _id: currentUserId || 'self', name: user?.name || 'You' },
      content,
      createdAt: new Date().toISOString()
    };
    setAiMessages((current) => [...current, userMessage]);
    setInputMessage('');
    setAiError('');
    setIsAiTyping(true);
    try {
      const history = aiMessages.slice(-6).map((message) => ({
        role: (message.sender?._id || message.sender) === 'ai' ? 'assistant' : 'user',
        content: message.content
      }));
      const response = await apiFetch('/api/ai/assistant', {
        method: 'POST',
        body: JSON.stringify({
          project: projectId,
          message: content,
          mode: aiMode,
          history
        })
      });
      const responseData = response.data || {};
      setAiMessages((current) => [...current, {
        sender: { _id: 'ai', name: assistantName },
        content: responseData.answer || 'I could not produce a usable answer. Please try a more specific question.',
        assistantData: responseData,
        createdAt: new Date().toISOString()
      }]);
    } catch (error) {
      setAiError(error.message || 'The AI service is unavailable. No response was generated.');
    } finally {
      setIsAiTyping(false);
    }
  };

  const currentMessages = activeTab === 'team' ? teamMessages : aiMessages;
  const sending = activeTab === 'team' ? isSendingTeamMessage : isAiTyping;

  if (!activeProject) {
    return (
      <div className="w-full min-h-[calc(100vh-80px)] bg-background relative flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0" />
        <div className="relative z-10 text-center bg-surface/80 backdrop-blur-xl border border-outline-variant/30 p-12 rounded-[32px] shadow-lg max-w-md w-full">
          <span className="material-symbols-outlined text-6xl text-secondary mb-4 opacity-50">forum</span>
          <h2 className="font-display text-[24px] font-bold text-on-surface mb-2 tracking-tight">No Project Selected</h2>
          <p className="font-body-md text-on-surface-variant">Please select an active project from the top navigation to view the chat and AI assistant.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-80px)] bg-background relative flex flex-col p-4 md:p-6 lg:p-8">
      <div className="absolute top-0 right-1/4 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="relative z-10 flex-1 w-full max-w-[1200px] mx-auto bg-surface/80 backdrop-blur-xl rounded-[32px] shadow-[0_8px_40px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex flex-col overflow-hidden">
        <div className="px-6 py-5 border-b border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface/50">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-on-surface transition-colors ${activeTab === 'ai' ? 'bg-tertiary-container text-tertiary' : 'bg-primary/10 text-primary'}`}>
              <span className="material-symbols-outlined text-[24px]">{activeTab === 'ai' ? 'auto_awesome' : 'group'}</span>
            </div>
            <div>
              <h1 className="font-title-lg font-black text-on-surface tracking-tight">{activeTab === 'ai' ? assistantName : 'Project Team Chat'}</h1>
              <p className="font-body-sm text-on-surface-variant">{activeTab === 'ai' ? 'Role-aware guidance grounded in your current project' : `${activeProject.title} · refreshes automatically`}</p>
            </div>
          </div>
          <div className="flex p-1 bg-surface-container-low rounded-xl border border-outline-variant/20 w-full sm:w-auto">
            <button onClick={() => setActiveTab('team')} className={`flex-1 sm:flex-none px-6 py-2 rounded-lg font-label-md text-[13px] font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'team' ? 'bg-surface shadow-sm text-primary' : 'text-secondary hover:text-on-surface'}`}>
              <span className="material-symbols-outlined text-[18px]">group</span> Team
            </button>
            <button onClick={() => setActiveTab('ai')} className={`flex-1 sm:flex-none px-6 py-2 rounded-lg font-label-md text-[13px] font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'ai' ? 'bg-surface shadow-sm text-tertiary' : 'text-secondary hover:text-on-surface'}`}>
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span> AI Assist
            </button>
          </div>
        </div>

        {activeTab === 'ai' && <div className="border-b border-outline-variant/30 bg-surface px-6 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-bold uppercase tracking-wider text-secondary">Guidance mode</span>
            {[
              ['research', 'Research', 'science'],
              ['career', 'Career', 'work'],
              ['planning', 'Project planning', 'account_tree']
            ].map(([value, label, icon]) => <button key={value} type="button" onClick={() => setAiMode(value)} className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${aiMode === value ? 'border-tertiary bg-tertiary text-on-tertiary' : 'border-outline-variant/50 text-on-surface-variant hover:border-tertiary/50'}`}><span className="material-symbols-outlined text-[15px]">{icon}</span>{label}</button>)}
            <span className="ml-auto text-xs text-secondary">Advisory only · verify important decisions with a person or source</span>
          </div>
        </div>}

        {activeTab === 'ai' && aiError && <div role="alert" className="mx-6 mt-4 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">{aiError}</div>}
        {activeTab === 'team' && teamError && <div role="alert" className="mx-6 mt-4 flex items-center gap-3 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error"><span className="flex-1">{teamError}</span><button type="button" onClick={() => setRefreshIndex((value) => value + 1)} className="rounded-lg border border-error/30 px-3 py-1.5 text-xs font-bold">Retry</button></div>}

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar bg-surface-container-lowest/30">
          {activeTab === 'team' && isLoadingMessages ? <div className="flex flex-1 items-center justify-center"><div className="h-9 w-9 animate-spin rounded-full border-4 border-primary/20 border-t-primary" /></div> : currentMessages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center flex-col gap-4">
              <div className="w-24 h-24 rounded-full bg-surface-container flex items-center justify-center mb-2"><span className="material-symbols-outlined text-5xl text-secondary opacity-50">{activeTab === 'ai' ? 'model_training' : 'forum'}</span></div>
              <h3 className="font-title-md font-bold text-on-surface">No messages yet</h3>
              <p className="font-body-sm text-secondary max-w-sm text-center">{activeTab === 'ai' ? 'Ask the AI for ideas or paste your proposal for academic feedback.' : 'Start the conversation with your project team.'}</p>
            </div>
          ) : currentMessages.map((message, index) => {
            const senderId = message.sender?._id || message.sender;
            const isSelf = sameUser(senderId, currentUserId) || (activeTab === 'ai' && senderId === 'self');
            const isAi = senderId === 'ai';
            return <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={message._id || `${senderId}-${message.createdAt}-${index}`} className={`flex max-w-[85%] lg:max-w-[70%] ${isSelf ? 'self-end' : 'self-start'} gap-3 group`}>
              {!isSelf && <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-auto shadow-sm ${isAi ? 'bg-tertiary text-on-tertiary' : 'bg-surface-container-high text-on-surface font-bold text-sm'}`}>{isAi ? <span className="material-symbols-outlined text-[16px]">auto_awesome</span> : (message.sender?.name?.charAt(0) || 'U')}</div>}
              <div className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
                {!isSelf && <span className="font-label-sm text-[11px] font-bold text-on-surface-variant mb-1.5 ml-1 uppercase tracking-wider">{message.sender?.name || 'User'}</span>}
                <div className={`px-5 py-3.5 rounded-[20px] shadow-sm ${isSelf ? 'bg-primary text-on-primary rounded-br-[4px]' : isAi ? 'bg-tertiary-container/30 border border-tertiary/20 text-on-surface rounded-bl-[4px]' : 'bg-surface border border-outline-variant/30 text-on-surface rounded-bl-[4px]'}`}>
                  <p className="font-body-md text-[15px] whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  {isAi && message.assistantData?.nextActions?.length > 0 && <div className="mt-4 border-t border-tertiary/15 pt-3"><p className="mb-2 text-xs font-black uppercase tracking-wider text-tertiary">Recommended next actions</p><ol className="space-y-2">{message.assistantData.nextActions.map((action, actionIndex) => <li key={`${action.title}-${actionIndex}`} className="rounded-xl bg-surface/70 p-3 text-sm"><span className="font-bold">{actionIndex + 1}. {action.title}</span>{action.reason && <span className="mt-1 block text-xs text-on-surface-variant">{action.reason}</span>}<span className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-secondary">Owner: {action.owner}</span></li>)}</ol></div>}
                  {isAi && message.assistantData?.questionsToConsider?.length > 0 && <div className="mt-3"><p className="mb-1 text-xs font-black uppercase tracking-wider text-tertiary">Questions to consider</p><ul className="list-disc space-y-1 pl-5 text-sm">{message.assistantData.questionsToConsider.map((question, questionIndex) => <li key={`${question}-${questionIndex}`}>{question}</li>)}</ul></div>}
                  {isAi && message.assistantData?.humanCheckpoint && <p className="mt-3 rounded-lg border border-outline-variant/30 bg-surface/60 px-3 py-2 text-xs text-on-surface-variant"><strong>Human checkpoint:</strong> {message.assistantData.humanCheckpoint}</p>}
                </div>
                <span className="font-label-sm text-[10px] font-bold text-secondary mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </motion.div>;
          })}
          {activeTab === 'ai' && isAiTyping && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex max-w-[85%] self-start gap-3"><div className="w-8 h-8 rounded-full bg-tertiary flex-shrink-0 flex items-center justify-center mt-auto shadow-sm text-on-tertiary"><span className="material-symbols-outlined text-[16px]">auto_awesome</span></div><div className="flex flex-col items-start"><span className="font-label-sm text-[11px] font-bold text-on-surface-variant mb-1.5 ml-1 uppercase tracking-wider">Academic AI</span><div className="px-5 py-4 rounded-[20px] bg-tertiary-container/30 border border-tertiary/20 rounded-bl-[4px] flex gap-1"><motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-2 h-2 rounded-full bg-tertiary" /><motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-2 h-2 rounded-full bg-tertiary" /><motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-2 h-2 rounded-full bg-tertiary" /></div></div></motion.div>}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 md:p-6 bg-surface/50 border-t border-outline-variant/30 backdrop-blur-md">
          <form onSubmit={handleSendMessage} className="flex gap-3 max-w-4xl mx-auto items-end">
            <div className={`flex-1 bg-surface-container-lowest border ${activeTab === 'ai' ? 'focus-within:border-tertiary focus-within:ring-tertiary/20' : 'focus-within:border-primary focus-within:ring-primary/20'} border-outline-variant/40 focus-within:ring-2 rounded-[24px] flex items-end overflow-hidden transition-all duration-200 shadow-sm`}>
              <textarea value={inputMessage} onChange={(event) => setInputMessage(event.target.value)} placeholder={activeTab === 'ai' ? `Ask for ${aiMode === 'career' ? 'career guidance linked to your project' : aiMode === 'planning' ? 'a practical project plan' : 'research guidance'}…` : 'Type a message to your team…'} disabled={sending} className="w-full bg-transparent border-none focus:outline-none px-5 py-3.5 max-h-32 min-h-[52px] resize-none font-body-md text-on-surface disabled:cursor-not-allowed disabled:opacity-60" rows={1} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); handleSendMessage(event); } }} />
            </div>
            <button type="submit" disabled={!inputMessage.trim() || sending} className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 shadow-sm ${!inputMessage.trim() || sending ? 'bg-surface-container-highest text-secondary cursor-not-allowed' : activeTab === 'ai' ? 'bg-tertiary text-on-tertiary hover:scale-105 active:scale-95 hover:shadow-md' : 'bg-primary text-on-primary hover:scale-105 active:scale-95 hover:shadow-md'}`} aria-label={activeTab === 'ai' ? 'Ask AI' : 'Send message'}>{sending ? <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span> : <span className="material-symbols-outlined font-bold text-[20px]" style={{ marginLeft: '2px' }}>send</span>}</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProjectChat;
