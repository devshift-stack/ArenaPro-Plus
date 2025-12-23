// ═══════════════════════════════════════════════════════════════════════════════
// USER & AUTH
// ═══════════════════════════════════════════════════════════════════════════════

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin';
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHAT & MESSAGES
// ═══════════════════════════════════════════════════════════════════════════════

export interface Message {
  id: string;
  chatId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  modelId?: string;
  modelName?: string;
  mode?: ArenaMode;
  metadata?: MessageMetadata;
  createdAt: string;
}

export interface MessageMetadata {
  processingTime?: number;
  tokensUsed?: number;
  cost?: number;
  sources?: string[];
}

export interface Chat {
  id: string;
  title: string;
  userId: string;
  teamId?: string;
  mode: ArenaMode;
  messages: Message[];
  metadata?: ChatMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMetadata {
  totalTokens?: number;
  totalCost?: number;
  modelsUsed?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// ARENA
// ═══════════════════════════════════════════════════════════════════════════════

export type ArenaMode =
  | 'AUTO_SELECT'
  | 'COLLABORATIVE'
  | 'DIVIDE_CONQUER'
  | 'PROJECT'
  | 'TESTER';

export interface ArenaModeConfig {
  id: ArenaMode;
  name: string;
  description: string;
  icon: string;
  gradient: string;
}

export interface Model {
  id: string;
  name: string;
  provider: string;
  description?: string;
  contextWindow: number;
  inputCost: number;
  outputCost: number;
  capabilities: ModelCapability[];
  isAvailable: boolean;
}

export type ModelCapability = 
  | 'text'
  | 'code'
  | 'vision'
  | 'function-calling'
  | 'json-mode';

// ═══════════════════════════════════════════════════════════════════════════════
// KNOWLEDGE BASE
// ═══════════════════════════════════════════════════════════════════════════════

export interface KnowledgeEntry {
  id: string;
  userId: string;
  teamId?: string;
  title: string;
  content: string;
  category: KnowledgeCategory;
  tags: string[];
  status: KnowledgeStatus;
  verificationScore?: number;
  sourceMessages?: string[];
  createdAt: string;
  updatedAt: string;
}

export type KnowledgeCategory = 
  | 'fact'
  | 'procedure'
  | 'concept'
  | 'reference';

export type KnowledgeStatus = 
  | 'pending'
  | 'beta'
  | 'verified';

// ═══════════════════════════════════════════════════════════════════════════════
// TEAM
// ═══════════════════════════════════════════════════════════════════════════════

export interface Team {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  members: TeamMember[];
  settings: TeamSettings;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  userId: string;
  user: User;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
}

export interface TeamSettings {
  allowSharedChats: boolean;
  allowSharedKnowledge: boolean;
  defaultMode: ArenaMode;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROMPTS
// ═══════════════════════════════════════════════════════════════════════════════

export interface Prompt {
  id: string;
  userId: string;
  teamId?: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  isPublic: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MEMORY
// ═══════════════════════════════════════════════════════════════════════════════

export interface Memory {
  id: string;
  userId: string;
  type: MemoryType;
  content: string;
  importance: number;
  accessCount: number;
  lastAccessed?: string;
  createdAt: string;
}

export type MemoryType = 
  | 'short_term'
  | 'long_term'
  | 'semantic'
  | 'episodic';

// ═══════════════════════════════════════════════════════════════════════════════
// API RESPONSES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// WEBSOCKET
// ═══════════════════════════════════════════════════════════════════════════════

export type WebSocketEvent = 
  | { type: 'connected' }
  | { type: 'disconnected' }
  | { type: 'message:new'; payload: Message }
  | { type: 'message:update'; payload: Partial<Message> & { id: string } }
  | { type: 'chat:updated'; payload: Partial<Chat> & { id: string } }
  | { type: 'typing:start'; payload: { chatId: string; modelId: string } }
  | { type: 'typing:stop'; payload: { chatId: string; modelId: string } }
  | { type: 'error'; payload: ApiError };

// ═══════════════════════════════════════════════════════════════════════════════
// UI HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

export interface SelectOption<T = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number | string;
}
