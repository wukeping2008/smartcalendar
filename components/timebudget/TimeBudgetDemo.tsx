/**
 * Time Budget Demo - 时间预算系统演示
 * 用于测试和展示完整功能
 */

import React, { useState, useEffect } from 'react'
import { Card } from '../../src/components/ui/card'
import { Button } from '../../src/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../src/components/ui/tabs'
import { 
  Clock, Settings, FileText, Wallet,
  Play, Square, Activity
} from 'lucide-react'

import TimeBudgetDashboard from './TimeBudgetDashboard'
import TimeTrackerWidget from './TimeTrackerWidget'
import TimeBankPanel from './TimeBankPanel'
import TimeBudgetConfigPanel from './TimeBudgetConfigPanel'
import TimeBudgetReportPanel from './TimeBudgetReportPanel'
import TimeBudgetService from '../../lib/services/TimeBudgetService'
import { BudgetCategory } from '../../types/timebudget'

export default function TimeBudgetDemo() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [demoMode, setDemoMode] = useState(false)

  // 演示数据初始化
  const initializeDemoData = async () => {
    setDemoMode(true)
    
    try {
      // 启动一些演示追踪
      console.log('🎯 初始化演示数据...')
      
      // 模拟完成一些任务
      await simulateCompletedTask('代码审查', BudgetCategory.WORK, 45 * 60)
      await simulateCompletedTask('团队会议', BudgetCategory.MEETING, 30 * 60)
      await simulateCompletedTask('学习新技术', BudgetCategory.LEARNING, 60 * 60)
      
      // 手动存入一些时间到时间银行
      await TimeBudgetService.saveToTimeBank(15 * 60, '提前完成任务节省的时间')
      
      console.log('✅ 演示数据初始化完成')
    } catch (error) {
      console.error('❌ 演示数据初始化失败:', error)
    }
  }

  // 模拟完成的任务
  const simulateCompletedTask = async (taskName: string, category: BudgetCategory, duration: number) => {
    const tracker = await TimeBudgetService.startTracking(
      `demo_${Date.now()}`,
      taskName,
      category,
      duration + 300 // 预估比实际多5分钟
    )
    
    if (tracker) {
      // 立即完成任务
      await TimeBudgetService.stopTracking(tracker.id)
    }
  }

  // 开始演示追踪
  const startDemoTracking = async () => {
    await TimeBudgetService.startTracking(
      `demo_live_${Date.now()}`,
      '演示任务 - 实时计时',
      BudgetCategory.WORK,
      25 * 60 // 25分钟
    )
  }

  // 停止当前追踪
  const stopCurrentTracking = async () => {
    const activeTracker = TimeBudgetService.getActiveTracker()
    if (activeTracker) {
      await TimeBudgetService.stopTracking(activeTracker.id)
    }
  }

  // 重置演示数据
  const resetDemoData = () => {
    if (confirm('确定要重置所有演示数据吗？')) {
      TimeBudgetService.dispose()
      window.location.reload()
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* 标题和控制面板 */}
      <Card className="bg-black/30 border-white/20 p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-white flex items-center">
            <Clock className="h-8 w-8 mr-3 text-cyan-400" />
            时间预算系统演示
          </h1>
          
          <div className="flex space-x-2">
            {!demoMode ? (
              <Button
                onClick={initializeDemoData}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                <Activity className="h-4 w-4 mr-2" />
                初始化演示数据
              </Button>
            ) : (
              <>
                <Button
                  onClick={startDemoTracking}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Play className="h-4 w-4 mr-2" />
                  开始演示计时
                </Button>
                <Button
                  onClick={stopCurrentTracking}
                  variant="outline"
                  className="text-white border-white/20"
                >
                  <Square className="h-4 w-4 mr-2" />
                  停止计时
                </Button>
                <Button
                  onClick={resetDemoData}
                  variant="outline"
                  className="text-red-400 border-red-400/50 hover:bg-red-400/10"
                >
                  重置数据
                </Button>
              </>
            )}
          </div>
        </div>

        {demoMode && (
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
            <h3 className="text-cyan-400 font-semibold mb-2">演示模式已激活</h3>
            <p className="text-sm text-gray-300">
              系统已生成一些演示数据，您可以体验完整的时间预算功能。尝试切换不同的标签页查看各项功能。
            </p>
          </div>
        )}
      </Card>

      {/* 主要功能标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 bg-black/30 border border-white/20">
          <TabsTrigger 
            value="dashboard" 
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
          >
            <Clock className="h-4 w-4 mr-2" />
            仪表盘
          </TabsTrigger>
          <TabsTrigger 
            value="tracker"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
          >
            <Activity className="h-4 w-4 mr-2" />
            时间追踪
          </TabsTrigger>
          <TabsTrigger 
            value="bank"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
          >
            <Wallet className="h-4 w-4 mr-2" />
            时间银行
          </TabsTrigger>
          <TabsTrigger 
            value="reports"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
          >
            <FileText className="h-4 w-4 mr-2" />
            报告分析
          </TabsTrigger>
          <TabsTrigger 
            value="settings"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
          >
            <Settings className="h-4 w-4 mr-2" />
            设置
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TimeBudgetDashboard />
            </div>
            <div>
              <TimeTrackerWidget compact />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tracker" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TimeTrackerWidget />
            <div>
              <TimeBudgetDashboard compact />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="bank" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TimeBankPanel />
            </div>
            <div>
              <TimeBudgetDashboard compact />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <TimeBudgetReportPanel />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <TimeBudgetConfigPanel />
        </TabsContent>
      </Tabs>

      {/* 功能说明 */}
      <Card className="bg-black/30 border-white/20 p-4">
        <h3 className="text-white font-semibold mb-3">功能说明</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="text-cyan-400 font-medium mb-2">⏱️ 精确时间追踪</h4>
            <ul className="space-y-1 text-gray-300">
              <li>• 精确到秒的计时</li>
              <li>• 暂停/恢复功能</li>
              <li>• 任务分类管理</li>
              <li>• 时间日志记录</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-cyan-400 font-medium mb-2">📊 工时预算管理</h4>
            <ul className="space-y-1 text-gray-300">
              <li>• 日/周/月预算设置</li>
              <li>• 实时使用监控</li>
              <li>• 超时预警机制</li>
              <li>• 预算vs实际对比</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-cyan-400 font-medium mb-2">💰 时间银行系统</h4>
            <ul className="space-y-1 text-gray-300">
              <li>• 节省时间累积</li>
              <li>• 时间借贷机制</li>
              <li>• 效率积分等级</li>
              <li>• 交易历史记录</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-cyan-400 font-medium mb-2">📈 数据分析报告</h4>
            <ul className="space-y-1 text-gray-300">
              <li>• 多维度统计分析</li>
              <li>• 趋势图表展示</li>
              <li>• 智能洞察建议</li>
              <li>• 报告导出功能</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-cyan-400 font-medium mb-2">⚙️ 个性化配置</h4>
            <ul className="space-y-1 text-gray-300">
              <li>• 预算自定义设置</li>
              <li>• 告警阈值调整</li>
              <li>• 时间银行参数</li>
              <li>• 界面偏好设置</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-cyan-400 font-medium mb-2">🎯 智能特性</h4>
            <ul className="space-y-1 text-gray-300">
              <li>• 自动时间分配建议</li>
              <li>• 效率评分系统</li>
              <li>• 工作模式识别</li>
              <li>• 持续优化建议</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}