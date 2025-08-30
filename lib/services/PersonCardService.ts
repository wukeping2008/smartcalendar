/**
 * Person Card CRM Service
 * 人物卡CRM管理服务
 */

import {
  PersonCard,
  ContactInfo,
  RelationshipInfo,
  Interaction,
  PersonCategory,
  ImportanceLevel,
  RelationType,
  RelationshipStrength,
  ContactFrequency,
  RelationshipQuality,
  RelationshipStatus,
  InteractionType,
  CommunicationChannel,
  CommunicationStyle,
  Sentiment,
  PersonTask,
  TaskStatus,
  TaskPriority,
  Note,
  ImportantDate,
  DateType,
  RelationshipAnalytics,
  HealthFactor,
  Opportunity,
  Recommendation,
  PersonGroup,
  GroupType,
  PersonSearchCriteria,
  RelationshipStrategy,
  TouchPoint,
  Milestone,
  ContactPreferences,
  MeetingPreferences,
  GiftManagement,
  GiftRecord
} from '../../types/personcard'
import { aiService } from './AIService'

class PersonCardService {
  private static instance: PersonCardService
  private persons: Map<string, PersonCard> = new Map()
  private groups: Map<string, PersonGroup> = new Map()
  private strategies: Map<string, RelationshipStrategy> = new Map()
  private analyticsCache: Map<string, RelationshipAnalytics> = new Map()
  private listeners: Set<(persons: PersonCard[]) => void> = new Set()

  private constructor() {
    this.initializeDefaultData()
    this.startPeriodicAnalysis()
    console.log('👥 Person Card CRM Service initialized')
  }

  static getInstance(): PersonCardService {
    if (!PersonCardService.instance) {
      PersonCardService.instance = new PersonCardService()
    }
    return PersonCardService.instance
  }

