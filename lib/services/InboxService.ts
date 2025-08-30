/**
 * Inbox Service - 收集箱分流服务
 * GTD (Getting Things Done) 实现
 * v4.0 核心服务
 */

import {
  InboxItem,
  TaskStatus,
  TaskPriority,
  TaskType,
  TaskSource,
  TaskAnalysis,
  TaskSuggestion,
  TriageRule,
  TriageResult,
  TriageCategory,
  RecommendedAction,
  TimeGap,
  OpportunisticAssignment,
  GTDList,
  WeeklyReview,
  InboxConfig,
  BulkOperation,
  InboxStats
} from '../../types/inbox'
import { Event } from '../../types/event'
import { StorageService } from './SimpleStorageService'
import { aiService } from './AIService'
import { useEventStore } from '../stores/event-store'

/**
 * 收集箱服务
 */
export class InboxService {
  private static instance: InboxService
  
  private items: Map<string, InboxItem> = new Map()
  private triageRules: TriageRule[] = []
  private gtdLists: Map<string, GTDList> = new Map()
  private weeklyReviews: WeeklyReview[] = []
  
  private config: InboxConfig = {
    autoTriage: true,
    autoSchedule: true,
    autoDelegate: false,
    triageRules: [],
    customCategories: [],
    twoMinuteThreshold: 120, // 2分钟 = 120秒
    reviewReminder: 'weekly',
    opportunistic: {
      enabled: true,
      minGapDuration: 5, // 最小5分钟空隙
      maxTaskComplexity: 'moderate',
      preferredContexts: ['@computer', '@phone']
    },
    ai: {
      enableAnalysis: true,
      enableSuggestions: true,
      enableAutoTagging: true,
      enableNLP: true
    }
  }
  
  private storageService: StorageService
  private aiService: typeof aiService
  
  private constructor() {
    this.storageService = new StorageService()
    this.aiService = aiService
    this.initialize()
  }
  
  /**
   * 获取单例实例
   */
  public static getInstance(): InboxService {
    if (!InboxService.instance) {
      InboxService.instance = new InboxService()
    }
    return InboxService.instance
  }
  
  /**
   * 初始化
   */
  private async initialize() {
    await this.loadItems()
    await this.loadRules()
    await this.loadGTDLists()
    this.setupDefaultRules()
    console.log('🚀 Inbox Service initialized')
  }
  
  /**
   * 设置默认分流规则
   */
  private setupDefaultRules() {
    // 2分钟规则
    this.triageRules.push({
      id: 'two-minute-rule',
      name: '2分钟规则',
      description: '2分钟内可完成的任务立即执行',
      enabled: true,
      priority: 100,
      conditions: [
        {
          field: 'analysis.estimatedDuration',
          operator: 'lessThan',
          value: 2
        }
      ],
      conditionLogic: 'AND',
      action: {
        type: 'categorize',
        params: { category: TriageCategory.DO_NOW }
      },
      stats: {
        matchCount: 0,
        successRate: 0
      }
    })
    
    // 紧急任务规则
    this.triageRules.push({
      id: 'urgent-task-rule',
      name: '紧急任务优先',
      description: '紧急任务自动设为高优先级',
      enabled: true,
      priority: 90,
      conditions: [
        {
          field: 'priority',
          operator: 'equals',
          value: TaskPriority.URGENT
        }
      ],
      conditionLogic: 'AND',
      action: {
        type: 'schedule',
        params: { immediate: true }
      },
      stats: {
        matchCount: 0,
        successRate: 0
      }
    })
    
    // 项目分解规则
    this.triageRules.push({
      id: 'project-decompose-rule',
      name: '项目分解',
      description: '复杂任务自动识别为项目',
      enabled: true,
      priority: 80,
      conditions: [
        {
          field: 'analysis.complexity',
          operator: 'equals',
          value: 'complex'
        }
      ],
      conditionLogic: 'AND',
      action: {
        type: 'categorize',
        params: { category: TriageCategory.PROJECT }
      },
      stats: {
        matchCount: 0,
        successRate: 0
      }
    })
    
    // 等待他人规则
    this.triageRules.push({
      id: 'waiting-for-rule',
      name: '等待他人',
      description: '需要他人完成的任务归入等待清单',
      enabled: true,
      priority: 70,
      conditions: [
        {
          field: 'analysis.requiresOthers',
          operator: 'equals',
          value: true
        }
      ],
      conditionLogic: 'AND',
      action: {
        type: 'categorize',
        params: { category: TriageCategory.WAITING }
      },
      stats: {
        matchCount: 0,
        successRate: 0
      }
    })
  }
  
