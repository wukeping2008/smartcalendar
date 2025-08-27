import { 
  PanelType, 
  PanelPriority, 
  SmartPriorityConfig 
} from '../../types/floating-panel';

// 默认智能优先级配置
export const DEFAULT_SMART_PRIORITY_CONFIG: SmartPriorityConfig = {
  morningPanels: [
    PanelType.CALENDAR,      // 查看今日计划
    PanelType.AI_ASSISTANT,  // 获取AI建议
    PanelType.INBOX,         // 处理待办事项
    PanelType.TIME_BUDGET    // 规划时间预算
  ],
  afternoonPanels: [
    PanelType.MARKET_STATUS, // 市场动态监控
    PanelType.TIME_FLOW,     // 时间流管理
    PanelType.AI_ASSISTANT,  // AI辅助决策
    PanelType.PERSON_CARD    // 人脉CRM
  ],
  eveningPanels: [
    PanelType.TIME_BUDGET,   // 回顾时间使用
    PanelType.CALENDAR,      // 规划明日计划
    PanelType.AI_ASSISTANT,  // AI总结建议
    PanelType.VOICE_INPUT    // 语音记录想法
  ],
  nightPanels: [
    PanelType.VOICE_INPUT,   // 快速语音记录
    PanelType.INBOX,         // 整理想法
    PanelType.AI_ASSISTANT,  // AI助手
    PanelType.TIME_FLOW      // 放松模式
  ]
};

// 时间段枚举
export enum TimeSlot {
  MORNING = 'morning',   // 9:00-12:00
  AFTERNOON = 'afternoon', // 12:00-18:00
  EVENING = 'evening',   // 18:00-22:00
  NIGHT = 'night'        // 22:00-9:00
}

/**
 * 获取当前时间段
 */
export function getCurrentTimeSlot(): TimeSlot {
  const hour = new Date().getHours();
  
  if (hour >= 9 && hour < 12) {
    return TimeSlot.MORNING;
  } else if (hour >= 12 && hour < 18) {
    return TimeSlot.AFTERNOON;
  } else if (hour >= 18 && hour < 22) {
    return TimeSlot.EVENING;
  } else {
    return TimeSlot.NIGHT;
  }
}

/**
 * 获取面板在当前时间段的智能优先级
 */
export function getSmartPriority(
  panelType: PanelType, 
  config: SmartPriorityConfig = DEFAULT_SMART_PRIORITY_CONFIG
): PanelPriority {
  const timeSlot = getCurrentTimeSlot();
  let relevantPanels: PanelType[] = [];

  switch (timeSlot) {
    case TimeSlot.MORNING:
      relevantPanels = config.morningPanels;
      break;
    case TimeSlot.AFTERNOON:
      relevantPanels = config.afternoonPanels;
      break;
    case TimeSlot.EVENING:
      relevantPanels = config.eveningPanels;
      break;
    case TimeSlot.NIGHT:
      relevantPanels = config.nightPanels;
      break;
  }

  const index = relevantPanels.indexOf(panelType);
  
  if (index === -1) {
    return PanelPriority.LOW;
  } else if (index === 0) {
    return PanelPriority.CRITICAL;
  } else if (index === 1) {
    return PanelPriority.HIGH;
  } else if (index === 2) {
    return PanelPriority.MEDIUM;
  } else {
    return PanelPriority.LOW;
  }
}

/**
 * 获取当前时间段的推荐面板列表（按优先级排序）
 */
export function getRecommendedPanels(
  config: SmartPriorityConfig = DEFAULT_SMART_PRIORITY_CONFIG
): PanelType[] {
  const timeSlot = getCurrentTimeSlot();
  
  switch (timeSlot) {
    case TimeSlot.MORNING:
      return [...config.morningPanels];
    case TimeSlot.AFTERNOON:
      return [...config.afternoonPanels];
    case TimeSlot.EVENING:
      return [...config.eveningPanels];
    case TimeSlot.NIGHT:
      return [...config.nightPanels];
    default:
      return [];
  }
}

/**
 * 根据用户行为模式动态调整优先级
 */
export function adjustPriorityByUsage(
  panelType: PanelType,
  basePriority: PanelPriority,
  usageData: {
    lastUsedTime?: number;
    usageFrequency: number; // 0-1之间的使用频率
    averageSessionTime: number; // 平均使用时长（分钟）
  }
): PanelPriority {
  const now = Date.now();
  const recentUsageBonus = usageData.lastUsedTime && 
    (now - usageData.lastUsedTime) < 30 * 60 * 1000 ? 1 : 0; // 30分钟内使用过

  const frequencyBonus = usageData.usageFrequency > 0.7 ? 1 : 
                        usageData.usageFrequency > 0.4 ? 0.5 : 0;

  const sessionBonus = usageData.averageSessionTime > 10 ? 1 : 
                      usageData.averageSessionTime > 5 ? 0.5 : 0;

  const totalBonus = recentUsageBonus + frequencyBonus + sessionBonus;
  const adjustedPriority = Math.min(
    PanelPriority.CRITICAL, 
    basePriority + Math.floor(totalBonus)
  );

  return adjustedPriority;
}

