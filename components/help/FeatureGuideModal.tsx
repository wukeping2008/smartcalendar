/**
 * Feature Guide Modal - v4.0功能指南弹窗
 * 用于向客户演示所有新功能
 */

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, ChevronRight, ChevronLeft, Sparkles, Brain, Layers, Inbox, Clock, Users, TrendingUp, Settings2 } from 'lucide-react'

interface FeatureGuideModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function FeatureGuideModal({ isOpen, onClose }: FeatureGuideModalProps) {
  const [currentPage, setCurrentPage] = useState(0)

  // Handle ESC key to close modal
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const features = [
    {
      title: '🎉 欢迎使用智能日历 v4.0',
      icon: <Sparkles className="h-12 w-12 text-cyan-400" />,
      content: (
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-white mb-4">
            从时间管理到智能生活助手
          </h2>
          <p className="text-gray-300 text-lg leading-relaxed">
            v4.0 全新升级，打造您的专属AI生活管家
          </p>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
              <div className="text-2xl mb-2">🚀</div>
              <h4 className="text-cyan-300 font-semibold">9维度情境感知</h4>
              <p className="text-gray-400 text-sm mt-1">智能理解您的生活状态</p>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
              <div className="text-2xl mb-2">🤖</div>
              <h4 className="text-purple-300 font-semibold">AI智能决策</h4>
              <p className="text-gray-400 text-sm mt-1">实时优化您的时间安排</p>
            </div>
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="text-2xl mb-2">📚</div>
              <h4 className="text-green-300 font-semibold">SOP自动执行</h4>
              <p className="text-gray-400 text-sm mt-1">标准流程智能触发</p>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
              <div className="text-2xl mb-2">💎</div>
              <h4 className="text-orange-300 font-semibold">GTD任务管理</h4>
              <p className="text-gray-400 text-sm mt-1">2分钟规则自动识别</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: '🧠 Context-SOP 情境感知系统',
      icon: <Brain className="h-12 w-12 text-purple-400" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-white">9维度智能感知</h3>
          <p className="text-gray-300">系统实时监控您的生活情境，自动触发相应的SOP流程</p>
          
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <span className="text-cyan-400 text-xl">⏰</span>
              <div>
                <h4 className="text-white font-semibold">时间维度</h4>
                <p className="text-gray-400 text-sm">识别工作时间、休息时间、关键时刻</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-green-400 text-xl">📍</span>
              <div>
                <h4 className="text-white font-semibold">位置维度</h4>
                <p className="text-gray-400 text-sm">办公室、家庭、通勤路上自动切换模式</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-purple-400 text-xl">👥</span>
              <div>
                <h4 className="text-white font-semibold">人物维度</h4>
                <p className="text-gray-400 text-sm">根据会议参与者调整准备策略</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-orange-400 text-xl">💼</span>
              <div>
                <h4 className="text-white font-semibold">任务队列</h4>
                <p className="text-gray-400 text-sm">基于当前任务负载智能调度</p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 mt-4">
            <p className="text-purple-300 text-sm">
              <strong>演示场景：</strong>系统检测到晚上9点，自动提醒执行"睡前15分钟流程"
            </p>
          </div>
        </div>
      )
    },
    {
      title: '📥 收集箱分流系统 + GTD',
      icon: <Inbox className="h-12 w-12 text-green-400" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-white">智能任务分流</h3>
          <p className="text-gray-300">基于GTD方法论，自动分类和处理任务</p>
          
          <div className="bg-gradient-to-r from-green-500/10 to-cyan-500/10 rounded-lg p-4 border border-green-500/30">
            <h4 className="text-green-300 font-bold mb-3">2分钟规则</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-green-400">✓</span>
                <span className="text-white text-sm">2分钟内可完成 → 立即执行</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-cyan-400">→</span>
                <span className="text-white text-sm">需要他人处理 → 委派任务</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-purple-400">📅</span>
                <span className="text-white text-sm">特定时间执行 → 计划安排</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">📚</span>
                <span className="text-white text-sm">参考资料 → 归档保存</span>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
            <h4 className="text-orange-300 font-bold mb-2">机会性调度</h4>
            <p className="text-gray-300 text-sm">
              系统智能识别"时间缝隙"，自动安排小任务填充空闲时间
            </p>
            <div className="mt-2 text-xs text-gray-400">
              例如：会议间隙5分钟 → 自动安排"回复邮件"任务
            </div>
          </div>
          
          <div className="flex items-center justify-between bg-black/30 rounded-lg p-3">
            <span className="text-gray-400 text-sm">语音输入："提醒我明天下午3点开会"</span>
            <span className="text-green-400 text-sm">→ AI自动解析并创建事件</span>
          </div>
        </div>
      )
    },
    {
      title: '📋 SOP管理系统',
      icon: <Layers className="h-12 w-12 text-orange-400" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-white">三种SOP执行模式</h3>
          <p className="text-gray-300">灵活应对不同场景的标准操作流程</p>
          
          <div className="space-y-3">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <h4 className="text-blue-300 font-bold flex items-center">
                ☑️ Checklist 检查清单
              </h4>
              <p className="text-gray-300 text-sm mt-2">适用于需要逐项确认的任务</p>
              <div className="mt-2 space-y-1">
                <div className="text-xs text-gray-400">✓ 睡前流程：穿袜子、戴眼罩、贴口贴...</div>
                <div className="text-xs text-gray-400">✓ 会议准备：议程、材料、设备测试...</div>
              </div>
            </div>
            
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
              <h4 className="text-purple-300 font-bold flex items-center">
                📝 Step-by-Step 分步指导
              </h4>
              <p className="text-gray-300 text-sm mt-2">按顺序执行的详细步骤</p>
              <div className="mt-2 space-y-1">
                <div className="text-xs text-gray-400">1. 检查议程 (2分钟)</div>
                <div className="text-xs text-gray-400">2. 准备材料 (5分钟)</div>
                <div className="text-xs text-gray-400">3. 测试设备 (3分钟)</div>
              </div>
            </div>
            
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <h4 className="text-green-300 font-bold flex items-center">
                🔀 Flowchart 流程图
              </h4>
              <p className="text-gray-300 text-sm mt-2">包含决策分支的复杂流程</p>
              <div className="mt-2 text-xs text-gray-400">
                支持条件判断、并行执行、循环操作
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
            <p className="text-yellow-300 text-sm">
              <strong>智能触发：</strong>系统根据情境自动启动相应SOP，无需手动操作
            </p>
          </div>
        </div>
      )
    },
    {
      title: '⏱️ 精确工时预算系统',
      icon: <Clock className="h-12 w-12 text-cyan-400" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-white">精确到秒的时间追踪</h3>
          <p className="text-gray-300">专业级时间管理，每一秒都有价值</p>
          
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg p-4 border border-cyan-500/30">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-cyan-300 font-semibold mb-2">预算分配</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">工作</span>
                    <span className="text-white">8h 30m</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">会议</span>
                    <span className="text-white">2h 15m</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">休息</span>
                    <span className="text-white">1h 30m</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-blue-300 font-semibold mb-2">实际消耗</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">已用</span>
                    <span className="text-green-400">5h 23m 17s</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">剩余</span>
                    <span className="text-orange-400">3h 6m 43s</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">效率</span>
                    <span className="text-purple-400">87.3%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <h4 className="text-red-300 font-semibold text-sm">超时预警</h4>
              <p className="text-gray-400 text-xs mt-1">
                任务接近时间预算时自动提醒，防止时间超支
              </p>
            </div>
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
              <h4 className="text-green-300 font-semibold text-sm">时间银行</h4>
              <p className="text-gray-400 text-xs mt-1">
                节省的时间可以"存储"用于未来的紧急任务
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: '🎯 更多智能功能',
      icon: <TrendingUp className="h-12 w-12 text-purple-400" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-white">全方位智能升级</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg p-3">
              <h4 className="text-purple-300 font-bold text-sm mb-1">📊 Daily Briefing</h4>
              <p className="text-gray-400 text-xs">
                每日简报，一眼掌握全天安排
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-lg p-3">
              <h4 className="text-blue-300 font-bold text-sm mb-1">🔮 WHAT IF模拟</h4>
              <p className="text-gray-400 text-xs">
                模拟调整，预见影响
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg p-3">
              <h4 className="text-green-300 font-bold text-sm mb-1">💝 温暖引导</h4>
              <p className="text-gray-400 text-xs">
                贴心提醒，关怀备至
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border border-orange-500/30 rounded-lg p-3">
              <h4 className="text-orange-300 font-bold text-sm mb-1">👥 人物卡CRM</h4>
              <p className="text-gray-400 text-xs">
                关系管理，互动追踪
              </p>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 rounded-lg p-4 border border-purple-500/30">
            <h4 className="text-white font-bold mb-2">🚀 即将推出</h4>
            <ul className="space-y-1 text-sm">
              <li className="text-gray-300">• 状态感知动态调整</li>
              <li className="text-gray-300">• 通勤时间智能规划</li>
              <li className="text-gray-300">• 多设备无缝同步</li>
              <li className="text-gray-300">• AI语音对话助手</li>
            </ul>
          </div>
          
          <div className="text-center pt-4">
            <p className="text-cyan-300 font-semibold">智能日历 v4.0</p>
            <p className="text-gray-400 text-sm">您的智能生活管家</p>
          </div>
        </div>
      )
    }
  ]

  const nextPage = () => {
    if (currentPage < features.length - 1) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }

  const currentFeature = features[currentPage]

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={(e) => {
        // Close modal when clicking backdrop
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="relative w-full max-w-3xl bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 border border-cyan-500/50 shadow-2xl rounded-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            {currentFeature.icon}
            <h2 className="text-xl font-bold text-white">{currentFeature.title}</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-8 min-h-[400px]">
          {currentFeature.content}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/10">
          <div className="flex space-x-2">
            {features.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index === currentPage ? 'bg-cyan-400' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={prevPage}
              disabled={currentPage === 0}
              className="text-white border-white/20 hover:bg-white/10 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              上一页
            </Button>
            
            {currentPage === features.length - 1 ? (
              <Button
                size="sm"
                onClick={onClose}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                开始体验
                <Sparkles className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={nextPage}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                下一页
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}