  /**
   * 捕获新项目到收集箱
   */
  public async capture(
    content: string,
    source: TaskSource = TaskSource.MANUAL,
    metadata?: Record<string, any>
  ): Promise<InboxItem> {
    // 创建收集箱项目
    const item: InboxItem = {
      id: this.generateItemId(),
      title: this.extractTitle(content),
      description: content,
      type: TaskType.TASK,
      status: TaskStatus.INBOX,
      priority: TaskPriority.NONE,
      source,
      capturedAt: new Date(),
      tags: [],
      rawContent: content,
      metadata
    }
    
    // AI分析
    if (this.config.ai.enableAnalysis) {
      item.analysis = await this.analyzeTask(content)
      
      // 自动标签
      if (this.config.ai.enableAutoTagging && item.analysis) {
        item.tags = item.analysis.suggestedTags
        item.category = item.analysis.suggestedCategory
        item.context = item.analysis.suggestedContext
        item.priority = item.analysis.suggestedPriority
      }
      
      // 智能建议
      if (this.config.ai.enableSuggestions && item.analysis) {
        item.suggestions = await this.generateSuggestions(item)
      }
    }
    
    // 保存项目
    this.items.set(item.id, item)
    await this.saveItems()
    
    // 自动分流
    if (this.config.autoTriage) {
      await this.triageItem(item.id)
    }
    
    return item
  }
  
  /**
   * 批量捕获
   */
  public async bulkCapture(items: Array<{ content: string; source?: TaskSource }>): Promise<InboxItem[]> {
    const captured: InboxItem[] = []
    
    for (const item of items) {
      const inboxItem = await this.capture(item.content, item.source)
      captured.push(inboxItem)
    }
    
    return captured
  }

  /**
   * 获取所有收集箱项目
   */
  public getAllItems(): InboxItem[] {
    return Array.from(this.items.values());
  }
  
  /**
   * 分析任务
   */
  private async analyzeTask(content: string): Promise<TaskAnalysis> {
    // 基础分析
    const analysis: TaskAnalysis = {
      estimatedDuration: this.estimateDuration(content),
      complexity: this.evaluateComplexity(content),
      suggestedCategory: '',
      suggestedTags: [],
      suggestedContext: [],
      suggestedPriority: TaskPriority.NONE,
      is2MinuteTask: false,
      requiresOthers: false,
      hasDeadline: false,
      isProject: false,
      extractedDates: [],
      extractedPeople: [],
      extractedLocations: [],
      keywords: []
    }
    
    // AI增强分析
    if (this.config.ai.enableNLP) {
      try {
        const aiAnalysis = await this.aiService.parseNaturalLanguageCommand(content)
        
        // 提取日期
        analysis.extractedDates = this.extractDates(content)
        
        // 提取人名
        analysis.extractedPeople = this.extractPeople(content)
        
        // 提取地点
        analysis.extractedLocations = this.extractLocations(content)
        
        // 关键词提取
        analysis.keywords = this.extractKeywords(content)
        
        // 判断属性
        analysis.is2MinuteTask = analysis.estimatedDuration <= 2
        analysis.requiresOthers = this.checkRequiresOthers(content)
        analysis.hasDeadline = analysis.extractedDates.length > 0
        analysis.isProject = analysis.complexity === 'complex' || content.includes('项目') || content.includes('计划')
        
        // 建议分类和标签
        analysis.suggestedCategory = this.suggestCategory(content, analysis)
        analysis.suggestedTags = this.suggestTags(content, analysis)
        analysis.suggestedContext = this.suggestContext(content, analysis)
        analysis.suggestedPriority = this.suggestPriority(content, analysis)
        
        // 情感和紧急度
        analysis.sentiment = this.analyzeSentiment(content)
        analysis.urgency = this.calculateUrgency(content, analysis)
        analysis.importance = this.calculateImportance(content, analysis)
        
      } catch (error) {
        console.error('AI analysis failed:', error)
      }
    }
    
    return analysis
  }
  
  /**
   * 估算任务时长
   */
  private estimateDuration(content: string): number {
    // 基于内容长度和复杂度的简单估算
    const wordCount = content.split(/\s+/).length
    
    // 检查是否包含时间相关词汇
    const timeMatches = content.match(/(\d+)\s*(分钟|小时|天|minute|hour|day)/gi)
    if (timeMatches) {
      const match = timeMatches[0]
      const number = parseInt(match.match(/\d+/)?.[0] || '0')
      if (match.includes('分钟') || match.includes('minute')) {
        return number
      }
      if (match.includes('小时') || match.includes('hour')) {
        return number * 60
      }
      if (match.includes('天') || match.includes('day')) {
        return number * 60 * 8 // 假设每天8小时
      }
    }
    
    // 基于关键词的估算
    if (content.includes('快速') || content.includes('简单')) return 5
    if (content.includes('会议')) return 60
    if (content.includes('报告') || content.includes('分析')) return 120
    if (content.includes('项目') || content.includes('计划')) return 240
    
    // 默认估算：每10个词约1分钟
    return Math.max(1, Math.round(wordCount / 10))
  }
  
