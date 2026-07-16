import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import API_BASE_URL from '../lib/api';
import { useAuth } from '../components/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const ProjectChat = () => {
  const { activeProject, user } = useAuth();
  const [activeTab, setActiveTab] = useState('team'); // 'team' or 'ai'
  
  // Chat States
  const [socket, setSocket] = useState(null);
  const [teamMessages, setTeamMessages] = useState([]);
  const [aiMessages, setAiMessages] = useState([
    { 
      sender: { _id: 'ai', name: 'Supervisor AI' }, 
      content: "Hello! I'm your AI assistant. I can help you brainstorm project ideas, refine your problem statement, or review your project proposals. What are you working on today?", 
      createdAt: new Date().toISOString() 
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  
  const messagesEndRef = useRef(null);
  const projectId = activeProject?._id;
  
  // Socket Connection for Team Chat
  useEffect(() => {
    if (!projectId) return;
    const newSocket = io(API_BASE_URL);
    setSocket(newSocket);
    newSocket.emit('join_project', projectId);
    newSocket.on('receive_message', (message) => {
      setTeamMessages((prev) => [...prev, message]);
    });
    return () => newSocket.close();
  }, [projectId]);

  // Fetch Team Messages
  useEffect(() => {
    if (!projectId) return;
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/api/messages/${projectId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) {
          setTeamMessages(json.data);
        }
      } catch (err) {
        console.error('Failed to load messages', err);
      }
    };
    fetchMessages();
  }, [projectId]);

  // Auto Scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [teamMessages, aiMessages, activeTab, isAiTyping]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !projectId) return;

    const newMessage = {
      project: projectId,
      content: inputMessage,
      sender: { _id: user?._id || 'self', name: user?.name || 'You' },
      createdAt: new Date().toISOString()
    };

    const currentInput = inputMessage;
    setInputMessage('');

    if (activeTab === 'team') {
      setTeamMessages(prev => [...prev, newMessage]);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/api/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ project: projectId, content: currentInput })
        });
        const json = await res.json();
        if (json.success && socket) {
          socket.emit('send_message', json.data);
        }
      } catch (err) {
        console.error('Failed to send message', err);
      }
    } else {
      // AI Tab Logic (Mocking AI Response for Idea Suggestion / Feedback)
      setAiMessages(prev => [...prev, newMessage]);
      setIsAiTyping(true);
      
      // Simulate network delay for AI response
      setTimeout(() => {
        setIsAiTyping(false);
        let aiResponse = "I can certainly help with that. Could you provide a bit more detail?";
        
        const lowerInput = currentInput.toLowerCase();
        if (lowerInput.includes('idea') || lowerInput.includes('suggest')) {
          aiResponse = "**Here are 3 project ideas based on current trends:**\n1. AI-Driven Academic Progress Predictor\n2. Blockchain-based Degree Verification System\n3. IoT Smart Classroom Attendance Tracker\n\nWhich of these interests you the most?";
        } else if (lowerInput.includes('feedback') || lowerInput.includes('review') || lowerInput.includes('proposal')) {
          aiResponse = "**Proposal Feedback:**\nYour problem statement is clear, but your *objectives* need to be more measurable. Instead of 'Build a web app', try 'Develop a web application capable of handling 500 concurrent users with <200ms latency'.";
        }

        setAiMessages(prev => [...prev, {
          sender: { _id: 'ai', name: 'Supervisor AI' },
          content: aiResponse,
          createdAt: new Date().toISOString()
        }]);
      }, 1500);
    }
  };

  const currentMessages = activeTab === 'team' ? teamMessages : aiMessages;

  if (!activeProject) {
    return (
      <div className="w-full min-h-[calc(100vh-80px)] bg-background relative flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
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
      {/* Subtle Background Mesh */}
      <div className="absolute top-0 right-1/4 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
      
      <div className="relative z-10 flex-1 w-full max-w-[1200px] mx-auto bg-surface/80 backdrop-blur-xl rounded-[32px] shadow-[0_8px_40px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex flex-col overflow-hidden">
        
        {/* Header & Tabs */}
        <div className="px-6 py-5 border-b border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface/50">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-on-surface transition-colors ${activeTab === 'ai' ? 'bg-tertiary-container text-tertiary' : 'bg-primary/10 text-primary'}`}>
              <span className="material-symbols-outlined text-[24px]">{activeTab === 'ai' ? 'auto_awesome' : 'group'}</span>
            </div>
            <div>
              <h1 className="font-title-lg font-black text-on-surface tracking-tight">{activeTab === 'ai' ? 'AI Co-pilot Assistant' : 'Project Team Chat'}</h1>
              <p className="font-body-sm text-on-surface-variant">{activeTab === 'ai' ? 'Idea Generation & Proposal Review' : activeProject.title}</p>
            </div>
          </div>
          
          <div className="flex p-1 bg-surface-container-low rounded-xl border border-outline-variant/20 w-full sm:w-auto">
            <button 
              onClick={() => setActiveTab('team')}
              className={`flex-1 sm:flex-none px-6 py-2 rounded-lg font-label-md text-[13px] font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'team' ? 'bg-surface shadow-sm text-primary' : 'text-secondary hover:text-on-surface'}`}
            >
              <span className="material-symbols-outlined text-[18px]">group</span> Team
            </button>
            <button 
              onClick={() => setActiveTab('ai')}
              className={`flex-1 sm:flex-none px-6 py-2 rounded-lg font-label-md text-[13px] font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'ai' ? 'bg-surface shadow-sm text-tertiary' : 'text-secondary hover:text-on-surface'}`}
            >
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span> AI Assist
            </button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar bg-surface-container-lowest/30">
          {currentMessages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center flex-col gap-4">
              <div className="w-24 h-24 rounded-full bg-surface-container flex items-center justify-center mb-2">
                <span className="material-symbols-outlined text-5xl text-secondary opacity-50">{activeTab === 'ai' ? 'model_training' : 'forum'}</span>
              </div>
              <h3 className="font-title-md font-bold text-on-surface">No messages yet</h3>
              <p className="font-body-sm text-secondary max-w-sm text-center">
                {activeTab === 'ai' ? "Ask the AI for project ideas or paste your proposal for instant feedback." : "Start the conversation with your team."}
              </p>
            </div>
          ) : (
            currentMessages.map((msg, idx) => {
              const isSelf = msg.sender?._id === (user?._id || 'self');
              const isAi = msg.sender?._id === 'ai';
              
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
                  key={idx} 
                  className={`flex max-w-[85%] lg:max-w-[70%] ${isSelf ? 'self-end' : 'self-start'} gap-3 group`}
                >
                  {!isSelf && (
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-auto shadow-sm ${isAi ? 'bg-tertiary text-on-tertiary' : 'bg-surface-container-high text-on-surface font-bold text-sm'}`}>
                      {isAi ? <span className="material-symbols-outlined text-[16px]">auto_awesome</span> : (msg.sender?.name?.charAt(0) || 'U')}
                    </div>
                  )}
                  
                  <div className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
                    {!isSelf && <span className="font-label-sm text-[11px] font-bold text-on-surface-variant mb-1.5 ml-1 uppercase tracking-wider">{msg.sender?.name || 'User'}</span>}
                    
                    <div className={`px-5 py-3.5 rounded-[20px] shadow-sm ${isSelf ? 'bg-primary text-on-primary rounded-br-[4px]' : isAi ? 'bg-tertiary-container/30 border border-tertiary/20 text-on-surface rounded-bl-[4px]' : 'bg-surface border border-outline-variant/30 text-on-surface rounded-bl-[4px]'}`}>
                      {/* Using standard white-space formatting for simplicity, in a real app this would parse markdown for the AI */}
                      <p className="font-body-md text-[15px] whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    </div>
                    
                    <span className="font-label-sm text-[10px] font-bold text-secondary mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
          
          {/* AI Typing Indicator */}
          {activeTab === 'ai' && isAiTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex max-w-[85%] self-start gap-3">
              <div className="w-8 h-8 rounded-full bg-tertiary flex-shrink-0 flex items-center justify-center mt-auto shadow-sm text-on-tertiary">
                <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
              </div>
              <div className="flex flex-col items-start">
                <span className="font-label-sm text-[11px] font-bold text-on-surface-variant mb-1.5 ml-1 uppercase tracking-wider">Supervisor AI</span>
                <div className="px-5 py-4 rounded-[20px] bg-tertiary-container/30 border border-tertiary/20 rounded-bl-[4px] flex gap-1">
                  <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-2 h-2 rounded-full bg-tertiary"></motion.div>
                  <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-2 h-2 rounded-full bg-tertiary"></motion.div>
                  <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-2 h-2 rounded-full bg-tertiary"></motion.div>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-surface/50 border-t border-outline-variant/30 backdrop-blur-md">
          <form onSubmit={handleSendMessage} className="flex gap-3 max-w-4xl mx-auto items-end">
            <button type="button" className="w-12 h-12 flex items-center justify-center text-secondary hover:text-primary hover:bg-primary/10 rounded-full transition-colors flex-shrink-0">
              <span className="material-symbols-outlined">attach_file</span>
            </button>
            
            <div className={`flex-1 bg-surface-container-lowest border ${activeTab === 'ai' ? 'focus-within:border-tertiary focus-within:ring-tertiary/20' : 'focus-within:border-primary focus-within:ring-primary/20'} border-outline-variant/40 focus-within:ring-2 rounded-[24px] flex items-end overflow-hidden transition-all duration-200 shadow-sm`}>
              <textarea 
                value={inputMessage} onChange={(e) => setInputMessage(e.target.value)}
                placeholder={activeTab === 'ai' ? "Ask the AI for ideas or paste your proposal..." : "Type a message to your team..."}
                className="w-full bg-transparent border-none focus:outline-none px-5 py-3.5 max-h-32 min-h-[52px] resize-none font-body-md text-on-surface"
                rows={1}
                onKeyDown={(e) => {
                  if(e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
            </div>
            
            <button 
              type="submit" disabled={!inputMessage.trim()}
              className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 shadow-sm ${
                !inputMessage.trim() 
                  ? 'bg-surface-container-highest text-secondary cursor-not-allowed'
                  : activeTab === 'ai'
                    ? 'bg-tertiary text-on-tertiary hover:scale-105 active:scale-95 hover:shadow-md'
                    : 'bg-primary text-on-primary hover:scale-105 active:scale-95 hover:shadow-md'
              }`}
            >
              <span className="material-symbols-outlined font-bold text-[20px]" style={{ marginLeft: '2px' }}>send</span>
            </button>
          </form>
        </div>
        
      </div>
    </div>
  );
};

export default ProjectChat;