  private initializeDefaultData() {
    // 初始化示例数据
    const samplePersons: Partial<PersonCard>[] = [
      {
        id: 'person-1',
        name: '张总',
        title: 'CEO',
        company: 'ABC科技有限公司',
        contact: {
          mobile: '138****5678',
          email: 'zhang@abc.com',
          wechat: 'zhang_ceo'
        },
        relationship: {
          type: RelationType.CLIENT,
          strength: RelationshipStrength.CLOSE,
          frequency: ContactFrequency.WEEKLY,
          quality: RelationshipQuality.EXCELLENT,
          trustLevel: 85,
          reciprocity: 75,
          history: '通过行业会议认识，合作3年',
          status: RelationshipStatus.ACTIVE
        },
        category: PersonCategory.VIP,
        importance: ImportanceLevel.CRITICAL,
        tags: ['重要客户', '科技行业', '决策者'],
        interests: ['高尔夫', '红酒', '科技趋势'],
        lastContactedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'person-2',
        name: '李经理',
        title: '项目经理',
        company: 'XYZ咨询公司',
        contact: {
          mobile: '139****1234',
          email: 'li@xyz.com',
          linkedin: 'li-manager'
        },
        relationship: {
          type: RelationType.PARTNER,
          strength: RelationshipStrength.MODERATE,
          frequency: ContactFrequency.MONTHLY,
          quality: RelationshipQuality.GOOD,
          trustLevel: 70,
          reciprocity: 80,
          history: '合作伙伴，2年合作经验',
          status: RelationshipStatus.ACTIVE
        },
        category: PersonCategory.KEY_CONTACT,
        importance: ImportanceLevel.HIGH,
        tags: ['合作伙伴', '咨询行业', '项目管理'],
        interests: ['项目管理', '敏捷开发', '团队建设'],
        lastContactedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    ]

    samplePersons.forEach(person => {
      this.createPerson(person as PersonCard)
    })

    // 创建示例群组
    this.createGroup({
      id: 'group-1',
      name: '重要客户',
      type: GroupType.CLIENTS,
      members: ['person-1'],
      createdAt: new Date()
    })
  }

  private startPeriodicAnalysis() {
    // 每天分析一次关系健康度
    setInterval(() => {
      this.analyzeAllRelationships()
    }, 24 * 60 * 60 * 1000)

    // 立即执行一次
    this.analyzeAllRelationships()
  }

  // 创建人物卡
  async createPerson(data: Partial<PersonCard>): Promise<PersonCard> {
    const person: PersonCard = {
      id: data.id || `person-${Date.now()}`,
      name: data.name || '',
      contact: data.contact || {},
      relationship: data.relationship || {
        type: RelationType.ACQUAINTANCE,
        strength: RelationshipStrength.WEAK,
        frequency: ContactFrequency.RARELY,
        quality: RelationshipQuality.NEUTRAL,
        trustLevel: 50,
        reciprocity: 50,
        history: '',
        status: RelationshipStatus.POTENTIAL
      },
      interactions: data.interactions || [],
      tags: data.tags || [],
      category: data.category || PersonCategory.REGULAR,
      importance: data.importance || ImportanceLevel.MEDIUM,
      influence: data.influence || {
        professional: 50,
        social: 50,
        financial: 50,
        knowledge: 50,
        overall: 50
      },
      personality: data.personality || {
        traits: [],
        communicationStyle: data.personality?.communicationStyle || CommunicationStyle.FORMAL,
        values: [],
        strengths: [],
        motivations: []
      },
      interests: data.interests || [],
      preferences: data.preferences || {
        topics: []
      },
      importantDates: data.importantDates || [],
      notes: data.notes || [],
      tasks: data.tasks || [],
      business: data.business || {
        expertise: [],
        projects: [],
        deals: []
      },
      socialNetwork: data.socialNetwork || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data
    }

    this.persons.set(person.id, person)
    this.notifyListeners()
    
    // 生成初始分析
    await this.analyzeRelationship(person.id)
    
    return person
  }

  // 更新人物卡
  updatePerson(id: string, updates: Partial<PersonCard>): PersonCard | null {
    const person = this.persons.get(id)
    if (!person) return null

    const updated = {
      ...person,
      ...updates,
      updatedAt: new Date()
    }

    this.persons.set(id, updated)
    this.notifyListeners()
    
    // 清除缓存的分析
    this.analyticsCache.delete(id)
    
    return updated
  }

  // 删除人物卡
  deletePerson(id: string): boolean {
    const result = this.persons.delete(id)
    if (result) {
      this.notifyListeners()
      this.analyticsCache.delete(id)
    }
    return result
  }

  // 获取人物卡
  getPerson(id: string): PersonCard | undefined {
    return this.persons.get(id)
  }

  // 获取所有人物卡
  getAllPersons(): PersonCard[] {
    return Array.from(this.persons.values())
  }

  // 搜索人物卡
  searchPersons(criteria: PersonSearchCriteria): PersonCard[] {
    let results = Array.from(this.persons.values())

    if (criteria.query) {
      const query = criteria.query.toLowerCase()
      results = results.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.company?.toLowerCase().includes(query) ||
        p.title?.toLowerCase().includes(query) ||
        p.tags.some(t => t.toLowerCase().includes(query))
      )
    }

    if (criteria.categories?.length) {
      results = results.filter(p => criteria.categories!.includes(p.category))
    }

    if (criteria.relationTypes?.length) {
      results = results.filter(p => criteria.relationTypes!.includes(p.relationship.type))
    }

    if (criteria.importance?.length) {
      results = results.filter(p => criteria.importance!.includes(p.importance))
    }

    if (criteria.tags?.length) {
      results = results.filter(p => 
        p.tags.some(t => criteria.tags!.includes(t))
      )
    }

    if (criteria.lastContactedDays !== undefined) {
      const cutoff = Date.now() - criteria.lastContactedDays * 24 * 60 * 60 * 1000
      results = results.filter(p => 
        !p.lastContactedAt || p.lastContactedAt.getTime() < cutoff
      )
    }

    if (criteria.hasUpcomingTasks) {
      results = results.filter(p => 
        p.tasks.some(t => t.status !== TaskStatus.COMPLETED)
      )
    }

    if (criteria.hasNotes) {
      results = results.filter(p => p.notes.length > 0)
    }

    if (criteria.groups?.length) {
      const groupMembers = new Set<string>()
      criteria.groups.forEach(groupId => {
        const group = this.groups.get(groupId)
        if (group) {
          group.members.forEach(m => groupMembers.add(m))
        }
      })
      results = results.filter(p => groupMembers.has(p.id))
    }

    return results
  }

  // 添加互动记录
  addInteraction(personId: string, interaction: Omit<Interaction, 'id'>): Interaction | null {
    const person = this.persons.get(personId)
    if (!person) return null

    const newInteraction: Interaction = {
      id: `interaction-${Date.now()}`,
      ...interaction
    }

    person.interactions.push(newInteraction)
    person.lastContactedAt = interaction.date
    person.updatedAt = new Date()

    this.persons.set(personId, person)
    this.notifyListeners()
    
    // 更新关系分析
    this.analyzeRelationship(personId)

    return newInteraction
  }