  /**
   * 评估任务复杂度
   */
  private evaluateComplexity(content: string): 'simple' | 'moderate' | 'complex' {
    const wordCount = content.split(/\s+/).length
    
    // 复杂度指标
    const hasMultipleSteps = content.includes('步骤') || content.includes('流程') || content.includes('然后')
    const hasResearch = content.includes('研究') || content.includes('调研') || content.includes('分析')
    const hasCollaboration = content.includes('协作') || content.includes('团队') || content.includes('会议')
    const isProject = content.includes('项目') || content.includes('计划') || content.includes('方案')
    
    const complexityScore = 
      (wordCount > 50 ? 1 : 0) +
      (hasMultipleSteps ? 1 : 0) +
      (hasResearch ? 1 : 0) +
      (hasCollaboration ? 1 : 0) +
      (isProject ? 2 : 0)
    
    if (complexityScore >= 3) return 'complex'
    if (complexityScore >= 1) return 'moderate'
    return 'simple'
  }
  
  /**
   * 提取日期
   */
  private extractDates(content: string): Date[] {
    const dates: Date[] = []
    const today = new Date()
    
    // 相对日期
    if (content.includes('今天')) dates.push(today)
    if (content.includes('明天')) {
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      dates.push(tomorrow)
    }
    if (content.includes('后天')) {
      const dayAfter = new Date(today)
      dayAfter.setDate(dayAfter.getDate() + 2)
      dates.push(dayAfter)
    }
    
    // 星期
    const weekdayMatch = content.match(/周[一二三四五六日]|星期[一二三四五六日天]/g)
    if (weekdayMatch) {
      // TODO: 计算具体日期
    }
    
    // 具体日期格式 MM/DD 或 MM-DD
    const dateMatch = content.match(/(\d{1,2})[\/\-](\d{1,2})/g)
    if (dateMatch) {
      dateMatch.forEach(match => {
        const [month, day] = match.split(/[\/\-]/).map(Number)
        const date = new Date(today.getFullYear(), month - 1, day)
        if (date < today) {
          date.setFullYear(date.getFullYear() + 1)
        }
        dates.push(date)
      })
    }
    
    return dates
  }
  
  /**
   * 提取人名
   */
  private extractPeople(content: string): string[] {
    const people: string[] = []
    
    // 简单的中文人名匹配（2-4个字）
    const chineseNames = content.match(/[张王李赵刘陈杨黄周吴徐孙马朱胡林郭何高罗郑梁谢唐许韩冯邓曹彭曾肖田董袁潘蒋蔡余杜叶程魏苏吕丁任沈姚卢姜崔钟谭陆范汪金石廖贾韦夏付方邹熊白孟秦邱江尹薛闫段雷钱汤易常武康贺][一-龥]{1,3}/g)
    if (chineseNames) {
      people.push(...chineseNames)
    }
    
    // 英文名
    const englishNames = content.match(/[A-Z][a-z]+\s+[A-Z][a-z]+/g)
    if (englishNames) {
      people.push(...englishNames)
    }
    
    // @提及
    const mentions = content.match(/@[\w\u4e00-\u9fa5]+/g)
    if (mentions) {
      people.push(...mentions.map(m => m.substring(1)))
    }
    
    return [...new Set(people)]
  }
  
  /**
   * 提取地点
   */
  private extractLocations(content: string): string[] {
    const locations: string[] = []
    
    // 常见地点关键词
    const locationKeywords = ['办公室', '会议室', '家', '公司', '机场', '酒店', '餐厅', '咖啡厅']
    locationKeywords.forEach(keyword => {
      if (content.includes(keyword)) {
        locations.push(keyword)
      }
    })
    
    // 具体地址匹配（简化版）
    const addressMatch = content.match(/[一-龥]+(路|街|大道|广场|中心|大厦|楼)/g)
    if (addressMatch) {
      locations.push(...addressMatch)
    }
    
    return [...new Set(locations)]
  }
  
  /**
   * 提取关键词
   */
  private extractKeywords(content: string): string[] {
    // 简单的关键词提取
    const stopWords = ['的', '了', '和', '是', '在', '我', '有', '这', '个', '们', '中', '来', '上', '大', '为', '以', '于', '不', '与', '会', '可']
    
    const words = content.match(/[\u4e00-\u9fa5]+|[a-zA-Z]+/g) || []
    const keywords = words
      .filter((word: string) => word.length > 1 && !stopWords.includes(word))
      .filter((word: string, index: number, self: string[]) => self.indexOf(word) === index) // 去重
      .slice(0, 10) // 最多10个关键词
    
    return keywords
  }
  
  /**
   * 检查是否需要他人
   */
  private checkRequiresOthers(content: string): boolean {
    const collaborationKeywords = [
      '会议', '讨论', '协作', '合作', '团队', '审批', '确认',
      '联系', '沟通', '协调', '反馈', '请示', '汇报', '通知'
    ]
    
    return collaborationKeywords.some(keyword => content.includes(keyword))
  }
  
  /**
   * 建议分类
   */
  private suggestCategory(content: string, analysis: TaskAnalysis): string {
    if (analysis.isProject) return '项目'
    if (analysis.requiresOthers) return '协作'
    if (content.includes('会议')) return '会议'
    if (content.includes('学习') || content.includes('阅读')) return '学习'
    if (content.includes('运动') || content.includes('健身')) return '健康'
    if (content.includes('购买') || content.includes('购物')) return '购物'
    return '任务'
  }
  
