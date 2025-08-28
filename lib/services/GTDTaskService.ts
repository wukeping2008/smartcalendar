import { 
  GTDTask, 
  GTDTaskCategory, 
  InboxItem, 
  TaskAutoCompletion,
  TaskClassificationRule,
  PersonContext,
  GTDProject
} from '../../types/gtd-task';
import { getTaskAutoCompleteService } from './TaskAutoCompleteService';

export class GTDTaskService {
  private tasks: Map<string, GTDTask> = new Map();
  private inbox: Map<string, InboxItem> = new Map();
  private autoCompletions: Map<string, TaskAutoCompletion> = new Map();
  private classificationRules: TaskClassificationRule[] = [];
  private personContexts: Map<string, PersonContext> = new Map();
  private projects: Map<string, GTDProject> = new Map();

  constructor() {
    this.initializeClassificationRules();
    this.loadStoredData();
  }

  private initializeClassificationRules() {
    this.classificationRules = [
      // Trash patterns
      { 
        pattern: /已尝试|失败|不再相关|过时|重复/,
        keywords: ['放弃', '不做', '取消', '删除'],
        category: GTDTaskCategory.TRASH,
        priority: 1,
        confidence: 0.9
      },
      // Store patterns
      {
        pattern: /保存|记录|备忘|参考|学习材料|分析/,
        keywords: ['存档', '留着', '备用', 'notes', '笔记'],
        category: GTDTaskCategory.STORE,
        priority: 2,
        confidence: 0.85
      },
      // Do patterns
      {
        pattern: /立即|马上|现在|执行|直接/,
        keywords: ['做', '开始', '动手', '实施'],
        category: GTDTaskCategory.DO,
        priority: 4,
        confidence: 0.9
      },
      // Ask patterns
      {
        pattern: /询问|请求|需要.*帮助|协作|批准/,
        keywords: ['问', '联系', '沟通', '确认', '请教'],
        category: GTDTaskCategory.ASK,
        priority: 3,
        confidence: 0.85
      },
      // Waiting patterns
      {
        pattern: /等待|等.*回复|pending|暂停/,
        keywords: ['等', '待', '暂缓', '搁置'],
        category: GTDTaskCategory.WAITING,
        priority: 2,
        confidence: 0.8
      },
      // Lock patterns
      {
        pattern: /周[一二三四五六日]|明天|今天|下午|上午|\d+[点时]/,
        keywords: ['预约', '会议', '日程', '固定时间'],
        category: GTDTaskCategory.LOCK,
        priority: 5,
        confidence: 0.95
      },
      // Quick Win patterns
      {
        pattern: /简单|快速|几分钟|小事/,
        keywords: ['顺便', '快点', '小任务', '简单处理'],
        category: GTDTaskCategory.QUICK_WIN,
        priority: 3,
        confidence: 0.8
      },
      // Think patterns
      {
        pattern: /计划|分析|研究|思考|策略|复杂/,
        keywords: ['想', '规划', '分解', '设计', '方案'],
        category: GTDTaskCategory.THINK,
        priority: 3,
        confidence: 0.85
      }
    ];
  }

