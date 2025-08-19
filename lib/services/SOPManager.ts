/**
 * SOP Manager - 标准操作流程管理服务
 * v4.0 核心服务
 */

import {
  SOP,
  SOPType,
  SOPCategory,
  SOPPriority,
  SOPStep,
  StepStatus,
  ChecklistSOP,
  StepByStepSOP,
  FlowchartSOP,
  SOPExecution,
  SOPExecutionOptions,
  SOPTemplate,
  SOPTrigger,
  ChecklistItem,
  FlowchartNode
} from '../../types/sop'
import { StorageService } from './SimpleStorageService'
import ContextEngine from './ContextEngine'

/**
 * SOP管理器
 */
export class SOPManager {
  private static instance: SOPManager
  
  private sops: Map<string, SOP> = new Map()
  private executions: Map<string, SOPExecution> = new Map()
  private templates: Map<string, SOPTemplate> = new Map()
  private storageService: StorageService
  
  // 执行回调
  private executionCallbacks: Map<string, SOPExecutionOptions['callbacks']> = new Map()
  
  private constructor() {
    this.storageService = new StorageService()
    this.initialize()
  }
  
  /**
   * 获取单例实例
   */
  public static getInstance(): SOPManager {
    if (!SOPManager.instance) {
      SOPManager.instance = new SOPManager()
    }
    return SOPManager.instance
  }
  
  /**
   * 初始化
   */
  private async initialize() {
    await this.loadSOPs()
    await this.loadTemplates()
    this.registerContextListeners()
    console.log('🚀 SOP Manager initialized')
  }
  
  /**
   * 注册情境监听器
   */
  private registerContextListeners() {
    // 监听情境变化，自动触发相关SOP
    ContextEngine.registerListener({
      id: 'sop-context-listener',
      name: 'SOP Context Listener',
      callback: (context, matches) => {
        // 检查是否有触发SOP的动作
        for (const match of matches) {
          for (const action of match.suggestedActions) {
            if (action.type === 'trigger_sop' && action.payload?.sopId) {
              this.triggerSOP(action.payload.sopId, 'context')
            }
          }
        }
      }
    })
  }
  
  /**
   * 创建SOP
   */
  public async createSOP(sopData: Partial<SOP>): Promise<SOP> {
    const sop = this.buildSOP(sopData)
    this.sops.set(sop.id, sop)
    await this.saveSOPs()
    return sop
  }
  
  /**
   * 构建SOP对象
   */
  private buildSOP(data: Partial<SOP>): SOP {
    const baseData = {
      id: data.id || this.generateSOPId(),
      name: data.name || '未命名SOP',
      category: data.category || SOPCategory.PERSONAL,
      priority: data.priority || SOPPriority.MEDIUM,
      version: '1.0.0',
      isActive: true,
      triggers: data.triggers || [],
      stats: {
        totalExecutions: 0,
        successRate: 0,
        averageDuration: 0,
        lastModified: new Date()
      },
      tags: data.tags || [],
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      visibility: data.visibility || 'private'
    }
    
    // 根据类型创建具体的SOP
    switch (data.type) {
      case SOPType.CHECKLIST:
        return {
          ...baseData,
          type: SOPType.CHECKLIST,
          items: (data as ChecklistSOP).items || [],
          groups: (data as ChecklistSOP).groups,
          completionCriteria: (data as ChecklistSOP).completionCriteria || {
            requiredItems: []
          }
        } as ChecklistSOP
      
      case SOPType.STEP_BY_STEP:
        return {
          ...baseData,
          type: SOPType.STEP_BY_STEP,
          steps: (data as StepByStepSOP).steps || [],
          executionMode: (data as StepByStepSOP).executionMode || 'sequential',
          progress: {
            completedSteps: [],
            totalSteps: ((data as StepByStepSOP).steps || []).length,
            percentComplete: 0
          },
          guidance: (data as StepByStepSOP).guidance || {
            showTimer: true,
            showProgress: true,
            allowSkip: false,
            allowReorder: false
          }
        } as StepByStepSOP
      
      case SOPType.FLOWCHART:
        return {
          ...baseData,
          type: SOPType.FLOWCHART,
          nodes: (data as FlowchartSOP).nodes || [],
          flow: {
            startNodeId: (data as FlowchartSOP).flow?.startNodeId || '',
            visitedNodes: [],
            decisionHistory: []
          },
          visualization: (data as FlowchartSOP).visualization || {
            layout: 'horizontal'
          }
        } as FlowchartSOP
      
      default:
        throw new Error(`Unsupported SOP type: ${data.type}`)
    }
  }
  