  // 添加任务
  addTask(personId: string, task: Omit<PersonTask, 'id'>): PersonTask | null {
    const person = this.persons.get(personId)
    if (!person) return null

    const newTask: PersonTask = {
      id: `task-${Date.now()}`,
      ...task
    }

    person.tasks.push(newTask)
    person.updatedAt = new Date()

    this.persons.set(personId, person)
    this.notifyListeners()

    return newTask
  }

  // 更新任务状态
  updateTaskStatus(personId: string, taskId: string, status: TaskStatus): boolean {
    const person = this.persons.get(personId)
    if (!person) return false

    const task = person.tasks.find(t => t.id === taskId)
    if (!task) return false

    task.status = status
    person.updatedAt = new Date()

    this.persons.set(personId, person)
    this.notifyListeners()

    return true
  }

  // 添加笔记
  addNote(personId: string, note: Omit<Note, 'id' | 'date'>): Note | null {
    const person = this.persons.get(personId)
    if (!person) return null

    const newNote: Note = {
      id: `note-${Date.now()}`,
      date: new Date(),
      ...note
    }

    person.notes.push(newNote)
    person.updatedAt = new Date()

    this.persons.set(personId, person)
    this.notifyListeners()

    return newNote
  }

  // 添加重要日期
  addImportantDate(personId: string, date: Omit<ImportantDate, 'id'>): ImportantDate | null {
    const person = this.persons.get(personId)
    if (!person) return null

    const newDate: ImportantDate = {
      id: `date-${Date.now()}`,
      ...date
    }

    person.importantDates.push(newDate)
    person.updatedAt = new Date()

    this.persons.set(personId, person)
    this.notifyListeners()

    return newDate
  }

  // 分析关系健康度
  async analyzeRelationship(personId: string): Promise<RelationshipAnalytics> {
    const person = this.persons.get(personId)
    if (!person) {
      throw new Error('Person not found')
    }

    // 检查缓存
    const cached = this.analyticsCache.get(personId)
    if (cached && (Date.now() - (cached as any).timestamp) < 60 * 60 * 1000) {
      return cached
    }

    // 计算互动统计
    const now = Date.now()
    const interactions = person.interactions.sort((a, b) => b.date.getTime() - a.date.getTime())
    const lastInteraction = interactions[0]
    const lastInteractionDays = lastInteraction 
      ? Math.floor((now - lastInteraction.date.getTime()) / (24 * 60 * 60 * 1000))
      : 999

    // 计算平均互动间隔
    let averageInterval = 999
    if (interactions.length > 1) {
      const intervals: number[] = []
      for (let i = 0; i < interactions.length - 1; i++) {
        const days = Math.floor(
          (interactions[i].date.getTime() - interactions[i + 1].date.getTime()) / 
          (24 * 60 * 60 * 1000)
        )
        intervals.push(days)
      }
      averageInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
    }

    // 判断互动趋势
    let interactionTrend: 'increasing' | 'stable' | 'decreasing' = 'stable'
    if (interactions.length >= 3) {
      const recent = interactions.slice(0, 3)
      const older = interactions.slice(3, 6)
      if (recent.length && older.length) {
        const recentAvg = recent.length / 3
        const olderAvg = older.length / 3
        if (recentAvg > olderAvg * 1.2) interactionTrend = 'increasing'
        else if (recentAvg < olderAvg * 0.8) interactionTrend = 'decreasing'
      }
    }

    // 计算健康度因素
    const healthFactors: HealthFactor[] = [
      {
        factor: '互动频率',
        score: Math.max(0, 100 - lastInteractionDays * 3),
        weight: 0.3,
        trend: interactionTrend === 'increasing' ? 'up' : interactionTrend === 'decreasing' ? 'down' : 'stable'
      },
      {
        factor: '关系强度',
        score: this.getStrengthScore(person.relationship.strength),
        weight: 0.2,
        trend: 'stable'
      },
      {
        factor: '信任度',
        score: person.relationship.trustLevel,
        weight: 0.2,
        trend: 'stable'
      },
      {
        factor: '互惠程度',
        score: person.relationship.reciprocity,
        weight: 0.15,
        trend: 'stable'
      },
      {
        factor: '关系质量',
        score: this.getQualityScore(person.relationship.quality),
        weight: 0.15,
        trend: 'stable'
      }
    ]

    // 计算总体健康度
    const healthScore = healthFactors.reduce((sum, f) => sum + f.score * f.weight, 0)
    const healthTrend = healthScore > 70 ? 'improving' : healthScore < 50 ? 'declining' : 'stable'

    // 计算价值分析
    const valueProvided = Math.min(100, interactions.filter(i => i.type === InteractionType.FAVOR).length * 20)
    const valueReceived = Math.min(100, interactions.filter(i => i.sentiment === Sentiment.VERY_POSITIVE).length * 15)
    const valueBalance = valueProvided - valueReceived

    // 评估流失风险
    const churnRisk = Math.min(100, lastInteractionDays * 2 + (100 - healthScore) / 2)
    const riskFactors: string[] = []
    if (lastInteractionDays > 30) riskFactors.push('长时间未联系')
    if (healthScore < 50) riskFactors.push('关系健康度低')
    if (person.relationship.quality === RelationshipQuality.STRAINED) riskFactors.push('关系紧张')

    // 识别机会
    const opportunities: Opportunity[] = []
    if (person.importance === ImportanceLevel.CRITICAL && lastInteractionDays > 7) {
      opportunities.push({
        id: 'opp-1',
        type: 'reach_out',
        description: '重要联系人需要维护',
        potential: 80,
        effort: 20,
        timeframe: '本周'
      })
    }

    // 生成建议
    const recommendations: Recommendation[] = []
    if (lastInteractionDays > 14) {
      recommendations.push({
        id: 'rec-1',
        type: 'action',
        priority: 'high',
        title: '建议联系',
        description: `已经${lastInteractionDays}天未联系${person.name}`,
        suggestedAction: '发送问候消息或安排通话',
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      })
    }

    const analytics: RelationshipAnalytics = {
      personId,
      interactionCount: interactions.length,
      lastInteractionDays,
      averageInteractionInterval: averageInterval,
      interactionTrend,
      healthScore,
      healthTrend,
      healthFactors,
      valueProvided,
      valueReceived,
      valueBalance,
      churnRisk,
      riskFactors,
      opportunities,
      recommendations
    }

    // 缓存结果
    this.analyticsCache.set(personId, {
      ...analytics,
      timestamp: Date.now()
    } as any)

    return analytics
  }

