/**
 * Inbox Panel - 收集箱面板组件
 * GTD任务管理和智能分流
 */

'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Inbox,
  Plus,
  Filter,
  Zap,
  Clock,
  Send,
  Archive,
  Trash2,
  CheckCircle2,
  Circle,
  AlertCircle,
  Calendar,
  Users,
  Pause,
  PlayCircle,
  Brain,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Mic,
  MicOff,
  Loader2,
  Target,
  TrendingUp,
  Timer
} from 'lucide-react'
import InboxService from '../../lib/services/InboxService'
import FeatureGuide from '../help/FeatureGuide'
import { 
  InboxItem, 
  TaskStatus, 
  TaskPriority,
  TaskType,
  TaskSource,
  TriageCategory,
  TriageResult
} from '../../types/inbox'

interface InboxPanelProps {
  className?: string
  onTaskSchedule?: (task: InboxItem) => void
}

export default function InboxPanel({ className = '', onTaskSchedule }: InboxPanelProps) {
  const [items, setItems] = useState<InboxItem[]>([])
  const [filteredItems, setFilteredItems] = useState<InboxItem[]>([])
  const [selectedItem, setSelectedItem] = useState<InboxItem | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [captureText, setCaptureText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all')
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [isVoiceInput, setIsVoiceInput] = useState(false)
  const [stats, setStats] = useState<any>(null)
  
  const captureInputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    loadItems()
    loadStats()
  }, [])

  useEffect(() => {
    filterItems()
  }, [items, filter])

  const loadItems = async () => {
    // TODO: 从InboxService加载项目
    // 模拟数据
    const mockItems: InboxItem[] = [
      {
        id: '1',
        title: '完成项目报告',
        description: '需要在周五前完成Q4项目总结报告',
        type: TaskType.TASK,
        status: TaskStatus.INBOX,
        priority: TaskPriority.HIGH,
        source: TaskSource.MANUAL,
        capturedAt: new Date(),
        tags: ['工作', '报告'],
        analysis: {
          estimatedDuration: 120,
          complexity: 'moderate',
          suggestedCategory: '工作',
          suggestedTags: ['报告', '重要'],
          suggestedContext: ['@computer'],
          suggestedPriority: TaskPriority.HIGH,
          is2MinuteTask: false,
          requiresOthers: false,
          hasDeadline: true,
          isProject: false,
          extractedDates: [new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)],
          extractedPeople: [],
          extractedLocations: [],
          keywords: ['项目', '报告', 'Q4'],
          urgency: 70,
          importance: 80
        }
      },
      {
        id: '2',
        title: '回复邮件',
        description: '快速回复客户的咨询邮件',
        type: TaskType.TASK,
        status: TaskStatus.INBOX,
        priority: TaskPriority.MEDIUM,
        source: TaskSource.EMAIL,
        capturedAt: new Date(Date.now() - 60 * 60 * 1000),
        tags: ['邮件', '客户'],
        analysis: {
          estimatedDuration: 2,
          complexity: 'simple',
          suggestedCategory: '沟通',
          suggestedTags: ['邮件', '快速'],
          suggestedContext: ['@email'],
          suggestedPriority: TaskPriority.MEDIUM,
          is2MinuteTask: true,
          requiresOthers: false,
          hasDeadline: false,
          isProject: false,
          extractedDates: [],
          extractedPeople: ['客户'],
          extractedLocations: [],
          keywords: ['邮件', '回复'],
          urgency: 50,
          importance: 40
        }
      },
      {
        id: '3',
        title: '团队会议准备',
        description: '准备明天的团队周会材料，需要协调各部门进度',
        type: TaskType.TASK,
        status: TaskStatus.PROCESSING,
        priority: TaskPriority.HIGH,
        source: TaskSource.CALENDAR,
        capturedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        tags: ['会议', '团队'],
        analysis: {
          estimatedDuration: 45,
          complexity: 'moderate',
          suggestedCategory: '会议',
          suggestedTags: ['会议', '协作'],
          suggestedContext: ['@office', '@computer'],
          suggestedPriority: TaskPriority.HIGH,
          is2MinuteTask: false,
          requiresOthers: true,
          hasDeadline: true,
          isProject: false,
          extractedDates: [new Date(Date.now() + 24 * 60 * 60 * 1000)],
          extractedPeople: ['团队', '各部门'],
          extractedLocations: [],
          keywords: ['会议', '准备', '协调'],
          urgency: 80,
          importance: 70
        }
      }
    ]
    
    setItems(mockItems)
  }

  const loadStats = async () => {
    const inboxStats = InboxService.getStats()
    setStats(inboxStats)
  }

  const filterItems = () => {
    if (filter === 'all') {
      setFilteredItems(items)
    } else {
      setFilteredItems(items.filter(item => item.status === filter))
    }
  }

  const handleCapture = async () => {
    if (!captureText.trim()) return
    
    setIsCapturing(true)
    try {
      const newItem = await InboxService.capture(captureText, TaskSource.MANUAL)
      setItems([newItem, ...items])
      setCaptureText('')
      
      // 自动分流
      setTimeout(() => {
        handleTriage(newItem.id)
      }, 500)
    } catch (error) {
      // Failed to capture item
    } finally {
      setIsCapturing(false)
    }
  }

  const handleQuickCapture = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleCapture()
    }
  }

  const handleTriage = async (itemId: string) => {
    setIsProcessing(true)
    try {
      const result = await InboxService.triageItem(itemId)
      if (result) {
        // 更新项目状态
        setItems(prev => prev.map(item => 
          item.id === itemId 
            ? { ...item, status: result.newStatus }
            : item
        ))
        
        // 显示分流结果
        showTriageResult(result)
      }
    } catch (error) {
      // Failed to triage item
    } finally {
      setIsProcessing(false)
    }
  }

  const handleTriageAll = async () => {
    setIsProcessing(true)
    try {
      const results = await InboxService.triageAll()
      // 刷新列表
      loadItems()
      
      // 显示统计
      // 分流完成: results.length 个项目
    } catch (error) {
      // Failed to triage all
    } finally {
      setIsProcessing(false)
    }
  }

  const showTriageResult = (result: TriageResult) => {
    // TODO: 显示分流结果通知
    // Triage result: result
  }

  const startVoiceInput = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      const recognition = new SpeechRecognition()
      
      recognition.lang = 'zh-CN'
      recognition.continuous = false
      recognition.interimResults = false
      
      recognition.onstart = () => {
        setIsVoiceInput(true)
      }
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setCaptureText(transcript)
        setIsVoiceInput(false)
      }
      
      recognition.onerror = () => {
        setIsVoiceInput(false)
      }
      
      recognition.onend = () => {
        setIsVoiceInput(false)
      }
      
      recognition.start()
    }
  }

  const getPriorityColor = (priority: TaskPriority) => {
    const colors = {
      [TaskPriority.URGENT]: 'text-red-600 bg-red-50',
      [TaskPriority.HIGH]: 'text-orange-600 bg-orange-50',
      [TaskPriority.MEDIUM]: 'text-yellow-600 bg-yellow-50',
      [TaskPriority.LOW]: 'text-green-600 bg-green-50',
      [TaskPriority.NONE]: 'text-gray-600 bg-gray-50'
    }
    return colors[priority]
  }

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.INBOX:
        return <Inbox className="h-4 w-4" />
      case TaskStatus.PROCESSING:
        return <Loader2 className="h-4 w-4 animate-spin" />
      case TaskStatus.ACTIONABLE:
        return <PlayCircle className="h-4 w-4" />
      case TaskStatus.SCHEDULED:
        return <Calendar className="h-4 w-4" />
      case TaskStatus.DELEGATED:
        return <Users className="h-4 w-4" />
      case TaskStatus.WAITING:
        return <Pause className="h-4 w-4" />
      case TaskStatus.COMPLETED:
        return <CheckCircle2 className="h-4 w-4" />
      default:
        return <Circle className="h-4 w-4" />
    }
  }

  const getCategoryBadge = (item: InboxItem) => {
    if (!item.analysis) return null
    
    if (item.analysis.is2MinuteTask) {
      return (
        <Badge variant="secondary" className="text-xs">
          <Timer className="h-3 w-3 mr-1" />
          2分钟
        </Badge>
      )
    }
    
    if (item.analysis.isProject) {
      return (
        <Badge variant="outline" className="text-xs">
          项目
        </Badge>
      )
    }
    
    if (item.analysis.requiresOthers) {
      return (
        <Badge variant="outline" className="text-xs">
          <Users className="h-3 w-3 mr-1" />
          协作
        </Badge>
      )
    }
    
    return null
  }

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Inbox className="h-5 w-5 mr-2" />
          收集箱
          {items.length > 0 && (
            <Badge variant="default" className="ml-2">
              {items.filter(i => i.status === TaskStatus.INBOX).length}
            </Badge>
          )}
        </h3>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleTriageAll}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Zap className="h-3 w-3 mr-1" />
            )}
            智能分流
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowAnalysis(!showAnalysis)}
          >
            <Brain className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <FeatureGuide
        title="收集箱"
        steps={[
          '在输入框中快速记录您的想法或任务，按 Ctrl+Enter 或点击“+”按钮进行捕获。',
          '使用麦克风按钮进行语音输入，快速记录您的想法。',
          '点击“智能分流”按钮，让AI自动处理和分类收集箱中的所有项目。',
          '对于单个项目，点击项目卡片展开详情，然后点击“分流”按钮进行处理。',
          '使用顶部的过滤器（全部、收集箱、处理中等）快速查看不同状态的项目。'
        ]}
        className="mb-4"
      />

      {/* 快速捕获 */}
      <div className="mb-4">
        <div className="flex items-start space-x-2">
          <Textarea
            ref={captureInputRef}
            placeholder="快速记录想法、任务或笔记... (Ctrl+Enter 保存)"
            value={captureText}
            onChange={(e) => setCaptureText(e.target.value)}
            onKeyDown={handleQuickCapture}
            className="flex-1 min-h-[60px] resize-none"
          />
          <div className="flex flex-col space-y-2">
            <Button
              size="sm"
              onClick={handleCapture}
              disabled={!captureText.trim() || isCapturing}
            >
              {isCapturing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={startVoiceInput}
              disabled={isVoiceInput}
            >
              {isVoiceInput ? (
                <Mic className="h-4 w-4 text-red-500 animate-pulse" />
              ) : (
                <MicOff className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        {captureText && (
          <div className="mt-2 flex items-center space-x-2 text-xs text-gray-500">
            <Sparkles className="h-3 w-3" />
            <span>AI将自动分析并分类此任务</span>
          </div>
        )}
      </div>

      {/* 过滤器 */}
      <div className="flex items-center space-x-2 mb-4 overflow-x-auto">
        <Button
          size="sm"
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          全部 ({items.length})
        </Button>
        <Button
          size="sm"
          variant={filter === TaskStatus.INBOX ? 'default' : 'outline'}
          onClick={() => setFilter(TaskStatus.INBOX)}
        >
          <Inbox className="h-3 w-3 mr-1" />
          收集箱 ({items.filter(i => i.status === TaskStatus.INBOX).length})
        </Button>
        <Button
          size="sm"
          variant={filter === TaskStatus.PROCESSING ? 'default' : 'outline'}
          onClick={() => setFilter(TaskStatus.PROCESSING)}
        >
          处理中 ({items.filter(i => i.status === TaskStatus.PROCESSING).length})
        </Button>
        <Button
          size="sm"
          variant={filter === TaskStatus.SCHEDULED ? 'default' : 'outline'}
          onClick={() => setFilter(TaskStatus.SCHEDULED)}
        >
          已安排 ({items.filter(i => i.status === TaskStatus.SCHEDULED).length})
        </Button>
      </div>

      {/* 统计信息 */}
      {showAnalysis && stats && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div>
              <div className="text-gray-500">捕获率</div>
              <div className="font-medium">{stats.captureRate}/天</div>
            </div>
            <div>
              <div className="text-gray-500">处理率</div>
              <div className="font-medium">{stats.processingRate}/天</div>
            </div>
            <div>
              <div className="text-gray-500">完成率</div>
              <div className="font-medium">{Math.round(stats.completionRate)}%</div>
            </div>
            <div>
              <div className="text-gray-500">平均处理</div>
              <div className="font-medium">{Math.round(stats.averageProcessingTime)}h</div>
            </div>
          </div>
        </div>
      )}

      {/* 项目列表 */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Inbox className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>收集箱为空</p>
            <p className="text-sm mt-1">开始记录你的想法和任务</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedItem?.id === item.id 
                  ? 'bg-blue-50 border-blue-300' 
                  : 'bg-white hover:bg-gray-50'
              }`}
              onClick={() => setSelectedItem(item)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2">
                  <div className="mt-1">
                    {getStatusIcon(item.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{item.title}</span>
                      {getCategoryBadge(item)}
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="outline" className={`text-xs ${getPriorityColor(item.priority)}`}>
                        {item.priority}
                      </Badge>
                      {item.tags.map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {item.analysis && (
                        <span className="text-xs text-gray-500">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {item.analysis.estimatedDuration}分钟
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <span className="text-xs text-gray-500">
                    {new Date(item.capturedAt).toLocaleTimeString('zh-CN', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                  {item.analysis && (
                    <div className="flex items-center space-x-1">
                      {item.analysis.urgency > 70 && (
                        <AlertCircle className="h-3 w-3 text-red-500" />
                      )}
                      {item.analysis.importance > 70 && (
                        <Target className="h-3 w-3 text-orange-500" />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 展开的分析详情 */}
              {selectedItem?.id === item.id && showAnalysis && item.analysis && (
                <div className="mt-3 pt-3 border-t">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">复杂度:</span>
                      <span className="ml-1 font-medium">{item.analysis.complexity}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">紧急度:</span>
                      <span className="ml-1 font-medium">{item.analysis.urgency}%</span>
                    </div>
                    <div>
                      <span className="text-gray-500">重要度:</span>
                      <span className="ml-1 font-medium">{item.analysis.importance}%</span>
                    </div>
                    <div>
                      <span className="text-gray-500">情感:</span>
                      <span className="ml-1 font-medium">{item.analysis.sentiment || 'neutral'}</span>
                    </div>
                  </div>
                  
                  {item.analysis.extractedDates.length > 0 && (
                    <div className="mt-2">
                      <span className="text-gray-500">日期:</span>
                      {item.analysis.extractedDates.map((date, idx) => (
                        <span key={idx} className="ml-1">
                          {new Date(date).toLocaleDateString('zh-CN')}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {item.analysis.extractedPeople.length > 0 && (
                    <div className="mt-1">
                      <span className="text-gray-500">人物:</span>
                      <span className="ml-1">{item.analysis.extractedPeople.join(', ')}</span>
                    </div>
                  )}

                  {item.suggestions && item.suggestions.length > 0 && (
                    <div className="mt-2">
                      <div className="text-gray-500 mb-1">AI建议:</div>
                      {item.suggestions.map((suggestion, idx) => (
                        <div key={idx} className="flex items-center justify-between py-1">
                          <span>{suggestion.reason}</span>
                          <Badge variant="outline" className="text-xs">
                            {Math.round(suggestion.confidence * 100)}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 操作按钮 */}
              {selectedItem?.id === item.id && (
                <div className="mt-3 pt-3 border-t flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleTriage(item.id)
                      }}
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      分流
                    </Button>
                    {item.status === TaskStatus.ACTIONABLE && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (onTaskSchedule) {
                            onTaskSchedule(item)
                          }
                        }}
                      >
                        <Calendar className="h-3 w-3 mr-1" />
                        安排
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        // Archive
                      }}
                    >
                      <Archive className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        // Delete
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
