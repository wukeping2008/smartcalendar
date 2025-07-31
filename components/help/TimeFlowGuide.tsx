'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface GuideStep {
  title: string
  description: string
  image?: string
  tips: string[]
}

const guideSteps: GuideStep[] = [
  {
    title: '3D时间流基础操作',
    description: '学习如何在3D空间中操作和查看您的时间安排',
    tips: [
      '🖱️ 鼠标拖拽可以旋转3D视角，查看不同角度的时间安排',
      '🎡 滚轮滚动可以缩放视图，放大查看详细信息',
      '👆 点击任意事件块可以选择并查看详情',
      '🎨 不同颜色代表不同类型：红色Trading、蓝色工作、绿色生活',
      '📊 事件的大小反映了持续时间的长短'
    ]
  },
  {
    title: '智能事件创建',
    description: '使用表单和语音两种方式快速创建事件',
    tips: [
      '📝 点击"新建事件"按钮打开详细创建表单',
      '🎤 点击"语音输入"按钮说出您的安排计划',
      '🗣️ 支持复杂中文表达："明天下午2点开会，提前1小时提醒"',
      '🤖 系统会自动解析时间、创建提醒、生成准备任务',
      '⚡ 语音创建比手动输入快3倍'
    ]
  },
  {
    title: 'Trading专业功能',
    description: '专为交易员设计的任务模板和工作流',
    tips: [
      '📊 扫watchlist：每小时整点执行，5分钟高效扫描',
      '💾 Key in数据：每15分钟数据录入，保持信息实时',
      '🎯 捕兽夹任务：会议间隙执行，灵活时间管理',
      '🏃 TABATA锻炼：5分钟高效锻炼，保持最佳状态',
      '🛡️ 市场保护时段：重要交易时间自动保护'
    ]
  },
  {
    title: '智能冲突检测',
    description: '实时检测时间冲突并提供解决建议',
    tips: [
      '⚠️ 系统自动检测时间重叠的事件',
      '🔴 冲突事件会显示红色边框警告',
      '💡 点击"冲突解决"获得智能调整建议',
      '🔧 支持自动调整或手动重新安排',
      '📊 冲突统计帮助优化时间安排'
    ]
  },
  {
    title: '双视图系统',
    description: '在3D时间流和传统日历间无缝切换',
    tips: [
      '🌊 时间流视图：革命性3D立体时间管理',
      '📅 传统视图：熟悉的日历布局，适合规划',
      '🔄 一键切换：头部按钮快速切换视图',
      '💾 状态保持：切换时保持选中的事件',
      '📱 响应式设计：完美适配桌面和移动设备'
    ]
  },
  {
    title: '高级功能技巧',
    description: '掌握系统的高级功能和使用技巧',
    tips: [
      '⏰ 多重提醒：自动设置30分钟+5分钟双重提醒',
      '🧠 精力管理：根据精力水平安排不同类型任务',
      '📈 工时预算：16小时工作预算，实时利用率监控',
      '🎯 灵活度评分：评估任务可调整程度',
      '📊 数据分析：详细的时间使用统计和趋势分析'
    ]
  }
]

export default function TimeFlowGuide() {
  const [open, setOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  const nextStep = () => {
    if (currentStep < guideSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const step = guideSteps[currentStep]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-white border-white/20">
          📚 使用指南
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] bg-slate-800 border-slate-700 max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center space-x-2">
            <span>📚</span>
            <span>秉笔太监智能秘书系统 - 使用指南</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {/* 进度指示器 */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">
                第 {currentStep + 1} 步，共 {guideSteps.length} 步
              </span>
              <span className="text-sm text-cyan-300">
                {Math.round((currentStep + 1) / guideSteps.length * 100)}% 完成
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep + 1) / guideSteps.length * 100}%` }}
              />
            </div>
          </div>

          {/* 当前步骤内容 */}
          <Card className="bg-black/40 border-white/20 p-6">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-cyan-300 mb-2">
                {step.title}
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {step.description}
              </p>
            </div>

            {/* 操作技巧列表 */}
            <div className="space-y-3">
              <h4 className="text-white font-semibold mb-3">💡 操作技巧：</h4>
              {step.tips.map((tip, index) => (
                <div 
                  key={index}
                  className="flex items-start space-x-3 p-3 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="text-cyan-400 text-sm font-mono mt-0.5">
                    {index + 1}.
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed flex-1">
                    {tip}
                  </p>
                </div>
              ))}
            </div>

            {/* 实践建议 */}
            <div className="mt-6 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-cyan-300 text-lg">🎯</span>
                <h4 className="text-cyan-300 font-semibold">实践建议</h4>
              </div>
              <p className="text-gray-300 text-sm">
                {currentStep === 0 && '建议先在3D时间流视图中练习基础操作，熟悉拖拽、缩放和点击选择。'}
                {currentStep === 1 && '尝试创建一个简单事件，然后使用语音输入创建一个复杂的会议安排。'}
                {currentStep === 2 && '如果您是交易员，先创建几个Trading任务模板，体验专业化工作流。'}
                {currentStep === 3 && '故意创建两个重叠的事件，观察系统如何检测和处理冲突。'}
                {currentStep === 4 && '在两个视图间多次切换，感受不同视图的优势和使用场景。'}
                {currentStep === 5 && '查看侧边栏的各种分析数据，了解您的时间使用模式。'}
              </p>
            </div>
          </Card>

          {/* 导航按钮 */}
          <div className="flex justify-between items-center mt-6">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="text-white border-white/20"
            >
              ← 上一步
            </Button>
            
            <div className="flex space-x-2">
              {guideSteps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  title={`跳转到第${index + 1}步: ${guideSteps[index].title}`}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentStep 
                      ? 'bg-cyan-500' 
                      : index < currentStep 
                        ? 'bg-cyan-500/50' 
                        : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>

            {currentStep < guideSteps.length - 1 ? (
              <Button
                onClick={nextStep}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                下一步 →
              </Button>
            ) : (
              <Button
                onClick={() => setOpen(false)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                开始使用 ✨
              </Button>
            )}
          </div>

          {/* 快速导航 */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <h4 className="text-white font-semibold mb-3">🔍 快速导航：</h4>
            <div className="grid grid-cols-2 gap-2">
              {guideSteps.map((step, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`text-left p-2 rounded text-xs transition-colors ${
                    index === currentStep
                      ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/50'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {index + 1}. {step.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