  // 批量分析所有关系
  private async analyzeAllRelationships() {
    const persons = this.getAllPersons()
    for (const person of persons) {
      await this.analyzeRelationship(person.id)
    }
  }

  // 获取关系强度分数
  private getStrengthScore(strength: RelationshipStrength): number {
    const scores = {
      [RelationshipStrength.VERY_CLOSE]: 100,
      [RelationshipStrength.CLOSE]: 80,
      [RelationshipStrength.MODERATE]: 60,
      [RelationshipStrength.WEAK]: 40,
      [RelationshipStrength.VERY_WEAK]: 20
    }
    return scores[strength] || 50
  }

  // 获取关系质量分数
  private getQualityScore(quality: RelationshipQuality): number {
    const scores = {
      [RelationshipQuality.EXCELLENT]: 100,
      [RelationshipQuality.GOOD]: 75,
      [RelationshipQuality.NEUTRAL]: 50,
      [RelationshipQuality.STRAINED]: 25,
      [RelationshipQuality.DIFFICULT]: 0
    }
    return scores[quality] || 50
  }

  // 创建关系策略
  createStrategy(personId: string, strategy: Omit<RelationshipStrategy, 'personId'>): RelationshipStrategy {
    const newStrategy: RelationshipStrategy = {
      personId,
      ...strategy
    }
    
    this.strategies.set(personId, newStrategy)
    return newStrategy
  }

  // 获取关系策略
  getStrategy(personId: string): RelationshipStrategy | undefined {
    return this.strategies.get(personId)
  }

  // 创建群组
  createGroup(group: PersonGroup): PersonGroup {
    this.groups.set(group.id, group)
    return group
  }

  // 添加成员到群组
  addToGroup(groupId: string, personId: string): boolean {
    const group = this.groups.get(groupId)
    if (!group) return false

    if (!group.members.includes(personId)) {
      group.members.push(personId)
    }
    return true
  }

  // 从群组移除成员
  removeFromGroup(groupId: string, personId: string): boolean {
    const group = this.groups.get(groupId)
    if (!group) return false

    const index = group.members.indexOf(personId)
    if (index > -1) {
      group.members.splice(index, 1)
      return true
    }
    return false
  }

  // 获取所有群组
  getAllGroups(): PersonGroup[] {
    return Array.from(this.groups.values())
  }

