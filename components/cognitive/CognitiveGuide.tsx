/**
 * 认知带宽功能指南组件
 * 提供简洁优雅的功能说明和使用提示
 */

'use client'

import React, { useState } from 'react'
import { Card } from '../../src/components/ui/card'
import { Button } from '../../src/components/ui/button'
import { 
  Brain,
  Zap,
  Shield,
  TrendingUp,
  Archive,
  Info,
  X,
  ChevronRight,
  Lightbulb,
  Target,
  Clock,
  AlertCircle
} from 'lucide-react'

interface CognitiveGuideProps {
  onClose?: () => void
  compact?: boolean
}

export default function CognitiveGuide({ onClose, compact = false }: CognitiveGuideProps) {
  const [currentTip, setCurrentTip] = useState(0)
  
  const quickTips = [
    {
      icon: Brain,
      title: "认知带宽保护",
      content: "基于海马体工作记忆限制，系统只允许3-7个活跃事项，避免认知过载"
    },
    {
      icon: Zap,
      title: "Trading专注模式",
      content: "一键进入专注状态，屏蔽所有干扰，1分钟决策计时，最大化交易效率"
    },
    {
      icon: Shield,
      title: "智能拒绝助手",
      content: "提供4种场景的委婉拒绝模板，保护个人边界，减少人情负担"
    },
    {
      icon: TrendingUp,
      title: "ROI决策支持",
      content: "自动计算活动的机会成本，对比Trading收益率，智能建议接受或拒绝"
    }
  ]

  const detailedGuide = {
    overview: {
      title: "🧠 认知带宽管理",
      description: "保护您最宝贵的认知资源",
      principle: "基于客户理念：认知带宽有限，专注高价值活动，保持边界清晰"
    },
    features: [
      {
        icon: Brain,
        color: "text-blue-500",
        title: "实时负载监控",
        description: "当前认知负载一目了然",
        usage: [
          "绿色(0-3): 认知充足，可接受新任务",
          "黄色(4-5): 接近上限，谨慎添加",
          "橙色(6): 临界状态，建议清理",
          "红色(7+): 过载！立即拒绝新承诺"
        ]
      },
      {
        icon: Zap,
        color: "text-green-500",
        title: "Trading专注模式",
        description: "为交易决策创造最佳环境",
        usage: [
          "点击⚡按钮立即进入",
          "自动归档低优先级事项",
          "只保留野猪老师等关键联系人",
          "60秒决策倒计时提醒"
        ]
      },
      {
        icon: Archive,
        color: "text-orange-500",
        title: "智能归档系统",
        description: "自动管理认知负载",
        usage: [
          "48小时自动过期机制",
          "一键清理非关键承诺",
          "社交客套自动忽略",
          "关键承诺永不遗忘"
        ]
      },
      {
        icon: Shield,
        color: "text-purple-500",
        title: "边界保护工具",
        description: "优雅拒绝，保护认知",
        usage: [
          "拒绝兜底: 资金有既定安排",
          "拒绝保密: 记性不好怕添麻烦",
          "拒绝低ROI: 建议找专业人士",
          "Trading优先: 正在处理重要决策"
        ]
      }
    ],
    shortcuts: [
      { key: "Alt+T", action: "进入/退出Trading模式" },
      { key: "Alt+C", action: "清理非关键承诺" },
      { key: "Alt+R", action: "快速ROI计算" },
      { key: "Esc", action: "关闭所有干扰" }
    ],
    bestPractices: [
      "每天早上查看认知负载，规划当天重点",
      "Trading时间段提前进入专注模式",
      "收到请求先计算ROI，低于阈值直接拒绝",
      "利用智能模板委婉拒绝，节省沟通成本"
    ]
  }

  if (compact) {
    // 紧凑提示模式
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
        <Lightbulb className="w-4 h-4 text-blue-400" />
        <span className="text-xs text-blue-300">
          {quickTips[currentTip].content}
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="h-5 w-5 p-0 text-blue-400 hover:text-blue-300"
          onClick={() => setCurrentTip((currentTip + 1) % quickTips.length)}
        >
          <ChevronRight className="w-3 h-3" />
        </Button>
      </div>
    )
  }

  // 完整指南模式
  return (
    <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700 shadow-2xl">
      {/* 头部 */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl">
              <Brain className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {detailedGuide.overview.title}
              </h2>
              <p className="text-gray-400 mt-1">
                {detailedGuide.overview.description}
              </p>
            </div>
          </div>
          {onClose && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        {/* 核心理念 */}
        <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <p className="text-sm text-blue-300 italic">
            💡 {detailedGuide.overview.principle}
          </p>
        </div>
      </div>

      {/* 功能详解 */}
      <div className="p-6 space-y-6">
        {/* 快速提示轮播 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickTips.map((tip, index) => (
            <div
              key={index}
              className="p-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-blue-500/50 transition-all cursor-pointer"
              onClick={() => setCurrentTip(index)}
            >
              <tip.icon className="w-5 h-5 text-blue-400 mb-2" />
              <h4 className="text-sm font-medium text-white mb-1">
                {tip.title}
              </h4>
              <p className="text-xs text-gray-400 line-clamp-2">
                {tip.content}
              </p>
            </div>
          ))}
        </div>

        {/* 详细功能说明 */}
        <div className="grid md:grid-cols-2 gap-4">
          {detailedGuide.features.map((feature, index) => (
            <div
              key={index}
              className="p-4 bg-gray-800/30 rounded-lg border border-gray-700"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 bg-gray-800 rounded-lg ${feature.color}`}>
                  <feature.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-400 mb-3">
                    {feature.description}
                  </p>
                  <ul className="space-y-1">
                    {feature.usage.map((use, idx) => (
                      <li key={idx} className="text-xs text-gray-500 flex items-start gap-1">
                        <span className="text-gray-600 mt-1">•</span>
                        <span>{use}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 快捷键 */}
        <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-yellow-400" />
            快捷操作
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {detailedGuide.shortcuts.map((shortcut, index) => (
              <div key={index} className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-gray-900 rounded text-xs text-gray-400 border border-gray-700">
                  {shortcut.key}
                </kbd>
                <span className="text-xs text-gray-500">{shortcut.action}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 最佳实践 */}
        <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-400" />
            最佳实践
          </h3>
          <div className="grid md:grid-cols-2 gap-2">
            {detailedGuide.bestPractices.map((practice, index) => (
              <div key={index} className="flex items-start gap-2">
                <Clock className="w-3 h-3 text-blue-400 mt-0.5" />
                <span className="text-xs text-gray-300">{practice}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 警告提示 */}
        <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />
          <div className="text-xs text-red-300">
            <strong>重要提醒：</strong>
            认知带宽是不可再生资源，一旦过载将严重影响决策质量。
            请严格控制活跃承诺数量，优先保障Trading等高价值活动。
          </div>
        </div>
      </div>
    </Card>
  )
}