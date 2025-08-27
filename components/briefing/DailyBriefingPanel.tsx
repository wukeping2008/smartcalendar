/**
 * Daily Briefing Panel Component
 * 每日简报面板组件
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  RefreshCw,
  Calendar,
  CheckCircle,
  Clock,
  TrendingUp,
  Brain,
  Heart,
  DollarSign,
  BookOpen,
  Users,
  Sun,
  Cloud,
  CloudRain,
  Wind,
  Droplets,
  AlertTriangle,
  ChevronRight,
  Volume2,
  Settings,
  Download,
  Share2,
  Star,
  Target,
  Zap
} from 'lucide-react'
import {
  DailyBriefing,
  EventBrief,
  TaskBrief,
  Recommendation,
  MarketIndicator,
  BriefingSection
} from '../../types/briefing'
import { dailyBriefingService } from '../../lib/services/DailyBriefingService'

interface DailyBriefingPanelProps {
  className?: string
  compact?: boolean
}

export default function DailyBriefingPanel({ 
  className = '', 
  compact = false 
}: DailyBriefingPanelProps) {
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<BriefingSection>(BriefingSection.SUMMARY)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    loadBriefing()
  }, [])

  const loadBriefing = async () => {
    setLoading(true)
    try {
      const todayBriefing = await dailyBriefingService.generateDailyBriefing()
      setBriefing(todayBriefing)
      
      // 标记为已读
      if (todayBriefing.readStatus === 'unread') {
        dailyBriefingService.markAsRead(todayBriefing.id)
      }
    } catch (error) {
      console.error('Failed to load briefing:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    loadBriefing()
  }

  const handleVoiceNarration = () => {
    if (!briefing) return
    
    if (isPlaying) {
      // 停止播放
      window.speechSynthesis.cancel()
      setIsPlaying(false)
    } else {
      // 开始播放
      const text = generateNarrationText(briefing)
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'zh-CN'
      utterance.rate = 1.0
      utterance.onend = () => setIsPlaying(false)
      
      window.speechSynthesis.speak(utterance)
      setIsPlaying(true)
    }
  }

  const generateNarrationText = (briefing: DailyBriefing): string => {
    const parts: string[] = []
    
    // 问候语
    parts.push(briefing.summary.greeting)
    parts.push(briefing.summary.dateInfo)
    parts.push(briefing.summary.overview)
    
    // 今日亮点
    if (briefing.summary.highlights.length > 0) {
      parts.push('今日亮点：')
      parts.push(briefing.summary.highlights.join('。'))
    }
    
    // 日程
    if (briefing.schedule.totalEvents > 0) {
      parts.push(`您今天有${briefing.schedule.totalEvents}个日程安排。`)
      if (briefing.schedule.firstEvent) {
        parts.push(`第一个日程是${briefing.schedule.firstEvent.time}的${briefing.schedule.firstEvent.title}。`)
      }
    }
    
    // 任务
    if (briefing.tasks.dueToday > 0) {
      parts.push(`今天有${briefing.tasks.dueToday}项任务需要完成。`)
    }
    
    // 名言
    if (briefing.summary.quote) {
      parts.push(`今日名言：${briefing.summary.quote.text}，${briefing.summary.quote.author}`)
    }
    
    return parts.join(' ')
  }

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case '晴': return <Sun className="w-8 h-8 text-yellow-500" />
      case '多云': return <Cloud className="w-8 h-8 text-gray-500" />
      case '雨': return <CloudRain className="w-8 h-8 text-blue-500" />
      default: return <Cloud className="w-8 h-8 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
      case 'high': return 'text-red-500'
      case 'medium': return 'text-yellow-500'
      case 'low': return 'text-green-500'
      default: return 'text-gray-500'
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'productivity': return <Brain className="w-4 h-4" />
      case 'health': return <Heart className="w-4 h-4" />
      case 'financial': return <DollarSign className="w-4 h-4" />
      case 'learning': return <BookOpen className="w-4 h-4" />
      case 'social': return <Users className="w-4 h-4" />
      default: return <Brain className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">正在生成今日简报...</span>
        </div>
      </Card>
    )
  }

  if (!briefing) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <p className="text-gray-500 mb-4">无法加载今日简报</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            重试
          </Button>
        </div>
      </Card>
    )
  }

  if (compact) {
    // 紧凑模式
    return (
      <Card className={`p-4 ${className}`}>
        <div className="space-y-3">
          {/* 头部 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold">今日简报</h3>
            </div>
            <Button size="sm" variant="ghost" onClick={handleRefresh}>
              <RefreshCw className="w-3 h-3" />
            </Button>
          </div>

          {/* 摘要 */}
          <div className="text-sm space-y-2">
            <p className="text-gray-600">{briefing.summary.greeting}</p>
            <p className="font-medium">{briefing.summary.overview}</p>
          </div>

          {/* 亮点 */}
          {briefing.summary.highlights.length > 0 && (
            <div className="space-y-1">
              {briefing.summary.highlights.slice(0, 3).map((highlight, idx) => (
                <div key={idx} className="text-sm flex items-start gap-1">
                  <ChevronRight className="w-3 h-3 mt-0.5 text-gray-400" />
                  <span>{highlight}</span>
                </div>
              ))}
            </div>
          )}

          {/* 快速统计 */}
          <div className="flex gap-4 text-xs">
            {briefing.schedule.totalEvents > 0 && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{briefing.schedule.totalEvents} 日程</span>
              </div>
            )}
            {briefing.tasks.dueToday > 0 && (
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                <span>{briefing.tasks.dueToday} 任务</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    )
  }

  // 完整模式
  return (
    <Card className={`${className}`}>
      {/* 头部 */}
      <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">今日简报</h2>
            <p className="text-gray-600">{briefing.summary.dateInfo}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleVoiceNarration}>
              <Volume2 className={`w-4 h-4 ${isPlaying ? 'text-blue-500' : ''}`} />
            </Button>
            <Button size="sm" variant="outline">
              <Download className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline">
              <Share2 className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 问候语 */}
        <div className="mb-4">
          <p className="text-lg font-medium text-gray-800">{briefing.summary.greeting}</p>
          <p className="text-gray-600 mt-1">{briefing.summary.overview}</p>
        </div>

        {/* 每日名言 */}
        {briefing.summary.quote && (
          <div className="bg-white/70 rounded-lg p-4 border border-gray-200">
            <div className="flex items-start gap-3">
              <Star className="w-5 h-5 text-yellow-500 mt-1" />
              <div>
                <p className="italic text-gray-700">&ldquo;{briefing.summary.quote.text}&rdquo;</p>
                <p className="text-sm text-gray-500 mt-1">— {briefing.summary.quote.author}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 主要内容 */}
      <Tabs value={activeSection} onValueChange={(v) => setActiveSection(v as BriefingSection)}>
        <TabsList className="w-full justify-start px-6 pt-4">
          <TabsTrigger value={BriefingSection.SUMMARY}>概览</TabsTrigger>
          <TabsTrigger value={BriefingSection.SCHEDULE}>日程</TabsTrigger>
          <TabsTrigger value={BriefingSection.TASKS}>任务</TabsTrigger>
          <TabsTrigger value={BriefingSection.INSIGHTS}>洞察</TabsTrigger>
          <TabsTrigger value={BriefingSection.MARKET}>市场</TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[500px]">
          <div className="p-6">
            {/* 概览标签页 */}
            <TabsContent value={BriefingSection.SUMMARY} className="space-y-6 mt-0">
              {/* 今日亮点 */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  今日亮点
                </h3>
                <div className="space-y-2">
                  {briefing.summary.highlights.map((highlight, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                      <ChevronRight className="w-4 h-4 mt-0.5 text-gray-400" />
                      <span className="text-sm">{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 天气信息 */}
              <div>
                <h3 className="font-semibold mb-3">天气状况</h3>
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getWeatherIcon(briefing.weather.current.condition)}
                      <div>
                        <p className="text-2xl font-bold">{briefing.weather.current.temperature}°C</p>
                        <p className="text-gray-600">{briefing.weather.current.condition}</p>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-600">
                      <div className="flex items-center gap-2 justify-end mb-1">
                        <Wind className="w-4 h-4" />
                        <span>风速 {briefing.weather.current.windSpeed} km/h</span>
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <Droplets className="w-4 h-4" />
                        <span>湿度 {briefing.weather.current.humidity}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="border-t pt-3">
                    <p className="text-sm text-gray-600 mb-2">
                      今日 {briefing.weather.forecast.low}°C - {briefing.weather.forecast.high}°C，
                      {briefing.weather.forecast.condition}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {briefing.weather.suggestions.map((suggestion, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {suggestion}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 智能推荐 */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  智能推荐
                </h3>
                <div className="space-y-3">
                  {briefing.recommendations.slice(0, 3).map((rec) => (
                    <div key={rec.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            rec.priority === 'high' ? 'destructive' :
                            rec.priority === 'medium' ? 'default' : 'secondary'
                          }>
                            {rec.priority === 'high' ? '重要' :
                             rec.priority === 'medium' ? '建议' : '可选'}
                          </Badge>
                          <span className="font-medium">{rec.title}</span>
                        </div>
                        {rec.timeframe && (
                          <span className="text-sm text-gray-500">{rec.timeframe}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                      {rec.impact && (
                        <p className="text-xs text-blue-600">💡 {rec.impact}</p>
                      )}
                      {rec.action && (
                        <Button size="sm" variant="outline" className="mt-2">
                          {rec.action.label}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* 日程标签页 */}
            <TabsContent value={BriefingSection.SCHEDULE} className="space-y-6 mt-0">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Card className="p-4 bg-blue-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">总日程</span>
                    <Calendar className="w-4 h-4 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold">{briefing.schedule.totalEvents}</p>
                </Card>
                <Card className="p-4 bg-red-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">重要日程</span>
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  </div>
                  <p className="text-2xl font-bold">{briefing.schedule.importantEvents.length}</p>
                </Card>
              </div>

              {/* 重要日程列表 */}
              {briefing.schedule.importantEvents.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">重要日程</h3>
                  <div className="space-y-3">
                    {briefing.schedule.importantEvents.map((event) => (
                      <div key={event.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium">{event.title}</p>
                            <p className="text-sm text-gray-600">{event.category}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{event.time}</p>
                            <p className="text-sm text-gray-500">{event.duration}分钟</p>
                          </div>
                        </div>
                        {event.location && (
                          <p className="text-sm text-gray-600">📍 {event.location}</p>
                        )}
                        {event.preparation && event.preparation.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {event.preparation.map((prep, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {prep}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 空闲时段 */}
              {briefing.schedule.freeSlots.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">空闲时段</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {briefing.schedule.freeSlots.map((slot, idx) => (
                      <div key={idx} className="bg-green-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-green-700">
                          {new Date(slot.start).toLocaleTimeString('zh-CN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })} - {new Date(slot.end).toLocaleTimeString('zh-CN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {slot.duration}分钟 {slot.label && `• ${slot.label}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 冲突警告 */}
              {briefing.schedule.conflictWarnings.length > 0 && (
                <div className="bg-red-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2 text-red-700 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    日程冲突
                  </h3>
                  <div className="space-y-1">
                    {briefing.schedule.conflictWarnings.map((warning, idx) => (
                      <p key={idx} className="text-sm text-red-600">{warning}</p>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* 任务标签页 */}
            <TabsContent value={BriefingSection.TASKS} className="space-y-6 mt-0">
              <div className="grid grid-cols-4 gap-3 mb-4">
                <Card className="p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{briefing.tasks.totalTasks}</p>
                  <p className="text-xs text-gray-600">总任务</p>
                </Card>
                <Card className="p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{briefing.tasks.completedYesterday}</p>
                  <p className="text-xs text-gray-600">昨日完成</p>
                </Card>
                <Card className="p-3 text-center">
                  <p className="text-2xl font-bold text-orange-600">{briefing.tasks.dueToday}</p>
                  <p className="text-xs text-gray-600">今日到期</p>
                </Card>
                <Card className="p-3 text-center">
                  <p className="text-2xl font-bold text-red-600">{briefing.tasks.overdue}</p>
                  <p className="text-xs text-gray-600">已逾期</p>
                </Card>
              </div>

              {/* 预计工作量 */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">预计工作量</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {briefing.tasks.estimatedWorkload.toFixed(1)}小时
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (briefing.tasks.estimatedWorkload / 8) * 100)}%` }}
                  />
                </div>
              </div>

              {/* 优先任务 */}
              {briefing.tasks.priorityTasks.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">优先任务</h3>
                  <div className="space-y-2">
                    {briefing.tasks.priorityTasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            task.priority === 'urgent' ? 'bg-red-500' :
                            task.priority === 'high' ? 'bg-orange-500' :
                            task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`} />
                          <div>
                            <p className="font-medium">{task.title}</p>
                            <p className="text-sm text-gray-600">{task.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className={getPriorityColor(task.priority)}>
                            {task.priority === 'urgent' ? '紧急' :
                             task.priority === 'high' ? '重要' :
                             task.priority === 'medium' ? '中等' : '低'}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">{task.estimatedDuration}分钟</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 建议焦点 */}
              {briefing.tasks.suggestedFocus.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-500" />
                    建议焦点
                  </h3>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-3">AI建议您优先处理这些任务：</p>
                    <div className="space-y-2">
                      {briefing.tasks.suggestedFocus.slice(0, 3).map((task, idx) => (
                        <div key={task.id} className="flex items-center gap-2">
                          <span className="text-lg font-bold text-blue-600">{idx + 1}</span>
                          <span className="text-sm">{task.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* 洞察标签页 */}
            <TabsContent value={BriefingSection.INSIGHTS} className="space-y-6 mt-0">
              {/* 生产力洞察 */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-500" />
                    生产力分析
                  </h3>
                  <Badge variant={
                    briefing.insights.productivity.trend === 'improving' ? 'default' :
                    briefing.insights.productivity.trend === 'stable' ? 'secondary' : 'destructive'
                  }>
                    {briefing.insights.productivity.trend === 'improving' ? '上升' :
                     briefing.insights.productivity.trend === 'stable' ? '稳定' : '下降'}
                  </Badge>
                </div>
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">生产力得分</span>
                    <span className="font-bold text-lg">{briefing.insights.productivity.score}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full transition-all"
                      style={{ width: `${briefing.insights.productivity.score}%` }}
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">{briefing.insights.productivity.analysis}</p>
                <div className="space-y-1">
                  {briefing.insights.productivity.suggestions.slice(0, 2).map((suggestion, idx) => (
                    <p key={idx} className="text-sm flex items-start gap-2">
                      <ChevronRight className="w-3 h-3 mt-0.5 text-gray-400" />
                      <span>{suggestion}</span>
                    </p>
                  ))}
                </div>
              </div>

              {/* 健康洞察 */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    健康状态
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-sm text-gray-600">能量水平</p>
                    <p className="font-semibold capitalize">
                      {briefing.insights.health.energyLevel === 'high' ? '充沛' :
                       briefing.insights.health.energyLevel === 'medium' ? '正常' : '疲倦'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">压力水平</p>
                    <p className="font-semibold capitalize">
                      {briefing.insights.health.stressLevel === 'high' ? '高压' :
                       briefing.insights.health.stressLevel === 'medium' ? '适中' : '轻松'}
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  {briefing.insights.health.suggestions.slice(0, 3).map((suggestion, idx) => (
                    <p key={idx} className="text-sm flex items-start gap-2">
                      <ChevronRight className="w-3 h-3 mt-0.5 text-gray-400" />
                      <span>{suggestion}</span>
                    </p>
                  ))}
                </div>
              </div>

              {/* 财务洞察 */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-500" />
                    财务状态
                  </h3>
                  <Badge variant="outline">{briefing.insights.financial.portfolioStatus}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-sm text-gray-600">每日目标</p>
                    <p className="font-semibold">${briefing.insights.financial.dailyTarget}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">风险等级</p>
                    <p className="font-semibold capitalize">
                      {briefing.insights.financial.riskLevel === 'high' ? '高' :
                       briefing.insights.financial.riskLevel === 'medium' ? '中' : '低'}
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  {briefing.insights.financial.suggestions.map((suggestion, idx) => (
                    <p key={idx} className="text-sm flex items-start gap-2">
                      <ChevronRight className="w-3 h-3 mt-0.5 text-gray-400" />
                      <span>{suggestion}</span>
                    </p>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* 市场标签页 */}
            <TabsContent value={BriefingSection.MARKET} className="space-y-6 mt-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">市场概览</h3>
                <Badge variant={briefing.market.marketStatus === 'open' ? 'default' : 'secondary'}>
                  {briefing.market.marketStatus === 'open' ? '开市' :
                   briefing.market.marketStatus === 'closed' ? '休市' :
                   briefing.market.marketStatus === 'pre-market' ? '盘前' : '盘后'}
                </Badge>
              </div>

              {/* 关键指标 */}
              <div className="grid grid-cols-1 gap-3">
                {briefing.market.keyIndicators.map((indicator) => (
                  <div key={indicator.symbol} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{indicator.name}</p>
                        <p className="text-sm text-gray-600">{indicator.symbol}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{indicator.value.toLocaleString()}</p>
                        <p className={`text-sm ${
                          indicator.change > 0 ? 'text-green-600' : 
                          indicator.change < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {indicator.change > 0 ? '+' : ''}{indicator.change} ({indicator.changePercent > 0 ? '+' : ''}{indicator.changePercent}%)
                          {indicator.trend === 'up' ? '📈' : indicator.trend === 'down' ? '📉' : '➡️'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 风险提醒 */}
              {briefing.market.riskAlerts.length > 0 && (
                <div className="bg-red-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2 text-red-700 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    风险提醒
                  </h3>
                  <div className="space-y-1">
                    {briefing.market.riskAlerts.map((alert, idx) => (
                      <p key={idx} className="text-sm text-red-600">{alert}</p>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </Card>
  )
}