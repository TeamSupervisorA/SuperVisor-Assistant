import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import API_BASE_URL from '../lib/api';
import { useAuth } from '../components/AuthContext';

const ProjectChat = () => {
  const { activeProject, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);
  
  const projectId = activeProject?._id;
  
  useEffect(() => {
    if (!projectId) return;
    // Connect to Socket.IO server
    const newSocket = io(API_BASE_URL);
    setSocket(newSocket);

    // Join the project room
    newSocket.emit('join_project', projectId);

    // Listen for incoming messages
    newSocket.on('receive_message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => newSocket.close();
  }, [projectId]);

  useEffect(() => {
    // Fetch historical messages
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/api/messages/${projectId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) {
          setMessages(json.data);
        }
      } catch (err) {
        console.error('Failed to load messages', err);
      }
    };
    fetchMessages();
  }, [projectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !socket || !projectId) return;

    const newMessage = {
      project: projectId,
      content: inputMessage,
      sender: { _id: user?._id || 'self', name: user?.name || 'You' }, // Optimistic mock using real user context
      createdAt: new Date().toISOString()
    };

    // Optimistically add to UI
    setMessages(prev => [...prev, newMessage]);
    
    // Save to DB
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ project: projectId, content: inputMessage })
      });
      const json = await res.json();
      if (json.success) {
        // Broadcast via socket
        socket.emit('send_message', json.data);
      }
    } catch (err) {
      console.error('Failed to send message', err);
    }

    setInputMessage('');
  };

  if (!activeProject) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] bg-surface-container-lowest items-center justify-center">
        <div className="text-center bg-surface border border-outline-variant/30 p-10 rounded-2xl">
          <span className="material-symbols-outlined text-4xl text-outline mb-2">forum</span>
          <h2 className="font-headline-md text-on-surface">No Project Selected</h2>
          <p className="font-body-md text-secondary mt-2">Please select an active project from the top navigation to view chat.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-surface-container-lowest">
      {/* Header */}
      <div className="px-6 py-4 border-b border-outline-variant/30 flex items-center justify-between bg-surface-bright z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
            <span className="material-symbols-outlined font-bold">group</span>
          </div>
          <div>
            <h1 className="font-title-lg font-bold text-on-surface tracking-tight">Project Team Chat</h1>
            <p className="text-body-sm text-on-surface-variant">{activeProject.title}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors">
            <span className="material-symbols-outlined">search</span>
          </button>
          <button className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors">
            <span className="material-symbols-outlined">more_vert</span>
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-on-surface-variant flex-col gap-4">
            <span className="material-symbols-outlined text-6xl opacity-20">forum</span>
            <p className="font-body-lg">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isSelf = msg.sender?._id === 'self' || false; // Mock self logic
            return (
              <div key={idx} className={`flex max-w-[80%] ${isSelf ? 'self-end' : 'self-start'} gap-3 animate-fade-in-up`}>
                {!isSelf && (
                  <div className="w-8 h-8 rounded-full bg-secondary-container flex-shrink-0 flex items-center justify-center mt-auto text-on-secondary-container text-sm font-bold">
                    {msg.sender?.name?.charAt(0) || 'U'}
                  </div>
                )}
                <div className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
                  {!isSelf && <span className="text-label-sm text-on-surface-variant mb-1 ml-1">{msg.sender?.name || 'User'}</span>}
                  <div className={`px-4 py-2.5 rounded-2xl shadow-sm ${isSelf ? 'bg-primary text-on-primary rounded-br-sm' : 'bg-surface-container text-on-surface rounded-bl-sm border border-outline-variant/20'}`}>
                    <p className="font-body-md whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  <span className="text-label-sm text-on-surface-variant mt-1 opacity-70">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-surface-bright border-t border-outline-variant/30">
        <form onSubmit={handleSendMessage} className="flex gap-2 max-w-4xl mx-auto items-end">
          <button type="button" className="p-3 text-on-surface-variant hover:text-primary hover:bg-primary-container/20 rounded-full transition-colors flex-shrink-0">
            <span className="material-symbols-outlined">attach_file</span>
          </button>
          <div className="flex-1 bg-surface-container-lowest border border-outline-variant focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 rounded-3xl flex items-end overflow-hidden transition-all duration-200 shadow-sm">
            <textarea 
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-full bg-transparent border-none focus:outline-none p-3 max-h-32 min-h-[44px] resize-none font-body-md"
              rows={1}
              onKeyDown={(e) => {
                if(e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            <button type="button" className="p-3 text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined">mood</span>
            </button>
          </div>
          <button 
            type="submit" 
            disabled={!inputMessage.trim()}
            className={`p-3 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 shadow-md ${
              inputMessage.trim() 
                ? 'bg-primary text-on-primary hover:bg-primary/90 hover:scale-105 active:scale-95' 
                : 'bg-surface-container-highest text-on-surface-variant opacity-50 cursor-not-allowed'
            }`}
          >
            <span className="material-symbols-outlined font-bold" style={{ marginLeft: '2px' }}>send</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProjectChat;
