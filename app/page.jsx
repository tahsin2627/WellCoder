'use client';
import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Send, FolderUp } from 'lucide-react';

export default function WellCoder() {
  const [code, setCode] = useState('// Welcome to WellCoder\n// Awaiting your command...');
  const [chat, setChat] = useState([{ role: 'system', text: 'WellCoder initialized. Upload a project or ask me to write some code.' }]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setChat([...chat, { role: 'user', text: input }]);
    setInput('');
    // The backend API integration will go here later
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#0d1117] text-gray-300 font-sans">
      
      {/* Left Panel: Chat Interface */}
      <div className="w-full md:w-1/3 flex flex-col border-r border-gray-700 bg-[#161b22] h-[50vh] md:h-screen">
        
        {/* Header bar */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-[#010409]">
          <h1 className="text-xl font-bold text-white tracking-wide">WellCoder</h1>
          <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded flex items-center gap-2 text-sm transition-colors">
            <FolderUp size={16} />
            <span className="hidden md:inline">Upload Project</span>
            {/* webkitdirectory allows folder selection in supported browsers */}
            <input type="file" webkitdirectory="" directory="" className="hidden" />
          </label>
        </div>
        
        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chat.map((msg, idx) => (
            <div key={idx} className={`p-3 rounded-lg shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white ml-8' : 'bg-gray-800 border border-gray-700 mr-8'}`}>
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
            </div>
          ))}
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-gray-700 bg-[#0d1117]">
          <div className="flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Tell WellCoder what to build..." 
              className="flex-1 bg-[#161b22] border border-gray-600 rounded p-2.5 text-white outline-none focus:border-blue-500 transition-colors text-sm"
            />
            <button onClick={handleSend} className="bg-blue-600 hover:bg-blue-700 p-2.5 rounded text-white transition-colors">
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel: Monaco Code Editor */}
      <div className="flex-1 flex flex-col h-[50vh] md:h-screen border-t md:border-t-0 border-gray-700">
        
        {/* File Path Header */}
        <div className="px-4 py-2 border-b border-gray-700 bg-[#161b22] text-xs text-gray-400 font-mono flex items-center gap-2">
          <span className="text-blue-400">workspace</span> / index.js
        </div>
        
        {/* The Editor */}
        <div className="flex-1">
          <Editor
            height="100%"
            defaultLanguage="javascript"
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value)}
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
  );
}
