export interface NovaMemory {
    id: string;
    timestamp: number;
    type: 'thought' | 'task' | 'learning' | 'interaction' | 'plugin' | 'system';
    content: string;
    metadata?: Record<string, unknown>;
    importance: number;
    tags: string[];
    parentId?: string;
    childIds?: string[];
}
export interface NovaTask {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    priority: 'low' | 'medium' | 'high' | 'critical';
    createdAt: number;
    updatedAt: number;
    estimatedTime?: number;
    actualTime?: number;
    dependencies?: string[];
    tags: string[];
    result?: unknown;
    error?: string;
}
export interface NovaPlugin {
    id: string;
    name: string;
    version: string;
    description: string;
    enabled: boolean;
    capabilities: string[];
    config?: Record<string, unknown>;
    lastUsed?: number;
    performance?: {
        totalCalls: number;
        averageResponseTime: number;
        successRate: number;
    };
}
export interface NovaAgent {
    id: string;
    name: string;
    type: 'local' | 'remote' | 'ollama' | 'api';
    endpoint?: string;
    model?: string;
    capabilities: string[];
    status: 'online' | 'offline' | 'error';
    lastHeartbeat?: number;
    config?: Record<string, unknown>;
}
export interface NovaSystemStatus {
    cpu: number;
    memory: number;
    storage: number;
    network: boolean;
    ollamaStatus: 'connected' | 'disconnected' | 'error';
    activePlugins: number;
    activeTasks: number;
    uptime: number;
}
export interface NovaConfig {
    autonomyLevel: 'manual' | 'assisted' | 'autonomous';
    learningEnabled: boolean;
    memoryRetentionDays: number;
    maxConcurrentTasks: number;
    ollamaEndpoint: string;
    defaultModel: string;
    voiceEnabled: boolean;
    networkAccess: boolean;
    pluginAutoUpdate: boolean;
}
export interface ChatMessage {
    id: string;
    content: string;
    sender: 'user' | 'nova' | 'system';
    timestamp: number;
    type: 'message' | 'code' | 'command' | 'result';
    metadata?: Record<string, unknown>;
}
//# sourceMappingURL=index.d.ts.map