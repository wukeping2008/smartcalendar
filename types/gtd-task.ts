export enum GTDTaskCategory {
  TRASH = 'trash',           // [弃] 明确无用
  STORE = 'store',           // #存 保存/沉淀
  DO = 'do',                 // #做 直接动手
  ASK = 'ask',               // #问 需要他人
  WAITING = 'waiting',       // [等] 等待事件
  LOCK = 'lock',            // #锁 特定时间
  QUICK_WIN = 'quick_win',   // #见缝插针
  THINK = 'think'           // #想 需要拆解
}

export interface GTDTask {
  id: string;
  title: string;
  description?: string;        // 任务描述
  originalInput?: string;     // 原始输入文本
  expandedContent?: string;   // AI扩展后的内容
  category: GTDTaskCategory;
  priority: number;           // 1-5优先级
  source: 'manual' | 'wechat' | 'feishu' | 'apple_notes' | 'voice' | 'calendar';
  
  // 时间相关
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  scheduledDate?: Date;
  completedAt?: Date;
  
  // 状态
  status: 'pending' | 'in_progress' | 'completed' | 'archived' | 'deleted';
  
  // 关联
  contextPersonId?: string;    // 关联的人物卡ID
  projectId?: string;          // 关联的项目ID
  parentTaskId?: string;       // 父任务ID
  childTaskIds?: string[];     // 子任务IDs
  
  // 元数据
  tags?: string[];
  notes?: string;
  attachments?: string[];
  estimatedMinutes?: number;
  actualMinutes?: number;
  
  // AI分析结果
  aiAnalysis?: {
    confidence: number;        // 分类置信度 0-1
    suggestedCategory?: GTDTaskCategory;
    suggestedPriority?: number;
    extractedKeywords?: string[];
    sentiment?: 'positive' | 'neutral' | 'negative';
    urgency?: 'immediate' | 'today' | 'this_week' | 'this_month' | 'someday';
  };
  
  // GTD特定字段
  nextAction?: string;         // 下一步行动
  waitingFor?: string;         // 等待什么
  delegatedTo?: string;        // 委托给谁
  contextLocation?: string;    // 执行地点
  energy?: 'high' | 'medium' | 'low'; // 所需能量水平
}

export interface TaskAutoCompletion {
  id: string;
  keyword: string;
  expandedTask: string;
  category: GTDTaskCategory;
  confidence: number;
  usageCount: number;
  lastUsed: Date;
}

export interface InboxItem {
  id: string;
  rawText: string;
  source: GTDTask['source'];
  receivedAt: Date;
  processed: boolean;
  processedAt?: Date;
  resultTaskId?: string;
  error?: string;
}

export interface TaskClassificationRule {
  pattern: RegExp | string;
  keywords: string[];
  category: GTDTaskCategory;
  priority: number;
  confidence: number;
}

export interface PersonContext {
  personId: string;
  name: string;
  role: string;
  commonTasks: string[];
  preferredCategory?: GTDTaskCategory;
  responseTime?: string;       // 典型响应时间
  communicationStyle?: string; // 沟通风格
  sopRules?: string[];         // 标准操作规程
}

export interface GTDProject {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'paused' | 'completed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  dueDate?: Date;
  
  // 统计
  totalTaskCount: number;
  completedTaskCount: number;
  progress: number; // 0-100
  
  // 关联
  tags?: string[];
  stakeholders?: string[]; // 相关人员
  parentProjectId?: string;
  childProjectIds?: string[];
  
  // 元数据
  notes?: string;
  attachments?: string[];
  color?: string;
  icon?: string;
}