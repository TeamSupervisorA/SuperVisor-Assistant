import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiFetch } from '../lib/api';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const Settings = () => {
  const [settings, setSettings] = useState({
    aiChatbot: true,
    ideaGenerator: true,
    proposalFeedback: true,
    plagiarismAutoCheck: false,
    systemPrompt: 'You are a strict but fair academic supervisor. Your primary role is to guide students through their research process without writing the content for them. Always encourage critical thinking and cite relevant methodological frameworks when offering feedback.',
    plagiarismTolerance: 20
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await apiFetch('/api/users/settings');
        if (res && res.data) {
          setSettings(res.data);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiFetch('/api/users/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
      if (res.success) {
        alert('Settings saved successfully!');
      }
    } catch (err) {
      alert('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-80px)] bg-background relative overflow-hidden flex flex-col">
      {/* Premium Background Mesh */}
      <div className="absolute top-0 right-1/4 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[500px] bg-tertiary-container/5 rounded-full blur-[80px] pointer-events-none z-0"></div>

      <motion.div 
        initial="hidden" animate="show" variants={containerVariants}
        className="relative z-10 pt-6 px-6 md:px-10 pb-12 w-full max-w-[1440px] mx-auto flex flex-col gap-8"
      >
        <motion.div variants={itemVariants} className="mb-2">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary font-label-md text-[12px] font-bold mb-3 border border-primary/20 uppercase tracking-wide">System Configuration</span>
          <h2 className="font-display text-[32px] md:text-[42px] font-black text-on-surface tracking-tight leading-none mb-2">AI & Plagiarism Settings</h2>
          <p className="font-title-md text-[16px] text-on-surface-variant font-medium max-w-xl">Configure institutional safeguards and artificial intelligence parameters for the supervision suite.</p>
        </motion.div>

        {/* Bento Grid Layout */}
        <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Column 1: AI Settings & Toggles */}
          <div className="lg:col-span-2 space-y-6 lg:space-y-8">
            
            {/* AI Features Card */}
            <motion.section variants={itemVariants} className="bg-surface/80 backdrop-blur-xl rounded-[32px] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border-l-4 border-l-primary border-y border-r border-outline-variant/30 relative overflow-hidden">
              <div className="absolute top-6 right-6 w-16 h-16 bg-primary/10 rounded-full blur-[20px] pointer-events-none"></div>
              <div className="absolute top-6 right-6 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px]">auto_awesome</span>
              </div>
              
              <h3 className="font-title-lg text-[22px] font-bold text-on-surface mb-8">AI Feature Toggles</h3>
              <div className="space-y-4">
                
                {[
                  { id: 'aiChatbot', label: 'AI Supervisor Chatbot', desc: 'Enable the 24/7 student query assistant.' },
                  { id: 'ideaGenerator', label: 'Project Idea Generator', desc: 'Allow students to generate research topics.' },
                  { id: 'proposalFeedback', label: 'Proposal Feedback', desc: 'Automated critique on initial draft submissions.' },
                  { id: 'plagiarismAutoCheck', label: 'Plagiarism Auto-Check', desc: 'Run similarity reports on all document uploads automatically.', color: 'tertiary' }
                ].map((feature) => (
                  <div key={feature.id} className="flex items-center justify-between p-5 bg-surface-container-lowest/50 border border-outline-variant/40 rounded-[20px] hover:border-outline-variant/80 hover:shadow-sm transition-all group">
                    <div>
                      <h4 className="font-title-md text-[18px] font-bold text-on-surface mb-1">{feature.label}</h4>
                      <p className="font-body-sm text-[14px] text-secondary">{feature.desc}</p>
                    </div>
                    <div className="relative inline-block w-14 mr-2 align-middle select-none transition duration-200 ease-in flex-shrink-0">
                      <input 
                        checked={settings[feature.id]} 
                        onChange={e => handleChange(feature.id, e.target.checked)} 
                        className={`toggle-checkbox absolute block w-7 h-7 rounded-full bg-white border-4 border-surface-variant appearance-none cursor-pointer z-10 transition-transform duration-300 ${settings[feature.id] ? 'translate-x-7 border-transparent shadow-sm' : ''}`} 
                        type="checkbox" 
                      />
                      <label className={`toggle-label block overflow-hidden h-7 rounded-full cursor-pointer transition-colors duration-300 ${settings[feature.id] ? (feature.color === 'tertiary' ? 'bg-tertiary' : 'bg-primary') : 'bg-surface-variant'}`}></label>
                    </div>
                  </div>
                ))}

              </div>
            </motion.section>

            {/* Prompt Editor Card */}
            <motion.section variants={itemVariants} className="bg-surface/80 backdrop-blur-xl rounded-[32px] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border-l-4 border-l-secondary border-y border-r border-outline-variant/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-sm">
                     <span className="material-symbols-outlined text-[20px]">edit_note</span>
                  </div>
                  <h3 className="font-title-lg text-[22px] font-bold text-on-surface">Prompt Template Editor</h3>
                </div>
                <button 
                  onClick={() => handleChange('systemPrompt', 'You are a strict but fair academic supervisor. Your primary role is to guide students through their research process without writing the content for them. Always encourage critical thinking and cite relevant methodological frameworks when offering feedback.')} 
                  className="text-secondary hover:text-primary font-label-md text-[12px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">restart_alt</span> Reset Default
                </button>
              </div>
              <p className="font-body-sm text-[14px] text-secondary mb-6">Define the systemic persona and constraints for the AI Supervisor. This will govern how it responds to students.</p>
              
              <div className="relative group">
                <textarea 
                  value={settings.systemPrompt} 
                  onChange={e => handleChange('systemPrompt', e.target.value)} 
                  className="w-full h-48 p-5 rounded-[20px] border border-outline-variant/50 bg-surface-container-lowest/50 text-on-surface font-body-md text-[15px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-y shadow-inner transition-colors leading-relaxed" 
                  placeholder="Enter system prompt..."
                />
              </div>
            </motion.section>
          </div>

          {/* Column 2: Plagiarism Settings */}
          <div className="lg:col-span-1 space-y-6 lg:space-y-8">
            <motion.section variants={itemVariants} className="bg-surface/80 backdrop-blur-xl rounded-[32px] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-outline-variant/30">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-[20px]">policy</span>
                 </div>
                 <h3 className="font-title-lg text-[22px] font-bold text-on-surface">Tolerances</h3>
              </div>
              <p className="font-body-sm text-[14px] text-secondary mb-8 leading-relaxed">Configure acceptable similarity thresholds for student submissions before auto-flagging.</p>
              
              <div className="mb-8">
                <label className="block font-label-md text-[13px] font-bold text-on-surface-variant uppercase tracking-wider mb-3">Allowed Similarity</label>
                <div className="flex items-center gap-4 bg-surface-container-lowest/50 p-2 rounded-[20px] border border-outline-variant/40">
                  <input 
                    value={settings.plagiarismTolerance} 
                    onChange={e => handleChange('plagiarismTolerance', parseInt(e.target.value))} 
                    className="flex-1 bg-transparent px-4 py-3 text-center font-display text-[32px] font-black text-on-surface focus:outline-none" 
                    type="number" min="0" max="100" 
                  />
                  <div className="w-16 h-16 flex items-center justify-center bg-surface rounded-xl shadow-sm border border-outline-variant/30">
                     <span className="font-display text-[24px] font-bold text-secondary">%</span>
                  </div>
                </div>
              </div>

              {/* Risk Thresholds */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                   <h4 className="font-label-md text-[12px] font-bold text-secondary uppercase tracking-widest">Risk Zones</h4>
                   <div className="flex-1 h-px bg-outline-variant/30"></div>
                </div>
                
                {/* Safe */}
                <div className="flex items-center justify-between p-4 rounded-[16px] bg-primary/10 border border-primary/20 group hover:bg-primary/15 transition-colors">
                  <div className="flex items-center gap-3 text-primary">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    <span className="font-title-sm text-[15px] font-bold">Safe</span>
                  </div>
                  <span className="font-label-md text-[13px] font-bold bg-surface px-3 py-1.5 rounded-lg text-primary shadow-sm">0 - {settings.plagiarismTolerance}%</span>
                </div>

                {/* Warning */}
                <div className="flex items-center justify-between p-4 rounded-[16px] bg-surface-variant/50 border border-outline-variant group hover:bg-surface-variant/80 transition-colors">
                  <div className="flex items-center gap-3 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px]">warning</span>
                    <span className="font-title-sm text-[15px] font-bold">Warning</span>
                  </div>
                  <span className="font-label-md text-[13px] font-bold bg-surface px-3 py-1.5 rounded-lg text-on-surface-variant shadow-sm">{settings.plagiarismTolerance + 1} - {Math.min(settings.plagiarismTolerance + 15, 100)}%</span>
                </div>

                {/* Danger */}
                <div className="flex items-center justify-between p-4 rounded-[16px] bg-error/10 border border-error/20 group hover:bg-error/15 transition-colors">
                  <div className="flex items-center gap-3 text-error">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    <span className="font-title-sm text-[15px] font-bold">High Risk</span>
                  </div>
                  <span className="font-label-md text-[13px] font-bold bg-surface px-3 py-1.5 rounded-lg text-error shadow-sm">{Math.min(settings.plagiarismTolerance + 16, 100)}%+</span>
                </div>
              </div>
            </motion.section>
          </div>
        </motion.div>

        {/* Footer Actions */}
        <motion.div variants={itemVariants} className="mt-4 pt-6 border-t border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-6 pb-6">
          <div className="flex items-start gap-4 max-w-3xl bg-surface-variant/30 p-4 rounded-[20px]">
            <span className="material-symbols-outlined text-secondary text-[24px]">info</span>
            <p className="font-body-sm text-[14px] text-secondary leading-relaxed">
              <strong className="text-on-surface">Disclaimer:</strong> Artificial Intelligence features are designed to function as a support tool for academic supervision. They do not replace human judgment, ethical oversight, or formal institutional academic integrity protocols.
            </p>
          </div>
          <button 
            onClick={handleSave} 
            disabled={saving} 
            className={`px-8 py-4 bg-primary text-on-primary rounded-[16px] font-title-md text-[16px] font-bold shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap flex items-center gap-2 ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {saving ? (
              <><motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="material-symbols-outlined text-[20px]">sync</motion.span> Saving...</>
            ) : (
              <><span className="material-symbols-outlined text-[20px]">save</span> Save Settings</>
            )}
          </button>
        </motion.div>

      </motion.div>
    </div>
  );
};

export default Settings;
