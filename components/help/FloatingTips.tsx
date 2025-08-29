'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '../../src/components/ui/card'
import { Button } from '../../src/components/ui/button'
import { X, Lightbulb, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react'

interface Tip {
  id: string
  title: string
  content: string
  category: 'beginner' | 'advanced' | 'trading' | 'productivity'
  priority: number
  showOn?: string[] // 特定页面或状态下显示
  icon: string
}

const tips: Tip[] = [
  {
    id: 'drag-rotate-3d',
    title: '3D视图操作技巧',
    content: '在3D时间流视图中，按住鼠标左键拖拽可以旋转视角，滚轮可以缩放。这样能从不同角度查看您的时间安排！',
    category: 'beginner',
    priority: 10,
    showOn: ['flow-view'],
    icon: '🌊'
  },
  {
    id: 'voice-input-power',
    title: '语音输入超能力',
    content: '试试说"明天下午2点开会，提前1小时提醒发材料"，系统会自动创建会议和准备任务，还会设置双重提醒！',
    category: 'productivity',
    priority: 9,
    icon: '🎤'
  },
  {
    id: 'trading-sop',
    title: 'Trading专业流程',
    content: '扫watchlist建议设置在每小时整点，key in数据设置15分钟间隔，这样能保持最佳交易状态。',
    category: 'trading',
    priority: 8,
    showOn: ['trading-mode'],
    icon: '📊'
  },
  {
    id: 'conflict-resolution',
    title: '冲突解决智能化',
    content: '当事件时间重叠时，系统会自动标记冲突并提供调整建议。红色边框就是冲突警告！',
    category: 'advanced',
    priority: 7,
    icon: '⚠️'
  },
  {
    id: 'energy-management',
    title: '精力管理策略',
    content: '根据精力等级安排任务：Peak精力做复杂工作，Low精力处理例行事务。TABATA锻炼能快速恢复精力！',
    category: 'productivity',
    priority: 8,
    icon: '🧠'
  },
  {
    id: 'market-protection',
    title: '市场保护时段',
    content: '开启市场保护的时段会自动避免安排非交易任务，确保您不会错过重要的交易机会。',
    category: 'trading',
    priority: 6,
    icon: '🛡️'
  },
  {
    id: 'view-switching',
    title: '双视图切换技巧',
    content: '规划时用传统日历视图更清晰，执行时用3D时间流更直观。根据场景选择最适合的视图！',
    category: 'beginner',
    priority: 5,
    icon: '🔄'
  },
  {
    id: 'flexibility-score',
    title: '灵活度评分运用',
    content: '灵活度高的任务可以随时调整，灵活度低的任务要提前安排。利用这个特性优化您的时间安排！',
    category: 'advanced',
    priority: 4,
    icon: '🎯'
  }
]

interface FloatingTipsProps {
  currentView?: string
  isVisible?: boolean
}

export default function FloatingTips({ currentView = 'calendar', isVisible = true }: FloatingTipsProps) {
  const [currentTipIndex, setCurrentTipIndex] = useState(0)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [autoRotate, setAutoRotate] = useState(true)

  // 根据当前视图过滤提示
  const relevantTips = tips
    .filter(tip => !tip.showOn || tip.showOn.includes(currentView))
    .sort((a, b) => b.priority - a.priority)

  const currentTip = relevantTips[currentTipIndex] || tips[0]

  // 自动轮换提示
  useEffect(() => {
    if (!autoRotate || isMinimized || isDismissed) return

    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % relevantTips.length)
    }, 8000) // 8秒轮换一次

    return () => clearInterval(interval)
  }, [autoRotate, isMinimized, isDismissed, relevantTips.length])

  // 手动切换提示
  const nextTip = () => {
    setCurrentTipIndex((prev) => (prev + 1) % relevantTips.length)
    setAutoRotate(false) // 手动操作后停止自动轮换
  }

  const prevTip = () => {
    setCurrentTipIndex((prev) => (prev - 1 + relevantTips.length) % relevantTips.length)
    setAutoRotate(false)
  }

  // 获取分类颜色
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'beginner': return 'text-green-400 bg-green-400/10 border-green-400/20'
      case 'advanced': return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
      case 'trading': return 'text-red-400 bg-red-400/10 border-red-400/20'
      case 'productivity': return 'text-purple-400 bg-purple-400/10 border-purple-400/20'
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20'
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'beginner': return '新手入门'
      case 'advanced': return '高级技巧'
      case 'trading': return 'Trading专业'
      case 'productivity': return '效率提升'
      default: return '通用技巧'
    }
  }

  if (!isVisible || isDismissed) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm">
      <Card className={`bg-black/90 backdrop-blur-sm border-cyan-500/30 transition-all duration-300 ${
        isMinimized ? 'p-3' : 'p-4'
      }`}>
        {isMinimized ? (
          /* 最小化状态 */
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Lightbulb className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-300 text-sm font-medium">智能提示</span>
            </div>
            <div className="flex space-x-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsMinimized(false)}
                className="w-6 h-6 p-0 text-cyan-400 hover:bg-cyan-400/10"
              >
                <ChevronUp className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsDismissed(true)}
                className="w-6 h-6 p-0 text-gray-400 hover:bg-red-400/10 hover:text-red-400"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ) : (
          /* 完整状态 */
          <>
            {/* 头部 */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Lightbulb className="w-4 h-4 text-cyan-400" />
                <span className="text-cyan-300 text-sm font-medium">智能提示</span>
                <span className={`text-xs px-2 py-1 rounded-full border ${getCategoryColor(currentTip.category)}`}>
                  {getCategoryLabel(currentTip.category)}
                </span>
              </div>
              <div className="flex space-x-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsMinimized(true)}
                  className="w-6 h-6 p-0 text-cyan-400 hover:bg-cyan-400/10"
                >
                  <ChevronDown className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsDismissed(true)}
                  className="w-6 h-6 p-0 text-gray-400 hover:bg-red-400/10 hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* 提示内容 */}
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-lg">{currentTip.icon}</span>
                <h4 className="text-white font-semibold text-sm">
                  {currentTip.title}
                </h4>
              </div>
              <p className="text-gray-300 text-xs leading-relaxed">
                {currentTip.content}
              </p>
            </div>

            {/* 导航和控制 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={prevTip}
                  className="w-6 h-6 p-0 text-cyan-400 hover:bg-cyan-400/10"
                  disabled={relevantTips.length <= 1}
                >
                  <ArrowRight className="w-3 h-3 rotate-180" />
                </Button>
                <span className="text-xs text-gray-400">
                  {currentTipIndex + 1} / {relevantTips.length}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={nextTip}
                  className="w-6 h-6 p-0 text-cyan-400 hover:bg-cyan-400/10"
                  disabled={relevantTips.length <= 1}
                >
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setAutoRotate(!autoRotate)}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    autoRotate 
                      ? 'text-cyan-300 bg-cyan-400/10 border border-cyan-400/20' 
                      : 'text-gray-400 bg-gray-400/10 border border-gray-400/20'
                  }`}
                >
                  {autoRotate ? '自动' : '手动'}
                </button>
              </div>
            </div>

            {/* 进度指示器 */}
            {relevantTips.length > 1 && (
              <div className="flex space-x-1 mt-3 justify-center">
                {relevantTips.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentTipIndex(index)
                      setAutoRotate(false)
                    }}
                    title={`跳转到提示 ${index + 1}: ${relevantTips[index]?.title || ''}`}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentTipIndex 
                        ? 'bg-cyan-500' 
                        : 'bg-gray-600 hover:bg-gray-500'
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </Card>

      {/* 隐藏的恢复按钮 */}
      {isDismissed && (
        <div className="absolute bottom-0 right-0">
          <Button
            size="sm"
            onClick={() => setIsDismissed(false)}
            className="bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30"
          >
            <Lightbulb className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
