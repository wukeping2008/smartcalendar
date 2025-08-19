/**
 * Context Engine - 情境感知核心引擎
 * v4.0 核心服务
 */

import { 
  Context, 
  ContextRule, 
  ContextMatch, 
  ContextListener,
  ContextProvider,
  ContextConfig,
  ContextHistory,
  ContextPrediction,
  TimeContext,
  LocationContext,
  PersonContext,
  EventContext,
  DeviceContext,
  PhysiologyContext,
  PsychologyContext,
  TaskQueueContext,
  ExternalDataContext,
  ContextCondition,
  ContextAction
} from '../../types/context'
import { StorageService } from './SimpleStorageService'

/**
 * 情境感知引擎
 */
export class ContextEngine {
  private static instance: ContextEngine
  
  private currentContext: Context | null = null
  private contextProviders: Map<string, ContextProvider> = new Map()
  private contextRules: ContextRule[] = []
  private contextListeners: Map<string, ContextListener> = new Map()
  private contextHistory: ContextHistory[] = []
  private updateTimer: NodeJS.Timeout | null = null
  
  private config: ContextConfig = {
    enabledProviders: ['time', 'event', 'taskQueue', 'device'],
    updateInterval: 30000, // 30秒更新一次
    storageLimit: 1000,
    enablePrediction: true,
    enableLearning: true,
    privacyMode: false
  }
  
  private storageService: StorageService
  
  private constructor() {
    this.storageService = new StorageService()
    this.initialize()
  }
  
  /**
   * 获取单例实例
   */
  public static getInstance(): ContextEngine {
    if (!ContextEngine.instance) {
      ContextEngine.instance = new ContextEngine()
    }
    return ContextEngine.instance
  }
  
  /**
   * 初始化引擎
   */
  private async initialize() {
    // 注册默认提供者
    this.registerDefaultProviders()
    
    // 加载保存的规则
    await this.loadRules()
    
    // 加载历史记录
    await this.loadHistory()
    
    // 启动情境更新
    this.startContextUpdate()
    
    console.log('🚀 Context Engine initialized')
  }
  
  /**
   * 注册默认的情境数据提供者
   */
  private registerDefaultProviders() {
    // 时间提供者
    this.registerProvider({
      name: 'time',
      type: 'time',
      getData: async () => this.getTimeContext()
    })
    
    // 事件提供者
    this.registerProvider({
      name: 'event',
      type: 'event',
      getData: async () => this.getEventContext()
    })
    
    // 任务队列提供者
    this.registerProvider({
      name: 'taskQueue',
      type: 'taskQueue',
      getData: async () => this.getTaskQueueContext()
    })
    
    // 设备提供者
    this.registerProvider({
      name: 'device',
      type: 'device',
      getData: async () => this.getDeviceContext()
    })
    
    // 位置提供者（需要权限）
    this.registerProvider({
      name: 'location',
      type: 'location',
      getData: async () => this.getLocationContext(),
      refreshInterval: 60000 // 1分钟更新一次
    })
  }
  
  /**
   * 获取时间情境
   */
  private async getTimeContext(): Promise<TimeContext> {
    const now = new Date()
    const hours = now.getHours()
    
    let timeOfDay: TimeContext['timeOfDay']
    if (hours >= 5 && hours < 12) timeOfDay = 'morning'
    else if (hours >= 12 && hours < 17) timeOfDay = 'afternoon'
    else if (hours >= 17 && hours < 21) timeOfDay = 'evening'
    else if (hours >= 21 || hours < 3) timeOfDay = 'night'
    else timeOfDay = 'dawn'
    
    const dayOfWeek = now.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const isWorkingHour = !isWeekend && hours >= 9 && hours < 18
    
    // 获取临近事件
    const nearEvents = await this.getNearbyEvents(now)
    
    return {
      currentTime: now,
      timeOfDay,
      dayOfWeek,
      isWeekend,
      isHoliday: false, // TODO: 接入节假日API
      isWorkingHour,
      nearEvents
    }
  }
  
