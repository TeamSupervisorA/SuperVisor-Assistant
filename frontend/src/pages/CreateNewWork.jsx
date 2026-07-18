import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { useAuth } from '../components/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const CreateNewWork = () => {
  const [selectedType, setSelectedType] = useState('sdp');
  const [formData, setFormData] = useState({
    title: '',
    problemStatement: '',
    objectives: '',
    techStack: '',
    expectedOutcome: ''
  });
  const [loading, setLoading] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [aiIdeaInterest, setAiIdeaInterest] = useState('');
  
  const navigate = useNavigate();
  const { setActiveProject, getDashboardPath } = useAuth();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.problemStatement.trim()) return alert('Title and Problem Statement are required');
    
    setLoading(true);
    try {
      const payload = {
        title: `[${selectedType.toUpperCase()}] ${formData.title}`,
        description: `
          **Problem Statement:** ${formData.problemStatement}
          **Objectives:** ${formData.objectives}
          **Tech Stack:** ${formData.techStack}
          **Expected Outcome:** ${formData.expectedOutcome}
        `,
        status: 'proposed'
      };
      
      const res = await apiFetch('/api/projects', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.success) {
        setActiveProject(res.data);
        navigate(getDashboardPath());
      }
    } catch (error) {
      alert('Error creating project: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestIdeas = async () => {
    if (!aiIdeaInterest) return alert('Please enter an area of interest');
    setAiLoading(true);
    setAiFeedback(null);
    try {
      const res = await apiFetch('/api/ai/suggest-ideas', {
        method: 'POST',
        body: JSON.stringify({ interests: aiIdeaInterest, department: 'Computer Science' }) // hardcoded dept for now
      });
      if (res.success) setAiFeedback(res.data);
    } catch (e) {
      alert('Error fetching AI suggestions');
    } finally {
      setAiLoading(false);
    }
  };

  const handleReviewProposal = async () => {
    if (!formData.title || !formData.problemStatement) return alert('Please fill in title and problem statement first.');
    setAiLoading(true);
    setAiFeedback(null);
    try {
      const proposalText = `Title: ${formData.title}. Problem: ${formData.problemStatement}. Objectives: ${formData.objectives}. Tech: ${formData.techStack}.`;
      const res = await apiFetch('/api/ai/review-proposal', {
        method: 'POST',
        body: JSON.stringify({ proposalText })
      });
      if (res.success) setAiFeedback(res.data);
    } catch (e) {
      alert('Error fetching AI review');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Subtle Background Mesh */}
      <div className="absolute top-0 right-1/4 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[500px] bg-tertiary-container/5 rounded-full blur-[80px] pointer-events-none z-0"></div>

      <motion.div 
        initial="hidden" animate="show" variants={containerVariants}
        className="relative z-10 p-6 md:p-8 lg:p-10 w-full max-w-[1200px] mx-auto flex flex-col gap-8"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary font-label-md text-[12px] font-bold mb-3 border border-primary/20 uppercase tracking-wide">Project Initialization</span>
            <h1 className="font-display text-[32px] md:text-[42px] font-black text-on-surface tracking-tight leading-none mb-2">Create New Work</h1>
            <p className="font-body-md text-[16px] text-on-surface-variant font-light max-w-2xl">Submit your project proposal details below. These will be reviewed by your supervisor.</p>
          </div>
          <button 
            type="button"
            onClick={() => setAiAssistantOpen(!aiAssistantOpen)}
            className={`px-5 py-2.5 rounded-xl font-label-md text-[13px] font-bold transition-all flex items-center gap-2 border ${aiAssistantOpen ? 'bg-primary/10 text-primary border-primary/30' : 'bg-surface text-secondary border-outline-variant/30 hover:border-primary/50'}`}
          >
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            AI Proposal Assist
          </button>
        </motion.div>

        {/* AI Assist Banner (Collapsible) */}
        <AnimatePresence>
          {aiAssistantOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-primary/5 border border-primary/20 rounded-[24px] p-6 flex flex-col gap-6 relative">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[30px]"></div>
                 
                 <div className="relative z-10 flex flex-col md:flex-row gap-6">
                   <div className="flex-1 bg-surface-container-lowest/50 backdrop-blur-sm rounded-xl p-5 border border-primary/10">
                     <h4 className="font-title-sm text-[15px] font-bold text-on-surface mb-3 flex items-center gap-2"><span className="material-symbols-outlined text-primary text-[18px]">lightbulb</span> Get Project Ideas</h4>
                     <div className="flex gap-2">
                       <input value={aiIdeaInterest} onChange={e => setAiIdeaInterest(e.target.value)} placeholder="e.g. Healthcare, Machine Learning..." className="flex-1 px-3 py-2 text-[13px] rounded-lg border border-outline-variant bg-surface" />
                       <button onClick={handleSuggestIdeas} disabled={aiLoading} className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-[13px] font-bold">Generate</button>
                     </div>
                   </div>

                   <div className="flex-1 bg-surface-container-lowest/50 backdrop-blur-sm rounded-xl p-5 border border-primary/10">
                     <h4 className="font-title-sm text-[15px] font-bold text-on-surface mb-3 flex items-center gap-2"><span className="material-symbols-outlined text-primary text-[18px]">rate_review</span> Review Current Proposal</h4>
                     <p className="text-[12px] text-secondary mb-3">AI will analyze your form data below and suggest improvements.</p>
                     <button onClick={handleReviewProposal} disabled={aiLoading} className="w-full px-4 py-2 bg-primary text-on-primary hover:bg-primary-fixed-variant rounded-lg text-[13px] font-bold">Analyze Proposal</button>
                   </div>
                 </div>

                 {aiLoading && <div className="text-center text-primary text-[13px] animate-pulse">AI is thinking...</div>}
                 
                 {aiFeedback && (
                   <div className="relative z-10 bg-surface rounded-xl p-5 border border-primary/20 shadow-sm mt-2">
                     <h4 className="font-title-sm text-[14px] font-bold text-primary mb-2">AI Feedback</h4>
                     <div className="font-body-sm text-[13px] text-on-surface whitespace-pre-wrap">{aiFeedback}</div>
                   </div>
                 )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Column: Form Fields */}
          <motion.div variants={itemVariants} className="flex-1 bg-surface/80 backdrop-blur-xl rounded-[32px] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-outline-variant/30 flex flex-col gap-8">
            
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
              <h2 className="font-title-lg text-[22px] font-bold text-on-surface">Proposal Details</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block font-label-md text-[13px] font-bold text-on-surface mb-2 uppercase tracking-wider">Project Title <span className="text-error">*</span></label>
                <input 
                  required name="title" value={formData.title} onChange={handleInputChange}
                  placeholder="e.g. AI-driven Healthcare Diagnostics"
                  className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-xl px-4 py-3.5 font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-secondary" 
                />
              </div>

              <div>
                <label className="block font-label-md text-[13px] font-bold text-on-surface mb-2 uppercase tracking-wider flex justify-between">
                  <span>Problem Statement <span className="text-error">*</span></span>
                </label>
                <textarea 
                  required name="problemStatement" value={formData.problemStatement} onChange={handleInputChange}
                  placeholder="What specific problem does this project solve?"
                  className="w-full h-32 bg-surface-container-lowest border border-outline-variant/40 rounded-xl px-4 py-3.5 font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-secondary resize-none" 
                />
              </div>

              <div>
                <label className="block font-label-md text-[13px] font-bold text-on-surface mb-2 uppercase tracking-wider">Core Objectives</label>
                <textarea 
                  name="objectives" value={formData.objectives} onChange={handleInputChange}
                  placeholder="List 3-4 main objectives you aim to achieve..."
                  className="w-full h-24 bg-surface-container-lowest border border-outline-variant/40 rounded-xl px-4 py-3.5 font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-secondary resize-none" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-label-md text-[13px] font-bold text-on-surface mb-2 uppercase tracking-wider">Proposed Tech Stack</label>
                  <input 
                    name="techStack" value={formData.techStack} onChange={handleInputChange}
                    placeholder="e.g. React, Node.js, MongoDB, Python"
                    className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-xl px-4 py-3.5 font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-secondary" 
                  />
                </div>
                <div>
                  <label className="block font-label-md text-[13px] font-bold text-on-surface mb-2 uppercase tracking-wider">Expected Outcome</label>
                  <input 
                    name="expectedOutcome" value={formData.expectedOutcome} onChange={handleInputChange}
                    placeholder="e.g. A functioning web portal"
                    className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-xl px-4 py-3.5 font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-secondary" 
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-6 border-t border-outline-variant/20 flex justify-end gap-4">
               <button type="button" onClick={() => navigate(-1)} className="px-6 py-3 rounded-xl font-label-md text-[14px] font-bold text-secondary hover:bg-surface-container transition-colors">
                 Cancel
               </button>
               <button type="submit" disabled={loading} className="px-8 py-3 bg-primary text-on-primary rounded-xl font-label-md text-[14px] font-bold hover:bg-primary-fixed-variant transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50">
                 {loading ? 'Submitting...' : 'Submit Project Proposal'}
                 <span className="material-symbols-outlined text-[18px]">send</span>
               </button>
            </div>
          </motion.div>

          {/* Right Column: Project Category (Bento) */}
          <motion.div variants={itemVariants} className="w-full lg:w-[350px] shrink-0 flex flex-col gap-4">
             <div className="bg-surface-container-lowest/80 backdrop-blur-md rounded-2xl p-5 border border-outline-variant/30 mb-2">
                <h3 className="font-label-md text-[13px] font-bold uppercase tracking-wider text-on-surface mb-1">Project Category</h3>
                <p className="font-body-sm text-[12px] text-secondary">Select the type of academic work this proposal represents.</p>
             </div>

             {[
               { id: 'sdp', title: 'SDP Project', desc: 'Software Development Project', icon: 'laptop_mac' },
               { id: 'assignment', title: 'Course Assignment', desc: 'Standard coursework module', icon: 'assignment' },
               { id: 'research', title: 'Research Paper', desc: 'Academic publication research', icon: 'science' },
               { id: 'thesis', title: 'Thesis / Dissertation', desc: 'Masters or PhD culmination', icon: 'school' }
             ].map((cat) => (
               <label key={cat.id} className="cursor-pointer group relative block w-full">
                 <input 
                   className="peer sr-only" type="radio" name="work_type" 
                   value={cat.id} checked={selectedType === cat.id} onChange={() => setSelectedType(cat.id)}
                 />
                 <div className="bg-surface/60 backdrop-blur-xl border border-outline-variant/40 rounded-[20px] p-5 transition-all duration-300 peer-checked:border-primary peer-checked:bg-primary/5 hover:border-primary/40 flex items-center gap-4">
                   <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${selectedType === cat.id ? 'bg-primary text-on-primary shadow-md shadow-primary/20' : 'bg-surface-container text-secondary group-hover:bg-surface-variant'}`}>
                     <span className="material-symbols-outlined text-[24px]">{cat.icon}</span>
                   </div>
                   <div>
                     <h4 className={`font-title-md text-[16px] font-bold transition-colors ${selectedType === cat.id ? 'text-primary' : 'text-on-surface'}`}>{cat.title}</h4>
                     <p className="font-body-sm text-[12px] text-on-surface-variant leading-tight mt-1">{cat.desc}</p>
                   </div>
                   <div className={`absolute top-1/2 -translate-y-1/2 right-5 transition-all ${selectedType === cat.id ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                     <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                   </div>
                 </div>
               </label>
             ))}
          </motion.div>

        </form>
      </motion.div>
    </div>
  );
};

export default CreateNewWork;