  /**
   * 建议标签
   */
  private suggestTags(content: string, analysis: TaskAnalysis): string[] {
    const tags: string[] = []
    
    // 基于关键词的标签
    if (content.includes('重要')) tags.push('重要')
    if (content.includes('紧急')) tags.push('紧急')
    if (content.includes('工作')) tags.push('工作')
    if (content.includes('个人')) tags.push('个人')
    if (content.includes('学习')) tags.push('学习')
    
    // 基于分析结果的标签
    if (analysis.is2MinuteTask) tags.push('快速')
    if (analysis.hasDeadline) tags.push('有期限')
    if (analysis.requiresOthers) tags.push('需协作')
    
    return tags
  }
  
  /**
   * 建议上下文
   */
  private suggestContext(content: string, analysis: TaskAnalysis): string[] {
    const contexts: string[] = []
    
    if (content.includes('电话') || content.includes('打电话')) contexts.push('@phone')
    if (content.includes('邮件') || content.includes('email')) contexts.push('@email')
    if (content.includes('电脑') || content.includes('编程') || content.includes('文档')) contexts.push('@computer')
    if (content.includes('外出') || content.includes('购物')) contexts.push('@errands')
    if (content.includes('家') || content.includes('家里')) contexts.push('@home')
    if (content.includes('办公室') || content.includes('公司')) contexts.push('@office')
    
    if (contexts.length === 0) contexts.push('@anywhere')
    
    return contexts
  }
  
  /**
   * 建议优先级
   */
  private suggestPriority(content: string, analysis: TaskAnalysis): TaskPriority {
    if (content.includes('紧急') || content.includes('立即') || content.includes('马上')) {
      return TaskPriority.URGENT
    }
    
    if (content.includes('重要') || analysis.hasDeadline) {
      return TaskPriority.HIGH
    }
    
    if (analysis.is2MinuteTask) {
      return TaskPriority.MEDIUM
    }
    
    return TaskPriority.LOW
  }
  
  /**
   * 分析情感
   */
  private analyzeSentiment(content: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['好', '棒', '优秀', '成功', '进步', '完成', '解决']
    const negativeWords = ['问题', '错误', '失败', '困难', '延迟', '取消', '紧急']
    
    const positiveCount = positiveWords.filter(word => content.includes(word)).length
    const negativeCount = negativeWords.filter(word => content.includes(word)).length
    
    if (positiveCount > negativeCount) return 'positive'
    if (negativeCount > positiveCount) return 'negative'
    return 'neutral'
  }
  