  /**
   * 获取SOP
   */
  public getSOP(sopId: string): SOP | undefined {
    return this.sops.get(sopId)
  }
  
  /**
   * 获取所有SOP
   */
  public getAllSOPs(): SOP[] {
    return Array.from(this.sops.values())
  }
  
  /**
   * 获取分类SOP
   */
  public getSOPsByCategory(category: SOPCategory): SOP[] {
    return this.getAllSOPs().filter(sop => sop.category === category)
  }
  
  /**
   * 更新SOP
   */
  public async updateSOP(sopId: string, updates: Partial<SOP>): Promise<SOP | null> {
    const sop = this.sops.get(sopId)
    if (!sop) return null
    
    const updatedSOP = {
      ...sop,
      ...updates,
      updatedAt: new Date(),
      stats: {
        ...sop.stats,
        lastModified: new Date()
      }
    }
    
    this.sops.set(sopId, updatedSOP)
    await this.saveSOPs()
    return updatedSOP
  }
  
  /**
   * 删除SOP
   */
  public async deleteSOP(sopId: string): Promise<boolean> {
    const deleted = this.sops.delete(sopId)
    if (deleted) {
      await this.saveSOPs()
    }
    return deleted
  }
  
  /**
   * 触发SOP
   */
  public async triggerSOP(sopId: string, source: 'manual' | 'automatic' | 'scheduled' | 'context'): Promise<SOPExecution | null> {
    const sop = this.sops.get(sopId)
    if (!sop || !sop.isActive) return null
    
    // 检查约束条件
    if (!this.checkConstraints(sop)) {
      console.log(`SOP ${sopId} blocked by constraints`)
      return null
    }
    
    // 创建执行实例
    const execution = this.createExecution(sop, source)
    this.executions.set(execution.id, execution)
    
    // 开始执行
    this.startExecution(execution)
    
    return execution
  }
  
  /**
   * 检查约束条件
   */
  private checkConstraints(sop: SOP): boolean {
    // TODO: 实现约束检查逻辑
    return true
  }
  
  /**
   * 创建执行实例
   */
  private createExecution(sop: SOP, triggeredBy: 'manual' | 'automatic' | 'scheduled' | 'context'): SOPExecution {
    const execution: SOPExecution = {
      id: this.generateExecutionId(),
      sopId: sop.id,
      sopName: sop.name,
      status: 'preparing',
      startedAt: new Date(),
      progress: {
        totalSteps: this.getTotalSteps(sop),
        completedSteps: 0,
        percentComplete: 0
      },
      context: {
        triggeredBy,
        executor: 'current_user' // TODO: 获取当前用户
      },
      stepRecords: [],
      interruptions: []
    }
    
    return execution
  }
  
  /**
   * 获取总步骤数
   */
  private getTotalSteps(sop: SOP): number {
    switch (sop.type) {
      case SOPType.CHECKLIST:
        return (sop as ChecklistSOP).items.length
      case SOPType.STEP_BY_STEP:
        return (sop as StepByStepSOP).steps.length
      case SOPType.FLOWCHART:
        return (sop as FlowchartSOP).nodes.filter(n => n.type === 'process').length
      default:
        return 0
    }
  }
  
