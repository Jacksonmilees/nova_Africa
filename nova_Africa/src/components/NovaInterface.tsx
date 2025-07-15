import React, { useState, useEffect, useRef } from 'react';
import { Send, Cpu, Activity, Database, Network, Settings, Zap, Brain, Terminal, Code } from 'lucide-react';
import NovaCore from '../services/NovaCore';
import { ChatMessage, NovaSystemStatus, NovaTask, NovaPlugin } from '../types';

const NovaInterface: React.FC = () => {
  const [nova] = useState(() => new NovaCore());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [systemStatus, setSystemStatus] = useState<NovaSystemStatus>(nova.currentStatus);
  const [activeTab, setActiveTab] = useState<'chat' | 'memory' | 'tasks' | 'plugins' | 'system'>('chat');
  const [tasks, setTasks] = useState<NovaTask[]>([]);
  const [plugins, setPlugins] = useState<NovaPlugin[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize NOVA system
    nova.on('initialized', () => {
      addSystemMessage('NOVA System initialized successfully');
      setTasks(nova.allTasks);
      setPlugins(nova.allPlugins);
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

    nova.on('pluginEnabled', () => {
      setPlugins(nova.allPlugins);
    });

    nova.on('pluginDisabled', () => {
      setPlugins(nova.allPlugins);
    });

    // Add initial system message
    addSystemMessage('NOVA (Neural Operational Virtual Assistant) - Aether Core Unit 001');
    addSystemMessage('Initializing system components...');

    return () => {
      nova.shutdown();
    };
  }, [nova]);

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
      const response = await nova.processCommand(userInput);
      addNovaMessage(response);
    } catch (error) {
      addNovaMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'result');
    } finally {
      setIsProcessing(false);
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

  const renderSystemTab = () => (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Ollama Status</span>
            <span className={`text-sm ${getStatusColor(systemStatus.ollamaStatus)}`}>
              {getStatusIcon(systemStatus.ollamaStatus)} {systemStatus.ollamaStatus}
            </span>
          </div>
          <div className="text-xs text-gray-500">Local LLM Connection</div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Active Plugins</span>
            <span className="text-sm text-blue-400">{systemStatus.activePlugins}</span>
          </div>
          <div className="text-xs text-gray-500">Loaded & Enabled</div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Active Tasks</span>
            <span className="text-sm text-purple-400">{systemStatus.activeTasks}</span>
          </div>
          <div className="text-xs text-gray-500">Currently Processing</div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Network</span>
            <span className={`text-sm ${getStatusColor(systemStatus.network ? 'online' : 'offline')}`}>
              {getStatusIcon(systemStatus.network ? 'online' : 'offline')} {systemStatus.network ? 'online' : 'offline'}
            </span>
          </div>
          <div className="text-xs text-gray-500">Internet Connectivity</div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Uptime</span>
            <span className="text-sm text-green-400">{Math.floor(systemStatus.uptime / 60)}m</span>
          </div>
          <div className="text-xs text-gray-500">System Runtime</div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Memory Usage</span>
            <span className="text-sm text-cyan-400">{nova.allMemories.length}</span>
          </div>
          <div className="text-xs text-gray-500">Stored Memories</div>
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          System Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Autonomy Level</label>
            <select className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2">
              <option value="manual">Manual</option>
              <option value="assisted">Assisted</option>
              <option value="autonomous">Autonomous</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Default Model</label>
            <input
              type="text"
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
              value={nova.currentConfig.defaultModel}
              readOnly
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderTasksTab = () => (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Task Management</h3>
        <button
          onClick={() => {
            nova.createTask({
              title: 'New Task',
              description: 'Auto-generated task',
              status: 'pending',
              priority: 'medium',
              tags: ['auto'],
            });
          }}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm"
        >
          Create Task
        </button>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <div key={task.id} className="bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">{task.title}</h4>
              <span className={`px-2 py-1 rounded text-xs ${
                task.status === 'completed' ? 'bg-green-600' :
                task.status === 'in_progress' ? 'bg-blue-600' :
                task.status === 'failed' ? 'bg-red-600' :
                'bg-gray-600'
              }`}>
                {task.status}
              </span>
            </div>
            <p className="text-sm text-gray-400 mb-2">{task.description}</p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Priority: {task.priority}</span>
              <span>{new Date(task.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPluginsTab = () => (
    <div className="p-6 space-y-4">
      <h3 className="text-lg font-semibold">Plugin Management</h3>
      
      <div className="space-y-3">
        {plugins.map((plugin) => (
          <div key={plugin.id} className="bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${plugin.enabled ? 'bg-green-500' : 'bg-gray-500'}`} />
                <h4 className="font-medium">{plugin.name}</h4>
                <span className="text-xs text-gray-500 ml-2">v{plugin.version}</span>
              </div>
              <button
                onClick={() => {
                  if (plugin.enabled) {
                    nova.disablePlugin(plugin.id);
                  } else {
                    nova.enablePlugin(plugin.id);
                  }
                }}
                className={`px-3 py-1 rounded text-xs ${
                  plugin.enabled 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {plugin.enabled ? 'Disable' : 'Enable'}
              </button>
            </div>
            <p className="text-sm text-gray-400 mb-2">{plugin.description}</p>
            <div className="flex flex-wrap gap-2">
              {plugin.capabilities.map((cap) => (
                <span key={cap} className="bg-gray-700 px-2 py-1 rounded text-xs">
                  {cap}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMemoryTab = () => (
    <div className="p-6 space-y-4">
      <h3 className="text-lg font-semibold">Memory Archive</h3>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {nova.allMemories.slice(0, 50).map((memory) => (
          <div key={memory.id} className="bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className={`px-2 py-1 rounded text-xs ${
                memory.type === 'thought' ? 'bg-purple-600' :
                memory.type === 'task' ? 'bg-blue-600' :
                memory.type === 'learning' ? 'bg-green-600' :
                memory.type === 'interaction' ? 'bg-yellow-600' :
                'bg-gray-600'
              }`}>
                {memory.type}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(memory.timestamp).toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-gray-300 mb-2">{memory.content}</p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Importance: {memory.importance}/10</span>
              <div className="flex gap-2">
                {memory.tags.map((tag) => (
                  <span key={tag} className="bg-gray-700 px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderChatTab = () => (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg ${
              message.sender === 'user' 
                ? 'bg-blue-600 text-white' 
                : message.sender === 'system'
                ? 'bg-gray-700 text-gray-300'
                : 'bg-gray-800 text-gray-100'
            }`}>
              {message.sender === 'system' && (
                <div className="flex items-center mb-1">
                  <Terminal className="w-4 h-4 mr-2" />
                  <span className="text-xs font-medium">SYSTEM</span>
                </div>
              )}
              {message.sender === 'nova' && (
                <div className="flex items-center mb-1">
                  <Brain className="w-4 h-4 mr-2" />
                  <span className="text-xs font-medium">NOVA</span>
                </div>
              )}
              <div className={`${message.type === 'code' ? 'font-mono bg-gray-900 p-2 rounded' : ''}`}>
                {message.content}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter command or message..."
            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={isProcessing || !inputValue.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
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

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">NOVA</h1>
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
            <button
              onClick={() => setActiveTab('chat')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'chat' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Terminal className="w-5 h-5" />
              <span>Chat Interface</span>
            </button>
            
            <button
              onClick={() => setActiveTab('memory')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'memory' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Database className="w-5 h-5" />
              <span>Memory Archive</span>
            </button>
            
            <button
              onClick={() => setActiveTab('tasks')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'tasks' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Activity className="w-5 h-5" />
              <span>Task Manager</span>
            </button>
            
            <button
              onClick={() => setActiveTab('plugins')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'plugins' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Code className="w-5 h-5" />
              <span>Plugin Manager</span>
            </button>
            
            <button
              onClick={() => setActiveTab('system')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'system' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Cpu className="w-5 h-5" />
              <span>System Status</span>
            </button>
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold capitalize">
              {activeTab === 'chat' ? 'Neural Interface' : 
               activeTab === 'memory' ? 'Memory Archive' :
               activeTab === 'tasks' ? 'Task Management' :
               activeTab === 'plugins' ? 'Plugin Ecosystem' :
               'System Monitoring'}
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
          {activeTab === 'chat' && renderChatTab()}
          {activeTab === 'memory' && renderMemoryTab()}
          {activeTab === 'tasks' && renderTasksTab()}
          {activeTab === 'plugins' && renderPluginsTab()}
          {activeTab === 'system' && renderSystemTab()}
        </div>
      </div>
    </div>
  );
};

export default NovaInterface;