  /**
   * 计算紧急度
   */
  private calculateUrgency(content: string, analysis: TaskAnalysis): number {
    let urgency = 0
    
    if (content.includes('紧急')) urgency += 40
    if (content.includes('立即') || content.includes('马上')) urgency += 30
    if (content.includes('今天')) urgency += 20
    if (content.includes('明天')) urgency += 10
    
    if (analysis.hasDeadline) {
      const daysUntilDeadline = analysis.extractedDates[0] 
        ? Math.ceil((analysis.extractedDates[0].getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 999
      
      if (daysUntilDeadline <= 1) urgency += 30
      else if (daysUntilDeadline <= 3) urgency += 20
      else if (daysUntilDeadline <= 7) urgency += 10
    }
    
    return Math.min(100, urgency)
  }
  
  /**
   * 计算重要度
   */
  private calculateImportance(content: string, analysis: TaskAnalysis): number {
    let importance = 0
    
    if (content.includes('重要')) importance += 30
    if (content.includes('关键') || content.includes('核心')) importance += 20
    if (content.includes('战略') || content.includes('长期')) importance += 15
    
    if (analysis.isProject) importance += 20
    if (analysis.complexity === 'complex') importance += 15
    if (analysis.requiresOthers) importance += 10
    
    return Math.min(100, importance)
  }
  
  /**
   * 生成建议
   */
  private async generateSuggestions(item: InboxItem): Promise<TaskSuggestion[]> {
    const suggestions: TaskSuggestion[] = []
    
    if (!item.analysis) return suggestions
    
    // 2分钟任务建议
    if (item.analysis.is2MinuteTask) {
      suggestions.push({
        type: 'action',
        reason: '这个任务可以在2分钟内完成，建议立即执行',
        confidence: 0.9
      })
    }
    
    // 需要安排时间的任务
    if (item.analysis.estimatedDuration > 30 && !item.analysis.is2MinuteTask) {
      suggestions.push({
        type: 'schedule',
        reason: `这个任务需要约${item.analysis.estimatedDuration}分钟，建议安排专门时间`,
        confidence: 0.8,
        details: { duration: item.analysis.estimatedDuration }
      })
    }
    
    // 需要委派的任务
    if (item.analysis.requiresOthers) {
      suggestions.push({
        type: 'delegate',
        reason: '这个任务需要他人参与或协作',
        confidence: 0.7,
        details: { people: item.analysis.extractedPeople }
      })
    }
    
    // 可以推迟的任务
    if (item.priority === TaskPriority.LOW && !item.analysis.hasDeadline) {
      suggestions.push({
        type: 'defer',
        reason: '这个任务优先级较低且没有明确期限，可以推迟处理',
        confidence: 0.6
      })
    }
    
    return suggestions
  }
  
  /**
   * 提取标题
   */
  private extractTitle(content: string): string {
    // 如果内容很短，直接作为标题
    if (content.length <= 50) {
      return content
    }
    
    // 提取第一句或前50个字符
    const firstSentence = content.match(/^[^。！？\n]+/)?.[0] || ''
    if (firstSentence && firstSentence.length <= 50) {
      return firstSentence
    }
    
    return content.substring(0, 47) + '...'
  }
  
  /**
   * 分流单个项目
   */
  public async triageItem(itemId: string): Promise<TriageResult | null> {
    const item = this.items.get(itemId)
    if (!item) return null
    
    // 应用分流规则
    const matchedRules: string[] = []
    let category = TriageCategory.SCHEDULE // 默认分类
    let newStatus = TaskStatus.ACTIONABLE
    let action: RecommendedAction = {
      type: 'schedule',
      label: '安排时间'
    }
    
    for (const rule of this.triageRules) {
      if (!rule.enabled) continue
      
      if (this.matchRule(rule, item)) {
        matchedRules.push(rule.id)
        
        // 更新统计
        rule.stats.matchCount++
        rule.stats.lastMatched = new Date()
        
        // 应用规则动作
        const result = this.applyRuleAction(rule, item)
        if (result.category) category = result.category
        if (result.status) newStatus = result.status
        if (result.action) action = result.action
        
        // 如果是高优先级规则，停止检查其他规则
        if (rule.priority >= 90) break
      }
    }
    
    // 创建分流结果
    const result: TriageResult = {
      itemId,
      originalStatus: item.status,
      newStatus,
      category,
      action,
      confidence: matchedRules.length > 0 ? 0.8 : 0.5,
      reasoning: this.generateTriageReasoning(item, category),
      appliedRules: matchedRules
    }
    
    // 更新项目状态
    item.status = newStatus
    item.processedAt = new Date()
    
    // 根据分类执行相应动作
    await this.executeTriageAction(item, result)
    
    await this.saveItems()
    
    return result
  }
  
  /**
   * 批量分流
   */
  public async triageAll(): Promise<TriageResult[]> {
    const results: TriageResult[] = []
    const inboxItems = Array.from(this.items.values())
      .filter(item => item.status === TaskStatus.INBOX)
    
    for (const item of inboxItems) {
      const result = await this.triageItem(item.id)
      if (result) {
        results.push(result)
      }
    }
    
    return results
  }
  
  /**
   * 匹配规则
   */
  private matchRule(rule: TriageRule, item: InboxItem): boolean {
    if (rule.conditionLogic === 'AND') {
      return rule.conditions.every(condition => this.matchCondition(condition, item))
    } else if (rule.conditionLogic === 'OR') {
      return rule.conditions.some(condition => this.matchCondition(condition, item))
    }
    return false
  }
  
  /**
   * 匹配条件
   */
  private matchCondition(condition: any, item: InboxItem): boolean {
    const value = this.getNestedValue(item, condition.field)
    
    switch (condition.operator) {
      case 'equals':
        return value === condition.value
      case 'contains':
        return String(value).includes(String(condition.value))
      case 'startsWith':
        return String(value).startsWith(String(condition.value))
      case 'endsWith':
        return String(value).endsWith(String(condition.value))
      case 'matches':
        return new RegExp(condition.value).test(String(value))
      case 'greaterThan':
        return Number(value) > Number(condition.value)
      case 'lessThan':
        return Number(value) < Number(condition.value)
      default:
        return false
    }
  }
  
  /**
   * 获取嵌套值
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }
  
  /**
   * 应用规则动作
   */
  private applyRuleAction(rule: TriageRule, item: InboxItem): {
    category?: TriageCategory
    status?: TaskStatus
    action?: RecommendedAction
  } {
    const result: any = {}
    
    switch (rule.action.type) {
      case 'categorize':
        result.category = rule.action.params.category
        break
      
      case 'prioritize':
        item.priority = rule.action.params.priority
        break
      
      case 'schedule':
        result.status = TaskStatus.SCHEDULED
        result.action = {
          type: 'schedule',
          label: '安排到日程',
          params: rule.action.params
        }
        break
      
      case 'delegate':
        result.status = TaskStatus.DELEGATED
        result.category = TriageCategory.DELEGATE
        break
      
      case 'archive':
        result.status = TaskStatus.REFERENCE
        result.category = TriageCategory.REFERENCE
        break
      
      case 'delete':
        result.status = TaskStatus.TRASH
        result.category = TriageCategory.TRASH
        break
    }
    
    return result
  }
  
  /**
   * 生成分流理由
   */
  private generateTriageReasoning(item: InboxItem, category: TriageCategory): string {
    const analysis = item.analysis
    if (!analysis) return '基于默认规则分流'
    
    switch (category) {
      case TriageCategory.DO_NOW:
        return `任务预计只需${analysis.estimatedDuration}分钟，符合2分钟规则，建议立即完成`
      
      case TriageCategory.SCHEDULE:
        return `任务需要${analysis.estimatedDuration}分钟专注时间，已安排到日程`
      
      case TriageCategory.DELEGATE:
        return `任务需要${analysis.extractedPeople.join('、')}参与，建议委派或协作`
      
      case TriageCategory.PROJECT:
        return `任务复杂度较高，需要分解为多个子任务`
      
      case TriageCategory.WAITING:
        return `任务依赖他人完成，已加入等待清单`
      
      case TriageCategory.SOMEDAY:
        return `任务暂无明确期限，可以推迟到将来处理`
      
      case TriageCategory.REFERENCE:
        return `内容为参考资料，已归档备查`
      
      case TriageCategory.TRASH:
        return `任务已过期或不再需要，已移至垃圾箱`
      
      default:
        return '已完成智能分流'
    }
  }
  
  /**
   * 执行分流动作
   */
  private async executeTriageAction(item: InboxItem, result: TriageResult) {
    switch (result.category) {
      case TriageCategory.DO_NOW:
        // 立即执行的任务，可以创建提醒
        console.log(`Task "${item.title}" should be done now`)
        break
      
      case TriageCategory.SCHEDULE:
        // 安排到日程
        if (this.config.autoSchedule) {
          await this.scheduleTask(item)
        }
        break
      
      case TriageCategory.DELEGATE:
        // 委派任务
        if (this.config.autoDelegate && item.analysis?.extractedPeople[0]) {
          item.delegatedTo = item.analysis.extractedPeople[0]
        }
        break
      
      case TriageCategory.PROJECT:
        // 创建项目
        item.type = TaskType.PROJECT
        // TODO: 创建子任务
        break
      
      case TriageCategory.WAITING:
        // 加入等待清单
        this.addToGTDList('waiting_for', item.id)
        break
      
      case TriageCategory.SOMEDAY:
        // 加入将来某天清单
        this.addToGTDList('someday_maybe', item.id)
        break
    }
  }
  
  /**
   * 安排任务到日程
   */
  private async scheduleTask(item: InboxItem) {
    if (!item.analysis) return
    
    // 查找合适的时间段
    const gaps = await this.findTimeGaps()
    const assignment = this.findBestGap(item, gaps)
    
    if (assignment) {
      // 创建日历事件
      const eventStore = useEventStore.getState()
      eventStore.addEvent({
        title: item.title,
        description: item.description || '',
        startTime: new Date(assignment.gap.start),
        endTime: new Date(assignment.gap.end),
        category: 'WORK' as any,
        priority: item.priority.toUpperCase() as any,
        status: 'PLANNED' as any,
        tags: item.tags,
        estimatedDuration: item.analysis.estimatedDuration
      } as any)
      
      item.scheduledFor = new Date(assignment.gap.start)
      item.status = TaskStatus.SCHEDULED
    }
  }
  
  /**
   * 查找时间空隙
   */
  public async findTimeGaps(): Promise<TimeGap[]> {
    const gaps: TimeGap[] = []
    const eventStore = useEventStore.getState()
    const events = eventStore.events
    
    // 排序事件
    const sortedEvents = events.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    
    // 查找今天和明天的空隙
    const now = new Date()
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59)
    const tomorrowEnd = new Date(todayEnd)
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 1)
    
    let lastEndTime = now
    
    for (const event of sortedEvents) {
      if (event.startTime > tomorrowEnd) break
      
      // 计算空隙
      const gapDuration = (event.startTime.getTime() - lastEndTime.getTime()) / (1000 * 60) // 分钟
      
      if (gapDuration >= this.config.opportunistic.minGapDuration) {
        gaps.push({
          id: this.generateGapId(),
          start: new Date(lastEndTime),
          end: new Date(event.startTime),
          duration: gapDuration,
          type: this.classifyGapType(lastEndTime, event.startTime),
          quality: this.evaluateGapQuality(gapDuration),
          suitableFor: this.determineSuitableTaskTypes(gapDuration),
          maxComplexity: this.determineMaxComplexity(gapDuration)
        })
      }
      
      lastEndTime = new Date(event.endTime)
    }
    
    // 检查最后一个事件到今天结束的空隙
    const finalGapDuration = (todayEnd.getTime() - lastEndTime.getTime()) / (1000 * 60)
    if (finalGapDuration >= this.config.opportunistic.minGapDuration) {
      gaps.push({
        id: this.generateGapId(),
        start: new Date(lastEndTime),
        end: todayEnd,
        duration: finalGapDuration,
        type: 'between_events',
        quality: this.evaluateGapQuality(finalGapDuration),
        suitableFor: this.determineSuitableTaskTypes(finalGapDuration),
        maxComplexity: this.determineMaxComplexity(finalGapDuration)
      })
    }
    
    return gaps
  }
  
