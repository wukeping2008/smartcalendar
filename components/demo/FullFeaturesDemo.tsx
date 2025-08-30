'use client'

import React, { useState } from 'react'
import { Card } from '../../src/components/ui/card'
import { Button } from '../../src/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../src/components/ui/tabs'
import { Badge } from '../../src/components/ui/badge'
import {
  Clock,
  Brain,
  Users,
  Train,
  Sparkles,
  Calendar,
  HelpCircle,
  Activity,
  Target,
  TrendingUp,
  Zap,
  ChevronRight
} from 'lucide-react'

// 导入所有三个阶段的组件
// 第一阶段：精确工时预算系统
import TimeBudgetDashboard from '../timebudget/TimeBudgetDashboard'
import TimeTrackerWidget from '../timebudget/TimeTrackerWidget'
import TimeBankPanel from '../timebudget/TimeBankPanel'

// 第二阶段：智能辅助功能
import DailyBriefingPanel from '../briefing/DailyBriefingPanel'
import WhatIfSimulatorPanel from '../whatif/WhatIfSimulatorPanel'
import WarmGuidanceOverlay from '../guidance/WarmGuidanceOverlay'

// 第三阶段：高级功能
import PersonCardPanel from '../personcard/PersonCardPanel'
import CommutePlannerPanel from '../commute/CommutePlannerPanel'
import TaskInbox from '../gtd/TaskInbox'

