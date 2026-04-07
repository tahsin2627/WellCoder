'use client';
import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Send, FolderUp, Loader2, FileCode, Folder, MessageSquare, Code2, Settings, Terminal, Zap, ChevronDown, Check, RefreshCw } from 'lucide-react';

export default function WellCoder() {
  // --- CORE STATE ---
  const [files, setFiles] = useState({
    'index.js': '// Welcome to WellCoder\n// Awaiting your command...',
  });
  const [activeFile, setActiveFile] = useState('index.js');
  
  // Chat starts completely empty now!
  const [chat, setChat] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mobileView, setMobileView] = useState('chat');
  
  // --- NEW: TOAST NOTIFICATIONS ---
  const [toast, setToast] = useState(null);
  
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- NEW: CUSTOM DROPDOWN STATE ---
  const [freeModels, setFreeModels] = useState([
    { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B (Fallback)' }
  ]);
  const [selectedModel, setSelectedModel] = useState('meta-llama/llama-3.1-8b-instruct:free');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Models silently and use Toast
  useEffect(() => {
    async function fetchModels() {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/models");
        const data = await response.json();
        
        const free = data.data.filter(m => 
          m.pricing && Number(m.pricing.prompt) === 0 && Number(m.pricing.completion) === 0
        );

        if (free.length > 0) {
          setFreeModels(free);
          setSelectedModel(free[0].id);
          showToast(`Loaded ${free.length} live free models!`);
        }
      } catch (error) {
        showToast('Using fallback models (Network issue)', 'error');
      }
    }
    fetchModels();
  }, []);

  // --- HANDLERS ---
  const handleFileUpload = async (e) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;
    setIsLoading(true);
    showToast('Reading project files...', 'info');

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
        setFiles(newFiles);
        setActiveFile(firstFileName);
        showToast('Project loaded successfully!');
      }
    } catch (error) {
      showToast('Failed to read files.', 'error');
    } finally {
      setIsLoading(false);
      e.target.value = ''; 
    }
  };

  // Upgraded Send function to handle Retries
  const handleSend = async (customPrompt = null) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || isLoading) return;
    
    // Only add to chat if it's a new message, not a retry
    if (!customPrompt) {
      setChat((prev) => [...prev, { role: 'user', content: textToSend }]);
      setInput('');
    }
    
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend, model: selectedModel }),
      });

      const data = await response.json();
      
      if (!response.ok || data.error) throw new Error(data.error || 'API Error');
      
      setChat((prev) => [...prev, { role: 'system', content: data.reply }]);
    } catch (error) {
      // NEW: We flag this message as an error and save the original prompt so we can retry it!
      setChat((prev) => [...prev, { 
        role: 'system', 
        content: `Error: ${error.message}`, 
        isError: true,
        originalPrompt: textToSend 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const getLanguage = (fileName) => {
    if (fileName.endsWith('.json')) return 'json';
    if (fileName.endsWith('.html')) return 'html';
    if (fileName.endsWith('.css')) return 'css';
    if (fileName.endsWith('.md')) return 'markdown';
    return 'javascript';
  };

  // Helper to find model name for the dropdown button
  const getSelectedModelName = () => {
    const found = freeModels.find(m => m.id === selectedModel);
    return found ? found.name : 'Select a Model';
  };

  return (
    <div className="flex h-screen bg-[#09090b] text-gray-300 font-sans overflow-hidden relative">
      
      {/* TOAST NOTIFICATION POPUP */}
      {toast && (
        <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full shadow-lg border text-sm font-medium transition-all animate-in fade-in slide-in-from-top-5
          ${toast.type === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-400' : 
            toast.type === 'info' ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 
            'bg-green-500/10 border-green-500/50 text-green-400'}`}
        >
          {toast.message}
        </div>
      )}

      {/* PROFESSIONAL SIDEBAR */}
      <div className="hidden md:flex flex-col w-16 bg-[#000000] border-r border-gray-800 items-center py-4 justify-between z-10">
        <div className="space-y-6">
          <div className="p-2 bg-blue-600/10 text-blue-500 rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.2)]">
            <Zap size={24} />
          </div>
          <button className="p-2 text-gray-500 hover:text-white transition-colors"><MessageSquare size={22} /></button>
          <button className="p-2 text-gray-500 hover:text-white transition-colors"><Terminal size={22} /></button>
        </div>
        <button className="p-2 text-gray-500 hover:text-white transition-colors"><Settings size={22} /></button>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col md:flex-row relative">
        
        {/* CHAT PANEL */}
        <div className={`${mobileView === 'chat' ? 'flex' : 'hidden'} md:flex w-full md:w-[400px] lg:w-[450px] flex-col border-r border-gray-800 bg-[#09090b] h-[calc(100vh-60px)] md:h-screen`}>
          
          {/* HEADER WITH CUSTOM DROPDOWN */}
          <div className="p-4 border-b border-gray-800 flex flex-col gap-3 bg-[#000000] relative z-50">
            <div className="flex justify-between items-center">
              <h1 className="text-lg font-semibold text-white tracking-wide flex items-center gap-2">
                WellCoder <span className="text-[10px] bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30">v1.4</span>
              </h1>
            </div>
            
            {/* NEW: Custom Sleek Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between bg-[#121214] hover:bg-[#18181b] border border-gray-800 rounded-lg px-3 py-2.5 text-xs text-gray-300 transition-colors shadow-sm"
              >
                <span className="truncate pr-2">{getSelectedModelName()}</span>
                <ChevronDown size={14} className={`text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#121214] border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-[#09090b] sticky top-0">
                      Live Free Models ({freeModels.length})
                    </div>
                    {freeModels.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setSelectedModel(m.id);
                          setIsDropdownOpen(false);
                          showToast(`Switched to ${m.name}`);
                        }}
                        className="w-full text-left px-3 py-2.5 text-xs hover:bg-[#1e1e24] flex items-center justify-between border-b border-gray-800/50 last:border-0 transition-colors"
                      >
                        <span className={`truncate pr-4 ${selectedModel === m.id ? 'text-blue-400 font-medium' : 'text-gray-300'}`}>
                          {m.name}
                        </span>
                        {selectedModel === m.id && <Check size={14} className="text-blue-500 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
            {chat.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 opacity-50 space-y-4">
                <Zap size={48} />
                <p className="text-sm">Ready to code. Send a command.</p>
              </div>
            )}
            
            {chat.map((msg, idx) => (
              <div key={idx} className={`p-3.5 rounded-xl text-sm leading-relaxed 
                ${msg.role === 'user' ? 'bg-blue-600 text-white ml-8 shadow-md' : 
                  msg.isError ? 'bg-red-500/10 border border-red-500/30 mr-8 text-red-200 shadow-sm' : 
                  'bg-[#121214] border border-gray-800 mr-8 text-gray-200 shadow-sm'}`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                
                {/* NEW: RETRY BUTTON */}
                {msg.isError && (
                  <button 
                    onClick={() => handleSend(msg.originalPrompt)}
                    className="mt-3 flex items-center gap-1.5 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-1.5 rounded-md transition-colors"
                  >
                    <RefreshCw size={12} /> Retry Request
                  </button>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="bg-[#121214] border border-gray-800 mr-8 p-3 rounded-xl flex items-center gap-3 w-fit shadow-sm">
                <Loader2 size={16} className="animate-spin text-blue-400" />
                <span className="text-sm text-gray-400 font-medium">Processing...</span>
              </div>
            )}
          </div>

          <div className="p-4 bg-[#000000] border-t border-gray-800">
            <div className="flex gap-2 items-center bg-[#121214] border border-gray-700 focus-within:border-blue-500 transition-colors rounded-xl px-2 py-1 shadow-inner">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                disabled={isLoading}
                placeholder="Ask WellCoder..." 
                className="flex-1 bg-transparent border-none p-2 text-white outline-none text-sm disabled:opacity-50"
              />
              <button onClick={() => handleSend()} disabled={isLoading} className="bg-blue-600 hover:bg-blue-500 p-2 rounded-lg text-white transition-all shadow-md disabled:opacity-50 disabled:hover:bg-blue-600">
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* EDITOR PANEL */}
        <div className={`${mobileView === 'editor' ? 'flex' : 'hidden'} md:flex flex-1 flex-col h-[calc(100vh-60px)] md:h-screen min-w-0`}>
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-[#000000]">
            <div className="flex gap-2 items-center overflow-x-auto no-scrollbar">
              {Object.keys(files).map((fileName) => {
                const displayFileName = fileName.split('/').pop();
                return (
                  <button
                    key={fileName}
                    onClick={() => setActiveFile(fileName)}
                    className={`px-3 py-1.5 text-xs font-mono rounded-md flex items-center gap-2 whitespace-nowrap transition-colors ${activeFile === fileName ? 'bg-[#121214] text-blue-400 border border-gray-700 shadow-sm' : 'text-gray-500 hover:text-gray-300 hover:bg-[#121214]'}`}
                  >
                    <FileCode size={12} /> {displayFileName}
                  </button>
                )
              })}
            </div>
            
            <label className="cursor-pointer bg-[#121214] hover:bg-gray-800 border border-gray-700 text-gray-300 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-medium transition-colors shadow-sm whitespace-nowrap ml-2">
              <FolderUp size={14} />
              <span className="hidden sm:inline">Upload Project</span>
              <input type="file" webkitdirectory="" directory="" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>

          <div className="flex-1 bg-[#0d1117] relative">
            <Editor
              height="100%"
              language={getLanguage(activeFile)}
              theme="vs-dark"
              value={files[activeFile] || ''}
              onChange={(value) => setFiles((prev) => ({ ...prev, [activeFile]: value }))}
              options={{ minimap: { enabled: false }, fontSize: 14, wordWrap: 'on', padding: { top: 16 } }}
            />
          </div>
        </div>
      </div>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-[60px] bg-[#000000] border-t border-gray-800 flex justify-around items-center z-50">
        <button 
          onClick={() => setMobileView('chat')} 
          className={`flex flex-col items-center gap-1 p-2 ${mobileView === 'chat' ? 'text-blue-500' : 'text-gray-500'}`}
        >
          <MessageSquare size={20} />
          <span className="text-[10px] font-medium">Chat</span>
        </button>
        <button 
          onClick={() => setMobileView('editor')} 
          className={`flex flex-col items-center gap-1 p-2 ${mobileView === 'editor' ? 'text-blue-500' : 'text-gray-500'}`}
        >
          <Code2 size={20} />
          <span className="text-[10px] font-medium">Editor</span>
        </button>
      </div>
      
      {/* GLOBAL CSS ADDITIONS FOR SCROLLBAR */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #09090b; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
      `}</style>
    </div>
  );
}