  /**
   * 分类空隙类型
   */
  private classifyGapType(start: Date, end: Date): TimeGap['type'] {
    const startHour = start.getHours()
    const duration = (end.getTime() - start.getTime()) / (1000 * 60)
    
    if (duration <= 15) return 'buffer'
    if (startHour >= 12 && startHour < 13) return 'break'
    if (startHour >= 7 && startHour < 9) return 'commute'
    if (startHour >= 17 && startHour < 19) return 'commute'
    
    return 'between_events'
  }
  
  /**
   * 评估空隙质量
   */
  private evaluateGapQuality(duration: number): TimeGap['quality'] {
    if (duration >= 60) return 'high'
    if (duration >= 30) return 'medium'
    return 'low'
  }
  
  /**
   * 确定适合的任务类型
   */
  private determineSuitableTaskTypes(duration: number): TaskType[] {
    const types: TaskType[] = []
    
    if (duration >= 5) types.push(TaskType.NOTE, TaskType.IDEA)
    if (duration >= 15) types.push(TaskType.TASK, TaskType.CHECKLIST)
    if (duration >= 30) types.push(TaskType.ROUTINE, TaskType.HABIT)
    if (duration >= 60) types.push(TaskType.PROJECT, TaskType.APPOINTMENT)
    
    return types
  }
  
