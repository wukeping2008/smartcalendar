/**
 * What-If Simulator Panel Component
 * 决策模拟器面板组件
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '../../src/components/ui/card'
import { Button } from '../../src/components/ui/button'
import { Badge } from '../../src/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../src/components/ui/tabs'
import { ScrollArea } from '../../src/components/ui/scroll-area'
import { Input } from '../../src/components/ui/input'
import { Label } from '../../src/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../src/components/ui/select'
import { Slider } from '../../src/components/ui/slider'
import { Switch } from '../../src/components/ui/switch'
import { Progress } from '../../src/components/ui/progress'
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  Save,
  Download,
  Upload,
  Zap,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  BarChart3,
  Target,
  Clock,
  Users,
  Calendar,
  GitBranch,
  Layers,
  Settings,
  ChevronRight,
  ChevronDown,
  Activity,
  Brain,
  Heart,
  DollarSign,
  Sparkles
} from 'lucide-react'
import FeatureGuide from '../help/FeatureGuide'
import {
  WhatIfScenario,
  ScenarioChange,
  ChangeType,
  ChangeTarget,
  SimulationMode,
  SimulationResult,
  WhatIfPreset,
  ScenarioComparison
} from '../../types/whatif'
import { whatIfSimulator } from '../../lib/services/WhatIfSimulator'
import { Event, EventCategory, Priority } from '../../types/event'
import { useEventStore } from '../../lib/stores/event-store'

interface WhatIfSimulatorPanelProps {
  className?: string
  compact?: boolean
}

export default function WhatIfSimulatorPanel({
  className = '',
  compact = false
}: WhatIfSimulatorPanelProps) {
  const [activeScenario, setActiveScenario] = useState<WhatIfScenario | null>(null)
  const [scenarios, setScenarios] = useState<WhatIfScenario[]>([])
  const [presets, setPresets] = useState<WhatIfPreset[]>([])
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null)
  const [isSimulating, setIsSimulating] = useState(false)
  const [selectedMode, setSelectedMode] = useState<SimulationMode>(SimulationMode.STANDARD)
  const [activeTab, setActiveTab] = useState('scenarios')
  const [showAddChange, setShowAddChange] = useState(false)
  const [comparison, setComparison] = useState<ScenarioComparison | null>(null)
  
  // 新建场景表单
  const [newScenarioName, setNewScenarioName] = useState('')
  const [newScenarioDescription, setNewScenarioDescription] = useState('')
  
  // 新增变更表单
  const [changeType, setChangeType] = useState<ChangeType>(ChangeType.ADD)
  const [changeTarget, setChangeTarget] = useState<ChangeTarget>(ChangeTarget.EVENT)
  const [changeDescription, setChangeDescription] = useState('')

  useEffect(() => {
    loadScenarios()
    loadPresets()
  }, [])

  const loadScenarios = () => {
    const allScenarios = whatIfSimulator.getAllScenarios()
    setScenarios(allScenarios)
    
    const active = whatIfSimulator.getActiveScenario()
    if (active) {
      setActiveScenario(active)
    }
  }

  const loadPresets = () => {
    const allPresets = whatIfSimulator.getPresets()
    setPresets(allPresets)
  }

  const handleCreateScenario = async () => {
    if (!newScenarioName) return
    
    const scenario = await whatIfSimulator.createScenario(
      newScenarioName,
      newScenarioDescription
    )
    
    setActiveScenario(scenario)
    setNewScenarioName('')
    setNewScenarioDescription('')
    loadScenarios()
  }

  const handleApplyPreset = async (presetId: string) => {
    try {
      const scenario = await whatIfSimulator.applyPreset(presetId)
      setActiveScenario(scenario)
      loadScenarios()
      
      // 自动运行模拟
      await handleRunSimulation(scenario.id)
    } catch (error) {
      // Failed to apply preset
    }
  }

  const handleAddChange = () => {
    if (!activeScenario || !changeDescription) return
    
    const change: ScenarioChange = {
      id: `change_${Date.now()}`,
      type: changeType,
      target: changeTarget,
      action: {},
      params: {},
      description: changeDescription,
      expectedImpact: '待模拟分析'
    }
    
    whatIfSimulator.addChange(activeScenario.id, change)
    setChangeDescription('')
    setShowAddChange(false)
    loadScenarios()
  }

  const handleRunSimulation = async (scenarioId?: string) => {
    const id = scenarioId || activeScenario?.id
    if (!id) return
    
    setIsSimulating(true)
    try {
      const result = await whatIfSimulator.runSimulation(id, selectedMode)
      setSimulationResult(result)
      
      if (result.success) {
        setActiveScenario(result.scenario)
        loadScenarios()
      }
    } catch (error) {
      // Simulation failed
    } finally {
      setIsSimulating(false)
    }
  }

  const handleApplyScenario = async () => {
    if (!activeScenario || activeScenario.status !== 'simulated') return
    
    const success = await whatIfSimulator.applyScenario(activeScenario.id)
    if (success) {
      loadScenarios()
      // 刷新事件列表
      useEventStore.getState().loadEvents()
    }
  }

  const handleCompareScenarios = async (scenarioIds: string[]) => {
    if (scenarioIds.length < 2) return
    
    try {
      const result = await whatIfSimulator.compareScenarios(scenarioIds)
      setComparison(result)
      setActiveTab('comparison')
    } catch (error) {
      // Comparison failed
    }
  }

  const getChangeTypeIcon = (type: ChangeType) => {
    switch (type) {
      case ChangeType.ADD: return <Plus className="w-4 h-4" />
      case ChangeType.REMOVE: return <Trash2 className="w-4 h-4" />
      case ChangeType.MODIFY: return <Settings className="w-4 h-4" />
      case ChangeType.RESCHEDULE: return <Clock className="w-4 h-4" />
      case ChangeType.DELEGATE: return <Users className="w-4 h-4" />
      case ChangeType.SPLIT: return <GitBranch className="w-4 h-4" />
      case ChangeType.MERGE: return <Layers className="w-4 h-4" />
      case ChangeType.AUTOMATE: return <Zap className="w-4 h-4" />
      default: return <Info className="w-4 h-4" />
    }
  }

  const getImpactColor = (impact: string) => {
    if (impact.includes('positive') || impact.includes('改善')) return 'text-green-600'
    if (impact.includes('negative') || impact.includes('恶化')) return 'text-red-600'
    return 'text-gray-600'
  }

  const getScoreGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-green-500'
      case 'B': return 'bg-blue-500'
      case 'C': return 'bg-yellow-500'
      case 'D': return 'bg-orange-500'
      case 'F': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  if (compact) {
    // 紧凑模式
    return (
      <Card className={`p-4 ${className}`}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold">What-If 模拟器</h3>
            </div>
            {activeScenario && (
              <Badge variant="outline">{activeScenario.status}</Badge>
            )}
          </div>

          {activeScenario ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">{activeScenario.name}</p>
              <p className="text-xs text-gray-600">{activeScenario.description}</p>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleRunSimulation()}
                  disabled={isSimulating}
                >
                  {isSimulating ? (
                    <><Pause className="w-3 h-3 mr-1" />模拟中</>
                  ) : (
                    <><Play className="w-3 h-3 mr-1" />运行模拟</>
                  )}
                </Button>
                
                {activeScenario.status === 'simulated' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleApplyScenario}
                  >
                    应用方案
                  </Button>
                )}
              </div>

              {activeScenario.score && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-600">效率:</span>
                    <span className="ml-1 font-medium">{activeScenario.score.efficiency}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">可行性:</span>
                    <span className="ml-1 font-medium">{activeScenario.score.feasibility}%</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 mb-2">暂无活动场景</p>
              <Button size="sm" onClick={() => setShowAddChange(true)}>
                创建场景
              </Button>
            </div>
          )}
        </div>
      </Card>
    )
  }

  // 完整模式
  return (
    <Card className={className}>
      <div className="p-4 border-b">
        <FeatureGuide
          title="What-If 决策模拟器"
          steps={[
            '在“场景管理”标签页创建一个新场景，为您的模拟命名。',
            '为当前场景添加不同的“变更”，例如：添加/删除事件、重新安排任务等。',
            '选择一个模拟模式（快速、标准或深度）并点击“运行模拟”按钮。',
            '在“模拟结果”标签页查看AI对您的场景的详细分析，包括对效率、时间和冲突的影响。',
            '如果对结果满意，可以点击“应用到实际”将模拟的变更应用到您的真实日历中。',
            '在“方案对比”中可以比较不同模拟场景的优劣。'
          ]}
        />
      </div>
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">What-If 决策模拟器</h2>
              <p className="text-sm text-gray-600">模拟不同决策的影响，找到最优方案</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Select value={selectedMode} onValueChange={(v) => setSelectedMode(v as SimulationMode)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SimulationMode.QUICK}>快速模式</SelectItem>
                <SelectItem value={SimulationMode.STANDARD}>标准模式</SelectItem>
                <SelectItem value={SimulationMode.DEEP}>深度分析</SelectItem>
                <SelectItem value={SimulationMode.MONTE_CARLO}>蒙特卡洛</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              onClick={() => handleRunSimulation()}
              disabled={!activeScenario || isSimulating}
            >
              {isSimulating ? (
                <><Pause className="w-4 h-4 mr-2" />模拟中...</>
              ) : (
                <><Play className="w-4 h-4 mr-2" />运行模拟</>
              )}
            </Button>
          </div>
        </div>

        {/* 快速预设 */}
        <div className="flex gap-2 flex-wrap">
          {presets.map(preset => (
            <Button
              key={preset.id}
              size="sm"
              variant="outline"
              onClick={() => handleApplyPreset(preset.id)}
              className="text-xs"
            >
              <span className="mr-1">{preset.icon}</span>
              {preset.name}
            </Button>
          ))}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start px-6 pt-4">
          <TabsTrigger value="scenarios">场景管理</TabsTrigger>
          <TabsTrigger value="simulation">模拟结果</TabsTrigger>
          <TabsTrigger value="comparison">方案对比</TabsTrigger>
          <TabsTrigger value="insights">智能洞察</TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[600px]">
          <div className="p-6">
            {/* 场景管理 */}
            <TabsContent value="scenarios" className="space-y-6 mt-0">
              {/* 创建新场景 */}
              <Card className="p-4 bg-gray-50">
                <h3 className="font-semibold mb-3">创建新场景</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="scenario-name">场景名称</Label>
                    <Input
                      id="scenario-name"
                      value={newScenarioName}
                      onChange={(e) => setNewScenarioName(e.target.value)}
                      placeholder="例如：专注核心任务"
                    />
                  </div>
                  <div>
                    <Label htmlFor="scenario-desc">场景描述</Label>
                    <Input
                      id="scenario-desc"
                      value={newScenarioDescription}
                      onChange={(e) => setNewScenarioDescription(e.target.value)}
                      placeholder="描述这个场景的目标和策略"
                    />
                  </div>
                  <Button onClick={handleCreateScenario} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    创建场景
                  </Button>
                </div>
              </Card>

              {/* 场景列表 */}
              <div>
                <h3 className="font-semibold mb-3">场景列表</h3>
                <div className="space-y-3">
                  {scenarios.map(scenario => (
                    <Card
                      key={scenario.id}
                      className={`p-4 cursor-pointer transition-all ${
                        activeScenario?.id === scenario.id ? 'ring-2 ring-purple-500' : ''
                      }`}
                      onClick={() => setActiveScenario(scenario)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{scenario.name}</h4>
                          <p className="text-sm text-gray-600">{scenario.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            scenario.status === 'applied' ? 'default' :
                            scenario.status === 'simulated' ? 'secondary' : 'outline'
                          }>
                            {scenario.status === 'draft' ? '草稿' :
                             scenario.status === 'simulated' ? '已模拟' :
                             scenario.status === 'applied' ? '已应用' : '已归档'}
                          </Badge>
                          {scenario.score && (
                            <div className={`px-2 py-1 rounded text-white text-xs font-bold ${
                              getScoreGradeColor(scenario.score.grade)
                            }`}>
                              {scenario.score.grade}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 变更列表 */}
                      {scenario.changes.length > 0 && (
                        <div className="mt-3 space-y-1">
                          <p className="text-xs text-gray-500">包含 {scenario.changes.length} 项变更:</p>
                          {scenario.changes.slice(0, 3).map(change => (
                            <div key={change.id} className="flex items-center gap-2 text-xs">
                              {getChangeTypeIcon(change.type)}
                              <span className="truncate">{change.description}</span>
                            </div>
                          ))}
                          {scenario.changes.length > 3 && (
                            <p className="text-xs text-gray-400">...还有 {scenario.changes.length - 3} 项</p>
                          )}
                        </div>
                      )}

                      {/* 影响预览 */}
                      {scenario.impact && scenario.status === 'simulated' && (
                        <div className="mt-3 pt-3 border-t grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-gray-600">时间:</span>
                            <span className={`ml-1 font-medium ${
                              scenario.impact.timeImpact.netChange < 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {scenario.impact.timeImpact.netChange > 0 ? '+' : ''}
                              {scenario.impact.timeImpact.netChange.toFixed(1)}h
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">效率:</span>
                            <span className={`ml-1 font-medium ${
                              scenario.impact.productivityImpact.change > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {scenario.impact.productivityImpact.change > 0 ? '+' : ''}
                              {scenario.impact.productivityImpact.change.toFixed(0)}%
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">冲突:</span>
                            <span className={`ml-1 font-medium ${
                              scenario.impact.conflictImpact.netChange <= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {scenario.impact.conflictImpact.netChange}
                            </span>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>

              {/* 添加变更 */}
              {activeScenario && (
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">场景变更</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAddChange(!showAddChange)}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      添加变更
                    </Button>
                  </div>

                  {showAddChange && (
                    <div className="space-y-3 mb-4 p-4 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>变更类型</Label>
                          <Select value={changeType} onValueChange={(v) => setChangeType(v as ChangeType)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={ChangeType.ADD}>添加</SelectItem>
                              <SelectItem value={ChangeType.REMOVE}>删除</SelectItem>
                              <SelectItem value={ChangeType.MODIFY}>修改</SelectItem>
                              <SelectItem value={ChangeType.RESCHEDULE}>重新安排</SelectItem>
                              <SelectItem value={ChangeType.DELEGATE}>委派</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>目标类型</Label>
                          <Select value={changeTarget} onValueChange={(v) => setChangeTarget(v as ChangeTarget)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={ChangeTarget.EVENT}>事件</SelectItem>
                              <SelectItem value={ChangeTarget.TASK}>任务</SelectItem>
                              <SelectItem value={ChangeTarget.TIME_BUDGET}>时间预算</SelectItem>
                              <SelectItem value={ChangeTarget.PRIORITY}>优先级</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label>变更描述</Label>
                        <Input
                          value={changeDescription}
                          onChange={(e) => setChangeDescription(e.target.value)}
                          placeholder="描述这个变更的具体内容"
                        />
                      </div>
                      <Button onClick={handleAddChange} className="w-full">
                        确认添加
                      </Button>
                    </div>
                  )}

                  <div className="space-y-2">
                    {activeScenario.changes.map(change => (
                      <div key={change.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {getChangeTypeIcon(change.type)}
                          <div>
                            <p className="text-sm font-medium">{change.description}</p>
                            <p className="text-xs text-gray-600">{change.expectedImpact}</p>
                          </div>
                        </div>
                        {change.actualImpact && (
                          <Badge variant={
                            change.actualImpact.riskLevel === 'low' ? 'default' :
                            change.actualImpact.riskLevel === 'medium' ? 'secondary' :
                            'destructive'
                          }>
                            {change.actualImpact.scope}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </TabsContent>

            {/* 模拟结果 */}
            <TabsContent value="simulation" className="space-y-6 mt-0">
              {simulationResult ? (
                <>
                  {/* 总体评估 */}
                  <Card className="p-4 bg-gradient-to-r from-purple-50 to-blue-50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-lg">模拟结果</h3>
                      <Badge variant={simulationResult.success ? 'default' : 'destructive'}>
                        {simulationResult.success ? '成功' : '失败'}
                      </Badge>
                    </div>

                    {simulationResult.scenario.impact && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* 时间影响 */}
                        <div className="text-center">
                          <Clock className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                          <p className="text-sm text-gray-600">时间变化</p>
                          <p className={`text-xl font-bold ${
                            simulationResult.scenario.impact.timeImpact.netChange < 0 
                              ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {simulationResult.scenario.impact.timeImpact.netChange > 0 ? '+' : ''}
                            {simulationResult.scenario.impact.timeImpact.netChange.toFixed(1)}h
                          </p>
                        </div>

                        {/* 效率影响 */}
                        <div className="text-center">
                          <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-500" />
                          <p className="text-sm text-gray-600">效率提升</p>
                          <p className={`text-xl font-bold ${
                            simulationResult.scenario.impact.productivityImpact.change > 0 
                              ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {simulationResult.scenario.impact.productivityImpact.change > 0 ? '+' : ''}
                            {simulationResult.scenario.impact.productivityImpact.change.toFixed(0)}%
                          </p>
                        </div>

                        {/* 冲突变化 */}
                        <div className="text-center">
                          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                          <p className="text-sm text-gray-600">冲突变化</p>
                          <p className={`text-xl font-bold ${
                            simulationResult.scenario.impact.conflictImpact.netChange <= 0 
                              ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {simulationResult.scenario.impact.conflictImpact.netChange > 0 ? '+' : ''}
                            {simulationResult.scenario.impact.conflictImpact.netChange}
                          </p>
                        </div>

                        {/* 压力水平 */}
                        <div className="text-center">
                          <Heart className="w-8 h-8 mx-auto mb-2 text-red-500" />
                          <p className="text-sm text-gray-600">压力水平</p>
                          <p className={`text-xl font-bold ${
                            simulationResult.scenario.impact.stressImpact.change <= 0 
                              ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {simulationResult.scenario.impact.stressImpact.newLevel}/10
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 总体建议 */}
                    {simulationResult.scenario.impact?.overallAssessment && (
                      <div className="mt-4 p-4 bg-white rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">AI 建议</span>
                          <Badge variant={
                            simulationResult.scenario.impact.overallAssessment.recommendation === 'strongly_recommend' ? 'default' :
                            simulationResult.scenario.impact.overallAssessment.recommendation === 'recommend' ? 'secondary' :
                            simulationResult.scenario.impact.overallAssessment.recommendation === 'neutral' ? 'outline' :
                            'destructive'
                          }>
                            {simulationResult.scenario.impact.overallAssessment.recommendation === 'strongly_recommend' ? '强烈推荐' :
                             simulationResult.scenario.impact.overallAssessment.recommendation === 'recommend' ? '推荐' :
                             simulationResult.scenario.impact.overallAssessment.recommendation === 'neutral' ? '中立' :
                             simulationResult.scenario.impact.overallAssessment.recommendation === 'not_recommend' ? '不推荐' : '强烈反对'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {simulationResult.scenario.impact.overallAssessment.reasoning}
                        </p>
                        <div className="mt-2">
                          <span className="text-xs text-gray-500">置信度: </span>
                          <Progress value={simulationResult.scenario.impact.overallAssessment.confidence} className="h-2 mt-1" />
                        </div>
                      </div>
                    )}
                  </Card>

                  {/* 评分卡 */}
                  {simulationResult.scenario.score && (
                    <Card className="p-4">
                      <h3 className="font-semibold mb-4">场景评分</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">效率</span>
                          <div className="flex items-center gap-2">
                            <Progress value={simulationResult.scenario.score.efficiency} className="w-32 h-2" />
                            <span className="text-sm font-medium w-12">{simulationResult.scenario.score.efficiency}%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">平衡</span>
                          <div className="flex items-center gap-2">
                            <Progress value={simulationResult.scenario.score.balance} className="w-32 h-2" />
                            <span className="text-sm font-medium w-12">{simulationResult.scenario.score.balance}%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">可行性</span>
                          <div className="flex items-center gap-2">
                            <Progress value={simulationResult.scenario.score.feasibility} className="w-32 h-2" />
                            <span className="text-sm font-medium w-12">{simulationResult.scenario.score.feasibility}%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">可持续性</span>
                          <div className="flex items-center gap-2">
                            <Progress value={simulationResult.scenario.score.sustainability} className="w-32 h-2" />
                            <span className="text-sm font-medium w-12">{simulationResult.scenario.score.sustainability}%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">目标对齐</span>
                          <div className="flex items-center gap-2">
                            <Progress value={simulationResult.scenario.score.goalAlignment} className="w-32 h-2" />
                            <span className="text-sm font-medium w-12">{simulationResult.scenario.score.goalAlignment}%</span>
                          </div>
                        </div>
                        
                        <div className="pt-3 border-t flex items-center justify-between">
                          <span className="font-medium">综合得分</span>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold">{simulationResult.scenario.score.overall.toFixed(0)}</span>
                            <div className={`px-3 py-1 rounded text-white font-bold ${
                              getScoreGradeColor(simulationResult.scenario.score.grade)
                            }`}>
                              {simulationResult.scenario.score.grade}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* 推荐行动 */}
                  {simulationResult.scenario.recommendations && simulationResult.scenario.recommendations.length > 0 && (
                    <Card className="p-4">
                      <h3 className="font-semibold mb-4">推荐行动</h3>
                      <div className="space-y-3">
                        {simulationResult.scenario.recommendations.map(rec => (
                          <div key={rec.id} className="border rounded-lg p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {rec.type === 'action' ? <Zap className="w-4 h-4 text-blue-500" /> :
                                 rec.type === 'warning' ? <AlertTriangle className="w-4 h-4 text-orange-500" /> :
                                 <Info className="w-4 h-4 text-gray-500" />}
                                <span className="font-medium">{rec.title}</span>
                              </div>
                              <Badge variant={
                                rec.priority === 'high' ? 'destructive' :
                                rec.priority === 'medium' ? 'default' : 'secondary'
                              }>
                                {rec.priority === 'high' ? '高' :
                                 rec.priority === 'medium' ? '中' : '低'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>预期收益: {rec.expectedBenefit}</span>
                              <span>难度: {rec.difficulty === 'easy' ? '简单' :
                                         rec.difficulty === 'moderate' ? '中等' : '困难'}</span>
                              <span>耗时: {rec.timeRequired}分钟</span>
                            </div>
                            {rec.suggestedAction && (
                              <Button size="sm" variant="outline" className="mt-2">
                                执行建议
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* 风险警告 */}
                  {simulationResult.scenario.simulatedState.risks && 
                   simulationResult.scenario.simulatedState.risks.length > 0 && (
                    <Card className="p-4 bg-red-50">
                      <h3 className="font-semibold mb-4 text-red-700">风险警告</h3>
                      <div className="space-y-2">
                        {simulationResult.scenario.simulatedState.risks.map(risk => (
                          <div key={risk.id} className="flex items-start gap-3">
                            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{risk.description}</p>
                              <p className="text-xs text-gray-600 mt-1">{risk.mitigation}</p>
                              <div className="flex items-center gap-3 mt-1 text-xs">
                                <span>概率: {(risk.probability * 100).toFixed(0)}%</span>
                                <span>影响: {risk.impact}/10</span>
                                <span className="font-medium">风险分: {risk.score.toFixed(1)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* 应用按钮 */}
                  {simulationResult.success && simulationResult.scenario.status === 'simulated' && (
                    <div className="flex justify-end gap-3">
                      <Button variant="outline">
                        <Save className="w-4 h-4 mr-2" />
                        保存方案
                      </Button>
                      <Button onClick={handleApplyScenario}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        应用到实际
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <Brain className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">请先运行模拟查看结果</p>
                </div>
              )}
            </TabsContent>

            {/* 方案对比 */}
            <TabsContent value="comparison" className="space-y-6 mt-0">
              {comparison ? (
                <>
                  <Card className="p-4">
                    <h3 className="font-semibold mb-4">方案对比结果</h3>
                    <div className="mb-4 p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">获胜方案</span>
                        <span className="text-lg font-bold text-green-600">{comparison.winner.name}</span>
                      </div>
                    </div>

                    {/* 维度对比 */}
                    <div className="space-y-3">
                      {comparison.dimensions.map(dim => (
                        <div key={dim.name} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{dim.name}</span>
                            <span className="text-sm text-gray-500">权重: {(dim.weight * 100).toFixed(0)}%</span>
                          </div>
                          <div className="space-y-2">
                            {Array.from(dim.scores.entries()).map(([id, score]) => {
                              const scenario = comparison.scenarios.find(s => s.id === id)
                              return (
                                <div key={id} className="flex items-center justify-between">
                                  <span className="text-sm">{scenario?.name}</span>
                                  <div className="flex items-center gap-2">
                                    <Progress value={score} className="w-24 h-2" />
                                    <span className="text-sm font-medium w-12">{score.toFixed(0)}%</span>
                                    {dim.winner === id && (
                                      <CheckCircle className="w-4 h-4 text-green-500" />
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* 决策矩阵 */}
                  {comparison.decisionMatrix && (
                    <Card className="p-4">
                      <h3 className="font-semibold mb-4">决策矩阵</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">方案</th>
                              {comparison.decisionMatrix.criteria.map(c => (
                                <th key={c} className="text-center p-2">{c}</th>
                              ))}
                              <th className="text-center p-2 font-bold">总分</th>
                            </tr>
                          </thead>
                          <tbody>
                            {comparison.decisionMatrix.alternatives.map((alt, i) => (
                              <tr key={alt} className="border-b">
                                <td className="p-2 font-medium">{alt}</td>
                                {comparison.decisionMatrix.scores[i].map((score, j) => (
                                  <td key={j} className="text-center p-2">{score.toFixed(0)}</td>
                                ))}
                                <td className="text-center p-2 font-bold">
                                  {comparison.decisionMatrix.weightedScores[i].toFixed(0)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500 mb-4">选择要对比的场景</p>
                  <Button 
                    onClick={() => {
                      const selectedIds = scenarios
                        .filter(s => s.status === 'simulated')
                        .slice(0, 3)
                        .map(s => s.id)
                      if (selectedIds.length >= 2) {
                        handleCompareScenarios(selectedIds)
                      }
                    }}
                    disabled={scenarios.filter(s => s.status === 'simulated').length < 2}
                  >
                    对比已模拟场景
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* 智能洞察 */}
            <TabsContent value="insights" className="space-y-6 mt-0">
              {activeScenario && activeScenario.status === 'simulated' ? (
                <>
                  {/* 关键洞察 */}
                  <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      <h3 className="font-semibold">AI 洞察分析</h3>
                    </div>
                    
                    <div className="space-y-4">
                      {/* 效率分析 */}
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Activity className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium mb-1">效率提升潜力</p>
                          <p className="text-sm text-gray-600">
                            当前方案可以提升 {activeScenario.impact?.productivityImpact.changePercent.toFixed(0)}% 的生产效率，
                            主要通过{activeScenario.impact?.timeImpact.savedHours > 0 ? '减少低价值活动' : '优化时间分配'}实现。
                          </p>
                        </div>
                      </div>

                      {/* 风险评估 */}
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <AlertTriangle className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium mb-1">主要风险点</p>
                          <p className="text-sm text-gray-600">
                            {activeScenario.simulatedState.risks.length > 0 
                              ? `发现 ${activeScenario.simulatedState.risks.length} 个风险点，建议重点关注${
                                  activeScenario.simulatedState.risks[0]?.category === 'deadline' ? '截止日期管理' :
                                  activeScenario.simulatedState.risks[0]?.category === 'overload' ? '工作负载平衡' :
                                  activeScenario.simulatedState.risks[0]?.category === 'health' ? '健康和休息' : '质量控制'
                                }`
                              : '当前方案风险可控，执行难度较低'}
                          </p>
                        </div>
                      </div>

                      {/* 改进建议 */}
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Target className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium mb-1">优化建议</p>
                          <p className="text-sm text-gray-600">
                            {activeScenario.score?.overall > 80 
                              ? '方案整体优秀，建议直接实施并持续监控效果'
                              : activeScenario.score?.overall > 60
                              ? '方案基本可行，建议进一步优化时间安排和资源分配'
                              : '方案需要重大调整，建议重新评估目标和约束条件'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* 趋势预测 */}
                  <Card className="p-4">
                    <h3 className="font-semibold mb-4">趋势预测</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-500" />
                        <p className="text-sm text-gray-600">一周后效率</p>
                        <p className="text-xl font-bold">
                          +{((activeScenario.impact?.productivityImpact.changePercent || 0) * 1.5).toFixed(0)}%
                        </p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <Clock className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                        <p className="text-sm text-gray-600">月度节省时间</p>
                        <p className="text-xl font-bold">
                          {((activeScenario.impact?.timeImpact.savedHours || 0) * 20).toFixed(0)}h
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* 行动计划 */}
                  <Card className="p-4">
                    <h3 className="font-semibold mb-4">执行路线图</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                          1
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">立即执行</p>
                          <p className="text-sm text-gray-600">应用高优先级变更，解决紧急冲突</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-400 text-white flex items-center justify-center text-sm font-bold">
                          2
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">24小时内</p>
                          <p className="text-sm text-gray-600">调整日程安排，通知相关人员</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-300 text-white flex items-center justify-center text-sm font-bold">
                          3
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">本周内</p>
                          <p className="text-sm text-gray-600">监控执行效果，收集反馈并优化</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </>
              ) : (
                <div className="text-center py-12">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">运行模拟后查看智能洞察</p>
                </div>
              )}
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </Card>
  )
}