  // 获取待联系提醒
  getContactReminders(days: number = 7): Array<{person: PersonCard, daysSinceContact: number}> {
    const reminders: Array<{person: PersonCard, daysSinceContact: number}> = []
    const now = Date.now()

    this.persons.forEach(person => {
      if (person.lastContactedAt) {
        const daysSince = Math.floor((now - person.lastContactedAt.getTime()) / (24 * 60 * 60 * 1000))
        
        // 根据联系频率判断是否需要提醒
        const shouldRemind = this.shouldRemindContact(person.relationship.frequency, daysSince)
        
        if (shouldRemind) {
          reminders.push({ person, daysSinceContact: daysSince })
        }
      } else if (person.category === PersonCategory.VIP || person.category === PersonCategory.KEY_CONTACT) {
        // 重要联系人但从未联系过
        reminders.push({ person, daysSinceContact: 999 })
      }
    })

    // 按重要性和天数排序
    reminders.sort((a, b) => {
      const importanceA = this.getImportanceScore(a.person.importance)
      const importanceB = this.getImportanceScore(b.person.importance)
      
      if (importanceA !== importanceB) {
        return importanceB - importanceA
      }
      
      return b.daysSinceContact - a.daysSinceContact
    })

    return reminders
  }

  // 判断是否需要联系提醒
  private shouldRemindContact(frequency: ContactFrequency, daysSince: number): boolean {
    const thresholds = {
      [ContactFrequency.DAILY]: 2,
      [ContactFrequency.WEEKLY]: 10,
      [ContactFrequency.BIWEEKLY]: 20,
      [ContactFrequency.MONTHLY]: 35,
      [ContactFrequency.QUARTERLY]: 100,
      [ContactFrequency.YEARLY]: 380,
      [ContactFrequency.RARELY]: 999
    }
    
    return daysSince >= (thresholds[frequency] || 30)
  }

  // 获取重要性分数
  private getImportanceScore(importance: ImportanceLevel): number {
    const scores = {
      [ImportanceLevel.CRITICAL]: 100,
      [ImportanceLevel.HIGH]: 80,
      [ImportanceLevel.MEDIUM]: 60,
      [ImportanceLevel.LOW]: 40,
      [ImportanceLevel.MINIMAL]: 20
    }
    return scores[importance] || 50
  }

  // 获取即将到来的重要日期
  getUpcomingImportantDates(days: number = 30): Array<{person: PersonCard, date: ImportantDate}> {
    const upcoming: Array<{person: PersonCard, date: ImportantDate}> = []
    const now = new Date()
    const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

    this.persons.forEach(person => {
      person.importantDates.forEach(importantDate => {
        const dateObj = new Date(importantDate.date)
        
        if (importantDate.recurring) {
          // 处理重复日期
          const thisYear = new Date(dateObj)
          thisYear.setFullYear(now.getFullYear())
          
          if (thisYear >= now && thisYear <= cutoff) {
            upcoming.push({ person, date: importantDate })
          }
        } else {
          // 一次性日期
          if (dateObj >= now && dateObj <= cutoff) {
            upcoming.push({ person, date: importantDate })
          }
        }
      })
    })

    // 按日期排序
    upcoming.sort((a, b) => 
      new Date(a.date.date).getTime() - new Date(b.date.date).getTime()
    )

    return upcoming
  }

  // 生成AI洞察
  async generateInsights(personId: string): Promise<string[]> {
    const person = this.persons.get(personId)
    if (!person) return []

    const analytics = await this.analyzeRelationship(personId)
    
    const prompt = `
    基于以下人物信息生成3-5条关系维护洞察：
    - 姓名：${person.name}
    - 关系类型：${person.relationship.type}
    - 上次联系：${analytics.lastInteractionDays}天前
    - 关系健康度：${analytics.healthScore}/100
    - 互动趋势：${analytics.interactionTrend}
    - 兴趣爱好：${person.interests.join(', ')}
    
    请提供具体、可行的建议。
    `

    try {
      const response = await (aiService as any).generateText(prompt)
      return response.split('\n').filter(line => line.trim())
    } catch (error) {
      console.error('Failed to generate insights:', error)
      return []
    }
  }