  /**
   * 开始执行SOP
   */
  public async startExecution(execution: SOPExecution, options?: SOPExecutionOptions): Promise<void> {
    const sop = this.sops.get(execution.sopId)
    if (!sop) return
    
    // 保存执行选项
    if (options?.callbacks) {
      this.executionCallbacks.set(execution.id, options.callbacks)
    }
    
    // 更新状态
    execution.status = 'running'
    
    // 触发开始回调
    this.triggerCallback(execution.id, 'onStart')
    
    // 根据SOP类型执行
    switch (sop.type) {
      case SOPType.CHECKLIST:
        await this.executeChecklist(execution, sop as ChecklistSOP, options)
        break
      
      case SOPType.STEP_BY_STEP:
        await this.executeStepByStep(execution, sop as StepByStepSOP, options)
        break
      
      case SOPType.FLOWCHART:
        await this.executeFlowchart(execution, sop as FlowchartSOP, options)
        break
    }
  }
  
  /**
   * 执行检查清单
   */
  private async executeChecklist(
    execution: SOPExecution, 
    sop: ChecklistSOP, 
    options?: SOPExecutionOptions
  ): Promise<void> {
    // 初始化所有检查项
    for (const item of sop.items) {
      execution.stepRecords.push({
        stepId: item.id,
        status: StepStatus.PENDING
      })
    }
    
    // 等待用户逐项完成
    // TODO: 实现UI交互逻辑
  }
  
  /**
   * 执行分步指导
   */
  private async executeStepByStep(
    execution: SOPExecution,
    sop: StepByStepSOP,
    options?: SOPExecutionOptions
  ): Promise<void> {
    const steps = sop.steps
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      
      // 检查是否可以跳过
      if (step.skipCondition && step.skipCondition(execution.context)) {
        this.recordStepCompletion(execution, step.id, StepStatus.SKIPPED)
        continue
      }
      
      // 更新当前步骤
      execution.progress.currentStep = step.id
      
      // 记录开始
      const record = {
        stepId: step.id,
        status: StepStatus.IN_PROGRESS as StepStatus,
        startedAt: new Date()
      }
      execution.stepRecords.push(record)
      
      // 执行步骤
      await this.executeStep(step, execution, options)
      
      // 记录完成
      record.status = StepStatus.COMPLETED
      record.completedAt = new Date()
      record.duration = (record.completedAt.getTime() - record.startedAt.getTime()) / 1000
      
      // 更新进度
      execution.progress.completedSteps++
      execution.progress.percentComplete = Math.round(
        (execution.progress.completedSteps / execution.progress.totalSteps) * 100
      )
      
      // 触发步骤完成回调
      this.triggerCallback(execution.id, 'onStepComplete', step.id)
      
      // 自动前进延迟
      if (options?.behavior?.autoAdvance && i < steps.length - 1) {
        await this.delay(1000) // 1秒延迟
      }
    }
    