/**
 * 获取特殊情况下的优先级调整
 */
export function getContextualPriority(
  panelType: PanelType,
  context: {
    hasUnreadInbox?: boolean;
    marketVolatile?: boolean;
    hasUpcomingEvents?: boolean;
    voiceInputActive?: boolean;
    aiTaskRunning?: boolean;
  }
): PanelPriority {
  let bonus = 0;

  switch (panelType) {
    case PanelType.INBOX:
      if (context.hasUnreadInbox) bonus += 2;
      break;
    case PanelType.MARKET_STATUS:
      if (context.marketVolatile) bonus += 2;
      break;
    case PanelType.CALENDAR:
      if (context.hasUpcomingEvents) bonus += 1;
      break;
    case PanelType.VOICE_INPUT:
      if (context.voiceInputActive) bonus += 3; // 最高优先级
      break;
    case PanelType.AI_ASSISTANT:
      if (context.aiTaskRunning) bonus += 2;
      break;
  }

  return Math.min(PanelPriority.CRITICAL, bonus) as PanelPriority;
}

/**
 * 综合计算面板的最终优先级
 */
export function calculateFinalPriority(
  panelType: PanelType,
  options: {
    config?: SmartPriorityConfig;
    usageData?: {
      lastUsedTime?: number;
      usageFrequency: number;
      averageSessionTime: number;
    };
    context?: {
      hasUnreadInbox?: boolean;
      marketVolatile?: boolean;
      hasUpcomingEvents?: boolean;
      voiceInputActive?: boolean;
      aiTaskRunning?: boolean;
    };
    enableSmartPriority?: boolean;
  } = {}
): PanelPriority {
  const {
    config = DEFAULT_SMART_PRIORITY_CONFIG,
    usageData,
    context = {},
    enableSmartPriority = true
  } = options;

  // 基础智能优先级
  let basePriority = enableSmartPriority 
    ? getSmartPriority(panelType, config)
    : PanelPriority.MEDIUM;

  // 基于使用习惯的调整
  if (usageData) {
    basePriority = adjustPriorityByUsage(panelType, basePriority, usageData);
  }

  // 基于上下文的调整
  const contextualPriority = getContextualPriority(panelType, context);

  // 取最高优先级
  return Math.max(basePriority, contextualPriority) as PanelPriority;
}

/**
 * 获取优先级对应的视觉样式配置
 */
export function getPriorityStyles(priority: PanelPriority): {
  iconClassName: string;
  badgeClassName: string;
  glowEffect: boolean;
  animationIntensity: 'none' | 'subtle' | 'moderate' | 'strong';
} {
  switch (priority) {
    case PanelPriority.CRITICAL:
      return {
        iconClassName: 'text-red-400 bg-red-950/30 border-red-700',
        badgeClassName: 'bg-red-600 text-white',
        glowEffect: true,
        animationIntensity: 'strong'
      };
    case PanelPriority.HIGH:
      return {
        iconClassName: 'text-orange-400 bg-orange-950/30 border-orange-700',
        badgeClassName: 'bg-orange-600 text-white',
        glowEffect: true,
        animationIntensity: 'moderate'
      };
    case PanelPriority.MEDIUM:
      return {
        iconClassName: 'text-blue-400 bg-blue-950/30 border-blue-700',
        badgeClassName: 'bg-blue-600 text-white',
        glowEffect: false,
        animationIntensity: 'subtle'
      };
    case PanelPriority.LOW:
    default:
      return {
        iconClassName: 'text-gray-400 bg-gray-800/50 border-gray-700',
        badgeClassName: 'bg-gray-600 text-white',
        glowEffect: false,
        animationIntensity: 'none'
      };
  }
}

/**
 * 获取时间段的友好显示名称
 */
export function getTimeSlotDisplayName(timeSlot: TimeSlot): string {
  switch (timeSlot) {
    case TimeSlot.MORNING:
      return '上午时段';
    case TimeSlot.AFTERNOON:
      return '下午时段';
    case TimeSlot.EVENING:
      return '晚上时段';
    case TimeSlot.NIGHT:
      return '夜间时段';
    default:
      return '未知时段';
  }
}