  // 订阅变化
  subscribe(listener: (persons: PersonCard[]) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners() {
    const persons = this.getAllPersons()
    this.listeners.forEach(listener => listener(persons))
  }

  // 导出数据
  exportData(): string {
    const data = {
      version: '1.0',
      exportDate: new Date(),
      persons: this.getAllPersons(),
      groups: this.getAllGroups()
    }
    return JSON.stringify(data, null, 2)
  }

  // ============ 关系管理模块独特功能 ============
  
  // 获取礼物建议
  async getGiftSuggestions(personId: string, occasion: string, budget?: number): Promise<string[]> {
    const person = this.persons.get(personId)
    if (!person) return []
    
    const giftPrefs = person.giftManagement
    const interests = person.interests || []
    const preferences = person.preferences?.gifts || []
    
    // 基于历史记录和偏好生成建议
    const suggestions: string[] = []
    
    // 检查历史记录中受欢迎的礼物
    if (giftPrefs?.history) {
      const lovedGifts = giftPrefs.history
        .filter(g => g.response === 'loved')
        .map(g => g.item)
      if (lovedGifts.length > 0) {
        suggestions.push(`基于历史偏好：${lovedGifts[0]}类似款`)
      }
    }
    
    // 基于兴趣生成建议
    interests.forEach(interest => {
      const giftMap: Record<string, string[]> = {
        '高尔夫': ['高尔夫球具', '球场会籍', '高尔夫服饰'],
        '红酒': ['精选红酒', '醒酒器', '品酒课程'],
        '科技': ['智能设备', '科技配件', '创新产品'],
        '阅读': ['畅销书籍', '电子阅读器', '书店礼品卡'],
        '音乐': ['音乐会门票', '高品质耳机', '黑胶唱片']
      }
      
      if (giftMap[interest]) {
        suggestions.push(...giftMap[interest])
      }
    })
    
    // 根据预算筛选
    if (budget && giftPrefs?.budget) {
      const budgetKey = occasion.toLowerCase() as keyof typeof giftPrefs.budget
      const recommendedBudget = giftPrefs.budget[budgetKey] || budget
      if (budget < recommendedBudget * 0.5) {
        suggestions.unshift('注意：预算可能偏低，建议提高至' + recommendedBudget)
      }
    }
    
    // 避免不喜欢的礼物
    if (giftPrefs?.preferences?.dislikes) {
      return suggestions.filter(s => 
        !giftPrefs.preferences.dislikes.some(d => s.includes(d))
      )
    }
    
    return suggestions.slice(0, 5) // 返回前5个建议
  }
  
  // 生成会议邀请
  generateMeetingInvitation(personId: string, meetingType: string): string {
    const person = this.persons.get(personId)
    if (!person) return ''
    
    const meetingPrefs = person.meetingPreferences
    const contactPrefs = person.contactPreferences
    
    let template = `尊敬的${person.name}：\n\n`
    
    // 根据沟通风格调整语气
    if (contactPrefs?.communication?.style === 'casual') {
      template = `Hi ${person.name}，\n\n`
    }
    
    // 添加会议信息
    template += `希望能与您安排一次${meetingType}。`
    
    // 考虑会议偏好
    if (meetingPrefs) {
      if (meetingPrefs.location.preferred === 'remote') {
        template += `考虑到您的偏好，建议通过视频会议进行。`
      } else if (meetingPrefs.location.specificVenues?.length) {
        template += `地点可以选择${meetingPrefs.location.specificVenues[0]}。`
      }
      
      template += `\n预计时长${meetingPrefs.duration.preferred}分钟。`
      
      if (meetingPrefs.preparation.needsAgenda) {
        template += `\n会议议程将提前发送给您。`
      }
    }
    
    // 考虑最佳联系时间
    if (contactPrefs?.communication?.bestTime) {
      template += `\n\n根据您的时间安排，建议时间为${contactPrefs.communication.bestTime}。`
    }
    
    template += `\n\n期待您的回复。\n\n此致`
    
    return template
  }
  
  // 生成节日祝福
  generateHolidayGreeting(personId: string, holiday: string): string {
    const person = this.persons.get(personId)
    if (!person) return ''
    
    const style = person.contactPreferences?.communication?.style || 'formal'
    const language = person.contactPreferences?.communication?.language || 'chinese'
    
    let greeting = ''
    
    if (holiday === 'birthday') {
      if (style === 'formal') {
        greeting = `尊敬的${person.name}，\n\n值此您的生日之际，谨致以最诚挚的祝福！祝您身体健康，事业顺利，阖家幸福！`
      } else {
        greeting = `${person.name}，生日快乐！🎂\n\n愿新的一年带给你更多快乐和成功！`
      }
    } else if (holiday === 'newYear') {
      if (language === 'english') {
        greeting = `Dear ${person.name},\n\nWishing you a prosperous and joyful New Year!`
      } else {
        greeting = `${person.name}，\n\n新年快乐！祝您在新的一年里万事如意，财源广进！`
      }
    }
    
    // 添加个性化内容
    if (person.interests?.length) {
      greeting += `\n\n希望您在${person.interests[0]}方面也能收获满满！`
    }
    
    return greeting
  }
  
  // 记录礼物
  recordGift(personId: string, gift: Omit<GiftRecord, 'id'>): boolean {
    const person = this.persons.get(personId)
    if (!person) return false
    
    if (!person.giftManagement) {
      person.giftManagement = {
        preferences: { likes: [], dislikes: [], interests: [] },
        budget: { birthday: 0, holiday: 0, special: 0, business: 0 },
        history: [],
        occasions: { birthday: true, newYear: true, christmas: false, custom: [] }
      }
    }
    
    const giftRecord: GiftRecord = {
      id: `gift-${Date.now()}`,
      ...gift
    }
    
    person.giftManagement.history.push(giftRecord)
    this.notifyListeners()
    return true
  }
  
  // 更新联系偏好
  updateContactPreferences(personId: string, preferences: ContactPreferences): boolean {
    const person = this.persons.get(personId)
    if (!person) return false
    
    person.contactPreferences = preferences
    this.notifyListeners()
    return true
  }
  
  // 更新会议偏好
  updateMeetingPreferences(personId: string, preferences: MeetingPreferences): boolean {
    const person = this.persons.get(personId)
    if (!person) return false
    
    person.meetingPreferences = preferences
    this.notifyListeners()
    return true
  }
  
  // 获取执行秘书任务列表
  getExecutiveAssistantTasks(): Array<{type: string, person: PersonCard, action: string, deadline?: Date}> {
    const tasks: Array<{type: string, person: PersonCard, action: string, deadline?: Date}> = []
    const today = new Date()
    
    this.persons.forEach(person => {
      // 检查生日提醒
      person.importantDates.forEach(date => {
        if (date.type === DateType.BIRTHDAY && date.reminder) {
          const birthday = new Date(date.date)
          birthday.setFullYear(today.getFullYear())
          const daysUntil = Math.floor((birthday.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
          
          if (daysUntil > 0 && daysUntil <= (date.reminderDays || 7)) {
            tasks.push({
              type: 'birthday_reminder',
              person,
              action: `准备生日礼物和祝福（${daysUntil}天后）`,
              deadline: birthday
            })
          }
        }
      })
      
      // 检查定期联系
      if (person.nextContactDate && new Date(person.nextContactDate) <= today) {
        tasks.push({
          type: 'contact_reminder',
          person,
          action: '安排联系或会面',
          deadline: person.nextContactDate
        })
      }
      
      // 检查未完成的跟进
      person.interactions.forEach(interaction => {
        if (interaction.followUp && !interaction.followUp.completed && interaction.followUp.date) {
          if (new Date(interaction.followUp.date) <= today) {
            tasks.push({
              type: 'follow_up',
              person,
              action: interaction.followUp.action,
              deadline: interaction.followUp.date
            })
          }
        }
      })
    })
    
    // 按截止日期排序
    tasks.sort((a, b) => {
      if (!a.deadline) return 1
      if (!b.deadline) return -1
      return a.deadline.getTime() - b.deadline.getTime()
    })
    
    return tasks
  }

  // 导入数据
  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData)
      
      // 导入人物卡
      if (data.persons) {
        data.persons.forEach((person: PersonCard) => {
          this.persons.set(person.id, person)
        })
      }
      
      // 导入群组
      if (data.groups) {
        data.groups.forEach((group: PersonGroup) => {
          this.groups.set(group.id, group)
        })
      }
      
      this.notifyListeners()
      return true
    } catch (error) {
      console.error('Failed to import data:', error)
      return false
    }
  }

