'use client';
import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Send, FolderUp, Loader2, FileCode, Folder, MessageSquare, Code2, Settings, Terminal, Zap } from 'lucide-react';

export default function WellCoder() {
  const [files, setFiles] = useState({
    'index.js': '// Welcome to WellCoder\n// Awaiting your command...',
  });
  const [activeFile, setActiveFile] = useState('index.js');
  const [chat, setChat] = useState([{ role: 'system', content: 'WellCoder initialized. Fetching live OpenRouter models...' }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mobileView, setMobileView] = useState('chat');
  
  // NEW: State to hold our dynamically fetched free models
  const [freeModels, setFreeModels] = useState([
    { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B (Fallback)' }
  ]);
  const [selectedModel, setSelectedModel] = useState('meta-llama/llama-3.1-8b-instruct:free');

  // NEW: The React equivalent of your Python script!
  useEffect(() => {
    async function fetchModels() {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/models");
        const data = await response.json();
        
        // Filter exactly like your Python script
        const free = data.data.filter(m => 
          m.pricing && 
          Number(m.pricing.prompt) === 0 && 
          Number(m.pricing.completion) === 0
        );

        if (free.length > 0) {
          setFreeModels(free);
          // Auto-select the first available free model to ensure it's valid
          setSelectedModel(free[0].id);
          setChat((prev) => [...prev, { role: 'system', content: `Success: Loaded ${free.length} live free models from OpenRouter.` }]);
        }
      } catch (error) {
        console.error("Failed to fetch models", error);
        setChat((prev) => [...prev, { role: 'system', content: 'Warning: Could not fetch live models. Using fallback list.' }]);
      }
    }
    fetchModels();
  }, []); // The empty array means this runs exactly once when the app loads

  const handleFileUpload = async (e) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;
    setIsLoading(true);
    setChat((prev) => [...prev, { role: 'system', content: 'Reading project files...' }]);

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
        setChat((prev) => [...prev, { role: 'system', content: `Successfully loaded ${Object.keys(newFiles).length} files.` }]);
      }
    } catch (error) {
      setChat((prev) => [...prev, { role: 'system', content: 'Error reading uploaded files.' }]);
    } finally {
      setIsLoading(false);
      e.target.value = ''; 
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = input;
    setChat((prev) => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, model: selectedModel }),
      });

      const data = await response.json();
      
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Unknown error occurred');
      }
      
      setChat((prev) => [...prev, { role: 'system', content: data.reply }]);
    } catch (error) {
      setChat((prev) => [...prev, { role: 'system', content: `Error: ${error.message}` }]);
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

  return (
    <div className="flex h-screen bg-[#09090b] text-gray-300 font-sans overflow-hidden">
      
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
          
          {/* HEADER WITH AUTO-FETCHING MODEL SELECTOR */}
          <div className="p-4 border-b border-gray-800 flex flex-col gap-3 bg-[#000000]">
            <div className="flex justify-between items-center">
              <h1 className="text-lg font-semibold text-white tracking-wide flex items-center gap-2">
                WellCoder <span className="text-[10px] bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30">v1.3</span>
              </h1>
            </div>
            
            {/* Dynamic Dropdown */}
            <select 
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-[#121214] text-xs text-gray-300 border border-gray-800 rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-colors shadow-sm cursor-pointer appearance-none"
            >
              <optgroup label={`Live Free Models (${freeModels.length})`}>
                {freeModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Pro Models (Require Credits)">
                <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                <option value="anthropic/claude-3-haiku">Claude 3 Haiku</option>
                <option value="openai/gpt-4o">OpenAI GPT-4o</option>
              </optgroup>
            </select>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chat.map((msg, idx) => (
              <div key={idx} className={`p-3.5 rounded-xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white ml-8 shadow-md' : 'bg-[#121214] border border-gray-800 mr-8 text-gray-200 shadow-sm'}`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))}
            {isLoading && (
              <div className="bg-[#121214] border border-gray-800 mr-8 p-3 rounded-xl flex items-center gap-3 w-fit shadow-sm">
                <Loader2 size={16} className="animate-spin text-blue-400" />
                <span className="text-sm text-gray-400 font-medium">Processing via OpenRouter...</span>
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
              <button onClick={handleSend} disabled={isLoading} className="bg-blue-600 hover:bg-blue-500 p-2 rounded-lg text-white transition-all shadow-md disabled:opacity-50 disabled:hover:bg-blue-600">
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
    </div>
  );
}
