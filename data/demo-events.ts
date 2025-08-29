import { EventCategory, Priority, EventStatus, EnergyLevel, ReminderType } from '../types/event'

export function getDemoEvents(baseDate: Date) {
  const today = new Date(baseDate)
  today.setHours(0, 0, 0, 0)
  
  const events = []
  
  // === 今日日程 (周一示例) ===
  
  // 早晨例程
  events.push({
    title: '晨间复盘',
    description: '回顾昨日，规划今日重点',
    startTime: new Date(today.getTime() + 8 * 60 * 60 * 1000), // 8:00
    endTime: new Date(today.getTime() + 8 * 60 * 60 * 1000 + 30 * 60 * 1000), // 8:30
    category: EventCategory.LIFE_ROUTINE,
    priority: Priority.HIGH,
    status: EventStatus.COMPLETED,
    position: { x: -2, y: 0, z: 0 },
    size: { width: 200, height: 80, depth: 20 },
    color: '#059669',
    opacity: 0.8,
    isSelected: false,
    isDragging: false,
    isHovered: false,
    isConflicted: false,
    energyRequired: EnergyLevel.MEDIUM,
    estimatedDuration: 30,
    isMarketProtected: false,
    flexibilityScore: 20,
    tags: ['每日', '复盘'],
    reminders: []
  })
  
  // 上午工作
  events.push({
    title: '团队晨会',
    description: '项目进度同步，问题讨论',
    startTime: new Date(today.getTime() + 9 * 60 * 60 * 1000), // 9:00
    endTime: new Date(today.getTime() + 9 * 60 * 60 * 1000 + 30 * 60 * 1000), // 9:30
    category: EventCategory.MEETING,
    priority: Priority.HIGH,
    status: EventStatus.COMPLETED,
    position: { x: -1, y: 0, z: 0 },
    size: { width: 200, height: 80, depth: 20 },
    color: '#f59e0b',
    opacity: 0.8,
    isSelected: false,
    isDragging: false,
    isHovered: false,
    isConflicted: false,
    energyRequired: EnergyLevel.MEDIUM,
    estimatedDuration: 30,
    isMarketProtected: false,
    flexibilityScore: 10,
    tags: ['会议', '团队'],
    reminders: []
  })
  
  events.push({
    title: '深度工作：核心开发',
    description: '专注时间，完成重要功能开发',
    startTime: new Date(today.getTime() + 9 * 60 * 60 * 1000 + 45 * 60 * 1000), // 9:45
    endTime: new Date(today.getTime() + 12 * 60 * 60 * 1000), // 12:00
    category: EventCategory.WORK,
    priority: Priority.URGENT,
    status: EventStatus.IN_PROGRESS,
    position: { x: 0, y: 0, z: 0 },
    size: { width: 200, height: 80, depth: 20 },
    color: '#3b82f6',
    opacity: 0.8,
    isSelected: false,
    isDragging: false,
    isHovered: false,
    isConflicted: false,
    energyRequired: EnergyLevel.PEAK,
    estimatedDuration: 135,
    isMarketProtected: false,
    flexibilityScore: 5,
    tags: ['专注', '开发', '核心'],
    reminders: []
  })
  
  // 午间
  events.push({
    title: '午餐 & 休息',
    description: '补充能量，适当放松',
    startTime: new Date(today.getTime() + 12 * 60 * 60 * 1000), // 12:00
    endTime: new Date(today.getTime() + 13 * 60 * 60 * 1000), // 13:00
    category: EventCategory.MEAL,
    priority: Priority.MEDIUM,
    status: EventStatus.PLANNED,
    position: { x: 1, y: 0, z: 0 },
    size: { width: 200, height: 80, depth: 20 },
    color: '#f97316',
    opacity: 0.8,
    isSelected: false,
    isDragging: false,
    isHovered: false,
    isConflicted: false,
    energyRequired: EnergyLevel.LOW,
    estimatedDuration: 60,
    isMarketProtected: false,
    flexibilityScore: 60,
    tags: ['休息', '午餐'],
    reminders: []
  })
  
  // 下午工作
  events.push({
    title: '邮件处理',
    description: '统一回复邮件和消息',
    startTime: new Date(today.getTime() + 13 * 60 * 60 * 1000), // 13:00
    endTime: new Date(today.getTime() + 13 * 60 * 60 * 1000 + 30 * 60 * 1000), // 13:30
    category: EventCategory.WORK,
    priority: Priority.MEDIUM,
    status: EventStatus.PLANNED,
    position: { x: -1, y: 1, z: 0 },
    size: { width: 200, height: 80, depth: 20 },
    color: '#3b82f6',
    opacity: 0.8,
    isSelected: false,
    isDragging: false,
    isHovered: false,
    isConflicted: false,
    energyRequired: EnergyLevel.LOW,
    estimatedDuration: 30,
    isMarketProtected: false,
    flexibilityScore: 70,
    tags: ['沟通', '邮件'],
    reminders: []
  })
  
  events.push({
    title: '客户会议',
    description: '产品演示与需求讨论',
    startTime: new Date(today.getTime() + 14 * 60 * 60 * 1000), // 14:00
    endTime: new Date(today.getTime() + 15 * 60 * 60 * 1000), // 15:00
    category: EventCategory.MEETING,
    priority: Priority.HIGH,
    status: EventStatus.PLANNED,
    position: { x: 0, y: 1, z: 0 },
    size: { width: 200, height: 80, depth: 20 },
    color: '#f59e0b',
    opacity: 0.8,
    isSelected: false,
    isDragging: false,
    isHovered: false,
    isConflicted: false,
    energyRequired: EnergyLevel.HIGH,
    estimatedDuration: 60,
    isMarketProtected: false,
    flexibilityScore: 0,
    tags: ['客户', '重要'],
    reminders: [
      {
        id: 'client-15m',
        eventId: '',
        type: ReminderType.NOTIFICATION,
        time: new Date(today.getTime() + 13 * 60 * 60 * 1000 + 45 * 60 * 1000),
        message: '客户会议15分钟后开始',
        isTriggered: false
      }
    ]
  })
  
  events.push({
    title: '代码审查',
    description: '团队代码互审，提升质量',
    startTime: new Date(today.getTime() + 15 * 60 * 60 * 1000 + 30 * 60 * 1000), // 15:30
    endTime: new Date(today.getTime() + 16 * 60 * 60 * 1000 + 30 * 60 * 1000), // 16:30
    category: EventCategory.WORK,
    priority: Priority.MEDIUM,
    status: EventStatus.PLANNED,
    position: { x: 1, y: 1, z: 0 },
    size: { width: 200, height: 80, depth: 20 },
    color: '#3b82f6',
    opacity: 0.8,
    isSelected: false,
    isDragging: false,
    isHovered: false,
    isConflicted: false,
    energyRequired: EnergyLevel.MEDIUM,
    estimatedDuration: 60,
    isMarketProtected: false,
    flexibilityScore: 40,
    tags: ['技术', '协作'],
    reminders: []
  })
  
  events.push({
    title: '项目文档更新',
    description: '整理并更新项目文档',
    startTime: new Date(today.getTime() + 16 * 60 * 60 * 1000 + 30 * 60 * 1000), // 16:30
    endTime: new Date(today.getTime() + 17 * 60 * 60 * 1000 + 30 * 60 * 1000), // 17:30
    category: EventCategory.WORK,
    priority: Priority.LOW,
    status: EventStatus.PLANNED,
    position: { x: -2, y: 1, z: 0 },
    size: { width: 200, height: 80, depth: 20 },
    color: '#3b82f6',
    opacity: 0.8,
    isSelected: false,
    isDragging: false,
    isHovered: false,
    isConflicted: false,
    energyRequired: EnergyLevel.LOW,
    estimatedDuration: 60,
    isMarketProtected: false,
    flexibilityScore: 80,
    tags: ['文档', '整理'],
    reminders: []
  })
  
  // 晚间
  events.push({
    title: '健身锻炼',
    description: '保持身体健康，释放压力',
    startTime: new Date(today.getTime() + 18 * 60 * 60 * 1000), // 18:00
    endTime: new Date(today.getTime() + 19 * 60 * 60 * 1000), // 19:00
    category: EventCategory.EXERCISE,
    priority: Priority.MEDIUM,
    status: EventStatus.PLANNED,
    position: { x: 2, y: 0, z: 0 },
    size: { width: 200, height: 80, depth: 20 },
    color: '#ef4444',
    opacity: 0.8,
    isSelected: false,
    isDragging: false,
    isHovered: false,
    isConflicted: false,
    energyRequired: EnergyLevel.HIGH,
    estimatedDuration: 60,
    isMarketProtected: false,
    flexibilityScore: 50,
    tags: ['健康', '运动'],
    reminders: []
  })
  
  events.push({
    title: '晚餐',
    description: '健康晚餐',
    startTime: new Date(today.getTime() + 19 * 60 * 60 * 1000 + 30 * 60 * 1000), // 19:30
    endTime: new Date(today.getTime() + 20 * 60 * 60 * 1000 + 30 * 60 * 1000), // 20:30
    category: EventCategory.MEAL,
    priority: Priority.MEDIUM,
    status: EventStatus.PLANNED,
    position: { x: 1, y: 2, z: 0 },
    size: { width: 200, height: 80, depth: 20 },
    color: '#f97316',
    opacity: 0.8,
    isSelected: false,
    isDragging: false,
    isHovered: false,
    isConflicted: false,
    energyRequired: EnergyLevel.LOW,
    estimatedDuration: 60,
    isMarketProtected: false,
    flexibilityScore: 70,
    tags: ['用餐', '晚间'],
    reminders: []
  })
  
  events.push({
    title: '个人学习',
    description: '技术学习或阅读',
    startTime: new Date(today.getTime() + 21 * 60 * 60 * 1000), // 21:00
    endTime: new Date(today.getTime() + 22 * 60 * 60 * 1000), // 22:00
    category: EventCategory.PERSONAL,
    priority: Priority.LOW,
    status: EventStatus.PLANNED,
    position: { x: 0, y: 2, z: 0 },
    size: { width: 200, height: 80, depth: 20 },
    color: '#10b981',
    opacity: 0.8,
    isSelected: false,
    isDragging: false,
    isHovered: false,
    isConflicted: false,
    energyRequired: EnergyLevel.MEDIUM,
    estimatedDuration: 60,
    isMarketProtected: false,
    flexibilityScore: 90,
    tags: ['学习', '成长'],
    reminders: []
  })
  
  // === 明日重要安排 (周二) ===
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
  
  events.push({
    title: '产品规划会议',
    description: '下周版本迭代计划',
    startTime: new Date(tomorrow.getTime() + 10 * 60 * 60 * 1000), // 明天10:00
    endTime: new Date(tomorrow.getTime() + 11 * 60 * 60 * 1000 + 30 * 60 * 1000), // 11:30
    category: EventCategory.MEETING,
    priority: Priority.HIGH,
    status: EventStatus.PLANNED,
    position: { x: 0, y: 3, z: 1 },
    size: { width: 200, height: 80, depth: 20 },
    color: '#f59e0b',
    opacity: 0.8,
    isSelected: false,
    isDragging: false,
    isHovered: false,
    isConflicted: false,
    energyRequired: EnergyLevel.HIGH,
    estimatedDuration: 90,
    isMarketProtected: false,
    flexibilityScore: 10,
    tags: ['规划', '重要'],
    reminders: []
  })
  
  events.push({
    title: '技术分享会',
    description: '新技术栈介绍与讨论',
    startTime: new Date(tomorrow.getTime() + 14 * 60 * 60 * 1000), // 明天14:00
    endTime: new Date(tomorrow.getTime() + 15 * 60 * 60 * 1000), // 15:00
    category: EventCategory.MEETING,
    priority: Priority.MEDIUM,
    status: EventStatus.PLANNED,
    position: { x: 1, y: 3, z: 1 },
    size: { width: 200, height: 80, depth: 20 },
    color: '#f59e0b',
    opacity: 0.8,
    isSelected: false,
    isDragging: false,
    isHovered: false,
    isConflicted: false,
    energyRequired: EnergyLevel.MEDIUM,
    estimatedDuration: 60,
    isMarketProtected: false,
    flexibilityScore: 50,
    tags: ['学习', '分享'],
    reminders: []
  })
  
  // === 本周其他安排 ===
  const wednesday = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000)
  
  events.push({
    title: '季度总结报告',
    description: '准备Q1季度总结材料',
    startTime: new Date(wednesday.getTime() + 9 * 60 * 60 * 1000), // 周三9:00
    endTime: new Date(wednesday.getTime() + 11 * 60 * 60 * 1000), // 11:00
    category: EventCategory.WORK,
    priority: Priority.HIGH,
    status: EventStatus.PLANNED,
    position: { x: -1, y: 4, z: 2 },
    size: { width: 200, height: 80, depth: 20 },
    color: '#3b82f6',
    opacity: 0.8,
    isSelected: false,
    isDragging: false,
    isHovered: false,
    isConflicted: false,
    energyRequired: EnergyLevel.PEAK,
    estimatedDuration: 120,
    isMarketProtected: false,
    flexibilityScore: 20,
    tags: ['报告', '季度'],
    reminders: []
  })
  
  events.push({
    title: '部门聚餐',
    description: '团队建设活动',
    startTime: new Date(wednesday.getTime() + 18 * 60 * 60 * 1000), // 周三18:00
    endTime: new Date(wednesday.getTime() + 20 * 60 * 60 * 1000), // 20:00
    category: EventCategory.PERSONAL,
    priority: Priority.MEDIUM,
    status: EventStatus.PLANNED,
    position: { x: 2, y: 4, z: 2 },
    size: { width: 200, height: 80, depth: 20 },
    color: '#10b981',
    opacity: 0.8,
    isSelected: false,
    isDragging: false,
    isHovered: false,
    isConflicted: false,
    energyRequired: EnergyLevel.LOW,
    estimatedDuration: 120,
    isMarketProtected: false,
    flexibilityScore: 30,
    tags: ['团建', '社交'],
    reminders: []
  })
  
  const thursday = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)
  
  events.push({
    title: '外部培训',
    description: 'AI技术应用培训课程',
    startTime: new Date(thursday.getTime() + 9 * 60 * 60 * 1000), // 周四9:00
    endTime: new Date(thursday.getTime() + 17 * 60 * 60 * 1000), // 17:00
    category: EventCategory.PERSONAL,
    priority: Priority.MEDIUM,
    status: EventStatus.PLANNED,
    position: { x: 0, y: 5, z: 3 },
    size: { width: 200, height: 80, depth: 20 },
    color: '#10b981',
    opacity: 0.8,
    isSelected: false,
    isDragging: false,
    isHovered: false,
    isConflicted: false,
    energyRequired: EnergyLevel.MEDIUM,
    estimatedDuration: 480,
    isMarketProtected: false,
    flexibilityScore: 0,
    tags: ['培训', '全天'],
    reminders: []
  })
  
  const friday = new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000)
  
  events.push({
    title: '周总结会议',
    description: '本周工作总结，下周计划',
    startTime: new Date(friday.getTime() + 16 * 60 * 60 * 1000), // 周五16:00
    endTime: new Date(friday.getTime() + 17 * 60 * 60 * 1000), // 17:00
    category: EventCategory.MEETING,
    priority: Priority.HIGH,
    status: EventStatus.PLANNED,
    position: { x: 1, y: 6, z: 4 },
    size: { width: 200, height: 80, depth: 20 },
    color: '#f59e0b',
    opacity: 0.8,
    isSelected: false,
    isDragging: false,
    isHovered: false,
    isConflicted: false,
    energyRequired: EnergyLevel.MEDIUM,
    estimatedDuration: 60,
    isMarketProtected: false,
    flexibilityScore: 10,
    tags: ['总结', '每周'],
    reminders: []
  })
  
  // === 下周预告 ===
  const nextMonday = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
  
  events.push({
    title: '项目启动会',
    description: '新项目kick-off会议',
    startTime: new Date(nextMonday.getTime() + 9 * 60 * 60 * 1000), // 下周一9:00
    endTime: new Date(nextMonday.getTime() + 12 * 60 * 60 * 1000), // 12:00
    category: EventCategory.MEETING,
    priority: Priority.URGENT,
    status: EventStatus.PLANNED,
    position: { x: 0, y: 7, z: 5 },
    size: { width: 200, height: 80, depth: 20 },
    color: '#f59e0b',
    opacity: 0.8,
    isSelected: false,
    isDragging: false,
    isHovered: false,
    isConflicted: false,
    energyRequired: EnergyLevel.PEAK,
    estimatedDuration: 180,
    isMarketProtected: false,
    flexibilityScore: 0,
    tags: ['重要', '新项目'],
    reminders: []
  })
  
  return events
}

// 生成一周的演示数据
export function generateWeeklyDemoEvents(startDate: Date = new Date()) {
  return getDemoEvents(startDate)
}

// 生成特定日期的演示数据
export function generateDailyDemoEvents(date: Date) {
  const allEvents = getDemoEvents(date)
  const targetDate = new Date(date)
  targetDate.setHours(0, 0, 0, 0)
  const nextDay = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
  
  return allEvents.filter(event => {
    return event.startTime >= targetDate && event.startTime < nextDay
  })
}