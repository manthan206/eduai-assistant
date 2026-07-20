import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useAuth } from '../context/AuthContext';
import api, { API_URL } from '../services/api';
import {
  Cpu,
  LogOut,
  Plus,
  Trash2,
  Search,
  Settings,
  Send,
  Square,
  RefreshCw,
  Copy,
  Check,
  Menu,
  X,
  User,
  Moon,
  Sun,
  Sliders,
  Sparkles,
  Info,
  Clock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export default function DashboardPage({ darkMode, setDarkMode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Chats and Messaging State
  const [history, setHistory] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingText, setStreamingText] = useState('');

  // Sidebar toggle for mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Settings Panel State
  const [showSettings, setShowSettings] = useState(false);
  const [selectedModel, setSelectedModel] = useState('llama-3.3-70b-versatile');
  const [temperature, setTemperature] = useState(0.7);

  // Copy success indicator
  const [copiedId, setCopiedId] = useState(null);

  // Loading States
  const [historyLoading, setHistoryLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);

  // Toast Notification state
  const [toast, setToast] = useState(null);

  // Refs for scrolling and abortion
  const chatEndRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Auto-scroll helper
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText, isGenerating]);

  // Load chat history on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  // Show Toast Helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await api.get('/history');
      setHistory(response.data);
      if (response.data.length > 0 && !activeChatId) {
        // Open the most recent chat by default
        selectChat(response.data[0].id, response.data);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch chat history.", "error");
    } finally {
      setHistoryLoading(false);
    }
  };

  const selectChat = (id, historyList = history) => {
    const chat = historyList.find(c => c.id === id);
    if (chat) {
      setActiveChatId(chat.id);
      setMessages(chat.messages || []);
      setStreamingText('');
      setSidebarOpen(false);
    }
  };

  const handleNewChat = async () => {
    try {
      const response = await api.post('/new-chat', { title: "New Chat" });
      const newChat = {
        id: response.data.id,
        title: response.data.title,
        created_at: response.data.created_at,
        messages: []
      };
      setHistory(prev => [newChat, ...prev]);
      setActiveChatId(newChat.id);
      setMessages([]);
      setStreamingText('');
      showToast("Started a new conversation!");
    } catch (err) {
      console.error(err);
      showToast("Failed to create new conversation.", "error");
    }
  };

  const handleDeleteChat = async (id, e) => {
    e.stopPropagation(); // Avoid selecting the chat when clicking delete
    try {
      await api.delete(`/history/${id}`);
      setHistory(prev => prev.filter(c => c.id !== id));
      showToast("Chat deleted successfully.");
      
      if (activeChatId === id) {
        const remainingChats = history.filter(c => c.id !== id);
        if (remainingChats.length > 0) {
          selectChat(remainingChats[0].id, remainingChats);
        } else {
          setActiveChatId(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to delete chat.", "error");
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm("Are you sure you want to delete ALL chat conversations? This cannot be undone.")) {
      try {
        for (const chat of history) {
          await api.delete(`/history/${chat.id}`);
        }
        setHistory([]);
        setActiveChatId(null);
        setMessages([]);
        showToast("Clear completed.");
        setShowSettings(false);
      } catch (err) {
        console.error(err);
        showToast("Error clearing chat history.", "error");
      }
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
      showToast("Response generation stopped.", "info");
    }
  };

  const handleSendMessage = async (customMessage = null) => {
    const textToSend = customMessage || input;
    if (!textToSend.trim()) return;

    let currentChatId = activeChatId;

    // Create a new chat on the fly if none is active
    if (!currentChatId) {
      try {
        const response = await api.post('/new-chat', { title: "New Chat" });
        const newChat = {
          id: response.data.id,
          title: response.data.title,
          created_at: response.data.created_at,
          messages: []
        };
        setHistory(prev => [newChat, ...prev]);
        currentChatId = newChat.id;
        setActiveChatId(newChat.id);
      } catch (err) {
        console.error(err);
        showToast("Error creating chat session.", "error");
        return;
      }
    }

    if (!customMessage) setInput('');
    setIsGenerating(true);
    setStreamingText('');

    // Pre-insert user message locally for quick rendering
    const tempUserMsg = {
      id: Date.now(),
      role: 'user',
      message: textToSend,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    // Setup abort controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('eduai_token')}`
        },
        body: JSON.stringify({
          chat_id: currentChatId,
          message: textToSend,
          model: selectedModel,
          temperature: parseFloat(temperature)
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.detail || "Server error occurred");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullAssistantText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const normalizedBuffer = buffer.replace(/\r\n/g, '\n');
        const parts = normalizedBuffer.split('\n\n');
        buffer = parts.pop() || ""; // Keep remaining incomplete block

        for (const part of parts) {
          if (!part.trim()) continue;
          
          const lines = part.split('\n');
          let event = "";
          let dataVal = "";

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              event = line.substring(7).trim();
            } else if (line.startsWith('data: ')) {
              dataVal = line.substring(6).trim();
            }
          }

          if (dataVal) {
            try {
              const dataParsed = JSON.parse(dataVal);
              
              if (event === 'user_msg') {
                // Real DB user message id can replace temp message if needed
              } else if (event === 'token') {
                fullAssistantText += dataParsed.token;
                setStreamingText(fullAssistantText);
              } else if (event === 'done') {
                // Completed event
                const finalMsg = {
                  id: dataParsed.id,
                  role: 'assistant',
                  message: dataParsed.message,
                  timestamp: dataParsed.timestamp
                };
                setMessages(prev => {
                  // Filter out temporary local user msg to prevent duplicates, and append proper ones
                  // In our database structure, history is fetched fresh. Let's just append the assistant message.
                  return [...prev.filter(m => m.id !== tempUserMsg.id), tempUserMsg, finalMsg];
                });
                setStreamingText('');
                setIsGenerating(false);
                
                // Refresh sidebar titles
                fetchHistory();
              } else if (event === 'error') {
                showToast(dataParsed.error, "error");
                setIsGenerating(false);
              }
            } catch (e) {
              console.error("Error parsing stream chunk:", e);
            }
          }
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        // Save current stream partial response manually if desired
        fetchHistory();
      } else {
        console.error(error);
        showToast(error.message || "Failed to communicate with LLM server.", "error");
        setIsGenerating(false);
      }
    }
  };

  const handleRegenerate = () => {
    // Find the last user message
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMessage) {
      handleSendMessage(lastUserMessage.message);
    } else {
      showToast("No user message to regenerate.", "info");
    }
  };

  const handleCopyText = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const filteredHistory = history.filter(chat => 
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-900 dark:bg-dark-900 dark:text-gray-100 font-sans transition-colors duration-200">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold ${
              toast.type === 'error' 
                ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400' 
                : toast.type === 'info' 
                  ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            } backdrop-blur-md`}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
          >
            <Info className="w-4 h-4 shrink-0" />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 border-r border-gray-200/50 dark:border-dark-850/50 bg-white/70 dark:bg-dark-900/70 backdrop-blur-xl flex flex-col justify-between transition-transform duration-350 ease-out
        lg:static lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="p-4 flex items-center justify-between border-b border-gray-200/40 dark:border-dark-850/40">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-brand-500 text-white shadow-md shadow-brand-500/15">
              <Cpu className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-brand-500 to-purple-500 bg-clip-text text-transparent">
              EduAI Assistant
            </span>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg border border-gray-200/40 dark:border-dark-800/40 hover:bg-gray-100 dark:hover:bg-dark-800 text-gray-500 hover:text-gray-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sidebar Action Buttons & Search */}
        <div className="p-3 space-y-3">
          <button
            onClick={handleNewChat}
            className="w-full py-3 px-4 rounded-xl border border-dashed border-brand-500/40 hover:border-brand-500/80 bg-brand-500/5 hover:bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Conversation
          </button>

          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-dark-850 bg-white/20 dark:bg-dark-950/20 focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium text-xs"
              placeholder="Search conversations..."
            />
          </div>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
          {historyLoading ? (
            <div className="space-y-2 p-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-10 rounded-xl bg-gray-200/50 dark:bg-dark-850/50 animate-pulse-slow"></div>
              ))}
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400">
              No conversations found.
            </div>
          ) : (
            filteredHistory.map((chat) => (
              <div
                key={chat.id}
                onClick={() => selectChat(chat.id)}
                className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 text-sm ${
                  activeChatId === chat.id
                    ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold'
                    : 'hover:bg-gray-150/40 dark:hover:bg-dark-850/40 text-gray-600 dark:text-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate pr-8">
                  <span className="shrink-0 text-gray-400">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                  <span className="truncate">{chat.title}</span>
                </div>
                
                <button
                  onClick={(e) => handleDeleteChat(chat.id, e)}
                  className="absolute right-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-dark-800 transition-all duration-150"
                  title="Delete Conversation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* User Settings & Logout Bottom Footer */}
        <div className="p-3 border-t border-gray-200/40 dark:border-dark-850/40 space-y-2">
          {user && (
            <div className="flex items-center space-x-3 px-3 py-2 rounded-xl bg-gray-150/30 dark:bg-dark-850/30">
              <div className="p-1.5 rounded-lg bg-brand-500/20 text-brand-500">
                <User className="w-4 h-4" />
              </div>
              <div className="truncate">
                <p className="text-xs font-bold truncate leading-none">{user.name}</p>
                <p className="text-[10px] text-gray-400 truncate mt-1 leading-none">{user.email}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="py-2.5 rounded-xl border border-gray-200/40 dark:border-dark-800/40 hover:bg-gray-150/40 dark:hover:bg-dark-850/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" /> Settings
            </button>
            <button
              onClick={handleLogout}
              className="py-2.5 rounded-xl border border-red-500/10 hover:bg-red-500/5 text-red-500 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Log Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Chat Pane Container */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        
        {/* Background Gradients inside workspace */}
        <div className="gradient-bg-mesh opacity-30">
          <div className="gradient-sphere-1"></div>
          <div className="gradient-sphere-2"></div>
        </div>

        {/* Workspace Header */}
        <header className="h-16 border-b border-gray-200/40 dark:border-dark-850/40 flex justify-between items-center px-4 bg-white/40 dark:bg-dark-900/40 backdrop-blur-md relative z-10">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-gray-200/50 dark:border-dark-800/50 hover:bg-gray-150/50 dark:hover:bg-dark-850/50"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="truncate">
              <h2 className="font-extrabold text-sm truncate leading-snug">
                {activeChatId 
                  ? (history.find(c => c.id === activeChatId)?.title || "Active Chat")
                  : "Welcome to EduAI Assistant"}
              </h2>
              <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3 text-brand-500" />
                Model: <span className="font-semibold text-brand-500">{selectedModel}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl border border-gray-200/50 dark:border-dark-800/50 hover:bg-gray-150/50 dark:hover:bg-dark-850/50 text-gray-500 hover:text-gray-900 transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-gray-500" />}
            </button>
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-xl border border-gray-200/50 dark:border-dark-800/50 hover:bg-gray-150/50 dark:hover:bg-dark-850/50 text-gray-500 hover:text-gray-900 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Message Container Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 relative z-10">
          
          {messages.length === 0 && !streamingText ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto py-12">
              <motion.div 
                className="p-4 rounded-3xl bg-brand-500/10 text-brand-500 mb-6"
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Cpu className="w-12 h-12" />
              </motion.div>
              <h3 className="text-xl font-extrabold mb-3">Ask Any Question</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-8">
                Welcome to EduAI Assistant! Ask any question on any topic — programming, science, mathematics, general knowledge, history, or problem solving.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {[
                  "Explain how photosynthesis works",
                  "Write a Python script to sort a list",
                  "Solve 2x + 5 = 15 step by step",
                  "What caused the Industrial Revolution?"
                ].map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(sample)}
                    className="p-3.5 rounded-2xl border border-gray-200/50 dark:border-dark-850/50 bg-white/40 dark:bg-dark-950/40 hover:bg-white/80 dark:hover:bg-dark-850/80 text-left text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-brand-500 dark:hover:text-brand-400 transition-all duration-200"
                  >
                    "{sample}" &rarr;
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg) => (
                <div 
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5 px-1.5">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                      {msg.role === 'user' ? 'You' : 'EduAI Assistant'}
                    </span>
                  </div>

                  <div className={`p-4 md:p-5 rounded-2xl max-w-full leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-brand-500 text-white rounded-tr-none'
                      : 'bg-white dark:bg-dark-850 border border-gray-200/30 dark:border-dark-800/30 rounded-tl-none text-gray-800 dark:text-gray-150'
                  }`}>
                    {msg.role === 'user' ? (
                      <p className="text-sm whitespace-pre-wrap font-medium">{msg.message}</p>
                    ) : (
                      <div className="prose-custom text-sm">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({ node, inline, className, children, ...props }) {
                              const match = /language-(\w+)/.exec(className || '');
                              return !inline && match ? (
                                <div className="relative group my-4 rounded-xl overflow-hidden shadow-lg border border-gray-200/10">
                                  <div className="flex justify-between items-center px-4 py-2 bg-gray-100 dark:bg-dark-900 border-b border-gray-200/10 text-xs font-mono text-gray-400">
                                    <span>{match[1]}</span>
                                    <button
                                      onClick={() => handleCopyText(String(children).replace(/\n$/, ''), msg.id + match[1])}
                                      className="flex items-center gap-1.5 hover:text-white transition-colors"
                                    >
                                      {copiedId === (msg.id + match[1]) ? (
                                        <>
                                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                                          <span className="text-emerald-400">Copied!</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3.5 h-3.5" />
                                          <span>Copy</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                  <SyntaxHighlighter
                                    style={vscDarkPlus}
                                    language={match[1]}
                                    PreTag="div"
                                    {...props}
                                    customStyle={{ margin: 0, padding: '16px', fontSize: '13px', background: '#0a0a14' }}
                                  >
                                    {String(children).replace(/\n$/, '')}
                                  </SyntaxHighlighter>
                                </div>
                              ) : (
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              );
                            }
                          }}
                        >
                          {msg.message}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-3 mt-2 px-2 text-gray-400">
                      <button
                        onClick={() => handleCopyText(msg.message, msg.id)}
                        className="flex items-center gap-1 text-[11px] font-semibold hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                </div>
              ))}

              {/* Streaming AI Bubble */}
              {streamingText && (
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-2 mb-1.5 px-1.5">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                      EduAI Assistant
                    </span>
                  </div>

                  <div className="p-4 md:p-5 rounded-2xl max-w-full leading-relaxed shadow-sm bg-white dark:bg-dark-850 border border-gray-200/30 dark:border-dark-800/30 rounded-tl-none text-gray-800 dark:text-gray-150">
                    <div className="prose-custom text-sm typing-cursor">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ node, inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline && match ? (
                              <div className="relative my-4 rounded-xl overflow-hidden shadow-lg border border-gray-200/10">
                                <div className="flex justify-between items-center px-4 py-2 bg-gray-100 dark:bg-dark-900 border-b border-gray-200/10 text-xs font-mono text-gray-400">
                                  <span>{match[1]}</span>
                                </div>
                                <SyntaxHighlighter
                                  style={vscDarkPlus}
                                  language={match[1]}
                                  PreTag="div"
                                  {...props}
                                  customStyle={{ margin: 0, padding: '16px', fontSize: '13px', background: '#0a0a14' }}
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              </div>
                            ) : (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            );
                          }
                        }}
                      >
                        {streamingText}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}

              {/* Typing indicator placeholder if pending */}
              {isGenerating && !streamingText && (
                <div className="flex items-center space-x-2.5 p-3 rounded-2xl bg-white dark:bg-dark-850 border border-gray-200/30 dark:border-dark-800/30 w-fit">
                  <div className="w-2.5 h-2.5 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                  <div className="w-2.5 h-2.5 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                  <div className="w-2.5 h-2.5 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          )}
        </main>

        {/* Input Text Form Area */}
        <footer className="p-4 bg-white/40 dark:bg-dark-900/40 border-t border-gray-200/40 dark:border-dark-850/40 backdrop-blur-md relative z-10">
          <div className="max-w-3xl mx-auto relative">
            
            {/* Input Action Controls (Stop generation, Regenerate) */}
            {isGenerating ? (
              <div className="flex justify-center mb-3">
                <button
                  onClick={handleStopGeneration}
                  className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 text-xs font-semibold flex items-center gap-2 transition-all duration-200"
                >
                  <Square className="w-3.5 h-3.5 fill-current" /> Stop Generation
                </button>
              </div>
            ) : messages.length > 0 ? (
              <div className="flex justify-center mb-3">
                <button
                  onClick={handleRegenerate}
                  className="px-4 py-2 rounded-xl bg-gray-150 dark:bg-dark-850 hover:bg-gray-200 dark:hover:bg-dark-800 border border-gray-200/30 dark:border-dark-800/30 text-xs font-semibold flex items-center gap-2 transition-all duration-200"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Regenerate Response
                </button>
              </div>
            ) : null}

            {/* Main Input Text Box */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative flex items-center"
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={1}
                placeholder="Ask EduAI a question... (Shift+Enter for new line)"
                className="w-full pl-4 pr-16 py-4 rounded-2xl border border-gray-200 dark:border-dark-850 bg-white/80 dark:bg-dark-950/80 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-500 text-sm resize-none pr-14 leading-relaxed font-medium transition-all"
              />
              <button
                type="submit"
                disabled={isGenerating || !input.trim()}
                className="absolute right-2.5 p-3 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:bg-gray-200 dark:disabled:bg-dark-850 text-white disabled:text-gray-400 transition-all duration-200 shadow-md shadow-brand-500/10 disabled:shadow-none"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            
            <p className="text-[10px] text-center text-gray-400 mt-2">
              EduAI Assistant may provide general guidance. Always cross-verify critical security policies or system definitions.
            </p>
          </div>
        </footer>

        {/* SETTINGS OVERLAY MODAL */}
        <AnimatePresence>
          {showSettings && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              {/* Backdrop */}
              <motion.div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSettings(false)}
              />

              {/* Settings Card */}
              <motion.div 
                className="w-full max-w-lg rounded-3xl border border-gray-200 dark:border-dark-800 bg-white dark:bg-dark-900 shadow-2xl relative z-10 p-6 overflow-hidden max-h-[90vh] flex flex-col justify-between"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <div className="flex justify-between items-center border-b border-gray-200/40 dark:border-dark-850/40 pb-4 mb-5">
                  <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-brand-500" />
                    <h3 className="font-extrabold text-lg">System Settings</h3>
                  </div>
                  <button 
                    onClick={() => setShowSettings(false)}
                    className="p-1.5 rounded-lg border border-gray-200/50 dark:border-dark-800/50 hover:bg-gray-150 dark:hover:bg-dark-850 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-6 pr-1">
                  
                  {/* Model Selection */}
                  <div className="space-y-2">
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-400">
                      AI Model Selector
                    </label>
                    <div className="relative">
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-850 bg-gray-50 dark:bg-dark-950 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm font-semibold cursor-pointer appearance-none"
                      >
                        <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (Recommended)</option>
                        <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (Super Fast)</option>
                        <option value="mixtral-8x7b-32768">mixtral-8x7b-32768 (High Context)</option>
                        <option value="gemma2-9b-it">gemma2-9b-it (Google Gemma 2)</option>
                      </select>
                      <span className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400">
                        <Sliders className="w-4 h-4" />
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400">
                      EduAI Assistant uses Groq Cloud API for ultra-fast, free LLM inference. Set `GROQ_API_KEY` in `.env`.
                    </p>
                  </div>

                  {/* Temperature Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-400">
                        Temperature: <span className="text-brand-500 font-bold">{temperature}</span>
                      </label>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1.2"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-full accent-brand-500 cursor-ew-resize bg-gray-200 dark:bg-dark-800 rounded-lg h-2"
                    />
                    <div className="flex justify-between text-[9px] text-gray-400">
                      <span>0.0 (Precise & Factual)</span>
                      <span>1.2 (Creative & Random)</span>
                    </div>
                  </div>

                  {/* Dark Mode toggle */}
                  <div className="flex justify-between items-center p-3 rounded-xl border border-gray-200/50 dark:border-dark-850/50">
                    <div>
                      <h4 className="text-sm font-bold">Theme Appearance</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">Toggle between light and dark modes.</p>
                    </div>
                    <button
                      onClick={() => setDarkMode(!darkMode)}
                      className="px-4 py-2 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 text-brand-500 text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      {darkMode ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5" />}
                      <span>{darkMode ? "Light" : "Dark"} Mode</span>
                    </button>
                  </div>

                  {/* User Profile display */}
                  <div className="p-4 rounded-xl border border-gray-200/50 dark:border-dark-850/50 space-y-2 bg-gray-50/50 dark:bg-dark-950/20">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                      Connected User Profile
                    </label>
                    {user ? (
                      <div className="space-y-1.5 text-xs">
                        <p><span className="font-semibold text-gray-400">Name:</span> {user.name}</p>
                        <p><span className="font-semibold text-gray-400">Email:</span> {user.email}</p>
                        <p><span className="font-semibold text-gray-400">Role:</span> Educational Learner</p>
                      </div>
                    ) : (
                      <p className="text-xs">No profile details available.</p>
                    )}
                  </div>

                </div>

                <div className="border-t border-gray-200/40 dark:border-dark-850/40 pt-4 mt-5 flex gap-3">
                  <button
                    onClick={handleClearHistory}
                    className="flex-1 py-3 rounded-xl border border-red-500/10 hover:bg-red-500/5 text-red-500 hover:text-red-600 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" /> Clear All History
                  </button>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="flex-1 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition-all"
                  >
                    Apply Settings
                  </button>
                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
