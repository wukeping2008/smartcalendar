/**
 * Time Budget Report Panel - 时间预算报告面板
 * 展示详细的时间使用报告和分析
 */

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, TrendingUp, TrendingDown, Calendar,
  FileText, Download, AlertTriangle, CheckCircle,
  Target, Clock, Award, Activity, PieChart
} from 'lucide-react'
import TimeBudgetService from '../../lib/services/TimeBudgetService'
import { TimeBudgetReport, BudgetCategory } from '../../types/timebudget'

interface TimeBudgetReportPanelProps {
  onClose?: () => void
}

export default function TimeBudgetReportPanel({ onClose }: TimeBudgetReportPanelProps) {
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [report, setReport] = useState<TimeBudgetReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  useEffect(() => {
    generateReport()
  }, [reportType, selectedDate])

  const generateReport = async () => {
    setLoading(true)
    try {
      const newReport = await TimeBudgetService.generateReport(reportType, selectedDate)
      setReport(newReport)
    } catch (error) {
      console.error('生成报告失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 格式化时间
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  // 获取类别名称
  const getCategoryName = (category: BudgetCategory): string => {
    const names: Record<BudgetCategory, string> = {
      [BudgetCategory.WORK]: '工作',
      [BudgetCategory.MEETING]: '会议',
      [BudgetCategory.BREAK]: '休息',
      [BudgetCategory.LEARNING]: '学习',
      [BudgetCategory.PERSONAL]: '个人',
      [BudgetCategory.EXERCISE]: '运动',
      [BudgetCategory.COMMUTE]: '通勤',
      [BudgetCategory.OTHER]: '其他'
    }
    return names[category] || category
  }

  // 获取类别颜色
  const getCategoryColor = (category: BudgetCategory): string => {
    const colors: Record<BudgetCategory, string> = {
      [BudgetCategory.WORK]: 'text-blue-400',
      [BudgetCategory.MEETING]: 'text-purple-400',
      [BudgetCategory.BREAK]: 'text-green-400',
      [BudgetCategory.LEARNING]: 'text-yellow-400',
      [BudgetCategory.PERSONAL]: 'text-pink-400',
      [BudgetCategory.EXERCISE]: 'text-orange-400',
      [BudgetCategory.COMMUTE]: 'text-gray-400',
      [BudgetCategory.OTHER]: 'text-indigo-400'
    }
    return colors[category] || 'text-gray-400'
  }

  // 获取洞察图标
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />
      case 'achievement':
        return <Award className="h-4 w-4 text-green-400" />
      case 'suggestion':
        return <CheckCircle className="h-4 w-4 text-cyan-400" />
      default:
        return <Activity className="h-4 w-4 text-gray-400" />
    }
  }

  // 导出报告
  const exportReport = () => {
    if (!report) return

    const reportData = {
      title: `时间预算报告 - ${reportType === 'daily' ? '日报' : reportType === 'weekly' ? '周报' : '月报'}`,
      period: `${report.period.startDate.toLocaleDateString()} - ${report.period.endDate.toLocaleDateString()}`,
      summary: report.summary,
      categories: report.categories,
      insights: report.insights,
      generatedAt: report.generatedAt
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `time-budget-report-${reportType}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <Card className="bg-black/30 border-white/20 p-8">
        <div className="text-center">
          <Activity className="h-8 w-8 mx-auto mb-4 text-cyan-400 animate-spin" />
          <p className="text-gray-300">生成报告中...</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4 max-h-screen overflow-y-auto">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <BarChart3 className="h-6 w-6 mr-2" />
          时间预算报告
        </h2>
        <div className="flex space-x-2">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as 'daily' | 'weekly' | 'monthly')}
            className="px-3 py-2 bg-black/50 border border-white/20 rounded-lg text-white"
          >
            <option value="daily">日报</option>
            <option value="weekly">周报</option>
            <option value="monthly">月报</option>
          </select>
          <input
            type="date"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="px-3 py-2 bg-black/50 border border-white/20 rounded-lg text-white"
          />
          <Button
            variant="outline"
            onClick={exportReport}
            disabled={!report}
            className="text-gray-400 border-gray-400/50 hover:bg-gray-400/10"
          >
            <Download className="h-4 w-4 mr-1" />
            导出
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              关闭
            </Button>
          )}
        </div>
      </div>

      {!report ? (
        <Card className="bg-black/30 border-white/20 p-8">
          <div className="text-center text-gray-400">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>暂无报告数据</p>
          </div>
        </Card>
      ) : (
        <>
          {/* 报告概要 */}
          <div className="grid grid-cols-4 gap-3">
            <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30 p-3">
              <div className="flex items-center justify-between mb-2">
                <Clock className="h-5 w-5 text-blue-400" />
                <span className="text-xs text-blue-400">总预算</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {formatTime(report.summary.totalBudgeted)}
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30 p-3">
              <div className="flex items-center justify-between mb-2">
                <Activity className="h-5 w-5 text-green-400" />
                <span className="text-xs text-green-400">实际使用</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {formatTime(report.summary.totalActual)}
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30 p-3">
              <div className="flex items-center justify-between mb-2">
                <Target className="h-5 w-5 text-purple-400" />
                <span className="text-xs text-purple-400">效率评分</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {report.summary.efficiencyScore}%
              </div>
            </Card>

            <Card className={`p-3 ${
              report.summary.totalVariance >= 0 
                ? 'bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/30'
                : 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30'
            }`}>
              <div className="flex items-center justify-between mb-2">
                {report.summary.totalVariance >= 0 ? 
                  <TrendingUp className="h-5 w-5 text-red-400" /> :
                  <TrendingDown className="h-5 w-5 text-green-400" />
                }
                <span className={`text-xs ${
                  report.summary.totalVariance >= 0 ? 'text-red-400' : 'text-green-400'
                }`}>
                  差异
                </span>
              </div>
              <div className="text-2xl font-bold text-white">
                {report.summary.totalVariance >= 0 ? '+' : ''}
                {formatTime(Math.abs(report.summary.totalVariance))}
              </div>
            </Card>
          </div>

          {/* 分类详细统计 */}
          <Card className="bg-black/30 border-white/20 p-4">
            <h3 className="text-white font-semibold mb-4 flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              分类使用详情
            </h3>
            
            <div className="space-y-3">
              {report.categories.map(category => (
                <div key={category.category} className="bg-black/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className={`font-medium ${getCategoryColor(category.category)}`}>
                        {getCategoryName(category.category)}
                      </span>
                      {Math.abs(category.variancePercent) > 20 && (
                        <AlertTriangle className="h-4 w-4 text-yellow-400" />
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-white">
                        {formatTime(category.actual)} / {formatTime(category.budgeted)}
                      </div>
                      <div className={`text-xs ${
                        category.variance >= 0 ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {category.variance >= 0 ? '+' : ''}
                        {formatTime(Math.abs(category.variance))} 
                        ({category.variance >= 0 ? '+' : ''}{Math.round(category.variancePercent)}%)
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-full bg-black/50 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        category.variancePercent > 20 ? 'bg-red-500' :
                        category.variancePercent > 0 ? 'bg-orange-500' :
                        category.variancePercent > -20 ? 'bg-cyan-500' :
                        'bg-green-500'
                      }`}
                      style={{ 
                        width: `${Math.min(100, (category.actual / category.budgeted) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 洞察建议 */}
          {report.insights.length > 0 && (
            <Card className="bg-black/30 border-white/20 p-4">
              <h3 className="text-white font-semibold mb-4 flex items-center">
                <Award className="h-5 w-5 mr-2" />
                分析洞察
              </h3>
              
              <div className="space-y-3">
                {report.insights.map((insight, index) => (
                  <div key={index} className={`p-3 rounded-lg border-l-4 ${
                    insight.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500' :
                    insight.type === 'achievement' ? 'bg-green-500/10 border-green-500' :
                    'bg-cyan-500/10 border-cyan-500'
                  }`}>
                    <div className="flex items-start space-x-3">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <p className="text-sm text-white">{insight.message}</p>
                        {insight.actionable && (
                          <div className="mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs text-cyan-400 border-cyan-400/50 hover:bg-cyan-400/10"
                            >
                              执行建议
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* 趋势图表区域 */}
          <Card className="bg-black/30 border-white/20 p-4">
            <h3 className="text-white font-semibold mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              使用趋势
            </h3>
            
            {/* 时间分布饼图 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm text-gray-400 mb-2">分类时间分布</h4>
                <div className="space-y-2">
                  {report.trends.categoryDistribution
                    .sort((a, b) => b.percentage - a.percentage)
                    .slice(0, 5)
                    .map(item => (
                      <div key={item.category} className="flex items-center justify-between">
                        <span className={`text-xs ${getCategoryColor(item.category)}`}>
                          {getCategoryName(item.category)}
                        </span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-black/50 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${getCategoryColor(item.category).replace('text-', 'bg-')}`}
                              style={{ width: `${Math.min(100, item.percentage)}%` }}
                            />
                          </div>
                          <span className="text-xs text-white min-w-[3rem] text-right">
                            {Math.round(item.percentage)}%
                          </span>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
              
              <div>
                <h4 className="text-sm text-gray-400 mb-2">每日使用趋势</h4>
                <div className="space-y-1">
                  {report.trends.dailyUsage.slice(-7).map((day, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">
                        {day.date.toLocaleDateString().slice(-5)}
                      </span>
                      <span className="text-white">
                        {formatTime(day.usage)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* 报告元信息 */}
          <Card className="bg-black/30 border-white/20 p-3">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>
                报告期间: {report.period.startDate.toLocaleDateString()} - {report.period.endDate.toLocaleDateString()}
              </span>
              <span>
                生成时间: {report.generatedAt.toLocaleString()}
              </span>
              <span>
                报告ID: {report.id.slice(-8)}
              </span>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}