  private loadStoredData() {
    // Load from localStorage in browser environment
    if (typeof window !== 'undefined') {
      const storedTasks = localStorage.getItem('gtd_tasks');
      const storedInbox = localStorage.getItem('gtd_inbox');
      const storedCompletions = localStorage.getItem('gtd_completions');
      
      if (storedTasks) {
        const tasks = JSON.parse(storedTasks);
        tasks.forEach((task: GTDTask) => {
          this.tasks.set(task.id, {
            ...task,
            createdAt: new Date(task.createdAt),
            updatedAt: new Date(task.updatedAt),
            dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
            scheduledDate: task.scheduledDate ? new Date(task.scheduledDate) : undefined,
            completedDate: task.completedDate ? new Date(task.completedDate) : undefined
          });
        });
      }

      if (storedInbox) {
        const items = JSON.parse(storedInbox);
        items.forEach((item: InboxItem) => {
          this.inbox.set(item.id, {
            ...item,
            receivedAt: new Date(item.receivedAt),
            processedAt: item.processedAt ? new Date(item.processedAt) : undefined
          });
        });
      }

      if (storedCompletions) {
        const completions = JSON.parse(storedCompletions);
        completions.forEach((completion: TaskAutoCompletion) => {
          this.autoCompletions.set(completion.keyword, {
            ...completion,
            lastUsed: new Date(completion.lastUsed)
          });
        });
      }
    }
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gtd_tasks', JSON.stringify(Array.from(this.tasks.values())));
      localStorage.setItem('gtd_inbox', JSON.stringify(Array.from(this.inbox.values())));
      localStorage.setItem('gtd_completions', JSON.stringify(Array.from(this.autoCompletions.values())));
    }
  }

  // 添加到收集箱
  async addToInbox(text: string, source: GTDTask['source']): Promise<InboxItem> {
    const item: InboxItem = {
      id: this.generateId(),
      rawText: text,
      source,
      receivedAt: new Date(),
      processed: false
    };

    this.inbox.set(item.id, item);
    this.saveToStorage();
    
    // 自动处理
    setTimeout(() => this.processInboxItem(item.id), 100);
    
    return item;
  }

  // 处理收集箱项目
  async processInboxItem(itemId: string): Promise<GTDTask | null> {
    const item = this.inbox.get(itemId);
    if (!item || item.processed) return null;

    try {
      // 1. 尝试自动补全
      const expanded = await this.expandTaskText(item.rawText);
      
      // 2. 分类任务
      const category = this.classifyTask(expanded || item.rawText);
      
      // 3. 提取优先级
      const priority = this.extractPriority(expanded || item.rawText);
      
      // 4. 创建任务
      const task: GTDTask = {
        id: this.generateId(),
        title: this.extractTitle(expanded || item.rawText),
        originalInput: item.rawText,
        expandedContent: expanded,
        category,
        priority,
        source: item.source,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'pending',
        aiAnalysis: {
          confidence: this.calculateConfidence(item.rawText, category),
          suggestedCategory: category,
          suggestedPriority: priority,
          extractedKeywords: this.extractKeywords(item.rawText)
        }
      };

      // 5. 保存任务
      this.tasks.set(task.id, task);
      
      // 6. 更新收集箱项目
      item.processed = true;
      item.processedAt = new Date();
      item.resultTaskId = task.id;
      
      this.saveToStorage();
      return task;
      
    } catch (error) {
      item.error = error instanceof Error ? error.message : 'Unknown error';
      this.saveToStorage();
      return null;
    }
  }

  // 任务文本扩展
  private async expandTaskText(text: string): Promise<string | null> {
    // 使用TaskAutoCompleteService获取补全建议
    const autoCompleteService = getTaskAutoCompleteService();
    const completions = await autoCompleteService.getCompletions(text);
    
    if (completions.length > 0) {
      // 使用置信度最高的补全
      const bestCompletion = completions[0];
      
      // 学习用户模式
      if (bestCompletion.source === 'pattern' && bestCompletion.confidence > 0.8) {
        const keywords = text.toLowerCase().split(/\s+/);
        if (keywords.length > 0) {
          autoCompleteService.learnPattern(keywords[0], bestCompletion.text, bestCompletion.category);
        }
      }
      
      return bestCompletion.text;
    }
    
    return null;
  }

  // 任务分类
  private classifyTask(text: string): GTDTaskCategory {
    let bestMatch: { category: GTDTaskCategory; score: number } = {
      category: GTDTaskCategory.DO,
      score: 0
    };

    for (const rule of this.classificationRules) {
      let score = 0;
      
      // 检查模式匹配
      if (typeof rule.pattern === 'string' ? text.includes(rule.pattern) : rule.pattern.test(text)) {
        score += rule.confidence * 0.6;
      }
      
      // 检查关键词
      for (const keyword of rule.keywords) {
        if (text.includes(keyword)) {
          score += rule.confidence * 0.4 / rule.keywords.length;
        }
      }
      
      if (score > bestMatch.score) {
        bestMatch = { category: rule.category, score };
      }
    }

    return bestMatch.category;
  }

  // 提取优先级
  private extractPriority(text: string): number {
    if (text.includes('紧急') || text.includes('立即') || text.includes('马上')) return 5;
    if (text.includes('重要') || text.includes('关键')) return 4;
    if (text.includes('一般') || text.includes('常规')) return 3;
    if (text.includes('空闲') || text.includes('有空')) return 2;
    return 3; // 默认中等优先级
  }

  // 提取标题
  private extractTitle(text: string): string {
    // 移除时间相关的词
    let title = text.replace(/今天|明天|下周|本周|这周|下个月/g, '').trim();
    
    // 截断过长的标题
    if (title.length > 50) {
      const sentences = title.split(/[。！？]/);
      title = sentences[0] || title.substring(0, 50) + '...';
    }
    
    return title || '未命名任务';
  }

  // 提取关键词
  private extractKeywords(text: string): string[] {
    const stopWords = ['的', '了', '是', '在', '和', '与', '或', '但', '而', '因为', '所以'];
    const words = text.split(/[\s，。！？、；：""''（）\[\]{}]/);
    
    return words
      .filter(word => word.length > 1 && !stopWords.includes(word))
      .slice(0, 5);
  }

  // 计算置信度
  private calculateConfidence(text: string, category: GTDTaskCategory): number {
    const rule = this.classificationRules.find(r => r.category === category);
    if (!rule) return 0.5;
    
    let confidence = rule.confidence;
    
    // 文本长度影响置信度
    if (text.length < 10) confidence *= 0.8;
    if (text.length > 100) confidence *= 1.1;
    
    return Math.min(1, confidence);
  }

  // 生成ID
  private generateId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 公共API方法
  
  async createTask(data: Partial<GTDTask>): Promise<GTDTask> {
    const task: GTDTask = {
      id: this.generateId(),
      title: data.title || '未命名任务',
      category: data.category || GTDTaskCategory.DO,
      priority: data.priority || 3,
      source: data.source || 'manual',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'pending',
      ...data
    };

    this.tasks.set(task.id, task);
    this.saveToStorage();
    return task;
  }

  async updateTask(id: string, updates: Partial<GTDTask>): Promise<GTDTask | null> {
    const task = this.tasks.get(id);
    if (!task) return null;

    const updatedTask = {
      ...task,
      ...updates,
      updatedAt: new Date()
    };

    this.tasks.set(id, updatedTask);
    this.saveToStorage();
    return updatedTask;
  }

  async deleteTask(id: string): Promise<boolean> {
    const task = this.tasks.get(id);
    if (!task) return false;

    // 软删除
    task.status = 'deleted';
    task.updatedAt = new Date();
    
    this.saveToStorage();
    return true;
  }

  getTasks(filter?: Partial<GTDTask>): GTDTask[] {
    let tasks = Array.from(this.tasks.values());
    
    if (filter) {
      tasks = tasks.filter(task => {
        for (const [key, value] of Object.entries(filter)) {
          if (task[key as keyof GTDTask] !== value) return false;
        }
        return true;
      });
    }
    
    return tasks.filter(t => t.status !== 'deleted');
  }

  getTasksByCategory(category: GTDTaskCategory): GTDTask[] {
    return this.getTasks({ category });
  }

  getInboxItems(unprocessedOnly = true): InboxItem[] {
    const items = Array.from(this.inbox.values());
    if (unprocessedOnly) {
      return items.filter(item => !item.processed);
    }
    return items;
  }

  // 批量导入任务
  async importTasks(items: Array<{ text: string; source: GTDTask['source'] }>): Promise<GTDTask[]> {
    const tasks: GTDTask[] = [];
    
    for (const item of items) {
      const inboxItem = await this.addToInbox(item.text, item.source);
      const task = await this.processInboxItem(inboxItem.id);
      if (task) tasks.push(task);
    }
    
    return tasks;
  }

  // 获取任务统计
  getStatistics() {
    const tasks = this.getTasks();
    const categoryCount: Record<GTDTaskCategory, number> = {} as any;
    const statusCount: Record<string, number> = {};
    
    for (const task of tasks) {
      categoryCount[task.category] = (categoryCount[task.category] || 0) + 1;
      statusCount[task.status] = (statusCount[task.status] || 0) + 1;
    }
    
    return {
      total: tasks.length,
      byCategory: categoryCount,
      byStatus: statusCount,
      inboxPending: this.getInboxItems(true).length
    };
  }

  // ==================== 项目管理方法 ====================
  
  /**
   * 创建新项目
   */
  async createProject(project: GTDProject): Promise<GTDProject> {
    this.projects.set(project.id, project);
    this.saveToStorage();
    return project;
  }

  /**
   * 获取所有项目
   */
  async getAllProjects(): Promise<GTDProject[]> {
    return Array.from(this.projects.values());
  }

  /**
   * 获取单个项目
   */
  async getProject(projectId: string): Promise<GTDProject | null> {
    return this.projects.get(projectId) || null;
  }

  /**
   * 更新项目
   */
  async updateProject(project: GTDProject): Promise<GTDProject> {
    this.projects.set(project.id, project);
    
    // 更新项目统计
    const projectTasks = Array.from(this.tasks.values()).filter(t => t.projectId === project.id);
    project.totalTaskCount = projectTasks.length;
    project.completedTaskCount = projectTasks.filter(t => t.status === 'completed').length;
    project.progress = project.totalTaskCount > 0 
      ? Math.round((project.completedTaskCount / project.totalTaskCount) * 100)
      : 0;
    
    this.saveToStorage();
    return project;
  }

  /**
   * 删除项目
   */
  async deleteProject(projectId: string): Promise<void> {
    // 删除项目下的所有任务
    const projectTasks = Array.from(this.tasks.values()).filter(t => t.projectId === projectId);
    projectTasks.forEach(task => {
      this.tasks.delete(task.id);
    });
    
    // 删除项目
    this.projects.delete(projectId);
    this.saveToStorage();
  }

  /**
   * 获取项目的任务
   */
  async getProjectTasks(projectId: string): Promise<GTDTask[]> {
    return Array.from(this.tasks.values()).filter(t => t.projectId === projectId);
  }

  /**
   * 将任务分配到项目
   */
  async assignTaskToProject(taskId: string, projectId: string | null): Promise<GTDTask | null> {
    const task = this.tasks.get(taskId);
    if (task) {
      task.projectId = projectId || undefined;
      task.updatedAt = new Date();
      this.tasks.set(taskId, task);
      
      // 更新项目统计
      if (projectId) {
        const project = this.projects.get(projectId);
        if (project) {
          await this.updateProject(project);
        }
      }
      
      this.saveToStorage();
      return task;
    }
    return null;
  }
}

// 单例实例
let instance: GTDTaskService | null = null;

export function getGTDTaskService(): GTDTaskService {
  if (!instance) {
    instance = new GTDTaskService();
  }
  return instance;
}