    // 完成执行
    this.completeExecution(execution)
  }
  
  /**
   * 执行流程图
   */
  private async executeFlowchart(
    execution: SOPExecution,
    sop: FlowchartSOP,
    options?: SOPExecutionOptions
  ): Promise<void> {
    let currentNodeId = sop.flow.startNodeId
    const visitedNodes = new Set<string>()
    
    while (currentNodeId) {
      const node = sop.nodes.find(n => n.id === currentNodeId)
      if (!node) break
      
      // 避免循环
      if (visitedNodes.has(currentNodeId)) {
        console.warn(`Loop detected at node ${currentNodeId}`)
        break
      }
      visitedNodes.add(currentNodeId)
      
      // 执行节点
      const nextNodeId = await this.executeFlowchartNode(node, execution, sop, options)
      currentNodeId = nextNodeId || ''
      
      // 记录访问
      sop.flow.visitedNodes.push(node.id)
    }
    
    // 完成执行
    this.completeExecution(execution)
  }
  
  /**
   * 执行流程图节点
   */
  private async executeFlowchartNode(
    node: FlowchartNode,
    execution: SOPExecution,
    sop: FlowchartSOP,
    options?: SOPExecutionOptions
  ): Promise<string | null> {
    switch (node.type) {
      case 'start':
        // 开始节点，直接返回下一个节点
        return node.connections[0]?.targetId || null
      
      case 'end':
        // 结束节点
        return null
      
      case 'process':
        // 处理节点
        await this.executeStep(node, execution, options)
        return node.connections[0]?.targetId || null
      
      case 'decision':
        // 决策节点
        if (node.decision) {
          // TODO: 实现决策逻辑，获取用户选择
          const decision = await this.getUserDecision(node.decision)
          const option = node.decision.options.find(o => o.value === decision)
          
          // 记录决策
          sop.flow.decisionHistory.push({
            nodeId: node.id,
            decision,
            timestamp: new Date()
          })
          
          return option?.nextNodeId || null
        }
        return null
      
      case 'parallel':
        // 并行节点
        if (node.parallel) {
          // TODO: 实现并行执行逻辑
          await this.executeParallelBranches(node.parallel.branches, execution, sop, options)
        }
        return node.connections[0]?.targetId || null
      
      case 'loop':
        // 循环节点
        if (node.loop) {
          // TODO: 实现循环逻辑
          const shouldContinue = await this.evaluateLoopCondition(node.loop)
          if (shouldContinue) {
            return node.id // 继续循环
          }
        }
        return node.connections[0]?.targetId || null
      
      default:
        return null
    }
  }
  
  /**
   * 执行单个步骤
   */
  private async executeStep(
    step: SOPStep | FlowchartNode,
    execution: SOPExecution,
    options?: SOPExecutionOptions
  ): Promise<void> {
    // 发送步骤提醒
    if (step.reminder?.beforeStart) {
      await this.delay(step.reminder.beforeStart * 1000)
      // TODO: 发送提醒通知
    }
    
    // 等待步骤完成
    if (options?.behavior?.confirmEachStep) {
      // TODO: 等待用户确认
      await this.waitForUserConfirmation(step.id)
    } else if (step.estimatedDuration) {
      // 模拟执行时间
      await this.delay(step.estimatedDuration * 1000)
    }
    
    // 执行验证
    if (step.validation) {
      const isValid = await this.validateStep(step, execution)
      if (!isValid) {
        throw new Error(`Step ${step.id} validation failed`)
      }
    }
  }
  
  /**
   * 获取用户决策
   */
  private async getUserDecision(decision: FlowchartNode['decision']): Promise<any> {
    // TODO: 实现UI交互获取用户选择
    return decision?.options[0]?.value
  }
  
  /**
   * 执行并行分支
   */
  private async executeParallelBranches(
    branches: string[][],
    execution: SOPExecution,
    sop: FlowchartSOP,
    options?: SOPExecutionOptions
  ): Promise<void> {
    // TODO: 实现并行执行逻辑
    const promises = branches.map(branch => {
      // 执行每个分支
      return Promise.resolve()
    })
    
    await Promise.all(promises)
  }
  
  /**
   * 评估循环条件
   */
  private async evaluateLoopCondition(loop: FlowchartNode['loop']): Promise<boolean> {
    // TODO: 实现循环条件评估
    if (!loop) return false
    
    if (loop.maxIterations && loop.currentIteration) {
      return loop.currentIteration < loop.maxIterations
    }
    
    return false
  }
  
  /**
   * 验证步骤
   */
  private async validateStep(step: SOPStep | FlowchartNode, execution: SOPExecution): Promise<boolean> {
    if (!step.validation) return true
    
    switch (step.validation.type) {
      case 'manual':
        // TODO: 等待用户手动确认
        return true
      
      case 'automatic':
        if (step.validation.validator) {
          return step.validation.validator(execution.context)
        }
        return true
      
      case 'photo':
        // TODO: 实现拍照验证
        return true
      
      case 'location':
        // TODO: 实现位置验证
        return true
      
      case 'data':
        // TODO: 实现数据验证
        return true
      
      default:
        return true
    }
  }
  
  /**
   * 等待用户确认
   */
  private async waitForUserConfirmation(stepId: string): Promise<void> {
    // TODO: 实现UI交互等待用户确认
    return new Promise(resolve => {
      setTimeout(resolve, 1000) // 模拟等待
    })
  }
  
  /**
   * 记录步骤完成
   */
  private recordStepCompletion(execution: SOPExecution, stepId: string, status: StepStatus) {
    const record = execution.stepRecords.find(r => r.stepId === stepId)
    if (record) {
      record.status = status
      record.completedAt = new Date()
    } else {
      execution.stepRecords.push({
        stepId,
        status,
        completedAt: new Date()
      })
    }
    
    if (status === StepStatus.COMPLETED) {
      execution.progress.completedSteps++
      execution.progress.percentComplete = Math.round(
        (execution.progress.completedSteps / execution.progress.totalSteps) * 100
      )
    }
  }
  
  /**
   * 完成执行
   */
  private completeExecution(execution: SOPExecution) {
    execution.status = 'completed'
    execution.completedAt = new Date()
    
    // 计算结果
    const completedSteps = execution.stepRecords.filter(r => r.status === StepStatus.COMPLETED)
    const skippedSteps = execution.stepRecords.filter(r => r.status === StepStatus.SKIPPED)
    const failedSteps = execution.stepRecords.filter(r => r.status === StepStatus.FAILED)
    
    execution.result = {
      success: failedSteps.length === 0,
      completionRate: Math.round((completedSteps.length / execution.stepRecords.length) * 100),
      skippedSteps: skippedSteps.map(r => r.stepId),
      failedSteps: failedSteps.map(r => r.stepId)
    }
    
    // 更新SOP统计
    this.updateSOPStats(execution.sopId, execution)
    
    // 触发完成回调
    this.triggerCallback(execution.id, 'onComplete', execution.result)
    
    // 清理回调
    this.executionCallbacks.delete(execution.id)
  }
  
  /**
   * 更新SOP统计
   */
  private async updateSOPStats(sopId: string, execution: SOPExecution) {
    const sop = this.sops.get(sopId)
    if (!sop) return
    
    const stats = sop.stats
    stats.totalExecutions++
    stats.lastExecuted = new Date()
    
    // 计算成功率
    if (execution.result?.success) {
      stats.successRate = ((stats.successRate * (stats.totalExecutions - 1)) + 100) / stats.totalExecutions
    } else {
      stats.successRate = (stats.successRate * (stats.totalExecutions - 1)) / stats.totalExecutions
    }
    
    // 计算平均时长
    if (execution.completedAt) {
      const duration = (execution.completedAt.getTime() - execution.startedAt.getTime()) / 1000
      stats.averageDuration = ((stats.averageDuration * (stats.totalExecutions - 1)) + duration) / stats.totalExecutions
    }
    
    await this.saveSOPs()
  }
  
  /**
   * 暂停执行
   */
  public pauseExecution(executionId: string) {
    const execution = this.executions.get(executionId)
    if (execution && execution.status === 'running') {
      execution.status = 'paused'
      execution.pausedAt = new Date()
      
      // 记录中断
      execution.interruptions.push({
        timestamp: new Date(),
        reason: 'User paused'
      })
      
      // 触发暂停回调
      this.triggerCallback(executionId, 'onPause')
    }
  }
  
  /**
   * 恢复执行
   */
  public resumeExecution(executionId: string) {
    const execution = this.executions.get(executionId)
    if (execution && execution.status === 'paused') {
      execution.status = 'running'
      
      // 更新中断记录
      const lastInterruption = execution.interruptions[execution.interruptions.length - 1]
      if (lastInterruption) {
        lastInterruption.resumedAt = new Date()
      }
      
      // 触发恢复回调
      this.triggerCallback(executionId, 'onResume')
      
      // TODO: 继续执行流程
    }
  }
  
  /**
   * 取消执行
   */
  public cancelExecution(executionId: string) {
    const execution = this.executions.get(executionId)
    if (execution && ['running', 'paused'].includes(execution.status)) {
      execution.status = 'cancelled'
      execution.completedAt = new Date()
      
      // 触发错误回调
      this.triggerCallback(executionId, 'onError', new Error('Execution cancelled'))
      
      // 清理回调
      this.executionCallbacks.delete(executionId)
    }
  }
  
  /**
   * 触发回调
   */
  private triggerCallback(executionId: string, callbackName: keyof NonNullable<SOPExecutionOptions['callbacks']>, ...args: any[]) {
    const callbacks = this.executionCallbacks.get(executionId)
    if (callbacks && callbacks[callbackName]) {
      try {
        (callbacks[callbackName] as Function)(...args)
      } catch (error) {
        console.error(`Error in callback ${callbackName}:`, error)
      }
    }
  }
  
  /**
   * 创建SOP模板
   */
  public async createTemplate(template: SOPTemplate): Promise<SOPTemplate> {
    this.templates.set(template.id, template)
    await this.saveTemplates()
    return template
  }
  
  /**
   * 从模板创建SOP
   */
  public async createFromTemplate(templateId: string, variables?: Record<string, any>): Promise<SOP | null> {
    const template = this.templates.get(templateId)
    if (!template) return null
    
    // 应用变量替换
    let sopData = { ...template.template }
    if (variables && template.variables) {
      // TODO: 实现变量替换逻辑
    }
    
    // 更新使用统计
    template.usage.count++
    template.usage.lastUsed = new Date()
    await this.saveTemplates()
    
    return this.createSOP(sopData)
  }
  
  /**
   * 加载默认SOP模板
   */
  private async loadDefaultTemplates() {
    // 睡前流程模板
    const bedtimeTemplate: SOPTemplate = {
      id: 'bedtime-routine-template',
      name: '睡前流程',
      description: '标准的睡前准备流程，帮助你更好地入睡',
      category: SOPCategory.HEALTH,
      type: SOPType.CHECKLIST,
      template: {
        name: '睡前15分钟流程',
        type: SOPType.CHECKLIST,
        category: SOPCategory.HEALTH,
        priority: SOPPriority.HIGH,
        items: [
          {
            id: 'wear-socks',
            title: '穿袜子',
            description: '穿上舒适的睡眠袜',
            estimatedDuration: 30,
            status: StepStatus.PENDING,
            checked: false,
            checkType: 'checkbox',
            required: true
          },
          {
            id: 'wear-eyemask',
            title: '戴眼罩',
            description: '戴上遮光眼罩',
            estimatedDuration: 20,
            status: StepStatus.PENDING,
            checked: false,
            checkType: 'checkbox',
            required: true
          },
          {
            id: 'mouth-tape',
            title: '贴口贴',
            description: '贴上呼吸口贴',
            estimatedDuration: 15,
            status: StepStatus.PENDING,
            checked: false,
            checkType: 'checkbox',
            required: false
          },
          {
            id: 'smell-check',
            title: '气味检查',
            description: '检查房间是否有异味',
            estimatedDuration: 10,
            status: StepStatus.PENDING,
            checked: false,
            checkType: 'checkbox'
          },
          {
            id: 'charge-devices',
            title: '设备充电',
            description: '将手机、手表等设备充电',
            estimatedDuration: 60,
            status: StepStatus.PENDING,
            checked: false,
            checkType: 'checkbox',
            required: true
          },
          {
            id: 'set-sleep-timer',
            title: '设定睡眠计时',
            description: '设置睡眠追踪',
            estimatedDuration: 15,
            status: StepStatus.PENDING,
            checked: false,
            checkType: 'checkbox'
          }
        ] as ChecklistItem[],
        completionCriteria: {
          requiredItems: ['wear-socks', 'wear-eyemask', 'charge-devices']
        }
      } as Partial<ChecklistSOP>,
      usage: {
        count: 0,
        rating: 4.5
      },
      tags: ['睡眠', '健康', '日常'],
      source: 'system'
    }
    
    this.templates.set(bedtimeTemplate.id, bedtimeTemplate)
    
    // 会议准备模板
    const meetingTemplate: SOPTemplate = {
      id: 'meeting-prep-template',
      name: '会议准备流程',
      description: '确保会议顺利进行的标准准备流程',
      category: SOPCategory.MEETING,
      type: SOPType.STEP_BY_STEP,
      template: {
        name: '会议前15分钟准备',
        type: SOPType.STEP_BY_STEP,
        category: SOPCategory.MEETING,
        priority: SOPPriority.HIGH,
        steps: [
          {
            id: 'check-agenda',
            title: '检查会议议程',
            description: '确认会议主题和议程安排',
            estimatedDuration: 120,
            status: StepStatus.PENDING
          },
          {
            id: 'prepare-materials',
            title: '准备会议材料',
            description: '准备演示文稿、文档等材料',
            estimatedDuration: 300,
            status: StepStatus.PENDING
          },
          {
            id: 'test-equipment',
            title: '测试设备',
            description: '测试摄像头、麦克风、屏幕共享',
            estimatedDuration: 180,
            status: StepStatus.PENDING,
            validation: {
              type: 'manual',
              criteria: '设备正常工作'
            }
          },
          {
            id: 'join-early',
            title: '提前进入会议室',
            description: '提前5分钟进入会议室',
            estimatedDuration: 60,
            status: StepStatus.PENDING
          }
        ] as SOPStep[],
        executionMode: 'sequential',
        guidance: {
          showTimer: true,
          showProgress: true,
          allowSkip: true,
          allowReorder: false,
          voiceGuidance: true
        }
      } as Partial<StepByStepSOP>,
      variables: [
        {
          name: 'meetingType',
          type: 'select',
          options: ['内部会议', '客户会议', '演示会议'],
          required: true
        }
      ],
      usage: {
        count: 0,
        rating: 4.8
      },
      tags: ['会议', '工作', '准备'],
      source: 'system'
    }
    
    this.templates.set(meetingTemplate.id, meetingTemplate)
  }
  
  /**
   * 加载SOP
   */
  private async loadSOPs() {
    const savedSOPs = await this.storageService.getItem('sops')
    if (savedSOPs) {
      savedSOPs.forEach((sop: SOP) => {
        this.sops.set(sop.id, sop)
      })
    } else {
      // 加载默认SOP
      await this.loadDefaultSOPs()
    }
  }
  
  /**
   * 加载默认SOP
   */
  private async loadDefaultSOPs() {
    // 从模板创建默认SOP
    await this.loadDefaultTemplates()
    
    // 创建睡前流程SOP
    const bedtimeTemplate = this.templates.get('bedtime-routine-template')
    if (bedtimeTemplate) {
      const bedtimeSOP = await this.createFromTemplate(bedtimeTemplate.id)
      if (bedtimeSOP) {
        // 添加触发器
        bedtimeSOP.triggers.push({
          id: 'bedtime-trigger',
          type: 'context',
          enabled: true,
          context: {
            contextRuleId: 'bedtime-reminder'
          }
        })
        await this.updateSOP(bedtimeSOP.id, bedtimeSOP)
      }
    }
  }
  
  /**
   * 保存SOP
   */
  private async saveSOPs() {
    const sopsArray = Array.from(this.sops.values())
    await this.storageService.setItem('sops', sopsArray)
  }
  
  /**
   * 加载模板
   */
  private async loadTemplates() {
    const savedTemplates = await this.storageService.getItem('sopTemplates')
    if (savedTemplates) {
      savedTemplates.forEach((template: SOPTemplate) => {
        this.templates.set(template.id, template)
      })
    } else {
      await this.loadDefaultTemplates()
      await this.saveTemplates()
    }
  }
  
  /**
   * 保存模板
   */
  private async saveTemplates() {
    const templatesArray = Array.from(this.templates.values())
    await this.storageService.setItem('sopTemplates', templatesArray)
  }
  
  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  
  /**
   * 生成SOP ID
   */
  private generateSOPId(): string {
    return `sop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  /**
   * 生成执行ID
   */
  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  /**
   * 清理资源
   */
  public dispose() {
    this.sops.clear()
    this.executions.clear()
    this.templates.clear()
    this.executionCallbacks.clear()
  }
}

// 导出单例
export default SOPManager.getInstance()