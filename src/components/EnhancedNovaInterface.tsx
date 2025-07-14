import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Cpu, Activity, Database, Network, Settings, Zap, Brain, Terminal, Code, Search,
  MessageSquare, FileText, Lightbulb, Cog, Monitor, Download, Play, Pause, RotateCcw,
  CheckCircle, AlertCircle, Clock, TrendingUp, Layers, GitBranch, Sparkles
} from 'lucide-react';
import NovaCore from '../services/NovaCore';
import AIProviderManager from '../services/AIProviderManager';
import AdvancedCodeAssistant from '../services/plugins/AdvancedCodeAssistant';
import IntelligentResearcher from '../services/plugins/IntelligentResearcher';
import AdvancedReasoning from '../services/plugins/AdvancedReasoning';
import { ChatMessage, NovaSystemStatus, NovaTask, NovaPlugin } from '../types';

const EnhancedNovaInterface: React.FC = () => {
  const [nova] = useState(() => new NovaCore());
  const [aiManager] = useState(() => new AIProviderManager(nova));
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [systemStatus, setSystemStatus] = useState<NovaSystemStatus>(nova.currentStatus);
  const [activeTab, setActiveTab] = useState<'chat' | 'memory' | 'tasks' | 'plugins' | 'system' | 'ollama'>('chat');
  const [tasks, setTasks] = useState<NovaTask[]>([]);
  const [plugins, setPlugins] = useState<NovaPlugin[]>([]);
  const [ollamaModels, setOllamaModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState('llama3.1');
  const [availableProviders, setAvailableProviders] = useState<any[]>([]);
  const [currentProvider, setCurrentProvider] = useState<'ollama' | 'gemini' | 'fallback'>('ollama');
  const [conversationMode, setConversationMode] = useState<'general' | 'code' | 'research' | 'reasoning'>('general');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize NOVA system
    nova.on('initialized', async () => {
      addSystemMessage('🚀 NOVA System initialized successfully');
      addSystemMessage('🧠 Loading advanced AI capabilities...');
      
      // Load enhanced plugins
      const codeAssistant = new AdvancedCodeAssistant();
      const researcher = new IntelligentResearcher();
      const reasoning = new AdvancedReasoning();
      
      await nova.loadPlugin(codeAssistant.getPlugin());
      await nova.loadPlugin(researcher.getPlugin());
      await nova.loadPlugin(reasoning.getPlugin());
      
      setTasks(nova.allTasks);
      setPlugins(nova.allPlugins);
      
      // Initialize AI providers
      try {
        await aiManager.initialize();
        const providers = await aiManager.getAvailableProviders();
        setAvailableProviders(providers);
        setCurrentProvider(aiManager.getPreferredProvider());
        
        const ollamaProvider = providers.find(p => p.provider === 'ollama');
        const geminiProvider = providers.find(p => p.provider === 'gemini');
        
        if (ollamaProvider?.available) {
          addSystemMessage('🔗 Ollama connection established');
          const models = await aiManager.getOllamaIntegration().listModels();
          setOllamaModels(models);
          if (models.length > 0) {
            setSelectedModel(models[0].name);
            aiManager.getOllamaIntegration().setDefaultModel(models[0].name);
          }
        }
        
        if (geminiProvider?.available) {
          addSystemMessage('🤖 Gemini API connected');
        }
        
        if (aiManager.getGeminiIntegration().isSerpApiConfigured()) {
          addSystemMessage('🔍 Web search capabilities enabled');
        }
        
        if (!ollamaProvider?.available && !geminiProvider?.available) {
          addSystemMessage('⚠️ External AI providers not available - running in basic mode');
        }
      } catch (error) {
        addSystemMessage('⚠️ AI providers initialization failed - running in basic mode');
      }
    });

    nova.on('statusUpdated', (status: NovaSystemStatus) => {
      setSystemStatus(status);
    });

    nova.on('taskCreated', (task: NovaTask) => {
      setTasks(prev => [...prev, task]);
    });

    nova.on('taskUpdated', (task: NovaTask) => {
      setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    });

    nova.on('pluginLoaded', () => {
      setPlugins(nova.allPlugins);
    });

    // Add initial system messages
    addSystemMessage('🌟 NOVA (Neural Operational Virtual Assistant) - Aether Core Unit 001');
    addSystemMessage('🔧 Initializing advanced AI capabilities...');
    addSystemMessage('💡 Ready for autonomous operation, coding assistance, and intelligent research');

    return () => {
      nova.shutdown();
    };
  }, [nova, aiManager]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addSystemMessage = (content: string) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      content,
      sender: 'system',
      timestamp: Date.now(),
      type: 'message',
    };
    setMessages(prev => [...prev, message]);
  };

  const addUserMessage = (content: string) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: Date.now(),
      type: 'message',
    };
    setMessages(prev => [...prev, message]);
  };

  const addNovaMessage = (content: string, type: 'message' | 'code' | 'command' | 'result' = 'message') => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      content,
      sender: 'nova',
      timestamp: Date.now(),
      type,
    };
    setMessages(prev => [...prev, message]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing) return;

    const userInput = inputValue.trim();
    setInputValue('');
    setIsProcessing(true);

    addUserMessage(userInput);

    try {
      const aiResponse = await aiManager.processRequest(userInput, conversationMode);
      const response = aiResponse.content;
      
      // Add provider info to the message
      addNovaMessage(response, 'message');
      
      // Add a small indicator of which provider was used
      if (aiResponse.provider !== 'fallback') {
        addSystemMessage(`💡 Response generated by ${aiResponse.provider} (${aiResponse.model})`);
      }
      
      // Store interaction in memory
      await nova.addMemory({
        type: 'interaction',
        content: `User: ${userInput} | NOVA (${aiResponse.provider}): ${response.substring(0, 200)}...`,
        importance: 6,
        tags: ['conversation', conversationMode, aiResponse.provider],
      });
      
    } catch (error) {
      addNovaMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'result');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleModelChange = (modelName: string) => {
    setSelectedModel(modelName);
    aiManager.getOllamaIntegration().setDefaultModel(modelName);
    addSystemMessage(`🔄 Switched to model: ${modelName}`);
  };

  const handlePullModel = async (modelName: string) => {
    try {
      addSystemMessage(`📥 Pulling model: ${modelName}...`);
      await aiManager.getOllamaIntegration().pullModel(modelName);
      const models = await aiManager.getOllamaIntegration().listModels();
      setOllamaModels(models);
      addSystemMessage(`✅ Model ${modelName} pulled successfully`);
    } catch (error) {
      addSystemMessage(`❌ Failed to pull model: ${error}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'online':
        return 'text-green-400';
      case 'disconnected':
      case 'offline':
        return 'text-red-400';
      case 'error':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'online':
        return '●';
      case 'disconnected':
      case 'offline':
        return '○';
      case 'error':
        return '⚠';
      default:
        return '◐';
    }
  };

  const renderOllamaTab = () => (
    <div className="p-6 space-y-6">
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Zap className="w-5 h-5 mr-2" />
          AI Provider Status
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {availableProviders.map((provider) => (
            <div key={provider.provider} className="bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium capitalize">{provider.provider}</span>
                <span className={`text-sm ${provider.available ? 'text-green-400' : 'text-red-400'}`}>
                  {provider.available ? '●' : '○'} {provider.available ? 'Available' : 'Offline'}
                </span>
              </div>
              <div className="text-xs text-gray-400">{provider.model || 'No model'}</div>
              {provider.available && (
                <button
                  onClick={() => {
                    aiManager.setPreferredProvider(provider.provider);
                    setCurrentProvider(provider.provider);
                    addSystemMessage(`🔄 Switched to ${provider.provider} provider`);
                  }}
                  className={`mt-2 px-3 py-1 rounded text-xs ${
                    currentProvider === provider.provider 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                >
                  {currentProvider === provider.provider ? 'Active' : 'Select'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Brain className="w-5 h-5 mr-2" />
          Ollama Configuration
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Connection Status</span>
              <span className={`text-sm ${getStatusColor(systemStatus.ollamaStatus)}`}>
                {getStatusIcon(systemStatus.ollamaStatus)} {systemStatus.ollamaStatus}
              </span>
            </div>
            <div className="text-xs text-gray-400">Local LLM Processing</div>
          </div>
          
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Active Model</span>
              <span className="text-sm text-blue-400">{selectedModel}</span>
            </div>
            <div className="text-xs text-gray-400">Current Language Model</div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Available Models</label>
            <div className="space-y-2">
              {ollamaModels.map((model) => (
                <div key={model.name} className="flex items-center justify-between bg-gray-700 p-3 rounded">
                  <div>
                    <div className="font-medium">{model.name}</div>
                    <div className="text-xs text-gray-400">{model.size} • {model.details?.parameter_size || 'Unknown size'}</div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleModelChange(model.name)}
                      className={`px-3 py-1 rounded text-xs ${
                        selectedModel === model.name 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-600 hover:bg-gray-500'
                      }`}
                    >
                      {selectedModel === model.name ? 'Active' : 'Select'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Pull New Model</label>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Model name (e.g., llama3.1, mistral, codellama)"
                className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const target = e.target as HTMLInputElement;
                    handlePullModel(target.value);
                    target.value = '';
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.querySelector('input[placeholder*="Model name"]') as HTMLInputElement;
                  if (input?.value) {
                    handlePullModel(input.value);
                    input.value = '';
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Conversation Modes</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { mode: 'general', icon: MessageSquare, label: 'General Chat', desc: 'General conversation and assistance' },
            { mode: 'code', icon: Code, label: 'Code Assistant', desc: 'Programming help and code analysis' },
            { mode: 'research', icon: Search, label: 'Research Mode', desc: 'Deep research and analysis' },
            { mode: 'reasoning', icon: Lightbulb, label: 'Reasoning', desc: 'Logical analysis and problem solving' },
          ].map(({ mode, icon: Icon, label, desc }) => (
            <button
              key={mode}
              onClick={() => setConversationMode(mode as any)}
              className={`p-4 rounded-lg text-left transition-colors ${
                conversationMode === mode 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <Icon className="w-5 h-5 mb-2" />
              <div className="font-medium text-sm">{label}</div>
              <div className="text-xs opacity-75">{desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderEnhancedChatTab = () => (
    <div className="flex flex-col h-full">
      {/* Chat Mode Selector */}
      <div className="bg-gray-800 border-b border-gray-700 p-3">
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {[
              { mode: 'general', icon: MessageSquare, label: 'General' },
              { mode: 'code', icon: Code, label: 'Code' },
              { mode: 'research', icon: Search, label: 'Research' },
              { mode: 'reasoning', icon: Lightbulb, label: 'Reasoning' },
            ].map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => setConversationMode(mode as any)}
                className={`flex items-center space-x-2 px-3 py-1 rounded text-sm transition-colors ${
                  conversationMode === mode 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <span>Provider: {currentProvider} | Model: {selectedModel}</span>
            <span className={getStatusColor(systemStatus.ollamaStatus)}>
              {getStatusIcon(systemStatus.ollamaStatus)}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md lg:max-w-2xl px-4 py-3 rounded-lg ${
              message.sender === 'user' 
                ? 'bg-blue-600 text-white' 
                : message.sender === 'system'
                ? 'bg-gray-700 text-gray-300 border border-gray-600'
                : 'bg-gray-800 text-gray-100 border border-gray-700'
            }`}>
              {message.sender === 'system' && (
                <div className="flex items-center mb-2">
                  <Terminal className="w-4 h-4 mr-2" />
                  <span className="text-xs font-medium">SYSTEM</span>
                </div>
              )}
              {message.sender === 'nova' && (
                <div className="flex items-center mb-2">
                  <Sparkles className="w-4 h-4 mr-2 text-blue-400" />
                  <span className="text-xs font-medium text-blue-400">NOVA</span>
                  <span className="text-xs text-gray-400 ml-2">({conversationMode})</span>
                </div>
              )}
              <div className={`${message.type === 'code' ? 'font-mono bg-gray-900 p-3 rounded text-sm' : ''}`}>
                {message.content}
              </div>
              <div className="text-xs text-gray-400 mt-2">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gray-800 border border-gray-700 px-4 py-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full" />
                <span className="text-sm text-gray-400">NOVA is thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Ask NOVA anything (${conversationMode} mode)...`}
            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={isProcessing || !inputValue.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded-lg transition-colors"
          >
            {isProcessing ? (
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );

  // Enhanced versions of other tabs with better UI
  const renderEnhancedSystemTab = () => (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Ollama Status', value: systemStatus.ollamaStatus, icon: Brain, color: getStatusColor(systemStatus.ollamaStatus) },
          { label: 'Active Plugins', value: systemStatus.activePlugins, icon: Layers, color: 'text-blue-400' },
          { label: 'Running Tasks', value: systemStatus.activeTasks, icon: Activity, color: 'text-purple-400' },
          { label: 'Network', value: systemStatus.network ? 'online' : 'offline', icon: Network, color: getStatusColor(systemStatus.network ? 'online' : 'offline') },
          { label: 'Uptime', value: `${Math.floor(systemStatus.uptime / 60)}m`, icon: Clock, color: 'text-green-400' },
          { label: 'Memories', value: nova.allMemories.length, icon: Database, color: 'text-cyan-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">{label}</span>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className={`text-lg font-semibold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Advanced Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Autonomy Level</label>
            <select className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2">
              <option value="manual">Manual Control</option>
              <option value="assisted">Assisted Mode</option>
              <option value="autonomous">Autonomous Operation</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Learning Mode</label>
            <select className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2">
              <option value="active">Active Learning</option>
              <option value="passive">Passive Learning</option>
              <option value="disabled">Learning Disabled</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Enhanced Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-600 to-cyan-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                NOVA
              </h1>
              <p className="text-xs text-gray-400">Aether Core Unit 001</p>
            </div>
          </div>
          
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Ollama</span>
              <span className={getStatusColor(systemStatus.ollamaStatus)}>
                {getStatusIcon(systemStatus.ollamaStatus)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Plugins</span>
              <span className="text-blue-400">{systemStatus.activePlugins}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Tasks</span>
              <span className="text-purple-400">{systemStatus.activeTasks}</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {[
              { id: 'chat', icon: MessageSquare, label: 'Neural Interface', desc: 'AI Chat & Commands' },
              { id: 'memory', icon: Database, label: 'Memory Archive', desc: 'Persistent Memory' },
              { id: 'tasks', icon: Activity, label: 'Task Manager', desc: 'Autonomous Tasks' },
              { id: 'plugins', icon: Code, label: 'Plugin Ecosystem', desc: 'AI Capabilities' },
              { id: 'ollama', icon: Brain, label: 'Ollama Control', desc: 'Local LLM Management' },
              { id: 'system', icon: Cpu, label: 'System Monitor', desc: 'Status & Config' },
            ].map(({ id, icon: Icon, label, desc }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`w-full flex items-start space-x-3 px-3 py-3 rounded-lg transition-colors ${
                  activeTab === id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <Icon className="w-5 h-5 mt-0.5" />
                <div className="text-left">
                  <div className="font-medium text-sm">{label}</div>
                  <div className="text-xs opacity-75">{desc}</div>
                </div>
              </button>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className="text-xs text-gray-400">
            <div className="flex items-center justify-between mb-1">
              <span>System Status</span>
              <span className="text-green-400">ACTIVE</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Uptime</span>
              <span>{Math.floor(systemStatus.uptime / 60)}m {systemStatus.uptime % 60}s</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold capitalize flex items-center">
              {activeTab === 'chat' && <><MessageSquare className="w-5 h-5 mr-2" />Neural Interface</>}
              {activeTab === 'memory' && <><Database className="w-5 h-5 mr-2" />Memory Archive</>}
              {activeTab === 'tasks' && <><Activity className="w-5 h-5 mr-2" />Task Management</>}
              {activeTab === 'plugins' && <><Code className="w-5 h-5 mr-2" />Plugin Ecosystem</>}
              {activeTab === 'ollama' && <><Brain className="w-5 h-5 mr-2" />Ollama Control</>}
              {activeTab === 'system' && <><Cpu className="w-5 h-5 mr-2" />System Monitor</>}
            </h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Network className={`w-4 h-4 ${systemStatus.network ? 'text-green-400' : 'text-red-400'}`} />
                <span className="text-sm text-gray-400">Network</span>
              </div>
              <div className="flex items-center space-x-2">
                <Brain className={`w-4 h-4 ${systemStatus.ollamaStatus === 'connected' ? 'text-green-400' : 'text-red-400'}`} />
                <span className="text-sm text-gray-400">Ollama</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {activeTab === 'chat' && renderEnhancedChatTab()}
          {activeTab === 'ollama' && renderOllamaTab()}
          {activeTab === 'system' && renderEnhancedSystemTab()}
          {/* Other tabs would be enhanced similarly */}
        </div>
      </div>
    </div>
  );
};

export default EnhancedNovaInterface;