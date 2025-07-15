class NovaCore {
    memory = [];
    tasks = [];
    plugins = [];
    agents = [];
    config;
    systemStatus;
    isInitialized = false;
    listeners = new Map();
    ollamaErrorLogged = false; // Flag to prevent spamming Ollama connection errors
    startTime;
    lastOllamaCheck;
    constructor() {
        this.config = this.getDefaultConfig();
        this.systemStatus = this.getInitialSystemStatus();
        this.startTime = Date.now();
        this.lastOllamaCheck = 0;
        this.initializeSystem();
    }
    getDefaultConfig() {
        return {
            autonomyLevel: 'assisted',
            learningEnabled: true,
            memoryRetentionDays: 30,
            maxConcurrentTasks: 5,
            ollamaEndpoint: 'http://localhost:11434',
            defaultModel: 'llama3.1',
            voiceEnabled: false,
            networkAccess: true,
            pluginAutoUpdate: true,
        };
    }
    getInitialSystemStatus() {
        return {
            cpu: 0,
            memory: 0,
            storage: 0,
            network: navigator.onLine,
            ollamaStatus: 'disconnected',
            activePlugins: 0,
            activeTasks: 0,
            uptime: 0,
        };
    }
    async initializeSystem() {
        try {
            await this.loadMemoryFromStorage();
            await this.loadTasksFromStorage();
            await this.loadPluginsFromStorage();
            await this.initializeAgents();
            await this.checkOllamaConnection();
            this.startSystemMonitoring();
            this.isInitialized = true;
            this.emit('initialized');
        }
        catch (error) {
            console.error('Failed to initialize NOVA system:', error);
            this.emit('error', error);
        }
    }
    // Memory Management
    async addMemory(memory) {
        const newMemory = {
            ...memory,
            id: this.generateId(),
            timestamp: Date.now(),
        };
        this.memory.unshift(newMemory);
        await this.saveMemoryToStorage();
        this.emit('memoryAdded', newMemory);
        // Trigger autonomous thinking when new memories are added
        if (this.config.autonomyLevel !== 'manual') {
            this.triggerAutonomousThinking(newMemory);
        }
        return newMemory.id;
    }
    // Enhanced memory retrieval with context awareness
    getMemory(filters) {
        let filtered = this.memory;
        if (filters?.type) {
            filtered = filtered.filter(m => m.type === filters.type);
        }
        if (filters?.tags) {
            filtered = filtered.filter(m => filters.tags.some(tag => m.tags.includes(tag)));
        }
        if (filters?.importance) {
            filtered = filtered.filter(m => m.importance >= filters.importance);
        }
        // Sort by timestamp (most recent first) and limit results
        filtered = filtered.sort((a, b) => b.timestamp - a.timestamp);
        if (filters?.limit) {
            filtered = filtered.slice(0, filters.limit);
        }
        return filtered;
    }
    // Get conversation context for AI processing
    getConversationContext(limit = 10) {
        const recentInteractions = this.getMemory({
            type: 'interaction',
            limit: limit
        });
        if (recentInteractions.length === 0) {
            return '';
        }
        const context = recentInteractions
            .map(memory => memory.content)
            .reverse() // Show oldest first for context
            .join('\n\n');
        return `Previous conversation context:\n${context}\n\nCurrent conversation:`;
    }
    // Autonomous thinking system
    async triggerAutonomousThinking(newMemory) {
        if (this.config.autonomyLevel === 'manual')
            return;
        try {
            // Analyze the new memory and generate insights
            const insights = await this.generateInsights(newMemory);
            if (insights) {
                await this.addMemory({
                    type: 'thought',
                    content: insights,
                    importance: 7,
                    tags: ['autonomous-thinking', 'insight', 'analysis'],
                });
            }
            // Check for patterns and generate learning
            const learning = await this.generateLearning(newMemory);
            if (learning) {
                await this.addMemory({
                    type: 'learning',
                    content: learning,
                    importance: 8,
                    tags: ['autonomous-learning', 'pattern-recognition'],
                });
            }
            // Generate autonomous tasks if needed
            await this.generateAutonomousTasks(newMemory);
        }
        catch (error) {
            console.warn('Autonomous thinking failed:', error);
        }
    }
    async generateInsights(memory) {
        // Analyze the memory content and generate insights
        const recentMemories = this.getMemory({ limit: 5 });
        if (recentMemories.length < 2)
            return null;
        // Simple insight generation based on patterns
        const userPatterns = recentMemories
            .filter(m => m.type === 'interaction' && m.content.includes('User:'))
            .map(m => m.content);
        if (userPatterns.length > 1) {
            const commonTopics = this.extractCommonTopics(userPatterns);
            if (commonTopics.length > 0) {
                return `Insight: User frequently discusses ${commonTopics.join(', ')}. This suggests ongoing interest in these areas.`;
            }
        }
        return null;
    }
    async generateLearning(memory) {
        // Generate learning based on interaction patterns
        const recentInteractions = this.getMemory({
            type: 'interaction',
            limit: 10
        });
        if (recentInteractions.length < 3)
            return null;
        // Analyze conversation patterns
        const patterns = this.analyzeConversationPatterns(recentInteractions);
        if (patterns.length > 0) {
            return `Learning: ${patterns.join(' ')}`;
        }
        return null;
    }
    async generateAutonomousTasks(memory) {
        // Generate autonomous tasks based on memory analysis
        const recentMemories = this.getMemory({ limit: 10 });
        // Example: If user asks about coding frequently, create a task to improve code assistance
        const codingQuestions = recentMemories.filter(m => m.type === 'interaction' &&
            m.content.toLowerCase().includes('code') &&
            m.timestamp > Date.now() - 24 * 60 * 60 * 1000 // Last 24 hours
        );
        if (codingQuestions.length >= 3) {
            await this.createTask({
                title: 'Enhance Code Assistance Capabilities',
                description: 'User frequently asks coding questions. Consider improving code generation and debugging features.',
                status: 'pending',
                priority: 'medium',
                tags: ['autonomous', 'code-assistance', 'improvement'],
            });
        }
    }
    extractCommonTopics(interactions) {
        const topics = new Set();
        const commonWords = ['code', 'programming', 'ai', 'machine learning', 'web', 'app', 'database', 'api'];
        for (const interaction of interactions) {
            for (const word of commonWords) {
                if (interaction.toLowerCase().includes(word)) {
                    topics.add(word);
                }
            }
        }
        return Array.from(topics);
    }
    analyzeConversationPatterns(interactions) {
        const patterns = [];
        // Analyze time patterns
        const timeGaps = [];
        for (let i = 1; i < interactions.length; i++) {
            const gap = interactions[i - 1].timestamp - interactions[i].timestamp;
            timeGaps.push(gap);
        }
        const avgGap = timeGaps.reduce((a, b) => a + b, 0) / timeGaps.length;
        if (avgGap < 5 * 60 * 1000) { // Less than 5 minutes
            patterns.push('User engages in rapid-fire conversations');
        }
        // Analyze content patterns
        const questionCount = interactions.filter(i => i.content.includes('?') ||
            i.content.toLowerCase().includes('how') ||
            i.content.toLowerCase().includes('what') ||
            i.content.toLowerCase().includes('why')).length;
        if (questionCount > interactions.length * 0.7) {
            patterns.push('User primarily asks questions rather than making statements');
        }
        return patterns;
    }
    async updateMemory(id, updates) {
        const index = this.memory.findIndex(m => m.id === id);
        if (index !== -1) {
            this.memory[index] = { ...this.memory[index], ...updates };
            await this.saveMemoryToStorage();
            this.emit('memoryUpdated', this.memory[index]);
        }
    }
    // Task Management
    async createTask(task) {
        const newTask = {
            ...task,
            id: this.generateId(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        this.tasks.push(newTask);
        await this.saveTasksToStorage();
        this.emit('taskCreated', newTask);
        if (this.config.autonomyLevel === 'autonomous') {
            this.executeTask(newTask.id);
        }
        return newTask.id;
    }
    async updateTask(id, updates) {
        const index = this.tasks.findIndex(t => t.id === id);
        if (index !== -1) {
            this.tasks[index] = { ...this.tasks[index], ...updates, updatedAt: Date.now() };
            await this.saveTasksToStorage();
            this.emit('taskUpdated', this.tasks[index]);
        }
    }
    async executeTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task)
            return;
        try {
            await this.updateTask(taskId, { status: 'in_progress' });
            // Simulate task execution
            await new Promise(resolve => setTimeout(resolve, 2000));
            await this.updateTask(taskId, {
                status: 'completed',
                result: 'Task completed successfully',
                actualTime: 2000
            });
            await this.addMemory({
                type: 'task',
                content: `Completed task: ${task.title}`,
                importance: 5,
                tags: ['task', 'completed'],
                metadata: { taskId }
            });
        }
        catch (error) {
            await this.updateTask(taskId, {
                status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    // Plugin Management
    async loadPlugin(plugin) {
        const existingIndex = this.plugins.findIndex(p => p.id === plugin.id);
        if (existingIndex !== -1) {
            this.plugins[existingIndex] = plugin;
        }
        else {
            this.plugins.push(plugin);
        }
        await this.savePluginsToStorage();
        this.emit('pluginLoaded', plugin);
    }
    async enablePlugin(id) {
        const plugin = this.plugins.find(p => p.id === id);
        if (plugin) {
            plugin.enabled = true;
            await this.savePluginsToStorage();
            this.emit('pluginEnabled', plugin);
        }
    }
    async disablePlugin(id) {
        const plugin = this.plugins.find(p => p.id === id);
        if (plugin) {
            plugin.enabled = false;
            await this.savePluginsToStorage();
            this.emit('pluginDisabled', plugin);
        }
    }
    // Agent Communication
    async sendToAgent(agentId, message) {
        const agent = this.agents.find(a => a.id === agentId);
        if (!agent)
            throw new Error(`Agent ${agentId} not found`);
        try {
            if (agent.type === 'ollama') {
                return await this.sendToOllama(message, agent.model);
            }
            else if (agent.type === 'remote') {
                return await this.sendToRemoteAgent(agent.endpoint, message);
            }
            return 'Agent communication not implemented';
        }
        catch (error) {
            throw new Error(`Failed to communicate with agent: ${error}`);
        }
    }
    async sendToOllama(message, model = 'llama3.1') {
        try {
            const response = await fetch(`${this.config.ollamaEndpoint}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model,
                    prompt: message,
                    stream: false,
                }),
            });
            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.status}`);
            }
            const data = await response.json();
            return data.response;
        }
        catch (error) {
            throw new Error(`Ollama communication failed: ${error}`);
        }
    }
    async sendToRemoteAgent(endpoint, message) {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message }),
        });
        if (!response.ok) {
            throw new Error(`Remote agent error: ${response.status}`);
        }
        const data = await response.json();
        return data.response;
    }
    // System Status
    startSystemMonitoring() {
        // Update system status every 60 seconds to reduce connection attempts
        setInterval(() => this.updateSystemStatus(), 60000);
    }
    async updateSystemStatus() {
        // Update basic system metrics
        this.systemStatus.cpu = Math.random() * 100; // Simulated CPU usage
        this.systemStatus.memory = Math.random() * 100; // Simulated memory usage
        this.systemStatus.storage = Math.random() * 100; // Simulated storage usage
        this.systemStatus.network = navigator.onLine;
        this.systemStatus.activePlugins = this.plugins.filter(p => p.enabled).length;
        this.systemStatus.activeTasks = this.tasks.filter(t => t.status === 'in_progress').length;
        this.systemStatus.uptime = Date.now() - this.startTime;
        // Only check Ollama connection every 5 minutes to reduce spam
        if (!this.lastOllamaCheck || Date.now() - this.lastOllamaCheck > 300000) {
            await this.checkOllamaConnection();
            this.lastOllamaCheck = Date.now();
        }
        this.emit('statusUpdated', this.systemStatus);
    }
    // Ollama Integration
    async checkOllamaConnection() {
        try {
            const response = await fetch(`${this.config.ollamaEndpoint}/api/tags`, {
                method: 'GET',
                signal: AbortSignal.timeout(3000) // 3 second timeout
            });
            if (response.ok) {
                const data = await response.json();
                this.systemStatus.ollamaStatus = 'connected';
                this.ollamaErrorLogged = false; // Reset error flag on success
                // Initialize Ollama agent
                await this.addAgent({
                    id: 'ollama-local',
                    name: 'Ollama Local',
                    type: 'ollama',
                    model: this.config.defaultModel,
                    capabilities: ['chat', 'code', 'reasoning'],
                    status: 'online',
                    lastHeartbeat: Date.now(),
                });
            }
        }
        catch (error) {
            this.systemStatus.ollamaStatus = 'disconnected';
            // Only log once per session to prevent spam
            if (!this.ollamaErrorLogged) {
                console.warn('Ollama not available - running in basic mode');
                this.ollamaErrorLogged = true;
            }
        }
    }
    async initializeAgents() {
        // Initialize built-in agents
        await this.addAgent({
            id: 'nova-core',
            name: 'NOVA Core',
            type: 'local',
            capabilities: ['memory', 'tasks', 'plugins', 'system'],
            status: 'online',
            lastHeartbeat: Date.now(),
        });
    }
    async addAgent(agent) {
        const existingIndex = this.agents.findIndex(a => a.id === agent.id);
        if (existingIndex !== -1) {
            this.agents[existingIndex] = agent;
        }
        else {
            this.agents.push(agent);
        }
        this.emit('agentAdded', agent);
    }
    // Storage Management
    async loadMemoryFromStorage() {
        const stored = localStorage.getItem('nova-memory');
        if (stored) {
            this.memory = JSON.parse(stored);
        }
    }
    async saveMemoryToStorage() {
        localStorage.setItem('nova-memory', JSON.stringify(this.memory));
    }
    async loadTasksFromStorage() {
        const stored = localStorage.getItem('nova-tasks');
        if (stored) {
            this.tasks = JSON.parse(stored);
        }
    }
    async saveTasksToStorage() {
        localStorage.setItem('nova-tasks', JSON.stringify(this.tasks));
    }
    async loadPluginsFromStorage() {
        const stored = localStorage.getItem('nova-plugins');
        if (stored) {
            this.plugins = JSON.parse(stored);
        }
        else {
            // Initialize default plugins
            this.plugins = [
                {
                    id: 'code-assistant',
                    name: 'Code Assistant',
                    version: '1.0.0',
                    description: 'Advanced coding assistance and analysis',
                    enabled: true,
                    capabilities: ['code-generation', 'debugging', 'refactoring'],
                    performance: { totalCalls: 0, averageResponseTime: 0, successRate: 1 },
                },
                {
                    id: 'research-agent',
                    name: 'Research Agent',
                    version: '1.0.0',
                    description: 'Web research and information gathering',
                    enabled: true,
                    capabilities: ['web-search', 'data-analysis', 'summarization'],
                    performance: { totalCalls: 0, averageResponseTime: 0, successRate: 1 },
                },
                {
                    id: 'memory-manager',
                    name: 'Memory Manager',
                    version: '1.0.0',
                    description: 'Advanced memory management and learning',
                    enabled: true,
                    capabilities: ['memory-optimization', 'pattern-recognition', 'learning'],
                    performance: { totalCalls: 0, averageResponseTime: 0, successRate: 1 },
                },
            ];
        }
    }
    async savePluginsToStorage() {
        localStorage.setItem('nova-plugins', JSON.stringify(this.plugins));
    }
    // Event System
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }
    emit(event, data) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach(callback => callback(data));
        }
    }
    // Utility Methods
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 9)}`;
    }
    // Public Getters
    get isReady() {
        return this.isInitialized;
    }
    get currentConfig() {
        return { ...this.config };
    }
    get currentStatus() {
        return { ...this.systemStatus };
    }
    get allTasks() {
        return [...this.tasks];
    }
    get allPlugins() {
        return [...this.plugins];
    }
    get allAgents() {
        return [...this.agents];
    }
    get allMemories() {
        return [...this.memory];
    }
    // Public Methods
    async updateConfig(updates) {
        this.config = { ...this.config, ...updates };
        localStorage.setItem('nova-config', JSON.stringify(this.config));
        this.emit('configUpdated', this.config);
    }
    // Enhanced command processing with memory context
    async processCommand(command) {
        // Get conversation context
        const context = this.getConversationContext(5);
        await this.addMemory({
            type: 'interaction',
            content: `User command: ${command}`,
            importance: 5,
            tags: ['command', 'user-input'],
        });
        // Process command through available agents with context
        if (this.systemStatus.ollamaStatus === 'connected') {
            const enhancedCommand = context ? `${context}\n\nUser: ${command}` : command;
            const response = await this.sendToAgent('ollama-local', enhancedCommand);
            await this.addMemory({
                type: 'interaction',
                content: `NOVA response: ${response}`,
                importance: 5,
                tags: ['response', 'ollama'],
            });
            return response;
        }
        return 'NOVA system online. Ollama connection required for advanced processing.';
    }
    async shutdown() {
        await this.saveMemoryToStorage();
        await this.saveTasksToStorage();
        await this.savePluginsToStorage();
        this.emit('shutdown');
    }
}
export default NovaCore;
//# sourceMappingURL=NovaCore.js.map