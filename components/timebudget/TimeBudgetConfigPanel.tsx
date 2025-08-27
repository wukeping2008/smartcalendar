/**
 * Time Budget Configuration Panel - 时间预算配置面板
 * 配置预算、告警、时间银行等设置
 */

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Settings, Target, Clock, AlertTriangle, 
  Wallet, Save, RotateCcw
} from 'lucide-react'
import TimeBudgetService from '../../lib/services/TimeBudgetService'
import { BudgetCategory, TimeBudget, TimeBudgetConfig } from '../../types/timebudget'

interface TimeBudgetConfigPanelProps {
  onClose?: () => void
}

export default function TimeBudgetConfigPanel({ onClose }: TimeBudgetConfigPanelProps) {
  const [budgets, setBudgets] = useState<TimeBudget[]>([])
  const [editingBudgets, setEditingBudgets] = useState<Map<string, Partial<TimeBudget>>>(new Map())
  const [alertSettings, setAlertSettings] = useState({
    warningThreshold: 80,
    criticalThreshold: 95,
    enabled: true
  })
  const [timeBankSettings, setTimeBankSettings] = useState({
    autoSave: true,
    borrowLimit: 7200, // 2小时，以秒为单位
    interestRate: 0.05
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    const allBudgets = TimeBudgetService.getAllBudgets()
    setBudgets(allBudgets)
    
    // 初始化编辑状态
    const editing = new Map<string, Partial<TimeBudget>>()
    allBudgets.forEach(budget => {
      editing.set(budget.id, {
        budgets: { ...budget.budgets },
        alerts: { ...budget.alerts }
      })
    })
    setEditingBudgets(editing)
  }

  // 格式化时间显示（秒转小时）
  const formatHours = (seconds: number): number => {
    return Math.round((seconds / 3600) * 10) / 10
  }

  // 时间转换（小时转秒）
  const hoursToSeconds = (hours: number): number => {
    return Math.round(hours * 3600)
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
      [BudgetCategory.WORK]: 'border-blue-500/50 bg-blue-500/10',
      [BudgetCategory.MEETING]: 'border-purple-500/50 bg-purple-500/10',
      [BudgetCategory.BREAK]: 'border-green-500/50 bg-green-500/10',
      [BudgetCategory.LEARNING]: 'border-yellow-500/50 bg-yellow-500/10',
      [BudgetCategory.PERSONAL]: 'border-pink-500/50 bg-pink-500/10',
      [BudgetCategory.EXERCISE]: 'border-orange-500/50 bg-orange-500/10',
      [BudgetCategory.COMMUTE]: 'border-gray-500/50 bg-gray-500/10',
      [BudgetCategory.OTHER]: 'border-indigo-500/50 bg-indigo-500/10'
    }
    return colors[category] || 'border-gray-500/50 bg-gray-500/10'
  }

  // 更新预算设置
  const updateBudgetSetting = (budgetId: string, field: keyof TimeBudget['budgets'], value: number) => {
    const current = editingBudgets.get(budgetId) || {}
    const budgets = current.budgets || {}
    
    setEditingBudgets(prev => new Map(prev).set(budgetId, {
      ...current,
      budgets: {
        ...budgets,
        [field]: hoursToSeconds(value)
      }
    }))
  }

  // 更新告警设置
  const updateAlertSetting = (budgetId: string, field: keyof TimeBudget['alerts'], value: number | boolean) => {
    const current = editingBudgets.get(budgetId) || {}
    const alerts = current.alerts || {}
    
    setEditingBudgets(prev => new Map(prev).set(budgetId, {
      ...current,
      alerts: {
        ...alerts,
        [field]: value
      }
    }))
  }

  // 保存所有设置
  const saveAllSettings = async () => {
    try {
      // TODO: 实现保存逻辑，这里需要扩展 TimeBudgetService
      console.log('保存设置:', {
        budgets: Object.fromEntries(editingBudgets),
        alertSettings,
        timeBankSettings
      })
      
      alert('设置保存成功！')
      if (onClose) onClose()
    } catch (error) {
      console.error('保存设置失败:', error)
      alert('保存设置失败！')
    }
  }

  // 重置设置
  const resetSettings = () => {
    if (confirm('确定要重置所有设置到默认值吗？')) {
      loadData()
      setAlertSettings({
        warningThreshold: 80,
        criticalThreshold: 95,
        enabled: true
      })
      setTimeBankSettings({
        autoSave: true,
        borrowLimit: 7200,
        interestRate: 0.05
      })
    }
  }

  return (
    <div className="space-y-4 max-h-screen overflow-y-auto">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <Settings className="h-6 w-6 mr-2" />
          时间预算设置
        </h2>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={resetSettings}
            className="text-gray-400 border-gray-400/50 hover:bg-gray-400/10"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            重置
          </Button>
          <Button
            onClick={saveAllSettings}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            <Save className="h-4 w-4 mr-1" />
            保存
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

      {/* 预算配置 */}
      <Card className="bg-black/30 border-white/20 p-4">
        <h3 className="text-white font-semibold mb-4 flex items-center">
          <Target className="h-5 w-5 mr-2" />
          分类预算设置
        </h3>
        
        <div className="space-y-3">
          {budgets.map(budget => {
            const editing = editingBudgets.get(budget.id)
            const currentBudgets = editing?.budgets || budget.budgets
            const currentAlerts = editing?.alerts || budget.alerts
            
            return (
              <Card key={budget.id} className={`p-3 ${getCategoryColor(budget.category)}`}>
                <div className="mb-3">
                  <h4 className="text-white font-medium">{getCategoryName(budget.category)}</h4>
                  <p className="text-xs text-gray-400">{budget.description || '暂无描述'}</p>
                </div>
                
                {/* 预算时间设置 */}
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">日预算(小时)</label>
                    <input
                      type="number"
                      value={formatHours(currentBudgets.daily)}
                      onChange={(e) => updateBudgetSetting(budget.id, 'daily', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 text-sm bg-black/50 border border-white/20 rounded text-white"
                      min="0.1"
                      max="24"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">周预算(小时)</label>
                    <input
                      type="number"
                      value={formatHours(currentBudgets.weekly)}
                      onChange={(e) => updateBudgetSetting(budget.id, 'weekly', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 text-sm bg-black/50 border border-white/20 rounded text-white"
                      min="0.1"
                      max="168"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">月预算(小时)</label>
                    <input
                      type="number"
                      value={formatHours(currentBudgets.monthly)}
                      onChange={(e) => updateBudgetSetting(budget.id, 'monthly', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 text-sm bg-black/50 border border-white/20 rounded text-white"
                      min="0.1"
                      max="744"
                      step="0.1"
                    />
                  </div>
                </div>
                
                {/* 告警设置 */}
                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/10">
                  <div>
                    <label className="text-xs text-gray-400 flex items-center mb-1">
                      <input
                        type="checkbox"
                        checked={currentAlerts.enabled}
                        onChange={(e) => updateAlertSetting(budget.id, 'enabled', e.target.checked)}
                        className="mr-1"
                      />
                      启用告警
                    </label>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">警告阈值(%)</label>
                    <input
                      type="number"
                      value={currentAlerts.warningThreshold}
                      onChange={(e) => updateAlertSetting(budget.id, 'warningThreshold', parseInt(e.target.value) || 80)}
                      className="w-full px-2 py-1 text-sm bg-black/50 border border-white/20 rounded text-white"
                      min="1"
                      max="100"
                      disabled={!currentAlerts.enabled}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">危急阈值(%)</label>
                    <input
                      type="number"
                      value={currentAlerts.criticalThreshold}
                      onChange={(e) => updateAlertSetting(budget.id, 'criticalThreshold', parseInt(e.target.value) || 95)}
                      className="w-full px-2 py-1 text-sm bg-black/50 border border-white/20 rounded text-white"
                      min="1"
                      max="100"
                      disabled={!currentAlerts.enabled}
                    />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </Card>

      {/* 全局告警设置 */}
      <Card className="bg-black/30 border-white/20 p-4">
        <h3 className="text-white font-semibold mb-3 flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          全局告警设置
        </h3>
        
        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={alertSettings.enabled}
              onChange={(e) => setAlertSettings(prev => ({ ...prev, enabled: e.target.checked }))}
              className="mr-2"
            />
            <span className="text-sm text-gray-300">启用所有告警</span>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">默认警告阈值(%)</label>
            <input
              type="number"
              value={alertSettings.warningThreshold}
              onChange={(e) => setAlertSettings(prev => ({ ...prev, warningThreshold: parseInt(e.target.value) || 80 }))}
              className="w-full px-2 py-1 text-sm bg-black/50 border border-white/20 rounded text-white"
              min="1"
              max="100"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">默认危急阈值(%)</label>
            <input
              type="number"
              value={alertSettings.criticalThreshold}
              onChange={(e) => setAlertSettings(prev => ({ ...prev, criticalThreshold: parseInt(e.target.value) || 95 }))}
              className="w-full px-2 py-1 text-sm bg-black/50 border border-white/20 rounded text-white"
              min="1"
              max="100"
            />
          </div>
        </div>
      </Card>

      {/* 时间银行设置 */}
      <Card className="bg-black/30 border-white/20 p-4">
        <h3 className="text-white font-semibold mb-3 flex items-center">
          <Wallet className="h-5 w-5 mr-2" />
          时间银行设置
        </h3>
        
        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={timeBankSettings.autoSave}
              onChange={(e) => setTimeBankSettings(prev => ({ ...prev, autoSave: e.target.checked }))}
              className="mr-2"
            />
            <span className="text-sm text-gray-300">自动存入节省时间</span>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">借用上限(小时)</label>
            <input
              type="number"
              value={formatHours(timeBankSettings.borrowLimit)}
              onChange={(e) => setTimeBankSettings(prev => ({ 
                ...prev, 
                borrowLimit: hoursToSeconds(parseFloat(e.target.value) || 2)
              }))}
              className="w-full px-2 py-1 text-sm bg-black/50 border border-white/20 rounded text-white"
              min="0.1"
              max="24"
              step="0.1"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">奖励利率</label>
            <input
              type="number"
              value={timeBankSettings.interestRate}
              onChange={(e) => setTimeBankSettings(prev => ({ 
                ...prev, 
                interestRate: parseFloat(e.target.value) || 0.05
              }))}
              className="w-full px-2 py-1 text-sm bg-black/50 border border-white/20 rounded text-white"
              min="0"
              max="1"
              step="0.01"
            />
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-white/10 text-xs text-gray-400">
          <p>• 自动存入：完成任务时自动将节省的时间存入银行</p>
          <p>• 借用上限：可以从时间银行借用的最大时间</p>
          <p>• 奖励利率：高效完成任务时的额外奖励比例</p>
        </div>
      </Card>
    </div>
  )
}