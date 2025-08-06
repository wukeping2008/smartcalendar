'use client'

import React, { useState, useEffect } from 'react'
import { storageService, AIDecisionRecord } from '../../lib/services/StorageService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../src/components/ui/card'
import { Badge } from '../../src/components/ui/badge'
import { Button } from '../../src/components/ui/button'
import { Calendar, Clock, TrendingUp, Brain, CheckCircle, XCircle, AlertCircle, BarChart3 } from 'lucide-react'

interface AIDecisionHistoryProps {
  limit?: number
  showStats?: boolean
}

export function AIDecisionHistory({ limit = 50, showStats = true }: AIDecisionHistoryProps) {
  const [decisions, setDecisions] = useState<AIDecisionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDecisions()
  }, [limit])

  const loadDecisions = async () => {
    try {
      setLoading(true)
      const data = await storageService.getAIDecisionHistory(limit)
      setDecisions(data)
      setError(null)
    } catch (err) {
      console.error('Failed to load AI decisions:', err)
      setError('无法加载AI决策历史')
    } finally {
      setLoading(false)
    }
  }

  const getDecisionIcon = (type: string) => {
    switch (type) {
      case 'market':
        return <TrendingUp className="h-4 w-4" />
      case 'productivity':
        return <BarChart3 className="h-4 w-4" />
      case 'energy':
        return <Brain className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500'
    if (confidence >= 0.6) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100'
      case 'medium':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
      case 'low':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
    }
  }

  const calculateStats = () => {
    if (decisions.length === 0) return null

    const applied = decisions.filter(d => d.appliedAt).length
    const byType = decisions.reduce((acc, d) => {
      acc[d.type] = (acc[d.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const avgConfidence = decisions.reduce((sum, d) => sum + d.confidence, 0) / decisions.length

    return {
      total: decisions.length,
      applied,
      applyRate: ((applied / decisions.length) * 100).toFixed(1),
      byType,
      avgConfidence: (avgConfidence * 100).toFixed(1)
    }
  }

  const stats = calculateStats()

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
          <Button onClick={loadDecisions} className="mt-4" variant="outline">
            重新加载
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* AI决策统计 */}
      {showStats && stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              AI决策统计
            </CardTitle>
            <CardDescription>
              AI助手的决策表现和学习效果
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-gray-500">总决策数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.applied}</div>
                <div className="text-sm text-gray-500">已应用</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.applyRate}%</div>
                <div className="text-sm text-gray-500">采纳率</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.avgConfidence}%</div>
                <div className="text-sm text-gray-500">平均置信度</div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">决策类型分布</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.byType).map(([type, count]) => (
                  <Badge key={type} variant="outline" className="flex items-center gap-1">
                    {getDecisionIcon(type)}
                    <span className="capitalize">{type}</span>
                    <span className="ml-1 text-xs">({count})</span>
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI决策历史列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI决策历史
            <Badge variant="secondary">{decisions.length}</Badge>
          </CardTitle>
          <CardDescription>
            AI助手的智能决策和建议记录
          </CardDescription>
        </CardHeader>
        <CardContent>
          {decisions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暂无AI决策记录</p>
              <p className="text-sm">AI助手将在后台为您提供智能建议</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {decisions.map((decision) => (
                <div 
                  key={decision.id} 
                  className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                        {getDecisionIcon(decision.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getPriorityColor(decision.priority)}>
                            {decision.priority}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {decision.type}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <div 
                              className={`w-2 h-2 rounded-full ${getConfidenceColor(decision.confidence)}`}
                            />
                            <span className="text-xs text-gray-500">
                              {(decision.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        
                        <p className="font-medium mb-2">{decision.message}</p>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {decision.reasoning}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(decision.createdAt).toLocaleDateString('zh-CN')}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(decision.createdAt).toLocaleTimeString('zh-CN', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          {decision.appliedAt && (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-3 w-3" />
                              已应用
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 刷新按钮 */}
      <div className="flex justify-center">
        <Button onClick={loadDecisions} variant="outline" className="flex items-center gap-2">
          <Brain className="h-4 w-4" />
          刷新AI决策
        </Button>
      </div>
    </div>
  )
}