  // ============= 从关系管理模块迁移的新功能 =============
  
  // 更新联系偏好（备用方法）
  altUpdateContactPreferences(personId: string, preferences: any): boolean {
    const person = this.persons.get(personId)
    if (!person) return false

    person.contactPreferences = preferences
    person.updatedAt = new Date()
    this.persons.set(personId, person)
    this.notifyListeners()
    return true
  }

  // 更新会议偏好（备用方法）
  altUpdateMeetingPreferences(personId: string, preferences: any): boolean {
    const person = this.persons.get(personId)
    if (!person) return false

    person.meetingPreferences = preferences
    person.updatedAt = new Date()
    this.persons.set(personId, person)
    this.notifyListeners()
    return true
  }

  // 添加礼物记录（简化版本）
  simpleAddGiftRecord(personId: string, gift: any): boolean {
    const person = this.persons.get(personId)
    if (!person) return false

    if (!person.giftManagement) {
      person.giftManagement = {
        preferences: { likes: [], dislikes: [], interests: [] },
        budget: { birthday: 0, holiday: 0, special: 0, business: 0 },
        history: [],
        occasions: { birthday: true, newYear: true, christmas: false, custom: [] }
      }
    }

    const giftRecord = {
      id: `gift-${Date.now()}`,
      date: new Date(),
      ...gift
    }

    person.giftManagement.history.push(giftRecord)
    person.updatedAt = new Date()
    this.persons.set(personId, person)
    this.notifyListeners()
    return true
  }