  /**
   * 获取事件情境
   */
  private async getEventContext(): Promise<EventContext> {
    // TODO: 从event-store获取数据
    const mockData: EventContext = {
      upcomingEvents: [],
      completedToday: 0,
      pendingTasks: 0
    }
    
    return mockData
  }
  
  /**
   * 获取任务队列情境
   */
  private async getTaskQueueContext(): Promise<TaskQueueContext> {
    // TODO: 从任务管理系统获取数据
    return {
      totalTasks: 0,
      urgentTasks: 0,
      overdueTasks: 0,
      estimatedWorkload: 0,
      completionRate: 0,
      taskCategories: {}
    }
  }
  
  /**
   * 获取设备情境
   */
  private async getDeviceContext(): Promise<DeviceContext> {
    const platform = this.detectPlatform()
    
    return {
      platform,
      networkType: navigator.onLine ? 'wifi' : 'offline',
      screenTime: 0, // TODO: 实现屏幕时间追踪
      batteryLevel: await this.getBatteryLevel(),
      isCharging: await this.isCharging()
    }
  }
  
  /**
   * 获取位置情境
   */
  private async getLocationContext(): Promise<LocationContext> {
    const isLocationEnabled = 'geolocation' in navigator
    
    if (!isLocationEnabled || this.config.privacyMode) {
      return {
        isLocationEnabled: false,
        geofences: []
      }
    }
    
    try {
      const position = await this.getCurrentPosition()
      return {
        isLocationEnabled: true,
        currentLocation: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        },
        currentPlace: await this.detectPlace(position),
        geofences: await this.checkGeofences(position)
      }
    } catch (error) {
      console.error('Failed to get location:', error)
      return {
        isLocationEnabled: false,
        geofences: []
      }
    }
  }
  
  /**
   * 获取当前位置
   */
  private getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject)
    })
  }
  
  /**
   * 检测当前场所类型
   */
  private async detectPlace(position: GeolocationPosition): Promise<LocationContext['currentPlace']> {
    // TODO: 实现场所检测逻辑
    return {
      type: 'other',
      name: '未知地点'
    }
  }
  
  /**
   * 检查地理围栏
   */
  private async checkGeofences(position: GeolocationPosition): Promise<LocationContext['geofences']> {
    // TODO: 实现地理围栏检查
    return []
  }
  
  /**
   * 获取附近的事件
   */
  private async getNearbyEvents(now: Date): Promise<TimeContext['nearEvents']> {
    // TODO: 从事件存储获取
    return []
  }
  
  /**
   * 检测平台
   */
  private detectPlatform(): DeviceContext['platform'] {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      return 'mobile'
    }
    return 'web'
  }
  
  /**
   * 获取电池电量
   */
  private async getBatteryLevel(): Promise<number | undefined> {
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery()
        return Math.round(battery.level * 100)
      } catch {
        return undefined
      }
    }
    return undefined
  }
  
  /**
   * 检查是否在充电
   */
  private async isCharging(): Promise<boolean | undefined> {
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery()
        return battery.charging
      } catch {
        return undefined
      }
    }
    return undefined
  }
  
  /**
   * 注册情境提供者
   */
  public registerProvider(provider: ContextProvider) {
    this.contextProviders.set(provider.name, provider)
  }
  
  /**
   * 更新当前情境
   */
  public async updateContext(): Promise<Context> {
    const context: Partial<Context> = {
      id: this.generateContextId(),
      timestamp: new Date()
    }
    
    // 收集所有启用的提供者数据
    for (const providerName of this.config.enabledProviders) {
      const provider = this.contextProviders.get(providerName)
      if (provider) {
        try {
          const data = await provider.getData()
          ;(context as any)[provider.type] = data
        } catch (error) {
          console.error(`Failed to get data from provider ${providerName}:`, error)
        }
      }
    }
    
    // 计算情境评分
    context.score = this.calculateContextScore(context)
    
    // 生成情境标签
    context.tags = this.generateContextTags(context)
    
    // 默认值填充
    this.fillDefaultValues(context)
    
    this.currentContext = context as Context
    
    // 匹配规则
    const matches = await this.matchRules(this.currentContext)
    
    // 通知监听器
    this.notifyListeners(this.currentContext, matches)
    
    // 保存历史
    await this.saveHistory(this.currentContext, matches)
    
    return this.currentContext
  }
  
  /**
   * 计算情境评分
   */
  private calculateContextScore(context: Partial<Context>): Context['score'] {
    // TODO: 实现智能评分算法
    return {
      productivity: 75,
      energy: 80,
      focus: 70,
      stress: 30
    }
  }
  
  /**
   * 生成情境标签
   */
  private generateContextTags(context: Partial<Context>): string[] {
    const tags: string[] = []
    
    if (context.time?.isWorkingHour) tags.push('working_hours')
    if (context.time?.isWeekend) tags.push('weekend')
    if (context.time?.timeOfDay) tags.push(context.time.timeOfDay)
    
    return tags
  }
  
  /**
   * 填充默认值
   */
  private fillDefaultValues(context: Partial<Context>) {
    // 填充所有必需但缺失的字段
    if (!context.location) {
      context.location = {
        isLocationEnabled: false,
        geofences: []
      }
    }
    
    if (!context.person) {
      context.person = {
        nearbyPeople: [],
        scheduledMeetings: [],
        recentInteractions: []
      }
    }
    
    if (!context.physiology) {
      context.physiology = {
        energyLevel: 'medium'
      }
    }
    
    if (!context.psychology) {
      context.psychology = {
        focusLevel: 'normal',
        motivationLevel: 'medium',
        cognitiveLoad: 'moderate'
      }
    }
    
    if (!context.externalData) {
      context.externalData = {}
    }
  }
  
  /**
   * 匹配规则
   */
  public async matchRules(context: Context): Promise<ContextMatch[]> {
    const matches: ContextMatch[] = []
    
    for (const rule of this.contextRules) {
      if (!rule.enabled) continue
      
      const matchResult = this.evaluateRule(rule, context)
      if (matchResult.matchScore > 0.5) {
        matches.push(matchResult)
      }
    }
    
    // 按优先级和匹配度排序
    matches.sort((a, b) => {
      if (a.rule.priority !== b.rule.priority) {
        return b.rule.priority - a.rule.priority
      }
      return b.matchScore - a.matchScore
    })
    
    return matches
  }
  
  /**
   * 评估单个规则
   */
  private evaluateRule(rule: ContextRule, context: Context): ContextMatch {
    let matchedConditions: string[] = []
    let totalScore = 0
    let totalWeight = 0
    
    for (const condition of rule.conditions) {
      const weight = condition.weight || 1
      const isMatched = this.evaluateCondition(condition, context)
      
      if (isMatched) {
        matchedConditions.push(condition.field)
        totalScore += weight
      }
      
      totalWeight += weight
    }
    
    const matchScore = totalWeight > 0 ? totalScore / totalWeight : 0
    
    // 根据逻辑运算符调整分数
    if (rule.conditionLogic === 'AND' && matchedConditions.length < rule.conditions.length) {
      return {
        rule,
        matchScore: 0,
        matchedConditions: [],
        suggestedActions: [],
        confidence: 0
      }
    }
    
    if (rule.conditionLogic === 'OR' && matchedConditions.length === 0) {
      return {
        rule,
        matchScore: 0,
        matchedConditions: [],
        suggestedActions: [],
        confidence: 0
      }
    }
    
    return {
      rule,
      matchScore,
      matchedConditions,
      suggestedActions: rule.actions,
      confidence: matchScore,
      explanation: `匹配了 ${matchedConditions.length}/${rule.conditions.length} 个条件`
    }
  }
  
  /**
   * 评估单个条件
   */
  private evaluateCondition(condition: ContextCondition, context: Context): boolean {
    const value = this.getNestedValue(context, condition.field)
    
    switch (condition.operator) {
      case 'equals':
        return value === condition.value
      
      case 'notEquals':
        return value !== condition.value
      
      case 'contains':
        return String(value).includes(String(condition.value))
      
      case 'greaterThan':
        return Number(value) > Number(condition.value)
      
      case 'lessThan':
        return Number(value) < Number(condition.value)
      
      case 'between':
        const [min, max] = condition.value
        const numValue = Number(value)
        return numValue >= min && numValue <= max
      
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(value)
      
      case 'regex':
        return new RegExp(condition.value).test(String(value))
      
      default:
        return false
    }
  }
  
  /**
   * 获取嵌套属性值
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }
  
  /**
   * 通知监听器
   */
  private notifyListeners(context: Context, matches: ContextMatch[]) {
    this.contextListeners.forEach(listener => {
      try {
        listener.callback(context, matches)
      } catch (error) {
        console.error(`Error in context listener ${listener.name}:`, error)
      }
    })
  }
  
  /**
   * 保存历史记录
   */
  private async saveHistory(context: Context, matches: ContextMatch[]) {
    const history: ContextHistory = {
      id: this.generateHistoryId(),
      context,
      matchedRules: matches,
      executedActions: [], // TODO: 记录实际执行的动作
      timestamp: new Date()
    }
    
    this.contextHistory.push(history)
    
    // 限制历史记录数量
    if (this.contextHistory.length > this.config.storageLimit) {
      this.contextHistory = this.contextHistory.slice(-this.config.storageLimit)
    }
    
    // 持久化存储
    await this.storageService.setItem('contextHistory', this.contextHistory)
  }
  
  /**
   * 添加规则
   */
  public async addRule(rule: ContextRule) {
    this.contextRules.push(rule)
    await this.saveRules()
  }
  
  /**
   * 删除规则
   */
  public async removeRule(ruleId: string) {
    this.contextRules = this.contextRules.filter(r => r.id !== ruleId)
    await this.saveRules()
  }
  
  /**
   * 更新规则
   */
  public async updateRule(ruleId: string, updates: Partial<ContextRule>) {
    const index = this.contextRules.findIndex(r => r.id === ruleId)
    if (index !== -1) {
      this.contextRules[index] = { ...this.contextRules[index], ...updates }
      await this.saveRules()
    }
  }
  
  /**
   * 注册监听器
   */
  public registerListener(listener: ContextListener) {
    this.contextListeners.set(listener.id, listener)
  }
  
  /**
   * 移除监听器
   */
  public removeListener(listenerId: string) {
    this.contextListeners.delete(listenerId)
  }
  
  /**
   * 获取当前情境
   */
  public getCurrentContext(): Context | null {
    return this.currentContext
  }
  
  /**
   * 获取历史记录
   */
  public getHistory(limit?: number): ContextHistory[] {
    if (limit) {
      return this.contextHistory.slice(-limit)
    }
    return this.contextHistory
  }
  
  /**
   * 预测未来情境
   */
  public async predictContext(futureTime: Date): Promise<ContextPrediction> {
    // TODO: 实现基于历史数据的预测算法
    return {
      futureContext: {},
      predictedTime: futureTime,
      confidence: 0.7,
      basedOn: ['historical_patterns', 'scheduled_events'],
      suggestedPreparations: []
    }
  }
  
  /**
   * 执行动作
   */
  public async executeAction(action: ContextAction): Promise<void> {
    console.log('Executing action:', action)
    
    // 延迟执行
    if (action.delay) {
      setTimeout(() => this.executeActionInternal(action), action.delay * 1000)
    } else {
      await this.executeActionInternal(action)
    }
  }
  
  /**
   * 内部执行动作
   */
  private async executeActionInternal(action: ContextAction) {
    switch (action.type) {
      case 'trigger_sop':
        // TODO: 触发SOP
        console.log('Triggering SOP:', action.payload)
        break
      
      case 'send_notification':
        // TODO: 发送通知
        console.log('Sending notification:', action.payload)
        break
      
      case 'adjust_schedule':
        // TODO: 调整日程
        console.log('Adjusting schedule:', action.payload)
        break
      
      case 'suggest_task':
        // TODO: 建议任务
        console.log('Suggesting task:', action.payload)
        break
      
      case 'change_mode':
        // TODO: 切换模式
        console.log('Changing mode:', action.payload)
        break
      
      case 'custom':
        // 自定义动作
        if (typeof action.payload === 'function') {
          await action.payload()
        }
        break
    }
  }
  
  /**
   * 启动情境更新
   */
  private startContextUpdate() {
    this.updateContext() // 立即更新一次
    
    this.updateTimer = setInterval(() => {
      this.updateContext()
    }, this.config.updateInterval)
  }
  
  /**
   * 停止情境更新
   */
  public stopContextUpdate() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer)
      this.updateTimer = null
    }
  }
  
  /**
   * 更新配置
   */
  public updateConfig(config: Partial<ContextConfig>) {
    this.config = { ...this.config, ...config }
    
    // 重启更新计时器
    if (config.updateInterval) {
      this.stopContextUpdate()
      this.startContextUpdate()
    }
  }
  
  /**
   * 加载规则
   */
  private async loadRules() {
    const savedRules = await this.storageService.getItem('contextRules')
    if (savedRules) {
      this.contextRules = savedRules
    } else {
      // 加载默认规则
      this.loadDefaultRules()
    }
  }
  
  /**
   * 加载默认规则
   */
  private loadDefaultRules() {
    // 睡前提醒规则
    this.contextRules.push({
      id: 'bedtime-reminder',
      name: '睡前流程提醒',
      description: '在睡前15分钟自动提醒执行睡前SOP',
      enabled: true,
      priority: 100,
      conditions: [
        {
          field: 'time.timeOfDay',
          operator: 'equals',
          value: 'night'
        },
        {
          field: 'time.currentTime',
          operator: 'between',
          value: [21, 23] // 21:00 - 23:00
        }
      ],
      conditionLogic: 'AND',
      actions: [
        {
          type: 'trigger_sop',
          payload: { sopId: 'bedtime-routine' }
        }
      ],
      constraints: {
        maxTriggersPerDay: 1,
        cooldownMinutes: 1440 // 24小时
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      triggerCount: 0
    })
    
    // 会议前准备规则
    this.contextRules.push({
      id: 'meeting-preparation',
      name: '会议前准备提醒',
      description: '会议前15分钟提醒准备材料和设备',
      enabled: true,
      priority: 90,
      conditions: [
        {
          field: 'time.nearEvents.0.type',
          operator: 'equals',
          value: 'before'
        },
        {
          field: 'time.nearEvents.0.minutesUntil',
          operator: 'lessThan',
          value: 15
        }
      ],
      conditionLogic: 'AND',
      actions: [
        {
          type: 'send_notification',
          payload: { 
            title: '会议即将开始',
            message: '请准备会议材料和检查设备'
          }
        },
        {
          type: 'trigger_sop',
          payload: { sopId: 'meeting-preparation' }
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      triggerCount: 0
    })
  }
  
  /**
   * 保存规则
   */
  private async saveRules() {
    await this.storageService.setItem('contextRules', this.contextRules)
  }
  
  /**
   * 加载历史记录
   */
  private async loadHistory() {
    const savedHistory = await this.storageService.getItem('contextHistory')
    if (savedHistory) {
      this.contextHistory = savedHistory
    }
  }
  
  /**
   * 生成情境ID
   */
  private generateContextId(): string {
    return `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  /**
   * 生成历史记录ID
   */
  private generateHistoryId(): string {
    return `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  /**
   * 清理资源
   */
  public dispose() {
    this.stopContextUpdate()
    this.contextListeners.clear()
    this.contextProviders.clear()
  }
}

// 导出单例
export default ContextEngine.getInstance()