export default function FullFeaturesDemo() {
  const [activePhase, setActivePhase] = useState<'phase1' | 'phase2' | 'phase3'>('phase1')
  const [showGuidance, setShowGuidance] = useState(false)

  const phases = {
    phase1: {
      title: '第一阶段：精确工时预算',
      subtitle: '时间追踪与管理',
      icon: Clock,
      color: 'from-blue-500 to-cyan-500',
      features: [
        { name: '实时计时器', description: '精确到秒的时间追踪' },
        { name: '预算分配', description: '日/周/月多维度预算' },
        { name: '时间银行', description: '创新的时间存储机制' }
      ]
    },
    phase2: {
      title: '第二阶段：智能辅助',
      subtitle: 'AI驱动的决策支持',
      icon: Brain,
      color: 'from-purple-500 to-pink-500',
      features: [
        { name: '每日简报', description: '智能生成的日程摘要' },
        { name: 'What-If模拟', description: '决策影响分析' },
        { name: '温暖引导', description: '个性化使用指导' }
      ]
    },
    phase3: {
      title: '第三阶段：高级功能',
      subtitle: '全方位生活管理',
      icon: Users,
      color: 'from-green-500 to-emerald-500',
      features: [
        { name: '人物卡CRM', description: '智能人脉管理' },
        { name: '通勤规划', description: '碎片时间利用' },
        { name: 'GTD收集箱', description: '任务智能分类' }
      ]
    }
  }

  const currentPhase = phases[activePhase]
  const PhaseIcon = currentPhase.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      {/* 顶部导航 */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              智能日历 v4.0 - 完整功能演示
            </h1>
            <p className="text-gray-400 mt-2">体验三个阶段的所有智能功能</p>
          </div>
          <Button
            onClick={() => setShowGuidance(!showGuidance)}
            variant="outline"
            className="text-gray-300 hover:text-white border-gray-600/50"
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            使用指南
          </Button>
        </div>

        {/* 阶段选择器 */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {Object.entries(phases).map(([key, phase]) => {
            const Icon = phase.icon
            const isActive = activePhase === key
            return (
              <Card
                key={key}
                onClick={() => setActivePhase(key as any)}
                className={`
                  cursor-pointer transition-all duration-300 transform hover:scale-105
                  ${isActive 
                    ? 'bg-gradient-to-r ' + phase.color + ' text-white shadow-2xl' 
                    : 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-300'
                  }
                  border ${isActive ? 'border-transparent' : 'border-gray-700/50'}
                `}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <Icon className="h-8 w-8" />
                    {isActive && (
                      <Badge className="bg-white/20 text-white border-white/30">
                        当前选中
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-lg font-bold mb-1">{phase.title}</h3>
                  <p className={`text-sm ${isActive ? 'text-white/90' : 'text-gray-400'}`}>
                    {phase.subtitle}
                  </p>
                  <div className="mt-4 space-y-2">
                    {phase.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <ChevronRight className="h-3 w-3" />
                        <span>{feature.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* 功能展示区 */}
      <div className="max-w-7xl mx-auto">
        <Card className="bg-gray-800/30 backdrop-blur-sm border-gray-700/30 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-lg bg-gradient-to-r ${currentPhase.color}`}>
              <PhaseIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{currentPhase.title}</h2>
              <p className="text-gray-400 text-sm">{currentPhase.subtitle}</p>
            </div>
          </div>

          {/* 第一阶段内容 */}
          {activePhase === 'phase1' && (
            <Tabs defaultValue="tracker" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-700/50">
                <TabsTrigger value="tracker">时间追踪器</TabsTrigger>
                <TabsTrigger value="budget">预算仪表盘</TabsTrigger>
                <TabsTrigger value="bank">时间银行</TabsTrigger>
              </TabsList>
              <TabsContent value="tracker" className="mt-6">
                <TimeTrackerWidget />
              </TabsContent>
              <TabsContent value="budget" className="mt-6">
                <TimeBudgetDashboard />
              </TabsContent>
              <TabsContent value="bank" className="mt-6">
                <TimeBankPanel />
              </TabsContent>
            </Tabs>
          )}

          {/* 第二阶段内容 */}
          {activePhase === 'phase2' && (
            <Tabs defaultValue="briefing" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-700/50">
                <TabsTrigger value="briefing">每日简报</TabsTrigger>
                <TabsTrigger value="whatif">What-If模拟</TabsTrigger>
                <TabsTrigger value="guidance">温暖引导</TabsTrigger>
              </TabsList>
              <TabsContent value="briefing" className="mt-6">
                <DailyBriefingPanel />
              </TabsContent>
              <TabsContent value="whatif" className="mt-6">
                <WhatIfSimulatorPanel />
              </TabsContent>
              <TabsContent value="guidance" className="mt-6">
                <div className="text-center py-12">
                  <Sparkles className="h-16 w-16 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">温暖引导系统</h3>
                  <p className="text-gray-400 mb-4">
                    智能引导会在您使用过程中自动出现
                  </p>
                  <Button
                    onClick={() => setShowGuidance(true)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500"
                  >
                    立即体验引导
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          )}

          {/* 第三阶段内容 */}
          {activePhase === 'phase3' && (
            <Tabs defaultValue="gtd" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-700/50">
                <TabsTrigger value="gtd">GTD收集箱</TabsTrigger>
                <TabsTrigger value="crm">人物卡CRM</TabsTrigger>
                <TabsTrigger value="commute">通勤规划</TabsTrigger>
              </TabsList>
              <TabsContent value="gtd" className="mt-6">
                <TaskInbox />
              </TabsContent>
              <TabsContent value="crm" className="mt-6">
                <PersonCardPanel />
              </TabsContent>
              <TabsContent value="commute" className="mt-6">
                <CommutePlannerPanel />
              </TabsContent>
            </Tabs>
          )}
        </Card>

        {/* 功能统计 */}
        <div className="grid grid-cols-4 gap-4 mt-8">
          <Card className="bg-gray-800/50 border-gray-700/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">总功能数</p>
                <p className="text-2xl font-bold text-white">12+</p>
              </div>
              <Target className="h-8 w-8 text-cyan-400" />
            </div>
          </Card>
          <Card className="bg-gray-800/50 border-gray-700/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">AI集成</p>
                <p className="text-2xl font-bold text-white">5</p>
              </div>
              <Brain className="h-8 w-8 text-purple-400" />
            </div>
          </Card>
          <Card className="bg-gray-800/50 border-gray-700/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">效率提升</p>
                <p className="text-2xl font-bold text-white">300%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
          </Card>
          <Card className="bg-gray-800/50 border-gray-700/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">用户满意度</p>
                <p className="text-2xl font-bold text-white">98%</p>
              </div>
              <Activity className="h-8 w-8 text-pink-400" />
            </div>
          </Card>
        </div>
      </div>

      {/* 温暖引导覆盖层 */}
      {showGuidance && <WarmGuidanceOverlay />}
    </div>
  )
}