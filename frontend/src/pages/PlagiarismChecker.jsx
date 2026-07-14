import React from 'react';

const PlagiarismChecker = () => {
  return (
    <div className="p-margin_desktop max-w-[1440px] mx-auto w-full flex-1">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2 text-secondary">
            <span className="font-label-md text-[12px] font-semibold uppercase tracking-wider">Document Analysis</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="font-label-md text-[12px] font-semibold">Literature_Review_v1.pdf</span>
          </div>
          <h2 className="font-headline-lg text-[32px] md:text-[48px] font-bold text-on-surface">Plagiarism Scan Results</h2>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-primary text-primary font-label-md text-[12px] font-semibold hover:bg-primary/5 transition-colors">
            <span className="material-symbols-outlined">share</span>
            Share
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-[12px] font-semibold hover:bg-surface-tint transition-colors">
            <span className="material-symbols-outlined">download</span>
            Download Plagiarism Report
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left Column: Summary & Sources */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Result Card */}
          <div className="bg-surface-container-lowest rounded-[24px] p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),_0px_2px_4px_-2px_rgba(0,0,0,0.05)] flex flex-col items-center justify-center text-center relative overflow-hidden border-l-2 border-primary">
            <span className="material-symbols-outlined absolute top-4 right-4 text-primary opacity-50" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <h3 className="font-title-lg text-[20px] font-semibold text-on-surface mb-2">Overall Similarity</h3>
            
            <div className="relative w-48 h-48 flex items-center justify-center my-4">
              {/* Circular Progress SVG Representation */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" fill="none" r="45" stroke="#ffdad6" strokeWidth="10"></circle>
                <circle cx="50" cy="50" fill="none" r="45" stroke="#ba1a1a" strokeDasharray="283" strokeDashoffset="164" strokeWidth="10"></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-[48px] font-bold text-error">42%</span>
              </div>
            </div>
            
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-error-container text-on-error-container font-label-md text-[12px] font-semibold mb-4">
              <span className="material-symbols-outlined text-[16px]">warning</span>
              High Risk
            </div>
            <p className="font-body-sm text-[14px] text-secondary">
              Similarity score is a support tool; teacher must make the final decision.
            </p>
          </div>

          {/* Matched Sources */}
          <div className="bg-surface-container-lowest rounded-[24px] p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),_0px_2px_4px_-2px_rgba(0,0,0,0.05)] flex-1">
            <h3 className="font-title-lg text-[20px] font-semibold text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">source</span>
              Matched Sources
            </h3>
            <div className="flex flex-col gap-4">
              {/* Source 1 */}
              <div className="p-3 rounded-lg border border-surface-container-high hover:bg-surface-container-low transition-colors cursor-pointer">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-label-md text-[12px] font-semibold text-error">24% Match</span>
                  <span className="material-symbols-outlined text-secondary text-[16px]">open_in_new</span>
                </div>
                <h4 className="font-body-md text-[16px] text-on-surface font-semibold truncate">The Impact of AI on Academic Integrity</h4>
                <p className="font-body-sm text-[14px] text-secondary truncate">Journal of Educational Technology, 2023</p>
              </div>

              {/* Source 2 */}
              <div className="p-3 rounded-lg border border-surface-container-high hover:bg-surface-container-low transition-colors cursor-pointer">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-label-md text-[12px] font-semibold text-[#d97706]">12% Match</span>
                  <span className="material-symbols-outlined text-secondary text-[16px]">open_in_new</span>
                </div>
                <h4 className="font-body-md text-[16px] text-on-surface font-semibold truncate">Machine Learning Methodologies in Higher Ed</h4>
                <p className="font-body-sm text-[14px] text-secondary truncate">arxiv.org/abs/2204.12345</p>
              </div>

              {/* Source 3 */}
              <div className="p-3 rounded-lg border border-surface-container-high hover:bg-surface-container-low transition-colors cursor-pointer">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-label-md text-[12px] font-semibold text-secondary">6% Match</span>
                  <span className="material-symbols-outlined text-secondary text-[16px]">open_in_new</span>
                </div>
                <h4 className="font-body-md text-[16px] text-on-surface font-semibold truncate">Student Submission: John_Doe_Final_Draft.docx</h4>
                <p className="font-body-sm text-[14px] text-secondary truncate">Internal Database, Fall 2022</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Document Viewer */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-[24px] p-0 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),_0px_2px_4px_-2px_rgba(0,0,0,0.05)] flex flex-col overflow-hidden">
          {/* Viewer Header */}
          <div className="border-b border-surface-container-high p-4 flex justify-between items-center bg-surface-bright">
            <h3 className="font-title-lg text-[20px] font-semibold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">find_in_page</span>
              Document Comparison View
            </h3>
            <div className="flex items-center gap-2">
              <button className="p-1.5 rounded hover:bg-surface-container-low text-secondary"><span className="material-symbols-outlined text-[20px]">zoom_out</span></button>
              <span className="font-body-sm text-[14px] text-secondary">100%</span>
              <button className="p-1.5 rounded hover:bg-surface-container-low text-secondary"><span className="material-symbols-outlined text-[20px]">zoom_in</span></button>
            </div>
          </div>

          {/* Viewer Canvas */}
          <div className="flex-1 bg-surface-container-low p-8 overflow-y-auto" style={{ maxHeight: '800px' }}>
            {/* Simulated Paper Page */}
            <div className="bg-surface-container-lowest shadow-sm mx-auto p-12 max-w-3xl min-h-[800px] font-body-md text-[16px] leading-relaxed text-on-surface">
              <h1 className="font-headline-md text-[24px] font-semibold mb-6 text-center">A Review of Artificial Intelligence Applications in Modern Pedagogy</h1>
              
              <p className="mb-4">
                The integration of artificial intelligence into educational frameworks has accelerated significantly over the past decade. 
                Educators are increasingly relying on automated systems to assist with grading, content delivery, and student engagement. 
                However, this technological shift brings profound challenges regarding academic integrity and original thought.
              </p>
              
              <p className="mb-4 bg-error/15 text-error rounded px-1 group relative cursor-pointer">
                <span className="absolute -left-6 top-0 opacity-0 group-hover:opacity-100 transition-opacity text-error">
                  <span className="material-symbols-outlined text-[16px]">warning</span>
                </span>
                As noted by several researchers, the rapid deployment of large language models has fundamentally altered the landscape of student assessment. Traditional methods of evaluation, such as essays and take-home examinations, are now highly vulnerable to algorithmic generation. Institutions must adapt their pedagogical strategies to emphasize critical thinking and in-class synthesis rather than mere factual recall.
              </p>

              <p className="mb-4">
                Furthermore, the ethical implications of these tools remain a topic of heated debate. 
                While some argue that AI acts as an equalizer, providing personalized tutoring to disadvantaged students, 
                others maintain that it exacerbates existing inequalities due to the digital divide.
              </p>

              <p className="mb-4 bg-amber-500/15 text-amber-600 rounded px-1 group relative cursor-pointer">
                <span className="absolute -left-6 top-0 opacity-0 group-hover:opacity-100 transition-opacity text-[#d97706]">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                </span>
                To effectively navigate this transition, universities are urged to develop comprehensive policies regarding acceptable AI use. These policies should clearly define the boundaries between technological assistance and academic misconduct, ensuring that students understand the value of their own cognitive labor in the learning process.
              </p>

              <p className="mb-4">
                In conclusion, while artificial intelligence offers unprecedented opportunities for educational enhancement, 
                it necessitates a paradigm shift in how we conceive of and measure student learning. 
                Future research must focus on longitudinal studies assessing the long-term impact of these tools on cognitive development.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlagiarismChecker;
