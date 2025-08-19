/**
 * SOP Executor - SOP执行器组件
 * 支持三种形态：Checklist、Step-by-step、Flowchart
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Play, 
  Pause, 
  X,
  ChevronRight,
  ChevronLeft,
  ListChecks,
  GitBranch,
  Layers,
  Timer,
  AlertCircle,
  CheckSquare,
  Square,
  SkipForward,
  Volume2,
  VolumeX,
  RotateCcw
} from 'lucide-react'
import SOPManager from '../../lib/services/SOPManager'
import { 
  SOP, 
  SOPType, 
  SOPExecution, 
  ChecklistSOP, 
  StepByStepSOP,
  FlowchartSOP,
  ChecklistItem,
  SOPStep,
  StepStatus
} from '../../types/sop'

interface SOPExecutorProps {
  sopId?: string
  onComplete?: (result: any) => void
  onCancel?: () => void
  autoStart?: boolean
  compact?: boolean
}

export default function SOPExecutor({ 
  sopId, 
  onComplete, 
  onCancel,
  autoStart = false,
  compact = false 
}: SOPExecutorProps) {
  const [sop, setSOP] = useState<SOP | null>(null)
  const [execution, setExecution] = useState<SOPExecution | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
  const [elapsedTime, setElapsedTime] = useState(0)
  const [enableVoice, setEnableVoice] = useState(false)
  const [showDialog, setShowDialog] = useState(false)

  // 可用的SOP列表
  const [availableSOPs, setAvailableSOPs] = useState<SOP[]>([])

  useEffect(() => {
    // 加载可用的SOP
    const sops = SOPManager.getAllSOPs()
    setAvailableSOPs(sops)

    // 如果指定了SOP ID，加载它
    if (sopId) {
      const targetSOP = SOPManager.getSOP(sopId)
      if (targetSOP) {
        setSOP(targetSOP)
        if (autoStart) {
          startExecution(targetSOP)
        }
      }
    }
  }, [sopId, autoStart])

  useEffect(() => {
    // 计时器
    let timer: NodeJS.Timeout | null = null
    if (isExecuting && !isPaused) {
      timer = setInterval(() => {
        setElapsedTime(prev => prev + 1)
      }, 1000)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [isExecuting, isPaused])

  const startExecution = async (targetSOP: SOP) => {
    const exec = await SOPManager.triggerSOP(targetSOP.id, 'manual')
    if (exec) {
      setExecution(exec)
      setIsExecuting(true)
      setShowDialog(true)
      setElapsedTime(0)

      // 语音提示
      if (enableVoice) {
        speak(`开始执行${targetSOP.name}`)
      }

      // 启动执行
      SOPManager.startExecution(exec, {
        mode: 'normal',
        ui: {
          showInModal: true,
          showNotifications: true,
          enableVoice,
          theme: 'light'
        },
        behavior: {
          allowSkip: true,
          allowPause: true,
          autoAdvance: false,
          confirmEachStep: false,
          saveProgress: true
        },
        callbacks: {
          onStepComplete: (stepId) => {
            console.log('Step completed:', stepId)
            if (targetSOP.type === SOPType.STEP_BY_STEP) {
              setCurrentStepIndex(prev => prev + 1)
            }
          },
          onComplete: (result) => {
            handleComplete(result)
          },
          onError: (error) => {
            console.error('Execution error:', error)
            setIsExecuting(false)
          }
        }
      })
    }
  }

  const handleComplete = (result: any) => {
    setIsExecuting(false)
    setIsPaused(false)
    
    if (enableVoice) {
      speak('任务完成！')
    }

    if (onComplete) {
      onComplete(result)
    }

    // 显示完成统计
    setTimeout(() => {
      setShowDialog(false)
      resetExecution()
    }, 3000)
  }

  const resetExecution = () => {
    setExecution(null)
    setCurrentStepIndex(0)
    setCheckedItems(new Set())
    setElapsedTime(0)
  }

  const pauseExecution = () => {
    if (execution) {
      SOPManager.pauseExecution(execution.id)
      setIsPaused(true)
    }
  }

  const resumeExecution = () => {
    if (execution) {
      SOPManager.resumeExecution(execution.id)
      setIsPaused(false)
    }
  }

  const cancelExecution = () => {
    if (execution) {
      SOPManager.cancelExecution(execution.id)
    }
    setIsExecuting(false)
    setShowDialog(false)
    resetExecution()
    if (onCancel) {
      onCancel()
    }
  }

  const toggleChecklistItem = (itemId: string) => {
    const newChecked = new Set(checkedItems)
    if (newChecked.has(itemId)) {
      newChecked.delete(itemId)
    } else {
      newChecked.add(itemId)
      if (enableVoice) {
        speak('已完成')
      }
    }
    setCheckedItems(newChecked)

    // 检查是否全部完成
    if (sop?.type === SOPType.CHECKLIST) {
      const checklist = sop as ChecklistSOP
      const requiredItems = checklist.completionCriteria.requiredItems
      const allRequired = requiredItems.every(id => newChecked.has(id))
      if (allRequired) {
        handleComplete({
          success: true,
          completionRate: 100
        })
      }
    }
  }

  const nextStep = () => {
    if (sop?.type === SOPType.STEP_BY_STEP) {
      const stepBySOP = sop as StepByStepSOP
      if (currentStepIndex < stepBySOP.steps.length - 1) {
        setCurrentStepIndex(prev => prev + 1)
        if (enableVoice) {
          const nextStep = stepBySOP.steps[currentStepIndex + 1]
          speak(nextStep.title)
        }
      } else {
        handleComplete({
          success: true,
          completionRate: 100
        })
      }
    }
  }

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1)
    }
  }

  const skipStep = () => {
    nextStep()
  }

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'zh-CN'
      speechSynthesis.speak(utterance)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getSOPIcon = (type: SOPType) => {
    switch (type) {
      case SOPType.CHECKLIST:
        return <ListChecks className="h-4 w-4" />
      case SOPType.STEP_BY_STEP:
        return <Layers className="h-4 w-4" />
      case SOPType.FLOWCHART:
        return <GitBranch className="h-4 w-4" />
    }
  }

  const getProgressPercentage = () => {
    if (!sop || !execution) return 0
    
    if (sop.type === SOPType.CHECKLIST) {
      const checklist = sop as ChecklistSOP
      return Math.round((checkedItems.size / checklist.items.length) * 100)
    } else if (sop.type === SOPType.STEP_BY_STEP) {
      const stepBySOP = sop as StepByStepSOP
      return Math.round(((currentStepIndex + 1) / stepBySOP.steps.length) * 100)
    }
    
    return execution.progress.percentComplete
  }

  // 渲染Checklist类型的SOP
  const renderChecklist = (checklist: ChecklistSOP) => (
    <div className="space-y-2">
      {checklist.items.map((item) => (
        <div 
          key={item.id}
          className={`flex items-start space-x-3 p-3 rounded-lg border ${
            checkedItems.has(item.id) ? 'bg-green-50 border-green-200' : 'bg-white'
          }`}
        >
          <button
            onClick={() => toggleChecklistItem(item.id)}
            className="mt-1"
          >
            {checkedItems.has(item.id) ? (
              <CheckSquare className="h-5 w-5 text-green-600" />
            ) : (
              <Square className="h-5 w-5 text-gray-400" />
            )}
          </button>
          <div className="flex-1">
            <div className="flex items-center">
              <span className={`font-medium ${checkedItems.has(item.id) ? 'line-through text-gray-500' : ''}`}>
                {item.title}
              </span>
              {item.required && (
                <Badge variant="outline" className="ml-2 text-xs">必需</Badge>
              )}
            </div>
            {item.description && (
              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
            )}
            {item.estimatedDuration && (
              <div className="flex items-center mt-1 text-xs text-gray-500">
                <Clock className="h-3 w-3 mr-1" />
                {item.estimatedDuration}秒
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )

  // 渲染Step-by-step类型的SOP
  const renderStepByStep = (stepBySOP: StepByStepSOP) => {
    const currentStep = stepBySOP.steps[currentStepIndex]
    
    return (
      <div className="space-y-4">
        {/* 进度指示器 */}
        <div className="flex items-center justify-between mb-4">
          {stepBySOP.steps.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                idx < currentStepIndex ? 'bg-green-500 text-white' :
                idx === currentStepIndex ? 'bg-blue-500 text-white' :
                'bg-gray-200 text-gray-500'
              }`}>
                {idx < currentStepIndex ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <span className="text-sm">{idx + 1}</span>
                )}
              </div>
              {idx < stepBySOP.steps.length - 1 && (
                <div className={`w-full h-1 mx-2 ${
                  idx < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* 当前步骤 */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">{currentStep.title}</h3>
              <Badge variant="outline" className="mt-1">
                步骤 {currentStepIndex + 1} / {stepBySOP.steps.length}
              </Badge>
            </div>
            {currentStep.estimatedDuration && (
              <div className="text-sm text-gray-500">
                <Clock className="h-4 w-4 inline mr-1" />
                预计 {currentStep.estimatedDuration}秒
              </div>
            )}
          </div>

          {currentStep.description && (
            <p className="text-gray-600 mb-4">{currentStep.description}</p>
          )}

          {currentStep.validation && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
                <span className="text-sm">需要验证: {currentStep.validation.criteria}</span>
              </div>
            </div>
          )}

          {/* 控制按钮 */}
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStepIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              上一步
            </Button>

            <div className="flex items-center space-x-2">
              {currentStep.optional && (
                <Button
                  variant="ghost"
                  onClick={skipStep}
                >
                  <SkipForward className="h-4 w-4 mr-1" />
                  跳过
                </Button>
              )}

              <Button
                onClick={nextStep}
              >
                {currentStepIndex === stepBySOP.steps.length - 1 ? '完成' : '下一步'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // 渲染流程图类型的SOP
  const renderFlowchart = (flowchart: FlowchartSOP) => (
    <div className="p-4 bg-gray-50 rounded-lg">
      <p className="text-center text-gray-500">流程图执行器开发中...</p>
    </div>
  )

  // 渲染SOP选择列表
  const renderSOPList = () => (
    <div className="space-y-2">
      {availableSOPs.map((availableSOP) => (
        <Card 
          key={availableSOP.id}
          className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => {
            setSOP(availableSOP)
            startExecution(availableSOP)
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getSOPIcon(availableSOP.type)}
              <div>
                <h4 className="font-medium">{availableSOP.name}</h4>
                <p className="text-sm text-gray-500">{availableSOP.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">{availableSOP.category}</Badge>
              <Badge variant="secondary">{availableSOP.priority}</Badge>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          </div>
          <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
            <span>执行{availableSOP.stats.totalExecutions}次</span>
            <span>成功率{Math.round(availableSOP.stats.successRate)}%</span>
            <span>平均{Math.round(availableSOP.stats.averageDuration / 60)}分钟</span>
          </div>
        </Card>
      ))}
    </div>
  )

  if (compact) {
    // 紧凑模式
    return (
      <Card className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="h-4 w-4" />
            <span className="text-sm font-medium">SOP执行</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowDialog(true)}
          >
            <Play className="h-3 w-3 mr-1" />
            开始
          </Button>
        </div>
        
        {isExecuting && execution && (
          <div className="mt-2">
            <div className="text-xs text-gray-600">{sop?.name}</div>
            <div className="flex items-center justify-between mt-1">
              <div className="text-xs">进度: {getProgressPercentage()}%</div>
              <div className="text-xs">{formatTime(elapsedTime)}</div>
            </div>
          </div>
        )}

        {/* 执行对话框 */}
        {renderExecutionDialog()}
      </Card>
    )
  }

  // 完整模式
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Layers className="h-5 w-5 mr-2" />
          SOP执行器
        </h3>
        {isExecuting && (
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant={enableVoice ? 'default' : 'outline'}
              onClick={() => setEnableVoice(!enableVoice)}
            >
              {enableVoice ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
            </Button>
            <Badge variant="outline">
              <Timer className="h-3 w-3 mr-1" />
              {formatTime(elapsedTime)}
            </Badge>
          </div>
        )}
      </div>

      {!sop && !isExecuting && (
        <div>
          <p className="text-sm text-gray-600 mb-3">选择一个SOP开始执行:</p>
          {renderSOPList()}
        </div>
      )}

      {sop && !isExecuting && (
        <div>
          <Card className="p-4 mb-4 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium flex items-center">
                  {getSOPIcon(sop.type)}
                  <span className="ml-2">{sop.name}</span>
                </h4>
                <p className="text-sm text-gray-600 mt-1">{sop.description}</p>
              </div>
              <Button onClick={() => startExecution(sop)}>
                <Play className="h-4 w-4 mr-1" />
                开始执行
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* 执行对话框 */}
      {renderExecutionDialog()}
    </Card>
  )

  function renderExecutionDialog() {
    if (!showDialog || !sop || !execution) return null

    return (
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center">
                {getSOPIcon(sop.type)}
                <span className="ml-2">{sop.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                {isPaused ? (
                  <Button size="sm" variant="outline" onClick={resumeExecution}>
                    <Play className="h-3 w-3 mr-1" />
                    继续
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={pauseExecution}>
                    <Pause className="h-3 w-3 mr-1" />
                    暂停
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={cancelExecution}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </DialogTitle>
            <DialogDescription>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-4">
                  <Badge variant="outline">
                    进度 {getProgressPercentage()}%
                  </Badge>
                  <span className="text-sm text-gray-500">
                    <Timer className="h-3 w-3 inline mr-1" />
                    {formatTime(elapsedTime)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant={enableVoice ? 'default' : 'outline'}
                    onClick={() => setEnableVoice(!enableVoice)}
                  >
                    {enableVoice ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
              
              {/* 进度条 */}
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {sop.type === SOPType.CHECKLIST && renderChecklist(sop as ChecklistSOP)}
            {sop.type === SOPType.STEP_BY_STEP && renderStepByStep(sop as StepByStepSOP)}
            {sop.type === SOPType.FLOWCHART && renderFlowchart(sop as FlowchartSOP)}
          </div>

          {/* 完成状态 */}
          {execution.status === 'completed' && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                <span className="font-medium text-green-800">执行完成！</span>
              </div>
              {execution.result && (
                <div className="mt-2 text-sm text-gray-600">
                  <p>完成率: {execution.result.completionRate}%</p>
                  <p>用时: {formatTime(elapsedTime)}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    )
  }
}