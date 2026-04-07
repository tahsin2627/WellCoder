'use client';
import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Send, FolderUp, Loader2, FileCode, Folder } from 'lucide-react';

export default function WellCoder() {
  const [files, setFiles] = useState({
    'index.js': '// Welcome to WellCoder\nconsole.log("Hello from WellCoder!");',
    'utils.js': 'export function add(a, b) {\n  return a + b;\n}',
    'package.json': '{\n  "name": "wellcoder-project",\n  "version": "1.0.0"\n}'
  });
  const [activeFile, setActiveFile] = useState('index.js');
  const [chat, setChat] = useState([{ role: 'system', text: 'WellCoder initialized. Select a file or give me a command.' }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // NEW: Function to handle folder uploads
  const handleFileUpload = async (e) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    setIsLoading(true);
    setChat((prev) => [...prev, { role: 'system', text: 'Reading files...' }]);

    const newFiles = {};
    let firstFileName = null;

    try {
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        
        // Skip heavy folders to prevent the browser from crashing
        if (file.webkitRelativePath.includes('node_modules') || file.webkitRelativePath.includes('.git')) {
          continue;
        }

        // Read the file as text
        const text = await file.text();
        const filePath = file.webkitRelativePath || file.name;
        
        newFiles[filePath] = text;
        if (!firstFileName) firstFileName = filePath;
      }

      if (Object.keys(newFiles).length > 0) {
        setFiles(newFiles); // Replace virtual file system with uploaded files
        setActiveFile(firstFileName); // Open the first file
        setChat((prev) => [...prev, { role: 'system', text: `Successfully loaded ${Object.keys(newFiles).length} files into the workspace.` }]);
      } else {
        setChat((prev) => [...prev, { role: 'system', text: 'No readable files found (node_modules and .git are ignored).' }]);
      }
    } catch (error) {
      setChat((prev) => [...prev, { role: 'system', text: 'Error reading uploaded files.' }]);
    } finally {
      setIsLoading(false);
      // Reset the input so you can upload the same folder again if needed
      e.target.value = ''; 
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = input;
    setChat((prev) => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();
      setChat((prev) => [...prev, { role: 'system', text: data.reply }]);
    } catch (error) {
      setChat((prev) => [...prev, { role: 'system', text: 'Error: Could not connect to WellCoder backend.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditorChange = (value) => {
    setFiles((prev) => ({ ...prev, [activeFile]: value }));
  };

  // Helper to determine language for Monaco Editor
  const getLanguage = (fileName) => {
    if (fileName.endsWith('.json')) return 'json';
    if (fileName.endsWith('.html')) return 'html';
    if (fileName.endsWith('.css')) return 'css';
    if (fileName.endsWith('.md')) return 'markdown';
    return 'javascript';
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#0d1117] text-gray-300 font-sans">
      
      {/* LEFT PANEL: Chat Interface */}
      <div className="w-full md:w-1/3 flex flex-col border-r border-gray-700 bg-[#161b22] h-[50vh] md:h-screen">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-[#010409]">
          <h1 className="text-xl font-bold text-white tracking-wide">WellCoder</h1>
          <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded flex items-center gap-2 text-sm transition-colors">
            <FolderUp size={16} />
            <span className="hidden md:inline">Upload Project</span>
            {/* NEW: onChange handler added here */}
            <input 
              type="file" 
              webkitdirectory="" 
              directory="" 
              className="hidden" 
              onChange={handleFileUpload}
            />
          </label>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chat.map((msg, idx) => (
            <div key={idx} className={`p-3 rounded-lg shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white ml-8' : 'bg-gray-800 border border-gray-700 mr-8'}`}>
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
            </div>
          ))}
          {isLoading && (
            <div className="bg-gray-800 border border-gray-700 mr-8 p-3 rounded-lg flex items-center gap-2 w-fit">
              <Loader2 size={16} className="animate-spin text-blue-400" />
              <span className="text-sm text-gray-400">Processing...</span>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-700 bg-[#0d1117]">
          <div className="flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isLoading}
              placeholder="Tell WellCoder what to build..." 
              className="flex-1 bg-[#161b22] border border-gray-600 rounded p-2.5 text-white outline-none focus:border-blue-500 transition-colors text-sm disabled:opacity-50"
            />
            <button 
              onClick={handleSend} 
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 p-2.5 rounded text-white transition-colors disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: File Explorer & Monaco Editor */}
      <div className="flex-1 flex flex-col md:flex-row h-[50vh] md:h-screen border-t md:border-t-0 border-gray-700">
        
        {/* File Explorer Sidebar */}
        <div className="w-full md:w-48 bg-[#0d1117] border-r border-gray-700 flex flex-col">
          <div className="px-4 py-2 border-b border-gray-700 bg-[#010409] text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Folder size={14} /> Workspace
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {Object.keys(files).map((fileName) => {
              // Extract just the file name if it's a long path for a cleaner sidebar
              const displayFileName = fileName.split('/').pop();
              return (
                <button
                  key={fileName}
                  onClick={() => setActiveFile(fileName)}
                  title={fileName} // Hover to see full path
                  className={`w-full text-left px-4 py-1.5 text-sm flex items-center gap-2 hover:bg-[#161b22] transition-colors truncate ${activeFile === fileName ? 'bg-[#161b22] text-blue-400 border-l-2 border-blue-500' : 'text-gray-400 border-l-2 border-transparent'}`}
                >
                  <FileCode size={14} className="shrink-0" />
                  <span className="truncate">{displayFileName}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* The Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-4 py-2 border-b border-gray-700 bg-[#161b22] text-xs text-gray-400 font-mono flex items-center gap-2 truncate">
            <span className="text-blue-400 truncate">{activeFile}</span>
          </div>
          <div className="flex-1">
            <Editor
              height="100%"
              language={getLanguage(activeFile)}
              theme="vs-dark"
              value={files[activeFile] || ''}
              onChange={handleEditorChange}
              options={{ 
                minimap: { enabled: false }, 
                fontSize: 14,
                wordWrap: 'on',
                padding: { top: 16 }
              }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
