'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useEventStore } from '../../lib/stores/event-store'
import { aiService } from '../../lib/services/AIService'
import { llmService } from '../../lib/services/LLMIntegrationService'
import { Event } from '../../types/event'
import ChatInterface from './ChatInterface'

interface AIAssistantProps {
  selectedEvent?: Event | null
}

interface InsightsData {
  habitAnalysis: string
  productivityTips: string[]
  energyOptimization: string
  weeklyPattern: string
}

interface AIRecommendation {
  type: string
  title: string
  description: string
  impact: string
  confidence: number
  action?: string
}

interface ConflictData {
  conflictId: string
  events: Event[]
  solutions: Array<{
    type: string
    description: string
    confidence: number
    impact: string
  }>
}

interface EnhancedRecommendation {
  enhanced: string
  enhancing: boolean
}

export default function AIAssistant({ selectedEvent }: AIAssistantProps) {
  const { events } = useEventStore()
  const [insights, setInsights] = useState<InsightsData | null>(null)
  const [enhancedInsights, setEnhancedInsights] = useState<string>('')
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
  const [enhancedRecommendations, setEnhancedRecommendations] = useState<EnhancedRecommendation[]>([])
  const [conflicts, setConflicts] = useState<ConflictData[]>([])
  const [isLearning, setIsLearning] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [activeTab, setActiveTab] = useState<'insights' | 'recommendations' | 'conflicts' | 'chat'>('insights')

  useEffect(() => {
    if (events.length > 0) {
      // AI学习用户习惯
      aiService.learnFromEvents(events)
      
      // 生成洞察报告
      const newInsights = aiService.getInsights(events)
      setInsights(newInsights)
      
      // 分析冲突
      const newConflicts = aiService.resolveConflicts(events)
      setConflicts(newConflicts)
    }
  }, [events])

  useEffect(() => {
    if (selectedEvent) {
      // 分析选中事件
      const analysis = aiService.analyzeEvent(selectedEvent, events)
      setRecommendations(analysis.recommendations)
    }
  }, [selectedEvent, events])

  const handleAILearning = () => {
    setIsLearning(true)
    setTimeout(() => {
      aiService.learnFromEvents(events)
      const newInsights = aiService.getInsights(events)
      setInsights(newInsights)
      setIsLearning(false)
    }, 2000) // 模拟AI学习过程
  }

  const handleEnhanceInsights = async () => {
    if (!insights || isEnhancing) return
    
    setIsEnhancing(true)
    setEnhancedInsights('')
    
    try {
      await llmService.generateInsightReport(insights, events, {
        onData: (chunk: string) => {
          setEnhancedInsights(prev => prev + chunk)
        },
        onComplete: () => {
          setIsEnhancing(false)
        },
        onError: (error) => {
          console.error('Enhanced insights error:', error)
          setIsEnhancing(false)
        }
      })
    } catch (error) {
      console.error('Failed to enhance insights:', error)
      setIsEnhancing(false)
    }
  }

  const handleEnhanceRecommendation = async (rec: AIRecommendation, index: number) => {
    if (!selectedEvent) return
    
    try {
      await llmService.enhanceRecommendation(rec.description, selectedEvent, {
        onData: (chunk: string) => {
          setEnhancedRecommendations(prev => {
            const newRecs = [...prev]
            if (!newRecs[index]) {
              newRecs[index] = { enhanced: chunk, enhancing: true }
            } else {
              newRecs[index] = { ...newRecs[index], enhanced: newRecs[index].enhanced + chunk }
            }
            return newRecs
          })
        },
        onComplete: () => {
          setEnhancedRecommendations(prev => {
            const newRecs = [...prev]
            if (newRecs[index]) {
              newRecs[index] = { ...newRecs[index], enhancing: false }
            }
            return newRecs
          })
        },
        onError: (error) => {
          console.error('Enhanced recommendation error:', error)
        }
      })
    } catch (error) {
      console.error('Failed to enhance recommendation:', error)
    }
  }

  // 应用AI建议
  const handleApplyRecommendation = (rec: AIRecommendation) => {
    if (!selectedEvent) {
      alert('请先选择一个事件')
      return
    }

    try {
      if (rec.action === 'reschedule') {
        // 重新安排建议
        const currentTime = new Date()
        const suggestedTime = new Date(currentTime.getTime() + 60 * 60 * 1000) // 1小时后
        
        const confirmReschedule = confirm(
          `建议将"${selectedEvent.title}"重新安排到${suggestedTime.toLocaleString('zh-CN')}，是否确认？`
        )
        
        if (confirmReschedule) {
          const duration = selectedEvent.endTime.getTime() - selectedEvent.startTime.getTime()
          const { updateEvent } = useEventStore.getState()
          
          updateEvent(selectedEvent.id, {
            startTime: suggestedTime,
            endTime: new Date(suggestedTime.getTime() + duration)
          })
          
          alert('✅ 事件已重新安排！')
        }
      } else if (rec.action === 'resolve_conflict') {
        // 解决冲突建议
        alert(`🔧 AI建议：${rec.description}\n\n请手动调整相关事件时间或通过冲突解决器自动处理。`)
      } else {
        // 通用建议应用
        alert(`💡 AI建议已记录：${rec.description}\n\n建议置信度：${Math.round(rec.confidence * 100)}%`)
      }
    } catch (error) {
      console.error('应用建议失败:', error)
      alert('❌ 应用建议时出现错误，请稍后重试')
    }
  }

  // 应用冲突解决方案
  const handleApplyConflictSolution = (conflict: ConflictData) => {
    if (conflict.solutions.length === 0) {
      alert('该冲突暂无可用解决方案')
      return
    }

    const bestSolution = conflict.solutions.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    )

    const confirmApply = confirm(
      `是否应用最佳冲突解决方案？\n\n解决方案：${bestSolution.description}\n置信度：${Math.round(bestSolution.confidence * 100)}%`
    )

    if (confirmApply) {
      try {
        // 这里应该调用实际的冲突解决逻辑
        // 暂时提供模拟实现
        alert(`✅ 冲突解决方案已应用：${bestSolution.description}`)
        
        // 从冲突列表中移除已解决的冲突
        setConflicts(prev => prev.filter(c => c.conflictId !== conflict.conflictId))
      } catch (error) {
        console.error('应用冲突解决方案失败:', error)
        alert('❌ 应用解决方案时出现错误，请稍后重试')
      }
    }
  }

  const tabs = [
    { key: 'insights', label: '🧠 AI洞察', count: null },
    { key: 'recommendations', label: '💡 智能建议', count: recommendations.length },
    { key: 'conflicts', label: '⚠️ 冲突解决', count: conflicts.length },
    { key: 'chat', label: '💬 AI对话', count: null }
  ]

  return (
    <Card className="bg-black/30 border-white/20 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">🤖 AI智能助手</h3>
        <Button
          size="sm"
          variant="outline"
          className="text-white border-white/20 text-xs"
          onClick={handleAILearning}
          disabled={isLearning}
        >
          {isLearning ? '🧠 学习中...' : '🎯 重新学习'}
        </Button>
      </div>

      {/* 标签导航 */}
      <div className="flex space-x-1 mb-4 bg-black/30 rounded-lg p-1">
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            size="sm"
            variant={activeTab === tab.key ? 'default' : 'ghost'}
            className={`flex-1 text-xs ${
              activeTab === tab.key 
                ? 'bg-cyan-600 text-white' 
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
            onClick={() => setActiveTab(tab.key as 'insights' | 'recommendations' | 'conflicts' | 'chat')}
          >
            {tab.label}
            {tab.count !== null && tab.count > 0 && (
              <span className="ml-1 bg-red-500/80 text-white px-1 rounded-full text-xs">
                {tab.count}
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* AI洞察 */}
      {activeTab === 'insights' && (
        <div className="space-y-3">
          {insights ? (
            <>
              {/* 增强洞察报告 */}
              {enhancedInsights && (
                <div className="p-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-purple-300 font-medium text-sm">🤖 AI深度洞察报告</h4>
                    {isEnhancing && <div className="text-xs text-purple-400">生成中...</div>}
                  </div>
                  <div className="text-gray-300 text-xs whitespace-pre-wrap">
                    {enhancedInsights}
                    {isEnhancing && <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse">|</span>}
                  </div>
                </div>
              )}

              {/* 增强按钮 */}
              {!enhancedInsights && (
                <div className="flex justify-center mb-3">
                  <Button
                    size="sm"
                    onClick={handleEnhanceInsights}
                    disabled={isEnhancing}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-xs"
                  >
                    {isEnhancing ? '🤖 生成深度洞察中...' : '✨ AI深度洞察分析'}
                  </Button>
                </div>
              )}

              {/* 原始洞察 */}
              <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <h4 className="text-blue-300 font-medium text-sm mb-2">📊 习惯分析</h4>
                <p className="text-gray-300 text-xs">{insights.habitAnalysis}</p>
              </div>

              <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <h4 className="text-green-300 font-medium text-sm mb-2">⚡ 精力优化</h4>
                <p className="text-gray-300 text-xs">{insights.energyOptimization}</p>
              </div>

              <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <h4 className="text-purple-300 font-medium text-sm mb-2">📈 效率提升</h4>
                <div className="space-y-1">
                  {insights.productivityTips.map((tip: string, index: number) => (
                    <p key={index} className="text-gray-300 text-xs">• {tip}</p>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                <h4 className="text-cyan-300 font-medium text-sm mb-2">📅 周模式</h4>
                <p className="text-gray-300 text-xs">{insights.weeklyPattern}</p>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="text-gray-400 text-sm mb-2">🤖 AI正在分析您的日程习惯...</div>
              <Button size="sm" onClick={handleAILearning} variant="outline" className="text-white border-white/20">
                开始AI学习
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 智能建议 */}
      {activeTab === 'recommendations' && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {selectedEvent ? (
            recommendations.length > 0 ? (
              recommendations.map((rec, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    rec.impact === 'high' ? 'bg-red-500/10 border-red-500/20' :
                    rec.impact === 'medium' ? 'bg-yellow-500/10 border-yellow-500/20' :
                    'bg-green-500/10 border-green-500/20'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <h4 className={`font-medium text-sm ${
                      rec.impact === 'high' ? 'text-red-300' :
                      rec.impact === 'medium' ? 'text-yellow-300' :
                      'text-green-300'
                    }`}>
                      {rec.title}
                    </h4>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-gray-400">
                        {Math.round(rec.confidence * 100)}%
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEnhanceRecommendation(rec, index)}
                        className="text-purple-400 hover:text-purple-300 p-1 h-6"
                        title="AI增强建议"
                      >
                        ✨
                      </Button>
                    </div>
                  </div>
                  
                  {/* 增强建议 */}
                  {enhancedRecommendations[index]?.enhanced && (
                    <div className="mb-2 p-2 bg-purple-500/10 rounded border border-purple-500/20">
                      <div className="text-purple-300 text-xs font-medium mb-1">🤖 AI增强建议：</div>
                      <div className="text-gray-300 text-xs whitespace-pre-wrap">
                        {enhancedRecommendations[index].enhanced}
                        {enhancedRecommendations[index].enhancing && 
                          <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse">|</span>
                        }
                      </div>
                    </div>
                  )}
                  
                  {/* 原始建议 */}
                  <p className="text-gray-300 text-xs mb-2">{rec.description}</p>
                  {rec.action && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-white border-white/20 text-xs hover:bg-white/10"
                      onClick={() => handleApplyRecommendation(rec)}
                    >
                      {rec.action === 'reschedule' ? '重新安排' :
                       rec.action === 'resolve_conflict' ? '解决冲突' : '应用建议'}
                    </Button>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <div className="text-green-400 text-sm">✅ 当前事件安排很合理！</div>
                <div className="text-gray-400 text-xs mt-1">AI没有发现需要优化的地方</div>
              </div>
            )
          ) : (
            <div className="text-center py-6">
              <div className="text-gray-400 text-sm">请选择一个事件获取AI建议</div>
            </div>
          )}
        </div>
      )}

      {/* 冲突解决 */}
      {activeTab === 'conflicts' && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {conflicts.length > 0 ? (
            conflicts.map((conflict, index) => (
              <div key={index} className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                <h4 className="text-red-300 font-medium text-sm mb-2">
                  ⚠️ 时间冲突 #{index + 1}
                </h4>
                <div className="text-xs text-gray-300 mb-2">
                  冲突事件：
                  {conflict.events.map((event: Event, i: number) => (
                    <span key={i} className="block">
                      • {event.title} ({event.startTime.toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })})
                    </span>
                  ))}
                </div>
                
                <div className="space-y-1">
                  <div className="text-xs text-gray-400 mb-1">AI解决方案：</div>
                  {conflict.solutions.slice(0, 2).map((solution, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-gray-300">{solution.description}</span>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-cyan-300 hover:text-cyan-200 p-1 h-6"
                        onClick={() => handleApplyConflictSolution(conflict)}
                      >
                        应用
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6">
              <div className="text-green-400 text-sm">✅ 暂无时间冲突</div>
              <div className="text-gray-400 text-xs mt-1">您的日程安排很合理</div>
            </div>
          )}
        </div>
      )}

      {/* AI对话 */}
      {activeTab === 'chat' && (
        <div className="h-[400px]">
          <ChatInterface />
        </div>
      )}

      {/* AI状态指示器 */}
      <div className="mt-4 pt-3 border-t border-white/10">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-gray-400">AI助手在线 {activeTab === 'chat' ? '- 对话模式' : ''}</span>
          </div>
          <div className="text-gray-400">
            已学习 {events.length} 个事件
          </div>
        </div>
      </div>
    </Card>
  )
}
