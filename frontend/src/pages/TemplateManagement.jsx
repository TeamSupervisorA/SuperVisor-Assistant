import React from 'react';

const TemplateManagement = () => {
  return (
    <div className="max-w-[1440px] mx-auto p-margin_mobile md:p-margin_desktop w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="font-headline-lg text-[24px] md:text-[32px] font-bold text-on-surface mb-2">Document Templates</h2>
          <p className="font-body-lg text-[18px] text-on-surface-variant">Manage official university templates for research, thesis, and assignments.</p>
        </div>
        <button className="bg-primary text-on-primary rounded-lg py-2.5 px-6 font-label-md text-[12px] font-semibold flex items-center justify-center gap-2 hover:bg-primary-container transition-colors shadow-sm self-start md:self-auto">
          <span className="material-symbols-outlined text-[20px]">upload_file</span>
          Upload New Template
        </button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Card 1 */}
        <div className="bg-surface-container-lowest rounded-[24px] p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),_0px_2px_4px_-2px_rgba(0,0,0,0.05)] border border-outline-variant/30 flex flex-col group hover:-translate-y-1 transition-transform duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-lg bg-error/10 flex items-center justify-center text-error">
              <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>picture_as_pdf</span>
            </div>
            <span className="bg-error/10 text-error font-label-md text-[12px] font-semibold px-2 py-1 rounded-full">PDF</span>
          </div>
          <h3 className="font-title-lg text-[20px] font-semibold text-on-surface mb-2 line-clamp-2">SDP Proposal Template</h3>
          <p className="font-body-sm text-[14px] text-on-surface-variant mb-6 mt-auto flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">update</span>
            Updated: Oct 12, 2023
          </p>
          <div className="flex gap-2 mt-auto border-t border-outline-variant/50 pt-4">
            <button className="flex-1 bg-surface-container border border-primary/20 text-primary rounded-lg py-1.5 font-label-md text-[12px] font-semibold hover:bg-primary/10 transition-colors flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-[16px]">visibility</span> Preview
            </button>
            <button className="p-1.5 text-secondary hover:text-primary rounded-lg hover:bg-surface-container transition-colors" title="Edit">
              <span className="material-symbols-outlined text-[20px]">edit</span>
            </button>
            <button className="p-1.5 text-secondary hover:text-primary rounded-lg hover:bg-surface-container transition-colors" title="Download">
              <span className="material-symbols-outlined text-[20px]">download</span>
            </button>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-surface-container-lowest rounded-[24px] p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),_0px_2px_4px_-2px_rgba(0,0,0,0.05)] border border-outline-variant/30 flex flex-col group hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 text-primary">
            <span className="material-symbols-outlined text-[24px]">magic_button</span>
          </div>
          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
            </div>
            <span className="bg-tertiary/10 text-tertiary font-label-md text-[12px] font-semibold px-2 py-1 rounded-full mr-6">DOCX</span>
          </div>
          <h3 className="font-title-lg text-[20px] font-semibold text-on-surface mb-2 line-clamp-2">Research Paper Template</h3>
          <p className="font-body-sm text-[14px] text-on-surface-variant mb-6 mt-auto flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">update</span>
            Updated: Nov 05, 2023
          </p>
          <div className="flex gap-2 mt-auto border-t border-outline-variant/50 pt-4">
            <button className="flex-1 bg-surface-container border border-primary/20 text-primary rounded-lg py-1.5 font-label-md text-[12px] font-semibold hover:bg-primary/10 transition-colors flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-[16px]">visibility</span> Preview
            </button>
            <button className="p-1.5 text-secondary hover:text-primary rounded-lg hover:bg-surface-container transition-colors" title="Edit">
              <span className="material-symbols-outlined text-[20px]">edit</span>
            </button>
            <button className="p-1.5 text-secondary hover:text-primary rounded-lg hover:bg-surface-container transition-colors" title="Download">
              <span className="material-symbols-outlined text-[20px]">download</span>
            </button>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-surface-container-lowest rounded-[24px] p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),_0px_2px_4px_-2px_rgba(0,0,0,0.05)] border border-outline-variant/30 flex flex-col group hover:-translate-y-1 transition-transform duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
            </div>
            <span className="bg-tertiary/10 text-tertiary font-label-md text-[12px] font-semibold px-2 py-1 rounded-full">DOCX</span>
          </div>
          <h3 className="font-title-lg text-[20px] font-semibold text-on-surface mb-2 line-clamp-2">Thesis Chapter Template</h3>
          <p className="font-body-sm text-[14px] text-on-surface-variant mb-6 mt-auto flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">update</span>
            Updated: Sep 28, 2023
          </p>
          <div className="flex gap-2 mt-auto border-t border-outline-variant/50 pt-4">
            <button className="flex-1 bg-surface-container border border-primary/20 text-primary rounded-lg py-1.5 font-label-md text-[12px] font-semibold hover:bg-primary/10 transition-colors flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-[16px]">visibility</span> Preview
            </button>
            <button className="p-1.5 text-secondary hover:text-primary rounded-lg hover:bg-surface-container transition-colors" title="Edit">
              <span className="material-symbols-outlined text-[20px]">edit</span>
            </button>
            <button className="p-1.5 text-secondary hover:text-primary rounded-lg hover:bg-surface-container transition-colors" title="Download">
              <span className="material-symbols-outlined text-[20px]">download</span>
            </button>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-surface-container-lowest rounded-[24px] p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),_0px_2px_4px_-2px_rgba(0,0,0,0.05)] border border-outline-variant/30 flex flex-col group hover:-translate-y-1 transition-transform duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-lg bg-error/10 flex items-center justify-center text-error">
              <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>picture_as_pdf</span>
            </div>
            <span className="bg-error/10 text-error font-label-md text-[12px] font-semibold px-2 py-1 rounded-full">PDF</span>
          </div>
          <h3 className="font-title-lg text-[20px] font-semibold text-on-surface mb-2 line-clamp-2">Assignment Rubric Template</h3>
          <p className="font-body-sm text-[14px] text-on-surface-variant mb-6 mt-auto flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">update</span>
            Updated: Aug 15, 2023
          </p>
          <div className="flex gap-2 mt-auto border-t border-outline-variant/50 pt-4">
            <button className="flex-1 bg-surface-container border border-primary/20 text-primary rounded-lg py-1.5 font-label-md text-[12px] font-semibold hover:bg-primary/10 transition-colors flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-[16px]">visibility</span> Preview
            </button>
            <button className="p-1.5 text-secondary hover:text-primary rounded-lg hover:bg-surface-container transition-colors" title="Edit">
              <span className="material-symbols-outlined text-[20px]">edit</span>
            </button>
            <button className="p-1.5 text-secondary hover:text-primary rounded-lg hover:bg-surface-container transition-colors" title="Download">
              <span className="material-symbols-outlined text-[20px]">download</span>
            </button>
          </div>
        </div>
      </div>

      {/* Drag and Drop Zone */}
      <div className="mt-8 border-2 border-dashed border-[#64748B] rounded-xl p-8 flex flex-col items-center justify-center bg-surface-container-lowest hover:bg-primary/5 transition-colors cursor-pointer group">
        <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
          <span className="material-symbols-outlined text-[32px]">cloud_upload</span>
        </div>
        <h4 className="font-title-lg text-[20px] font-semibold text-on-surface mb-2">Drag & Drop new templates here</h4>
        <p className="font-body-sm text-[14px] text-on-surface-variant mb-4">or click to browse from your computer</p>
        <p className="font-label-md text-[12px] font-semibold text-secondary">Supported formats: PDF, DOCX, XLSX (Max 10MB)</p>
      </div>
    </div>
  );
};

export default TemplateManagement;
