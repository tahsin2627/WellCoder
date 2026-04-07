'use client';
import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Send, FolderUp, Loader2, FileCode, MessageSquare, Code2, Settings, Terminal, Zap, ChevronDown, Check, RefreshCw, Wand2, Plus, X, Globe, Database, Paintbucket } from 'lucide-react';

export default function WellCoder() {
  // --- CORE STATE ---
  const [files, setFiles] = useState({ 'index.js': '// Welcome to WellCoder\n// Awaiting your command...' });
  const [activeFile, setActiveFile] = useState('index.js');
  const [chat, setChat] = useState([]);
  const [input, setInput] = useState('');
  
  // --- NEW: ADVANCED LOADING & UI STATES ---
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [mobileView, setMobileView] = useState('chat');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isAddingFile, setIsAddingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  // Project Wizard State
  const [wizardConfig, setWizardConfig] = useState({
    framework: 'React / Next.js',
    styling: 'Tailwind CSS',
    database: 'None'
  });

  // Toast & Dropdown State
  const [toast, setToast] = useState(null);
  const [freeModels, setFreeModels] = useState([{ id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B (Fallback)' }]);
  const [selectedModel, setSelectedModel] = useState('meta-llama/llama-3.1-8b-instruct:free');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const handleClickOutside = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsDropdownOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    async function fetchModels() {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/models");
        const data = await response.json();
        const free = data.data.filter(m => m.pricing && Number(m.pricing.prompt) === 0 && Number(m.pricing.completion) === 0);
        if (free.length > 0) {
          setFreeModels(free);
          setSelectedModel(free[0].id);
          showToast(`Loaded ${free.length} live free models!`);
        }
      } catch (error) { showToast('Using fallback models', 'error'); }
    }
    fetchModels();
  }, []);

  // --- HANDLERS ---
  
  // Add a new file manually
  const handleAddFile = () => {
    if (!newFileName.trim()) return setIsAddingFile(false);
    const fileName = newFileName.trim().replace(/\s+/g, '-');
    setFiles(prev => ({ ...prev, [fileName]: `// New file: ${fileName}\n` }));
    setActiveFile(fileName);
    setNewFileName('');
    setIsAddingFile(false);
    showToast(`Created ${fileName}`);
  };

  const handleFileUpload = async (e) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;
    setIsLoading(true); setLoadingText('Reading project files...');
    const newFiles = {};
    let firstFileName = null;
    try {
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        if (file.webkitRelativePath.includes('node_modules') || file.webkitRelativePath.includes('.git')) continue;
        const text = await file.text();
        const filePath = file.webkitRelativePath || file.name;
        newFiles[filePath] = text;
        if (!firstFileName) firstFileName = filePath;
      }
      if (Object.keys(newFiles).length > 0) {
        setFiles(newFiles); setActiveFile(firstFileName);
        showToast('Project loaded!');
      }
    } catch (error) { showToast('Failed to read files.', 'error'); } 
    finally { setIsLoading(false); e.target.value = ''; }
  };

  const handleSend = async (customPrompt = null, isWizard = false) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || isLoading) return;
    
    // Add to chat UI
    if (!customPrompt || isWizard) {
      setChat(prev => [...prev, { role: 'user', content: isWizard ? `[Wizard Triggered]: ${textToSend}` : textToSend }]);
      setInput('');
    }
    
    setIsLoading(true);
    let finalPromptToAI = textToSend;

    // --- NEW: THE SCRAPER INTEGRATION ---
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = textToSend.match(urlRegex);
    
    if (urls && urls.length > 0) {
      setLoadingText(`Fetching external data from ${urls[0]}...`);
      try {
        const scrapeRes = await fetch('/api/scrape', { method: 'POST', body: JSON.stringify({ url: urls[0] }) });
        const scrapeData = await scrapeRes.json();
        if (scrapeData.content) {
          finalPromptToAI = `The user shared this link (${urls[0]}). Here is its extracted content:\n\n${scrapeData.content}\n\nUser Request: ${textToSend}`;
          setLoadingText('Analyzing extracted content...');
        }
      } catch (err) { showToast('Failed to scrape URL', 'error'); }
    } else {
      setLoadingText('Drafting architecture & code...');
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: finalPromptToAI, model: selectedModel }),
      });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || 'API Error');
      setChat(prev => [...prev, { role: 'system', content: data.reply }]);
    } catch (error) {
      setChat(prev => [...prev, { role: 'system', content: `Error: ${error.message}`, isError: true, originalPrompt: textToSend }]);
    } finally {
      setIsLoading(false);
    }
  };

  const executeWizard = () => {
    setIsWizardOpen(false);
    const superPrompt = `I want to build a new project. 
    Framework: ${wizardConfig.framework}
    Styling: ${wizardConfig.styling}
    Database: ${wizardConfig.database}
    Please provide the optimal folder structure, terminal commands to initialize it, and the code for the main entry files. Keep it highly professional and production-ready.`;
    handleSend(superPrompt, true);
  };

  const getLanguage = (fileName) => {
    if (fileName.endsWith('.json')) return 'json';
    if (fileName.endsWith('.html')) return 'html';
    if (fileName.endsWith('.css')) return 'css';
    if (fileName.endsWith('.md')) return 'markdown';
    return 'javascript';
  };

  return (
    <div className="flex h-screen bg-[#09090b] text-gray-300 font-sans overflow-hidden relative">
      
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full shadow-lg border text-sm font-medium transition-all animate-in fade-in slide-in-from-top-5
          ${toast.type === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-400' : 'bg-green-500/10 border-green-500/50 text-green-400'}`}>
          {toast.message}
        </div>
      )}

      {/* LOVABLE-STYLE PROJECT WIZARD MODAL */}
      {isWizardOpen && (
        <div className="absolute inset-0 bg-black/80 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#121214] border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><Wand2 className="text-blue-500"/> New Project Wizard</h2>
              <button onClick={() => setIsWizardOpen(false)} className="text-gray-500 hover:text-white"><X size={20}/></button>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><Code2 size={14}/> Framework</label>
                <select value={wizardConfig.framework} onChange={(e)=>setWizardConfig({...wizardConfig, framework: e.target.value})} className="w-full bg-[#09090b] border border-gray-700 rounded-lg p-3 text-sm text-white focus:border-blue-500 outline-none">
                  <option>React / Next.js</option><option>Vanilla HTML/JS</option><option>Vue / Nuxt</option><option>Python Flask</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><Paintbucket size={14}/> Styling</label>
                <select value={wizardConfig.styling} onChange={(e)=>setWizardConfig({...wizardConfig, styling: e.target.value})} className="w-full bg-[#09090b] border border-gray-700 rounded-lg p-3 text-sm text-white focus:border-blue-500 outline-none">
                  <option>Tailwind CSS</option><option>Standard CSS</option><option>Bootstrap</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><Database size={14}/> Database Backend</label>
                <select value={wizardConfig.database} onChange={(e)=>setWizardConfig({...wizardConfig, database: e.target.value})} className="w-full bg-[#09090b] border border-gray-700 rounded-lg p-3 text-sm text-white focus:border-blue-500 outline-none">
                  <option>None (Frontend Only)</option><option>Supabase</option><option>Firebase</option><option>MongoDB</option>
                </select>
              </div>
              
              <button onClick={executeWizard} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl mt-4 transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                Generate Architecture
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROFESSIONAL SIDEBAR */}
      <div className="hidden md:flex flex-col w-16 bg-[#000000] border-r border-gray-800 items-center py-4 justify-between z-10">
        <div className="space-y-6">
          <div className="p-2 bg-blue-600/10 text-blue-500 rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.2)]"><Zap size={24} /></div>
          <button onClick={() => setIsWizardOpen(true)} title="Project Wizard" className="p-2 text-gray-500 hover:text-blue-400 transition-colors"><Wand2 size={22} /></button>
          <button className="p-2 text-gray-500 hover:text-white transition-colors"><MessageSquare size={22} /></button>
        </div>
        <button className="p-2 text-gray-500 hover:text-white transition-colors"><Settings size={22} /></button>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col md:flex-row relative">
        
        {/* CHAT PANEL */}
        <div className={`${mobileView === 'chat' ? 'flex' : 'hidden'} md:flex w-full md:w-[400px] lg:w-[450px] flex-col border-r border-gray-800 bg-[#09090b] h-[calc(100vh-60px)] md:h-screen`}>
          
          <div className="p-4 border-b border-gray-800 flex flex-col gap-3 bg-[#000000] relative z-50">
            <div className="flex justify-between items-center">
              <h1 className="text-lg font-semibold text-white tracking-wide flex items-center gap-2">WellCoder <span className="text-[10px] bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30">v2.0</span></h1>
              <button onClick={() => setIsWizardOpen(true)} className="md:hidden text-blue-400 bg-blue-500/10 p-1.5 rounded-md"><Wand2 size={16}/></button>
            </div>
            
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full flex items-center justify-between bg-[#121214] hover:bg-[#18181b] border border-gray-800 rounded-lg px-3 py-2.5 text-xs text-gray-300 transition-colors shadow-sm">
                <span className="truncate pr-2">{freeModels.find(m => m.id === selectedModel)?.name || 'Select a Model'}</span>
                <ChevronDown size={14} className={`text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#121214] border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50 max-h-[60vh] overflow-y-auto custom-scrollbar">
                  <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-[#09090b] sticky top-0">Live Free Models ({freeModels.length})</div>
                  {freeModels.map((m) => (
                    <button key={m.id} onClick={() => { setSelectedModel(m.id); setIsDropdownOpen(false); showToast(`Switched to ${m.name}`); }} className="w-full text-left px-3 py-2.5 text-xs hover:bg-[#1e1e24] flex items-center justify-between border-b border-gray-800/50 transition-colors">
                      <span className={`truncate pr-4 ${selectedModel === m.id ? 'text-blue-400 font-medium' : 'text-gray-300'}`}>{m.name}</span>
                      {selectedModel === m.id && <Check size={14} className="text-blue-500 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 relative custom-scrollbar">
            {chat.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 opacity-50 space-y-4">
                <Globe size={48} />
                <p className="text-sm text-center px-4">Paste a URL, run the Wizard,<br/>or just ask me to code.</p>
              </div>
            )}
            
            {chat.map((msg, idx) => (
              <div key={idx} className={`p-3.5 rounded-xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white ml-8 shadow-md' : msg.isError ? 'bg-red-500/10 border border-red-500/30 mr-8 text-red-200' : 'bg-[#121214] border border-gray-800 mr-8 text-gray-200 shadow-sm'}`}>
                <p className="whitespace-pre-wrap font-mono text-[13px]">{msg.content}</p>
                {msg.isError && (
                  <button onClick={() => handleSend(msg.originalPrompt)} className="mt-3 flex items-center gap-1.5 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-1.5 rounded-md transition-colors"><RefreshCw size={12} /> Retry</button>
                )}
              </div>
            ))}
            
            {/* NEW: ADVANCED AGENTIC LOADING STATE */}
            {isLoading && (
              <div className="bg-[#121214] border border-gray-800 mr-8 p-3 rounded-xl flex items-center gap-3 w-fit shadow-sm">
                <Loader2 size={16} className="animate-spin text-blue-400" />
                <span className="text-sm text-blue-400 font-medium animate-pulse">{loadingText}</span>
              </div>
            )}
          </div>

          <div className="p-4 bg-[#000000] border-t border-gray-800">
            <div className="flex gap-2 items-center bg-[#121214] border border-gray-700 focus-within:border-blue-500 transition-colors rounded-xl px-2 py-1 shadow-inner">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} disabled={isLoading} placeholder="Ask WellCoder or paste a URL..." className="flex-1 bg-transparent border-none p-2 text-white outline-none text-sm disabled:opacity-50" />
              <button onClick={() => handleSend()} disabled={isLoading} className="bg-blue-600 hover:bg-blue-500 p-2 rounded-lg text-white transition-all shadow-md disabled:opacity-50"><Send size={16} /></button>
            </div>
          </div>
        </div>

        {/* EDITOR PANEL WITH DYNAMIC FILE SYSTEM */}
        <div className={`${mobileView === 'editor' ? 'flex' : 'hidden'} md:flex flex-1 flex-col h-[calc(100vh-60px)] md:h-screen min-w-0`}>
          <div className="flex items-center justify-between px-2 py-2 border-b border-gray-800 bg-[#000000]">
            
            {/* Dynamic File Tabs */}
            <div className="flex gap-1 items-center overflow-x-auto custom-scrollbar flex-1 mr-2">
              {Object.keys(files).map((fileName) => (
                <button key={fileName} onClick={() => setActiveFile(fileName)} className={`px-3 py-1.5 text-xs font-mono rounded-md flex items-center gap-2 whitespace-nowrap transition-colors ${activeFile === fileName ? 'bg-[#121214] text-blue-400 border border-gray-700' : 'text-gray-500 hover:text-gray-300 hover:bg-[#121214]'}`}>
                  <FileCode size={12} /> {fileName.split('/').pop()}
                </button>
              ))}
              
              {/* Add File Button / Input */}
              {isAddingFile ? (
                <div className="flex items-center gap-1 ml-2 bg-[#121214] border border-blue-500 rounded-md px-2 py-1">
                  <input type="text" value={newFileName} onChange={(e)=>setNewFileName(e.target.value)} onKeyDown={(e)=> e.key === 'Enter' && handleAddFile()} placeholder="script.js" autoFocus className="bg-transparent text-xs text-white outline-none w-20 font-mono" />
                  <button onClick={handleAddFile} className="text-blue-400 hover:text-blue-300"><Check size={14}/></button>
                  <button onClick={() => setIsAddingFile(false)} className="text-gray-500 hover:text-red-400"><X size={14}/></button>
                </div>
              ) : (
                <button onClick={() => setIsAddingFile(true)} className="ml-2 px-2 py-1.5 text-gray-500 hover:text-blue-400 hover:bg-[#121214] rounded-md transition-colors flex items-center gap-1 text-xs font-mono">
                  <Plus size={14}/> File
                </button>
              )}
            </div>
            
            <label className="cursor-pointer bg-[#121214] hover:bg-gray-800 border border-gray-700 text-gray-300 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-medium transition-colors shadow-sm whitespace-nowrap shrink-0">
              <FolderUp size={14} />
              <span className="hidden sm:inline">Upload</span>
              <input type="file" webkitdirectory="" directory="" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>

          <div className="flex-1 bg-[#0d1117] relative">
            <Editor height="100%" language={getLanguage(activeFile)} theme="vs-dark" value={files[activeFile] || ''} onChange={(value) => setFiles(prev => ({ ...prev, [activeFile]: value }))} options={{ minimap: { enabled: false }, fontSize: 14, wordWrap: 'on', padding: { top: 16 } }} />
          </div>
        </div>
      </div>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-[60px] bg-[#000000] border-t border-gray-800 flex justify-around items-center z-50">
        <button onClick={() => setMobileView('chat')} className={`flex flex-col items-center gap-1 p-2 ${mobileView === 'chat' ? 'text-blue-500' : 'text-gray-500'}`}>
          <MessageSquare size={20} />
          <span className="text-[10px] font-medium">Chat</span>
        </button>
        <button onClick={() => setMobileView('editor')} className={`flex flex-col items-center gap-1 p-2 ${mobileView === 'editor' ? 'text-blue-500' : 'text-gray-500'}`}>
          <Code2 size={20} />
          <span className="text-[10px] font-medium">Editor</span>
        </button>
      </div>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
      `}</style>
    </div>
  );
}
