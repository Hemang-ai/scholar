import React, { useState, useCallback, useEffect } from 'react';
import { generateAcademicPaper } from './services/geminiService';
import { saveNewPaper, getPapers, savePaperVersion, deletePaper } from './services/storage';
import PaperRenderer from './components/PaperRenderer';
import { LoadingState, ViewState, Paper, PaperVersion } from './types';
import { APP_NAME } from './constants';

const App: React.FC = () => {
  // Navigation State
  const [view, setView] = useState<ViewState>('HOME');
  const [papers, setPapers] = useState<Paper[]>([]);
  
  // Generation State
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [loadingStep, setLoadingStep] = useState<string>('Initializing Research Protocol...');
  const [topic, setTopic] = useState('');
  const [overview, setOverview] = useState('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Editor/Viewer State
  const [currentPaper, setCurrentPaper] = useState<Paper | null>(null);
  const [currentVersion, setCurrentVersion] = useState<PaperVersion | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');

  // --- Effects ---

  // Load papers on mount
  useEffect(() => {
    setPapers(getPapers());
  }, []);

  // Cycle through academic loading steps
  useEffect(() => {
    if (loadingState !== LoadingState.GENERATING) return;

    const steps = [
      "Accessing Global Academic Databases...",
      "Synthesizing Peer-Reviewed Literature...",
      "Formulating Theoretical Framework...",
      "Conducting Simulated Meta-Analysis...",
      "Generating Statistical Models...",
      "Drafting Manuscript (APA 7th Edition)...",
      "Final Peer Review & Formatting..."
    ];

    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % steps.length;
      setLoadingStep(steps[index]);
    }, 2500);

    return () => clearInterval(interval);
  }, [loadingState]);

  // --- Handlers ---

  const handleGenerate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !overview.trim()) return;

    setLoadingState(LoadingState.GENERATING);
    setErrorMsg('');

    try {
      const result = await generateAcademicPaper(topic, overview);
      
      // Save immediately to history
      const newPaper = saveNewPaper(topic, overview, result);
      setPapers(getPapers()); // Refresh list
      
      // Navigate to Editor
      loadPaper(newPaper, newPaper.versions[0]);
      setLoadingState(LoadingState.IDLE); // Reset loading state
    } catch (err) {
      setLoadingState(LoadingState.ERROR);
      setErrorMsg("The system encountered an error while conducting the research. Please try again.");
    }
  }, [topic, overview]);

  const loadPaper = (paper: Paper, version?: PaperVersion) => {
    const v = version || paper.versions[paper.versions.length - 1]; // Default to latest
    setCurrentPaper(paper);
    setCurrentVersion(v);
    setEditContent(v.content);
    setIsEditing(false);
    setView('EDITOR');
    setLoadingState(LoadingState.IDLE);
  };

  const handleSaveVersion = () => {
    if (!currentPaper) return;
    
    // Check if changes actually made
    if (editContent === currentVersion?.content) {
      setIsEditing(false);
      return;
    }

    const updatedPaper = savePaperVersion(currentPaper.id, editContent);
    if (updatedPaper) {
      setPapers(getPapers());
      setCurrentPaper(updatedPaper);
      // Select the new (latest) version
      const latest = updatedPaper.versions[updatedPaper.versions.length - 1];
      setCurrentVersion(latest);
      setIsEditing(false);
    }
  };

  const handleDeletePaper = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this research paper permanently?')) {
      deletePaper(id);
      setPapers(getPapers());
    }
  };

  const handleDownloadPDF = () => {
    // Triggers the browser's print dialog, which includes "Save as PDF" functionality.
    // The CSS @media print styles in index.html ensure only the paper content is rendered.
    window.print();
  };

  const formatDate = (ts: number) => new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  // --- Render Views ---

  const renderNav = () => (
    <nav className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-lg sticky top-0 z-50 print:hidden">
      <div className="flex items-center gap-4">
        <button onClick={() => setView('HOME')} className="font-sans font-bold text-xl tracking-tight hover:text-slate-300 transition">
          {APP_NAME}
        </button>
        <div className="h-6 w-px bg-slate-700"></div>
        <button 
          onClick={() => setView('HISTORY')}
          className={`text-sm font-semibold px-3 py-1 rounded transition ${view === 'HISTORY' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          Research History
        </button>
      </div>
      {view === 'EDITOR' && currentPaper && (
         <div className="text-xs text-slate-400 max-w-xs truncate hidden md:block">
           Editing: {currentPaper.topic}
         </div>
      )}
    </nav>
  );

  const renderHome = () => (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <h1 className="text-3xl font-bold text-white mb-2 font-sans tracking-tight">{APP_NAME}</h1>
          <p className="text-slate-400 text-sm uppercase tracking-widest font-semibold">Automated Academic Research Assistant</p>
        </div>
        
        <form onSubmit={handleGenerate} className="p-8 space-y-6">
          <div>
            <label htmlFor="topic" className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Research Topic
            </label>
            <input
              id="topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition duration-200 bg-gray-50 text-gray-900 placeholder-gray-400"
              placeholder="e.g., The Impact of Quantum Computing on Cryptography"
              required
            />
          </div>

          <div>
            <label htmlFor="overview" className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Abstract / Overview
            </label>
            <textarea
              id="overview"
              rows={6}
              value={overview}
              onChange={(e) => setOverview(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition duration-200 bg-gray-50 text-gray-900 placeholder-gray-400 resize-none"
              placeholder="Briefly describe the research gap, methodology, or initial hypothesis..."
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-lg shadow-lg hover:shadow-xl transform transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span>Initiate Research Protocol</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="max-w-6xl mx-auto p-8 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 font-serif">Research Archives</h2>
        <button 
          onClick={() => setView('HOME')}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition shadow"
        >
          + New Research
        </button>
      </div>

      {papers.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
          <p className="text-gray-400 text-lg mb-4">No research papers found in local archives.</p>
          <button onClick={() => setView('HOME')} className="text-slate-600 hover:text-slate-900 font-semibold underline">
            Start your first paper
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {papers.map(p => (
            <div 
              key={p.id} 
              onClick={() => loadPaper(p)}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition cursor-pointer group relative"
            >
               <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-slate-700 mb-2 font-serif">
                      {p.topic}
                    </h3>
                    <p className="text-gray-500 text-sm line-clamp-2 mb-4 max-w-3xl">{p.overview}</p>
                    <div className="flex gap-4 text-xs text-gray-400 uppercase tracking-wider font-semibold">
                      <span>Versions: {p.versions.length}</span>
                      <span>Last Updated: {formatDate(p.updatedAt)}</span>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => handleDeletePaper(e, p.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition z-10"
                    title="Delete Paper"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderEditor = () => {
    if (!currentPaper || !currentVersion) return null;

    return (
      <div className="flex flex-col h-[calc(100vh-64px)] print:h-auto print:block">
        {/* Editor Toolbar - Hidden on Print */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center print:hidden shadow-sm z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setView('HISTORY')}
              className="text-gray-500 hover:text-gray-800 text-sm font-semibold flex items-center gap-1"
            >
              ← Back
            </button>
            <div className="h-6 w-px bg-gray-300"></div>
            
            {/* Version Selector */}
            <div className="relative group">
              <select 
                className="appearance-none bg-gray-50 border border-gray-300 text-gray-700 py-1.5 px-3 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-slate-500 text-sm font-medium cursor-pointer"
                value={currentVersion.id}
                onChange={(e) => {
                  const v = currentPaper.versions.find(ver => ver.id === e.target.value);
                  if (v) {
                    setCurrentVersion(v);
                    setEditContent(v.content);
                    setIsEditing(false); // Reset to view mode on version switch
                  }
                }}
              >
                {currentPaper.versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    Version {v.versionNumber} — {formatDate(v.createdAt)}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
             {isEditing ? (
                <>
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="text-gray-600 hover:text-gray-800 px-3 py-1.5 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveVersion}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded text-sm font-semibold shadow transition flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                    Save New Version
                  </button>
                </>
             ) : (
               <>
                 <button 
                  onClick={() => setIsEditing(true)}
                  className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-1.5 rounded text-sm font-semibold shadow-sm transition flex items-center gap-2"
                 >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                   Edit Paper
                 </button>
                 <button 
                  onClick={handleDownloadPDF}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-1.5 rounded text-sm font-semibold shadow transition flex items-center gap-2"
                  title="Print to PDF"
                 >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                   Download PDF
                 </button>
               </>
             )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto bg-gray-100 print:overflow-visible print:h-auto print:bg-white">
          {isEditing ? (
            <div className="max-w-4xl mx-auto my-8 h-full pb-20 px-4">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full h-full min-h-[80vh] p-8 rounded-lg shadow-lg border border-gray-300 font-mono text-sm leading-relaxed focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none resize-none"
                placeholder="Markdown content..."
              />
            </div>
          ) : (
            <div className="py-8 print:py-0">
               {/* Pass content of CURRENT VERSION */}
               <PaperRenderer content={currentVersion.content} />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderLoading = () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <div className="relative flex flex-col items-center">
        <div className="relative w-32 h-32 mb-10">
            <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-slate-900 rounded-full border-t-transparent animate-spin duration-1000"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-12 h-12 text-slate-800 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            </div>
        </div>

        <h2 className="text-3xl font-serif font-bold text-slate-900 mb-4 tracking-tight">Processing Research</h2>
        
        <div className="h-8 flex items-center justify-center overflow-hidden w-full max-w-md bg-slate-50 rounded-full px-6 py-2 border border-slate-200">
             <p className="text-sm font-mono text-slate-600 animate-fade-in-up key={loadingStep}">
               {">"} {loadingStep}
             </p>
        </div>
        
        <p className="mt-8 text-xs text-gray-400 uppercase tracking-widest">
            ScholarGen AI v2.0 • Generating Long-Form Manuscript
        </p>
      </div>
    </div>
  );

  const renderError = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg border-l-4 border-red-500 max-w-lg w-full">
        <h3 className="text-xl font-bold text-red-600 mb-4">Research Protocol Failed</h3>
        <p className="text-gray-600 mb-6">{errorMsg}</p>
        <button
          onClick={() => setLoadingState(LoadingState.IDLE)}
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-6 rounded transition"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Show Nav unless Loading */}
      {loadingState !== LoadingState.GENERATING && renderNav()}

      {loadingState === LoadingState.GENERATING ? renderLoading() : 
       loadingState === LoadingState.ERROR ? renderError() :
       view === 'HOME' ? renderHome() :
       view === 'HISTORY' ? renderHistory() :
       renderEditor()
      }
    </div>
  );
};

export default App;