  /**
   * 确定最大复杂度
   */
  private determineMaxComplexity(duration: number): TimeGap['maxComplexity'] {
    if (duration >= 60) return 'complex'
    if (duration >= 30) return 'moderate'
    return 'simple'
  }
  
  /**
   * 查找最佳空隙
   */
  public findBestGap(item: InboxItem, gaps: TimeGap[]): { gap: TimeGap; assignment: OpportunisticAssignment } | null {
    if (!item.analysis) return null
    
    const suitableGaps = gaps.filter(gap => {
      // 检查时长是否足够
      if (gap.duration < item.analysis!.estimatedDuration) return false
      
      // 检查复杂度是否匹配
      const complexityMatch = {
        'simple': ['simple', 'moderate', 'complex'],
        'moderate': ['moderate', 'complex'],
        'complex': ['complex']
      }
      
      if (!complexityMatch[gap.maxComplexity].includes(item.analysis!.complexity)) {
        return false
      }
      
      // 检查任务类型是否合适
      if (!gap.suitableFor.includes(item.type)) {
        return false
      }
      
      return true
    })
    
    if (suitableGaps.length === 0) return null
    
    // 评分并排序
    const scoredGaps = suitableGaps.map(gap => {
      const fitScore = this.calculateFitScore(item, gap)
      const assignment: OpportunisticAssignment = {
        gapId: gap.id,
        taskId: item.id,
        fitScore,
        estimatedCompletion: Math.min(100, (item.analysis!.estimatedDuration / gap.duration) * 100),
        suggestion: this.generateAssignmentSuggestion(item, gap),
        riskLevel: this.assessRisk(item, gap)
      }
      
      return { gap, assignment }
    })
    
    // 返回最佳匹配
    return scoredGaps.sort((a, b) => b.assignment.fitScore - a.assignment.fitScore)[0]
  }
  
  /**
   * 计算适配度
   */
  private calculateFitScore(item: InboxItem, gap: TimeGap): number {
    if (!item.analysis) return 0
    
    let score = 0
    
    // 时长匹配度
    const durationRatio = item.analysis.estimatedDuration / gap.duration
    if (durationRatio >= 0.8 && durationRatio <= 1.0) {
      score += 40 // 完美匹配
    } else if (durationRatio >= 0.5) {
      score += 30 // 良好匹配
    } else {
      score += 20 // 一般匹配
    }
    
    // 质量匹配度
    if (gap.quality === 'high' && item.analysis.complexity === 'complex') score += 30
    else if (gap.quality === 'medium' && item.analysis.complexity === 'moderate') score += 30
    else if (gap.quality === 'low' && item.analysis.complexity === 'simple') score += 30
    else score += 10
    
    // 优先级加分
    if (item.priority === TaskPriority.URGENT) score += 20
    else if (item.priority === TaskPriority.HIGH) score += 15
    else if (item.priority === TaskPriority.MEDIUM) score += 10
    
    // 上下文匹配
    if (item.context && gap.location) {
      if (item.context.includes('@' + gap.location)) score += 10
    }
    
    return Math.min(100, score)
  }
  
  /**
   * 生成分配建议
   */
  private generateAssignmentSuggestion(item: InboxItem, gap: TimeGap): string {
    if (!item.analysis) return '可以在这个时间段完成任务'
    
    const completionRate = Math.min(100, (item.analysis.estimatedDuration / gap.duration) * 100)
    
    if (completionRate === 100) {
      return '这个时间段刚好可以完成任务'
    } else if (completionRate >= 80) {
      return '这个时间段基本可以完成任务'
    } else if (completionRate >= 50) {
      return `可以完成任务的${Math.round(completionRate)}%`
    } else {
      return '时间充裕，可以轻松完成任务'
    }
  }
  
