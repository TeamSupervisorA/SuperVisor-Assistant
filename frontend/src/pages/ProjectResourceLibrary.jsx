import React from 'react';

const ProjectResourceLibrary = () => {
  return (
    <div className="max-w-container_max mx-auto p-margin_mobile md:p-margin_desktop w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="font-headline-lg text-[32px] md:text-[48px] font-bold text-on-surface">Resource Library</h1>
          <p className="font-body-lg text-[18px] text-on-surface-variant mt-2 max-w-2xl">Manage and discover shared assets, documentation, and tools across all active research projects.</p>
        </div>
        <div className="flex gap-4">
          <button className="px-6 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-label-md text-[12px] font-semibold text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-2 shadow-sm">
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            Filter
          </button>
          <button className="px-6 py-3 bg-primary text-on-primary rounded-lg font-label-md text-[12px] font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm">
            <span className="material-symbols-outlined text-[18px]">upload</span>
            Upload Resource
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Sidebar Filters */}
        <aside className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-8 hidden lg:flex">
          {/* Categories */}
          <div>
            <h3 className="font-label-md text-[12px] font-semibold text-secondary uppercase tracking-wider mb-4">Categories</h3>
            <ul className="flex flex-col gap-1">
              <li>
                <button className="w-full text-left px-3 py-2 rounded-md bg-primary-container text-on-primary-container font-body-md text-[16px] flex items-center justify-between">
                  All Resources
                  <span className="font-label-md text-[12px] font-semibold bg-surface-container-lowest text-primary px-2 py-0.5 rounded-full">142</span>
                </button>
              </li>
              <li>
                <button className="w-full text-left px-3 py-2 rounded-md text-on-surface-variant hover:bg-surface-container-low font-body-md text-[16px] flex items-center justify-between transition-colors">
                  Software
                  <span className="font-label-md text-[12px] font-semibold text-secondary">38</span>
                </button>
              </li>
              <li>
                <button className="w-full text-left px-3 py-2 rounded-md text-on-surface-variant hover:bg-surface-container-low font-body-md text-[16px] flex items-center justify-between transition-colors">
                  Datasets
                  <span className="font-label-md text-[12px] font-semibold text-secondary">56</span>
                </button>
              </li>
              <li>
                <button className="w-full text-left px-3 py-2 rounded-md text-on-surface-variant hover:bg-surface-container-low font-body-md text-[16px] flex items-center justify-between transition-colors">
                  Documentation
                  <span className="font-label-md text-[12px] font-semibold text-secondary">24</span>
                </button>
              </li>
              <li>
                <button className="w-full text-left px-3 py-2 rounded-md text-on-surface-variant hover:bg-surface-container-low font-body-md text-[16px] flex items-center justify-between transition-colors">
                  Design Assets
                  <span className="font-label-md text-[12px] font-semibold text-secondary">24</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Team Members */}
          <div>
            <h3 className="font-label-md text-[12px] font-semibold text-secondary uppercase tracking-wider mb-4">Shared By</h3>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary" type="checkbox" />
                <span className="font-body-sm text-[14px] text-on-surface group-hover:text-primary transition-colors">Dr. Sarah Jenkins</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary" type="checkbox" />
                <span className="font-body-sm text-[14px] text-on-surface group-hover:text-primary transition-colors">Michael Chen</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary" type="checkbox" />
                <span className="font-body-sm text-[14px] text-on-surface group-hover:text-primary transition-colors">Elena Rodriguez</span>
              </label>
            </div>
            <button className="text-primary font-label-md text-[12px] font-semibold mt-4 hover:underline">Show all members</button>
          </div>
        </aside>

        {/* Content Grid Area */}
        <div className="flex-1 w-full flex flex-col gap-10">
          {/* Pinned Resources (Bento style) */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary text-[20px]">push_pin</span>
              <h2 className="font-title-lg text-[20px] font-semibold text-on-surface">Pinned & Recommended</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Pinned Card 1 (AI Recommended) */}
              <div className="bg-surface-container-lowest rounded-2xl shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),0px_2px_4px_-2px_rgba(0,0,0,0.05)] p-6 border border-outline-variant/20 relative overflow-hidden group hover:shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] transition-shadow border-l-2 border-l-primary cursor-pointer resource-card">
                <div className="absolute top-4 right-4 text-primary bg-primary/10 p-1.5 rounded-full">
                  <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-tertiary-container flex items-center justify-center text-on-tertiary">
                    <span className="material-symbols-outlined">data_object</span>
                  </div>
                  <div>
                    <span className="font-label-md text-[12px] font-semibold text-secondary">Dataset • CSV</span>
                  </div>
                </div>
                <h3 className="font-title-lg text-[20px] font-semibold text-on-surface mb-2 line-clamp-1">Q3 Global Climate Metrics</h3>
                <p className="font-body-sm text-[14px] text-on-surface-variant mb-6 line-clamp-2">Aggregated sensor data from 400 global nodes. Cleaned and pre-processed for ML pipeline integration.</p>
                <div className="flex items-center justify-between border-t border-outline-variant/30 pt-4 mt-auto">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-surface-variant overflow-hidden border border-outline-variant/30">
                      <img alt="Profile avatar" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC-tTbTA0MLRwIYQq1TG7Mf0YcOSQsXT15qL0C_7rDQXW3duFaPy2cBn-qke0hDZ4L0UwXvyEQVDtuZuN6iwjbE_tWf4DbF-iFyqdYmhF2l2YW4ki_wdBYCsLQt0-iJK-VANk6A9F2dAlLB2JVKHKyw3FHEgkldQrYl91ueFhE-Ksc_aIE3-W87ebBbyt9TN4kZrJsdKN2mYtTXZk8O-2fGGERb24t2oCNoNiYfNJQr7cRTWmfHVIJRebpisPgd1VsBNYETmCBnH0c" />
                    </div>
                    <span className="font-label-md text-[12px] font-semibold text-on-surface-variant">Dr. Jenkins</span>
                  </div>
                  <span className="font-body-sm text-[14px] text-secondary">Oct 12</span>
                </div>
                {/* Quick Actions Overlay */}
                <div className="card-actions-overlay absolute inset-0 bg-surface-container-lowest/95 backdrop-blur-sm flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button className="p-2 rounded-full bg-surface-variant text-on-surface hover:bg-primary hover:text-on-primary transition-colors" title="Download">
                    <span className="material-symbols-outlined">download</span>
                  </button>
                  <button className="p-2 rounded-full bg-surface-variant text-on-surface hover:bg-primary hover:text-on-primary transition-colors" title="Preview">
                    <span className="material-symbols-outlined">visibility</span>
                  </button>
                  <button className="p-2 rounded-full bg-surface-variant text-on-surface hover:bg-primary hover:text-on-primary transition-colors" title="Share Link">
                    <span className="material-symbols-outlined">link</span>
                  </button>
                </div>
              </div>

              {/* Pinned Card 2 */}
              <div className="bg-surface-container-lowest rounded-2xl shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),0px_2px_4px_-2px_rgba(0,0,0,0.05)] p-6 border border-outline-variant/20 relative overflow-hidden group hover:shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] transition-shadow cursor-pointer resource-card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-surface-variant flex items-center justify-center text-on-surface">
                    <span className="material-symbols-outlined">description</span>
                  </div>
                  <div>
                    <span className="font-label-md text-[12px] font-semibold text-secondary">Documentation • PDF</span>
                  </div>
                </div>
                <h3 className="font-title-lg text-[20px] font-semibold text-on-surface mb-2 line-clamp-1">Lab Safety Protocol v2.4</h3>
                <p className="font-body-sm text-[14px] text-on-surface-variant mb-6 line-clamp-2">Updated compliance guidelines for the new biochemistry wing. Mandatory reading for all assistants.</p>
                <div className="flex items-center justify-between border-t border-outline-variant/30 pt-4 mt-auto">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-on-primary font-label-md text-[10px]">
                      SA
                    </div>
                    <span className="font-label-md text-[12px] font-semibold text-on-surface-variant">System Admin</span>
                  </div>
                  <span className="font-body-sm text-[14px] text-secondary">Sep 28</span>
                </div>
                {/* Quick Actions Overlay */}
                <div className="card-actions-overlay absolute inset-0 bg-surface-container-lowest/95 backdrop-blur-sm flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button className="p-2 rounded-full bg-surface-variant text-on-surface hover:bg-primary hover:text-on-primary transition-colors" title="Download">
                    <span className="material-symbols-outlined">download</span>
                  </button>
                  <button className="p-2 rounded-full bg-surface-variant text-on-surface hover:bg-primary hover:text-on-primary transition-colors" title="Preview">
                    <span className="material-symbols-outlined">visibility</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* All Resources Grid */}
          <section>
            <h2 className="font-title-lg text-[20px] font-semibold text-on-surface mb-6">Recent Uploads</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Resource Card 1 (Code) */}
              <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 p-5 flex flex-col group hover:shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),0px_2px_4px_-2px_rgba(0,0,0,0.05)] transition-shadow cursor-pointer resource-card relative overflow-hidden">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-inverse-surface flex items-center justify-center text-inverse-on-surface">
                      <span className="material-symbols-outlined text-[18px]">terminal</span>
                    </div>
                    <span className="font-label-md text-[12px] font-semibold text-secondary uppercase tracking-wide">Software</span>
                  </div>
                </div>
                <h4 className="font-headline-md text-[24px] font-semibold text-on-surface mb-1">core-analysis-pipeline</h4>
                <p className="font-body-sm text-[14px] text-on-surface-variant mb-4 line-clamp-2">Python scripts for running the primary data analysis on the cluster. Includes Dockerfile.</p>
                <div className="mt-auto pt-4 border-t border-outline-variant/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full overflow-hidden bg-surface-variant">
                      <img alt="User Avatar" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA1iEU6Y-g1RltY8WFiKlInXTp7ZjGqmNb1jFktbjIpu26cT_aiI0F6c7HQKG_djoxtbYZ8xz6rl04CgjCpvr3HQFA7Meg33o80UK6XXOOeQ0Vuqxhlny4_omDO35n91VE0XQaNYK2pwgk12nPi2V9jmqG4jVLXrk2bjVyar0Htikq1T7B5Op7_DDcpxxG0obF1nSxj79rUzW0lbwvZnMlB0fx_aBBFszjpb5I8f4v-480HJxXsKur-jVMgu1kZNPohbkA-Dbw3RGE" />
                    </div>
                    <span className="font-label-md text-[12px] font-semibold text-on-surface">M. Chen</span>
                  </div>
                  <span className="font-body-sm text-[14px] text-secondary">2 days ago</span>
                </div>
                <div className="card-actions-overlay absolute inset-0 bg-surface-container-lowest/90 backdrop-blur-[2px] flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button className="bg-surface border border-outline-variant text-on-surface px-4 py-2 rounded-lg font-label-md text-[12px] font-semibold hover:bg-surface-container-low transition-colors">View Repo</button>
                  <button className="bg-primary text-on-primary p-2 rounded-lg hover:bg-primary/90 transition-colors">
                    <span className="material-symbols-outlined">share</span>
                  </button>
                </div>
              </div>

              {/* Resource Card 2 (Design) */}
              <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 p-5 flex flex-col group hover:shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),0px_2px_4px_-2px_rgba(0,0,0,0.05)] transition-shadow cursor-pointer resource-card relative overflow-hidden">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-error-container flex items-center justify-center text-on-error-container">
                      <span className="material-symbols-outlined text-[18px]">brush</span>
                    </div>
                    <span className="font-label-md text-[12px] font-semibold text-secondary uppercase tracking-wide">Design Assets</span>
                  </div>
                </div>
                <h4 className="font-headline-md text-[24px] font-semibold text-on-surface mb-1">Project Poster Template</h4>
                <p className="font-body-sm text-[14px] text-on-surface-variant mb-4 line-clamp-2">Standardized Figma template for the upcoming end-of-year symposium. Includes university branding components.</p>
                <div className="mt-auto pt-4 border-t border-outline-variant/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full overflow-hidden bg-surface-variant">
                      <img alt="User Avatar" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCttjqttMLVoPQHxBBy1_v-oAn1aj8M40y-hcJWVOUYjI98y9C5QqFg2Jli3_y9r6hDBbKmPNqHMh-rcAeNQ1-NPVVg-bSIKRPSXJEmZkA8AVacjAIFsBBM_cn6-2lYayJXVCVsK1BgONUwvnI-rzWv2PayIPyee58aUh5wHaEbRVLC35cPMO1nyg8YBxgQQ15AzkkEvgc-ZzsQzuVHwlS9lHYALZsLWqFbGvgm_3V0kbjOOUN5QBaUdfPBCimDTb2Z4Noob4fbQeU" />
                    </div>
                    <span className="font-label-md text-[12px] font-semibold text-on-surface">E. Rodriguez</span>
                  </div>
                  <span className="font-body-sm text-[14px] text-secondary">5 days ago</span>
                </div>
                <div className="card-actions-overlay absolute inset-0 bg-surface-container-lowest/90 backdrop-blur-[2px] flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button className="bg-surface border border-outline-variant text-on-surface px-4 py-2 rounded-lg font-label-md text-[12px] font-semibold hover:bg-surface-container-low transition-colors">Open Figma</button>
                  <button className="bg-primary text-on-primary p-2 rounded-lg hover:bg-primary/90 transition-colors">
                    <span className="material-symbols-outlined">download</span>
                  </button>
                </div>
              </div>

              {/* Resource Card 3 (Data) */}
              <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 p-5 flex flex-col group hover:shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),0px_2px_4px_-2px_rgba(0,0,0,0.05)] transition-shadow cursor-pointer resource-card relative overflow-hidden">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-tertiary-container flex items-center justify-center text-on-tertiary">
                      <span className="material-symbols-outlined text-[18px]">table_chart</span>
                    </div>
                    <span className="font-label-md text-[12px] font-semibold text-secondary uppercase tracking-wide">Dataset</span>
                  </div>
                </div>
                <h4 className="font-headline-md text-[24px] font-semibold text-on-surface mb-1">Participant_Survey_Raw.csv</h4>
                <p className="font-body-sm text-[14px] text-on-surface-variant mb-4 line-clamp-2">Anonymized responses from the initial control group. Needs cleaning before ingestion.</p>
                <div className="mt-auto pt-4 border-t border-outline-variant/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full overflow-hidden bg-surface-variant">
                      <img alt="User Avatar" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB0JHQ0WjofaCaqNnNvTUVMNRIz5ApEZA8NTMU8d6DHiJhXif0_EN7Tx2-HXkO2mmuHPJ2azcMOC3mgVrPMzAg4eVRCnUlOfAZUWQlBCw0tiKoXh9B6DJsWjqkvvb1rw034Fa__JmUxPEBy9hBYHDVJ77LSs2PcMid1AoBmE3HIb8obJFsTZGtha47uSU9kUBALyFH1Z4_jr4KL9hKgfe62-tnaPOi3WhWTflQXomWRC10Q9dsCl4e6HAhlf6wHKvxURxag9J3JjAE" />
                    </div>
                    <span className="font-label-md text-[12px] font-semibold text-on-surface">Dr. Jenkins</span>
                  </div>
                  <span className="font-body-sm text-[14px] text-secondary">1 week ago</span>
                </div>
                <div className="card-actions-overlay absolute inset-0 bg-surface-container-lowest/90 backdrop-blur-[2px] flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button className="bg-surface border border-outline-variant text-on-surface px-4 py-2 rounded-lg font-label-md text-[12px] font-semibold hover:bg-surface-container-low transition-colors">Preview</button>
                  <button className="bg-primary text-on-primary p-2 rounded-lg hover:bg-primary/90 transition-colors">
                    <span className="material-symbols-outlined">download</span>
                  </button>
                </div>
              </div>

              {/* Resource Card 4 (Doc) */}
              <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 p-5 flex flex-col group hover:shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),0px_2px_4px_-2px_rgba(0,0,0,0.05)] transition-shadow cursor-pointer resource-card relative overflow-hidden">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-surface-variant flex items-center justify-center text-on-surface">
                      <span className="material-symbols-outlined text-[18px]">description</span>
                    </div>
                    <span className="font-label-md text-[12px] font-semibold text-secondary uppercase tracking-wide">Documentation</span>
                  </div>
                </div>
                <h4 className="font-headline-md text-[24px] font-semibold text-on-surface mb-1">Literature_Review_Draft.docx</h4>
                <p className="font-body-sm text-[14px] text-on-surface-variant mb-4 line-clamp-2">First draft of the background section for the upcoming grant proposal. Please review and comment.</p>
                <div className="mt-auto pt-4 border-t border-outline-variant/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full overflow-hidden bg-surface-variant">
                      <img alt="User Avatar" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBPcHFsX1DsWvr7cx1BMI-zwKaHPEFT74mxbZLGtwG2HCHTHxbvLMUD-J2yRd18W6_Q-SZ6E0gKnX3CeZn_LAsG0S9t2xX9zop7AA7Fmw4cI4kihCXb6Bu6a33G8ZanT_dr9xHS0WpNZrpQhxoWp3Z7OgRrM_aMp9tcpvzSIsUV8K7Ogb4uNnpCzSzs_KKAGKUgd8wCEI44NPyAa9VSv7GS-S9wzAGbK5ovPiWB6UP7JRufVCbzHODZJbRASi0Mqe2SavgF8kqfZFo" />
                    </div>
                    <span className="font-label-md text-[12px] font-semibold text-on-surface">M. Chen</span>
                  </div>
                  <span className="font-body-sm text-[14px] text-secondary">2 weeks ago</span>
                </div>
                <div className="card-actions-overlay absolute inset-0 bg-surface-container-lowest/90 backdrop-blur-[2px] flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button className="bg-surface border border-outline-variant text-on-surface px-4 py-2 rounded-lg font-label-md text-[12px] font-semibold hover:bg-surface-container-low transition-colors">Read</button>
                  <button className="bg-primary text-on-primary p-2 rounded-lg hover:bg-primary/90 transition-colors">
                    <span className="material-symbols-outlined">download</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
      <div className="h-20 w-full"></div> {/* Bottom spacing */}
    </div>
  );
};

export default ProjectResourceLibrary;