  // 获取简单礼物建议（基础版本）
  altGetGiftSuggestions(personId: string): string[] {
    const person = this.persons.get(personId)
    if (!person || !person.giftManagement) return []

    const suggestions: string[] = []
    
    // 基于喜好的建议
    if (person.giftManagement.preferences.likes.length > 0) {
      suggestions.push(...person.giftManagement.preferences.likes)
    }
    
    // 基于兴趣的建议
    if (person.interests && person.interests.length > 0) {
      person.interests.forEach(interest => {
        if (interest.includes('读书')) suggestions.push('书籍')
        if (interest.includes('运动')) suggestions.push('运动装备')
        if (interest.includes('音乐')) suggestions.push('音乐相关')
        if (interest.includes('美食')) suggestions.push('美食礼盒')
      })
    }

    // 避免重复和不喜欢的
    const dislikes = person.giftManagement.preferences.dislikes || []
    return Array.from(new Set(suggestions)).filter(s => !dislikes.includes(s))
  }

  // 获取最佳联系时间
  getBestContactTime(personId: string): string {
    const person = this.persons.get(personId)
    if (!person || !person.contactPreferences) return '9:00-18:00'
    
    return person.contactPreferences.communication.bestTime || '9:00-18:00'
  }

  // 检查是否可以联系
  canContactNow(personId: string): boolean {
    const person = this.persons.get(personId)
    if (!person || !person.contactPreferences) return true

    const now = new Date()
    const hour = now.getHours()
    const day = now.getDay()
    
    const prefs = person.contactPreferences
    
    // 检查工作日
    if (prefs.availability?.weekdays && !prefs.availability.weekdays[day]) {
      return false
    }
    
    // 检查边界设置
    if (prefs.boundaries) {
      if (!prefs.boundaries.afterHours && (hour < 9 || hour > 18)) return false
      if (!prefs.boundaries.weekends && (day === 0 || day === 6)) return false
    }
    
    return true
  }

  // 生成会议邀请建议（简化版本）
  simpleMeetingInvite(personId: string): any {
    const person = this.persons.get(personId)
    if (!person) return null

    const prefs = person.meetingPreferences
    if (!prefs) {
      return {
        duration: 30,
        location: 'flexible',
        needsAgenda: true,
        preparationTime: 15
      }
    }

    return {
      duration: prefs.duration.preferred,
      location: prefs.location.preferred,
      needsAgenda: prefs.preparation.needsAgenda,
      preparationTime: prefs.preparation.preparationTime,
      reminderTime: prefs.preparation.reminderTime,
      style: prefs.style
    }
  }

  // 执行秘书功能：自动生成祝福语（备用版本）
  altGenerateGreeting(personId: string, occasion: string): string {
    const person = this.persons.get(personId)
    if (!person) return ''

    const style = person.contactPreferences?.communication.style || 'professional'
    const name = person.name

    const greetings: Record<string, Record<string, string>> = {
      birthday: {
        formal: `尊敬的${name}，祝您生日快乐，身体健康，事业顺利！`,
        casual: `${name}，生日快乐！愿你的每一天都充满阳光和欢笑！`,
        friendly: `亲爱的${name}，生日快乐哦！🎂 愿你年年有今日，岁岁有今朝！`,
        professional: `${name}先生/女士，值此生日之际，祝您生日快乐，万事如意！`
      },
      newYear: {
        formal: `尊敬的${name}，新年快乐！祝您在新的一年里身体健康，工作顺利，阖家幸福！`,
        casual: `${name}，新年快乐！新的一年，新的开始，愿一切都好！`,
        friendly: `${name}，新年快乐呀！🎊 愿新的一年带给你更多的快乐和成功！`,
        professional: `${name}先生/女士，恭贺新年！祝您新年事业蒸蒸日上，家庭幸福美满！`
      }
    }

    return greetings[occasion]?.[style] || `祝${name}${occasion}快乐！`
  }
}

// 导出单例
export const personCardService = PersonCardService.getInstance()
export default PersonCardService