  /**
   * 评估风险
   */
  private assessRisk(item: InboxItem, gap: TimeGap): 'low' | 'medium' | 'high' {
    if (!item.analysis) return 'medium'
    
    const completionRate = (item.analysis.estimatedDuration / gap.duration) * 100
    
    if (completionRate > 90) return 'high' // 时间很紧
    if (completionRate > 70) return 'medium' // 时间适中
    return 'low' // 时间充裕
  }
  
  /**
   * 添加到GTD清单
   */
  private addToGTDList(listType: GTDList['type'], itemId: string) {
    let list = Array.from(this.gtdLists.values()).find(l => l.type === listType)
    
    if (!list) {
      // 创建新清单
      list = {
        id: this.generateListId(),
        name: this.getListName(listType),
        type: listType,
        items: [],
        settings: {
          autoArchive: true,
          reviewFrequency: 'weekly',
          sortOrder: 'priority'
        },
        stats: {
          totalItems: 0,
          completedToday: 0,
          completedThisWeek: 0
        }
      }
      this.gtdLists.set(list.id, list)
    }
    
    if (!list.items.includes(itemId)) {
      list.items.push(itemId)
      list.stats.totalItems++
    }
  }
  
  /**
   * 获取清单名称
   */
  private getListName(type: GTDList['type']): string {
    const names = {
      'next_actions': '下一步行动',
      'projects': '项目清单',
      'waiting_for': '等待清单',
      'someday_maybe': '将来/也许',
      'reference': '参考资料'
    }
    return names[type] || type
  }
  
  /**
   * 获取收集箱统计
   */
  public getStats(): InboxStats {
    const items = Array.from(this.items.values())
    const now = new Date()
    
    // 基础统计
    const byStatus: any = {}
    const byPriority: any = {}
    const byType: any = {}
    const bySource: any = {}
    
    items.forEach(item => {
      byStatus[item.status] = (byStatus[item.status] || 0) + 1
      byPriority[item.priority] = (byPriority[item.priority] || 0) + 1
      byType[item.type] = (byType[item.type] || 0) + 1
      bySource[item.source] = (bySource[item.source] || 0) + 1
    })
    
    // 时间统计
    const oldestItem = items.reduce((oldest, item) => {
      return !oldest || item.capturedAt < oldest ? item.capturedAt : oldest
    }, null as Date | null)
    
    // 计算平均处理时间
    const processedItems = items.filter(item => item.processedAt)
    const avgProcessingTime = processedItems.length > 0
      ? processedItems.reduce((sum, item) => {
          const time = item.processedAt!.getTime() - item.capturedAt.getTime()
          return sum + time
        }, 0) / processedItems.length / (1000 * 60 * 60) // 转换为小时
      : 0
    
    // 效率指标
    const todayItems = items.filter(item => {
      const itemDate = new Date(item.capturedAt)
      return itemDate.toDateString() === now.toDateString()
    })
    
    const captureRate = todayItems.length
    const processingRate = todayItems.filter(item => item.status !== TaskStatus.INBOX).length
    const completionRate = items.length > 0
      ? items.filter(item => item.status === TaskStatus.COMPLETED).length / items.length * 100
      : 0
    
    return {
      total: items.length,
      byStatus,
      byPriority,
      byType,
      bySource,
      oldestItem: oldestItem || undefined,
      averageProcessingTime: avgProcessingTime,
      captureRate,
      processingRate,
      completionRate,
      trend: {
        daily: [], // TODO: 实现趋势统计
        weekly: []
      }
    }
  }
  
  /**
   * 加载项目
   */
  private async loadItems() {
    const saved = await this.storageService.getItem('inboxItems')
    if (saved) {
      saved.forEach((item: InboxItem) => {
        this.items.set(item.id, item)
      })
    }
  }
  
  /**
   * 保存项目
   */
  private async saveItems() {
    const items = Array.from(this.items.values())
    await this.storageService.setItem('inboxItems', items)
  }
  
  /**
   * 加载规则
   */
  private async loadRules() {
    const saved = await this.storageService.getItem('triageRules')
    if (saved) {
      this.triageRules = saved
    }
  }
  
  /**
   * 保存规则
   */
  private async saveRules() {
    await this.storageService.setItem('triageRules', this.triageRules)
  }
  
  /**
   * 加载GTD清单
   */
  private async loadGTDLists() {
    const saved = await this.storageService.getItem('gtdLists')
    if (saved) {
      saved.forEach((list: GTDList) => {
        this.gtdLists.set(list.id, list)
      })
    }
  }
  
  /**
   * 保存GTD清单
   */
  private async saveGTDLists() {
    const lists = Array.from(this.gtdLists.values())
    await this.storageService.setItem('gtdLists', lists)
  }
  
  /**
   * 生成ID
   */
  private generateItemId(): string {
    return `inbox_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  private generateGapId(): string {
    return `gap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  private generateListId(): string {
    return `list_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  /**
   * 清理资源
   */
  public dispose() {
    this.items.clear()
    this.gtdLists.clear()
    this.triageRules = []
    this.weeklyReviews = []
  }
}

// 导出单例
export default InboxService.getInstance()
