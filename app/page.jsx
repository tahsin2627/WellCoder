'use client';
import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Send, FolderUp, Loader2, FileCode, Folder } from 'lucide-react';

export default function WellCoder() {
  // 1. We create a simple virtual file system with some dummy files
  const [files, setFiles] = useState({
    'index.js': '// Welcome to WellCoder\nconsole.log("Hello from WellCoder!");',
    'utils.js': 'export function add(a, b) {\n  return a + b;\n}',
    'package.json': '{\n  "name": "wellcoder-project",\n  "version": "1.0.0"\n}'
  });
  const [activeFile, setActiveFile] = useState('index.js');

  const [chat, setChat] = useState([{ role: 'system', text: 'WellCoder initialized. Select a file or give me a command.' }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  // 2. When the editor changes, save it to our virtual file system
  const handleEditorChange = (value) => {
    setFiles((prev) => ({ ...prev, [activeFile]: value }));
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
            <input type="file" webkitdirectory="" directory="" className="hidden" />
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
              <span className="text-sm text-gray-400">Thinking...</span>
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
            {Object.keys(files).map((fileName) => (
              <button
                key={fileName}
                onClick={() => setActiveFile(fileName)}
                className={`w-full text-left px-4 py-1.5 text-sm flex items-center gap-2 hover:bg-[#161b22] transition-colors ${activeFile === fileName ? 'bg-[#161b22] text-blue-400 border-l-2 border-blue-500' : 'text-gray-400 border-l-2 border-transparent'}`}
              >
                <FileCode size={14} />
                {fileName}
              </button>
            ))}
          </div>
        </div>

        {/* The Editor */}
        <div className="flex-1 flex flex-col">
          <div className="px-4 py-2 border-b border-gray-700 bg-[#161b22] text-xs text-gray-400 font-mono flex items-center gap-2">
            <span className="text-blue-400">{activeFile}</span>
          </div>
          <div className="flex-1">
            <Editor
              height="100%"
              language={activeFile.endsWith('.json') ? 'json' : 'javascript'}
              theme="vs-dark"
              value={files[activeFile]}
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
