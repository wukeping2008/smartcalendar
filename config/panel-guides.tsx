/**
 * 所有浮动面板的功能指南配置
 * 统一管理所有面板的帮助内容
 */

import React from 'react'
import { 
  Bot, 
  TrendingUp, 
  Mic, 
  Clock, 
  FileText, 
  GitBranch, 
  Users, 
  Train, 
  Inbox,
  Zap,
  Brain,
  Shield,
  Calculator,
  Target,
  Heart,
  Gift,
  Calendar,
  Activity
} from 'lucide-react'
import { PanelType } from '../types/floating-panel'
import type { GuideSection } from '../components/ui/panel-guide'

export interface PanelGuideConfig {
  title: string
  description: string
  sections: GuideSection[]
  shortcuts?: { key: string; action: string }[]
  tips?: string[]
}

export const PANEL_GUIDES: Record<PanelType, PanelGuideConfig> = {
  [PanelType.AI_ASSISTANT]: {
    title: 'AI助手',
    description: '基于Claude的智能对话助手，提供决策建议和任务规划',
    sections: [
      {
        title: '核心功能',
        icon: <Bot className="w-4 h-4 text-blue-400" />,
        items: [
          '自然语言对话交互',
          '智能日程安排建议',
          '任务优先级分析',
          '冲突检测与解决'
        ]
      },
      {
        title: '快速命令',
        icon: <Zap className="w-4 h-4 text-yellow-400" />,
        items: [
          '"安排会议" - 智能寻找空闲时间',
          '"今天做什么" - 获取日程建议',
          '"优化日程" - 自动调整安排'
        ]
      }
    ],
    shortcuts: [
      { key: 'Alt+1', action: '打开AI助手' },
      { key: 'Enter', action: '发送消息' },
      { key: 'Shift+Enter', action: '换行' }
    ],
    tips: [
      '可以直接粘贴邮件内容让AI提取日程',
      'AI会记住对话上下文，可以连续提问'
    ]
  },

  [PanelType.MARKET_STATUS]: {
    title: '市场状态',
    description: '实时监控市场数据，把握交易机会',
    sections: [
      {
        title: '市场监控',
        icon: <TrendingUp className="w-4 h-4 text-green-400" />,
        items: [
          '10种核心资产实时价格',
          '市场开闭状态提醒',
          '价格变动警报',
          'WebSocket实时推送'
        ]
      },
      {
        title: '交易时段',
        items: [
          '亚洲时段: 9:00-17:00',
          '欧洲时段: 15:00-23:00',
          '美国时段: 21:30-4:00'
        ]
      }
    ],
    shortcuts: [
      { key: 'Alt+3', action: '打开市场面板' },
      { key: 'R', action: '刷新数据' }
    ],
    tips: [
      '绿色背景表示市场开市中',
      '设置价格警报避免错过机会'
    ]
  },

  [PanelType.VOICE_INPUT]: {
    title: '语音输入',
    description: '使用语音快速创建事件和任务',
    sections: [
      {
        title: '语音命令',
        icon: <Mic className="w-4 h-4 text-purple-400" />,
        items: [
          '说"创建事件"开始',
          '自然语言描述时间',
          '支持中英文识别',
          '自动提取关键信息'
        ]
      },
      {
        title: '示例命令',
        items: [
          '"明天下午3点开会"',
          '"提醒我晚上8点健身"',
          '"下周一提交报告"'
        ]
      }
    ],
    shortcuts: [
      { key: 'Alt+5', action: '开始录音' },
      { key: 'Space', action: '暂停/继续' },
      { key: 'Enter', action: '确认创建' }
    ]
  },

  [PanelType.TIME_BUDGET]: {
    title: '时间预算',
    description: '管理时间分配，追踪效率指标',
    sections: [
      {
        title: '预算管理',
        icon: <Clock className="w-4 h-4 text-blue-400" />,
        items: [
          '分类时间预算设置',
          '实际vs预算对比',
          '效率趋势分析',
          '时间银行积分系统'
        ]
      },
      {
        title: '智能分析',
        items: [
          '自动识别时间黑洞',
          '优化建议生成',
          '专注时段识别'
        ]
      }
    ],
    shortcuts: [
      { key: 'Alt+7', action: '打开时间预算' }
    ],
    tips: [
      '每周回顾时间分配情况',
      '设置合理的预算避免过载'
    ]
  },

  [PanelType.DAILY_BRIEFING]: {
    title: '每日简报',
    description: 'AI生成的个性化每日洞察和建议',
    sections: [
      {
        title: '简报内容',
        icon: <FileText className="w-4 h-4 text-cyan-400" />,
        items: [
          '今日重点任务',
          '市场机会提醒',
          '效率优化建议',
          '人脉维护提醒'
        ]
      },
      {
        title: '智能分析',
        items: [
          '基于历史数据预测',
          '个性化优先级排序',
          '风险预警提示'
        ]
      }
    ],
    shortcuts: [
      { key: 'Alt+9', action: '查看简报' }
    ],
    tips: [
      '早晨第一时间查看简报',
      '可以自定义简报重点'
    ]
  },

  [PanelType.WHAT_IF]: {
    title: 'What-If模拟器',
    description: '模拟决策影响，预测可能结果',
    sections: [
      {
        title: '场景模拟',
        icon: <GitBranch className="w-4 h-4 text-purple-400" />,
        items: [
          '创建多个决策分支',
          '影响范围可视化',
          '概率分析计算',
          '时间线对比'
        ]
      },
      {
        title: '决策支持',
        items: [
          'ROI自动计算',
          '风险评估矩阵',
          '最优路径推荐'
        ]
      }
    ],
    shortcuts: [
      { key: 'Alt+0', action: '打开模拟器' },
      { key: 'Ctrl+N', action: '新建场景' }
    ],
    tips: [
      '重大决策前先模拟',
      '保存常用场景模板'
    ]
  },

  [PanelType.PERSON_CARD]: {
    title: '人脉CRM',
    description: '智能管理人际关系，维护重要联系',
    sections: [
      {
        title: '关系管理',
        icon: <Users className="w-4 h-4 text-pink-400" />,
        items: [
          '联系人智能分类',
          '互动历史追踪',
          '关系强度分析',
          '定期联系提醒'
        ]
      },
      {
        title: '贴心功能',
        icon: <Gift className="w-4 h-4 text-red-400" />,
        items: [
          '生日提醒',
          '礼物推荐',
          '话题建议',
          '社交策略'
        ]
      }
    ],
    shortcuts: [
      { key: 'Alt+8', action: '打开人脉管理' },
      { key: 'Ctrl+F', action: '搜索联系人' }
    ],
    tips: [
      '定期更新联系人信息',
      '记录每次互动要点',
      '设置VIP标记重要人物'
    ]
  },

  [PanelType.COMMUTE_PLANNER]: {
    title: '通勤规划',
    description: '优化通勤时间，充分利用碎片时间',
    sections: [
      {
        title: '通勤优化',
        icon: <Train className="w-4 h-4 text-blue-400" />,
        items: [
          '路线时间预测',
          '碎片时间任务匹配',
          '音频内容推荐',
          '通勤模式切换'
        ]
      }
    ],
    shortcuts: [
      { key: 'Ctrl+T', action: '打开通勤规划' }
    ],
    tips: [
      '设置常用路线',
      '下载离线内容'
    ]
  },

  [PanelType.GTD_INBOX]: {
    title: 'GTD收集箱',
    description: '快速收集想法，智能分类处理',
    sections: [
      {
        title: 'GTD流程',
        icon: <Inbox className="w-4 h-4 text-orange-400" />,
        items: [
          '快速捕获想法',
          '智能分类识别',
          '2分钟规则执行',
          '下一步行动生成'
        ]
      },
      {
        title: '处理原则',
        items: [
          '可执行→立即执行/委派',
          '不可执行→归档/删除',
          '需要时间→安排日程',
          '等待他人→跟进清单'
        ]
      }
    ],
    shortcuts: [
      { key: 'Alt+G', action: '打开GTD' },
      { key: 'Ctrl+Enter', action: '快速添加' }
    ],
    tips: [
      '每天清空收集箱',
      '保持收集箱简洁'
    ]
  },

  [PanelType.TRADING_FOCUS]: {
    title: 'Trading专注模式',
    description: '1分钟决策系统，屏蔽一切干扰',
    sections: [
      {
        title: '专注功能',
        icon: <Zap className="w-4 h-4 text-green-400" />,
        items: [
          '60秒决策倒计时',
          '屏蔽所有通知',
          'Watchlist快速扫描',
          '决策记录系统'
        ]
      },
      {
        title: '决策类型',
        icon: <Target className="w-4 h-4 text-red-400" />,
        items: [
          'BUY - 买入信号',
          'SELL - 卖出信号',
          'HOLD - 持有观望',
          'WATCH - 加入观察'
        ]
      }
    ],
    shortcuts: [
      { key: 'Alt+T', action: '进入Trading模式' },
      { key: '1-4', action: '快速决策' },
      { key: 'Space', action: '暂停计时' }
    ],
    tips: [
      '交易时段自动激活',
      '决策必须在60秒内完成',
      '每个决策都会被记录分析'
    ]
  },

  [PanelType.COGNITIVE_MANAGEMENT]: {
    title: '认知管理',
    description: '保护认知带宽，避免过载',
    sections: [
      {
        title: '带宽监控',
        icon: <Brain className="w-4 h-4 text-purple-400" />,
        items: [
          '实时负载监控',
          '7项上限管理',
          '48小时自动归档',
          '过载预警系统'
        ]
      },
      {
        title: '智能拒绝',
        icon: <Shield className="w-4 h-4 text-blue-400" />,
        items: [
          '请求类型识别',
          '拒绝模板库',
          'ROI自动计算',
          '边界保护策略'
        ]
      }
    ],
    shortcuts: [
      { key: 'Alt+C', action: '打开认知管理' },
      { key: 'Alt+R', action: '快速拒绝' }
    ],
    tips: [
      '认知带宽基于海马体研究',
      '每天清理低优先级承诺',
      'Trading时间拒绝一切新承诺'
    ]
  },

  // 添加缺失的面板配置
  [PanelType.CALENDAR]: {
    title: '传统日历',
    description: '传统月视图日历界面',
    sections: [
      {
        title: '日历功能',
        icon: <Calendar className="w-4 h-4 text-blue-400" />,
        items: [
          '月视图显示',
          '事件快速创建',
          '拖拽调整时间'
        ]
      }
    ],
    shortcuts: [
      { key: 'Alt+C', action: '切换到日历视图' }
    ]
  },

  [PanelType.TIME_FLOW]: {
    title: '3D时间流',
    description: '创新的3D时间轴可视化',
    sections: [
      {
        title: '3D交互',
        icon: <Activity className="w-4 h-4 text-purple-400" />,
        items: [
          '时间轴3D导航',
          '事件立体显示',
          '时间流动效果'
        ]
      }
    ],
    shortcuts: [
      { key: 'Alt+F', action: '切换到时间流视图' }
    ]
  },

  [PanelType.INBOX]: {
    title: '收件箱',
    description: '快速收集和处理信息',
    sections: [
      {
        title: '收集处理',
        icon: <Inbox className="w-4 h-4 text-green-400" />,
        items: [
          '快速输入',
          '智能分类',
          '批量处理'
        ]
      }
    ],
    shortcuts: [
      { key: 'Alt+I', action: '打开收件箱' }
    ]
  },

  [PanelType.RELATIONSHIPS]: {
    title: '关系管理',
    description: '人际关系网络管理',
    sections: [
      {
        title: '关系网络',
        icon: <Users className="w-4 h-4 text-pink-400" />,
        items: [
          '联系人管理',
          '互动记录',
          '关系强度分析'
        ]
      }
    ],
    shortcuts: [
      { key: 'Alt+R', action: '打开关系管理' }
    ]
  }
}