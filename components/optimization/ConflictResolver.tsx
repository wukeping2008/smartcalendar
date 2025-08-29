'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '../../src/components/ui/button'
import { Card } from '../../src/components/ui/card'
import { useEventStore } from '../../lib/stores/event-store'
import { ScheduleOptimizer, ConflictResolution, ResolutionSolution } from '../../lib/engines/ScheduleOptimizer'

interface ConflictResolverProps {
  className?: string
}

export default function ConflictResolver({ className = "" }: ConflictResolverProps) {
  const { events, updateEvent } = useEventStore()
  const [conflicts, setConflicts] = useState<ConflictResolution[]>([])
  const [selectedConflict, setSelectedConflict] = useState<ConflictResolution | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // 分析冲突
  const analyzeConflicts = async () => {
    setIsAnalyzing(true)
    try {
      const optimizer = new ScheduleOptimizer(events)
      const detectedConflicts = optimizer.detectConflicts()
      setConflicts(detectedConflicts)
    } catch (error) {
      // 冲突分析失败
    } finally {
      setIsAnalyzing(false)
    }
  }

  // 自动分析
  useEffect(() => {
    if (events.length > 0) {
      analyzeConflicts()
    }
  }, [events])

  // 应用解决方案
  const applySolution = async (solution: ResolutionSolution) => {
    try {
      // 应用所有变更
      for (const change of solution.changes) {
        updateEvent(change.eventId, {
          [change.field]: change.newValue
        })
      }

      // 重新分析冲突
      await analyzeConflicts()
      
      // 清除选中的冲突
      setSelectedConflict(null)
    } catch (error) {
      // 应用解决方案失败
    }
  }

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'high': return 'bg-orange-500/20 text-orange-300 border-orange-500/30'  
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'low': return 'bg-green-500/20 text-green-300 border-green-500/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const getConflictIcon = (type: string): string => {
    switch (type) {
      case 'time_overlap': return '⏰'
      case 'energy_overload': return '⚡'
      case 'market_conflict': return '🛡️'
      default: return '⚠️'
    }
  }

  const getConflictTitle = (type: string): string => {
    switch (type) {
      case 'time_overlap': return '时间冲突'
      case 'energy_overload': return '精力过载'
      case 'market_conflict': return '市场冲突'
      default: return '未知冲突'
    }
  }

  const getImpactColor = (impact: string): string => {
    switch (impact) {
      case 'minimal': return 'text-green-400'
      case 'moderate': return 'text-yellow-400'
      case 'significant': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 头部控制 */}
      <Card className="bg-black/30 border-white/20 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold">智能冲突检测</h3>
          <Button
            size="sm"
            onClick={analyzeConflicts}
            disabled={isAnalyzing}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            {isAnalyzing ? '分析中...' : '🔍 重新分析'}
          </Button>
        </div>

        {/* 冲突统计 */}
        <div className="grid grid-cols-4 gap-3 text-sm">
          <div className="text-center">
            <div className="text-white font-semibold">{conflicts.length}</div>
            <div className="text-gray-400">总冲突</div>
          </div>
          <div className="text-center">
            <div className="text-red-400 font-semibold">
              {conflicts.filter(c => c.severity === 'critical' || c.severity === 'high').length}
            </div>
            <div className="text-gray-400">高危</div>
          </div>
          <div className="text-center">
            <div className="text-yellow-400 font-semibold">
              {conflicts.filter(c => c.severity === 'medium').length}
            </div>
            <div className="text-gray-400">中等</div>
          </div>
          <div className="text-center">
            <div className="text-green-400 font-semibold">
              {conflicts.filter(c => c.severity === 'low').length}
            </div>
            <div className="text-gray-400">轻微</div>
          </div>
        </div>
      </Card>

      {/* 冲突列表 */}
      {conflicts.length > 0 ? (
        <Card className="bg-black/30 border-white/20 p-4">
          <h3 className="text-white font-semibold mb-4">检测到的冲突</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {conflicts.map((conflict) => (
              <div
                key={conflict.conflictId}
                className={`p-3 border rounded-lg cursor-pointer transition-all hover:bg-black/40 ${
                  selectedConflict?.conflictId === conflict.conflictId
                    ? 'bg-cyan-600/20 border-cyan-500'
                    : `border-white/20 ${getSeverityColor(conflict.severity)}`
                }`}
                onClick={() => setSelectedConflict(conflict)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getConflictIcon(conflict.conflictType)}</span>
                    <span className="text-white font-medium">
                      {getConflictTitle(conflict.conflictType)}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded border ${getSeverityColor(conflict.severity)}`}>
                    {conflict.severity === 'critical' ? '危急' :
                     conflict.severity === 'high' ? '严重' :
                     conflict.severity === 'medium' ? '中等' : '轻微'}
                  </span>
                </div>

                <div className="text-sm text-gray-300 mb-2">
                  影响事件: {conflict.affectedEvents.map(e => e.title).join(', ')}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-400">
                    {conflict.solutions.length} 个解决方案
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-cyan-300">
                      推荐置信度: {conflict.recommendation ? Math.round(conflict.recommendation.confidence * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card className="bg-black/30 border-white/20 p-6 text-center">
          <div className="text-4xl mb-2">✅</div>
          <h3 className="text-white font-semibold mb-2">无冲突检测</h3>
          <p className="text-gray-400 text-sm">
            当前日程安排良好，未发现时间冲突或精力过载问题
          </p>
        </Card>
      )}

      {/* 解决方案详情 */}
      {selectedConflict && (
        <Card className="bg-black/30 border-white/20 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">解决方案</h3>
            <Button
              size="sm"
              variant="outline"
              className="text-white border-white/20"
              onClick={() => setSelectedConflict(null)}
            >
              ✕ 关闭
            </Button>
          </div>

          <div className="space-y-3">
            {selectedConflict.solutions.map((solution, index) => (
              <div
                key={solution.id}
                className={`p-3 border rounded-lg ${
                  selectedConflict.recommendation && solution.id === selectedConflict.recommendation.id
                    ? 'bg-cyan-600/10 border-cyan-500/50'
                    : 'bg-black/20 border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-medium">
                      方案 {index + 1}
                      {selectedConflict.recommendation && solution.id === selectedConflict.recommendation.id && (
                        <span className="ml-2 text-cyan-300 text-xs">推荐</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400">
                      置信度: {Math.round(solution.confidence * 100)}%
                    </span>
                    <span className={`text-xs ${getImpactColor(solution.impact)}`}>
                      {solution.impact === 'minimal' ? '轻微影响' :
                       solution.impact === 'moderate' ? '中等影响' : '重大影响'}
                    </span>
                  </div>
                </div>

                <p className="text-gray-300 text-sm mb-3">{solution.description}</p>

                <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                  <div>
                    <span className="text-gray-400">精力优化:</span>
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${solution.energyOptimization * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">市场兼容:</span>
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                      <div
                        className="bg-cyan-500 h-2 rounded-full"
                        style={{ width: `${solution.marketCompatibility * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {solution.changes.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs text-gray-400 mb-1">将要进行的变更:</div>
                    <div className="space-y-1">
                      {solution.changes.map((change, i) => (
                        <div key={i} className="text-xs text-gray-300 bg-black/30 p-1 rounded">
                          {change.reason}: {String(change.oldValue)} → {String(change.newValue)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  size="sm"
                  onClick={() => applySolution(solution)}
                  className={
                    selectedConflict.recommendation && solution.id === selectedConflict.recommendation.id
                      ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                      : 'bg-gray-600 hover:bg-gray-700 text-white'
                  }
                >
                  {selectedConflict.recommendation && solution.id === selectedConflict.recommendation.id ? '🎯 应用推荐方案' : '应用此方案'}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
