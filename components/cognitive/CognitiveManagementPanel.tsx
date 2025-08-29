/**
 * 认知管理综合面板
 * 整合认知带宽监控、智能拒绝助手、ROI计算器等功能
 */

'use client'

import React, { useState } from 'react'
import { Card } from '../../src/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../src/components/ui/tabs'
import { Badge } from '../../src/components/ui/badge'
import { Button } from '../../src/components/ui/button'
import { 
  Brain,
  Shield,
  Calculator,
  Settings,
  X,
  Zap,
  Target
} from 'lucide-react'
import BandwidthMonitor from './BandwidthMonitor'
import RejectionAssistant from './RejectionAssistant'
import ROICalculator from './ROICalculator'
import { PanelGuide, PanelHelpButton, type GuideSection } from '../ui/panel-guide'

interface CognitiveManagementPanelProps {
  className?: string
  onClose?: () => void
}

export default function CognitiveManagementPanel({
  className = '',
  onClose
}: CognitiveManagementPanelProps) {
  const [activeTab, setActiveTab] = useState('monitor')
  const [showGuide, setShowGuide] = useState(false)
  const [tradingMode, setTradingMode] = useState(false)

  // 统一的功能指南配置
  const guideSections: GuideSection[] = [
    {
      title: '核心功能',
      icon: <Brain className="w-4 h-4 text-purple-400" />,
      items: [
        '实时监控认知负载状态',
        '48小时自动归档机制',
        '智能拒绝模板库',
        'ROI决策计算器'
      ]
    },
    {
      title: 'Trading专注模式',
      icon: <Zap className="w-4 h-4 text-green-400" />,
      items: [
        '1分钟决策倒计时',
        '屏蔽非核心干扰',
        '保护高价值时间窗口'
      ]
    },
    {
      title: '智能保护',
      icon: <Shield className="w-4 h-4 text-blue-400" />,
      items: [
        '基于海马体工作记忆原理',
        '承诺类型智能分类',
        '认知过载自动预警'
      ]
    }
  ]

  const shortcuts = [
    { key: 'Alt+C', action: '打开认知管理' },
    { key: 'Alt+T', action: 'Trading模式' },
    { key: 'ESC', action: '关闭面板' }
  ]

  const tips = [
    '认知带宽上限为7项（基于海马体研究）',
    '每天清理一次低优先级承诺',
    'Trading时间绝对不接受新承诺'
  ]

  const handleTradingModeToggle = (enabled: boolean) => {
    setTradingMode(enabled)
  }

  const handleRejection = (message: string) => {
    // 可以集成到消息发送系统
    navigator.clipboard.writeText(message)
    // 显示成功提示
  }

  const handleDecision = (decision: any) => {
    // 处理ROI决策结果
    // 可以保存到历史记录或触发其他操作
  }

  return (
    <>
      <Card className={`${className} relative h-full flex flex-col`}>
        {/* 面板头部 */}
        <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-purple-600" />
              <div>
                <h2 className="text-lg font-semibold">认知管理中心</h2>
                <p className="text-xs text-gray-600 mt-0.5">
                  保护认知带宽 · 智能决策 · 高效拒绝
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {tradingMode && (
                <Badge className="bg-green-600 text-white">
                  Trading模式
                </Badge>
              )}
              <PanelHelpButton onClick={() => setShowGuide(!showGuide)} />
              {onClose && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onClose}
                  title="关闭面板"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* 快速状态栏 */}
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              系统运行正常
            </span>
            <span>保护模式: 开启</span>
            <span>今日拒绝: 3次</span>
            <span>节省时间: 4.5小时</span>
          </div>
        </div>

        {/* 主要内容区域 */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-3 px-4 pt-2">
              <TabsTrigger value="monitor" className="text-xs">
                <Brain className="w-3 h-3 mr-1" />
                带宽监控
              </TabsTrigger>
              <TabsTrigger value="reject" className="text-xs">
                <Shield className="w-3 h-3 mr-1" />
                拒绝助手
              </TabsTrigger>
              <TabsTrigger value="roi" className="text-xs">
                <Calculator className="w-3 h-3 mr-1" />
                ROI计算
              </TabsTrigger>
            </TabsList>

            <div className="h-full overflow-y-auto">
              <TabsContent value="monitor" className="mt-0 h-full">
                <BandwidthMonitor 
                  onTradingModeToggle={handleTradingModeToggle}
                />
              </TabsContent>

              <TabsContent value="reject" className="mt-0 h-full">
                <RejectionAssistant 
                  onReject={handleRejection}
                />
              </TabsContent>

              <TabsContent value="roi" className="mt-0 h-full">
                <ROICalculator 
                  onDecision={handleDecision}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* 底部快速操作栏 */}
        <div className="p-3 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <Settings className="w-3 h-3 mr-1" />
                设置
              </Button>
            </div>
            <div className="text-xs text-gray-500">
              基于海马体工作记忆原理设计
            </div>
          </div>
        </div>
      </Card>

      {/* 统一的功能指南 */}
      <PanelGuide
        title="认知管理中心"
        description="保护有限的认知带宽，避免过载，专注高价值活动"
        sections={guideSections}
        shortcuts={shortcuts}
        tips={tips}
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
      />
    </>
  )
}