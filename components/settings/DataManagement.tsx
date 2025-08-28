'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Download, 
  Upload, 
  Trash2, 
  Save, 
  RefreshCw,
  Database,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { storageService } from '../../lib/services/StorageService'
import { useEventStore } from '../../lib/stores/event-store'
import { useGTDStore } from '../../lib/stores/gtd-store'
import { useTimeBudgetStore } from '../../lib/stores/time-budget-store'
import { usePreferenceStore } from '../../lib/stores/preference-store'
import { usePanelStore } from '../../lib/stores/panel-store'

export default function DataManagement() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const { events, clearAllEvents, loadEvents } = useEventStore()
  const preferenceStore = usePreferenceStore()
  
  // 导出所有数据
  const handleExportData = async () => {
    try {
      setLoading(true)
      setMessage(null)
      
      // 获取所有数据
      const exportData = await storageService.exportAllData()
      
      // 添加其他存储的数据
      const gtdState = useGTDStore.getState()
      const timeBudgetState = useTimeBudgetStore.getState()
      const panelState = usePanelStore.getState()
      const preferences = usePreferenceStore.getState()
      
      const fullExport = {
        ...exportData,
        gtd: {
          tasks: gtdState.tasks,
          projects: gtdState.projects,
          contexts: gtdState.contexts
        },
        timeBudget: {
          categories: timeBudgetState.categories,
          entries: timeBudgetState.entries
        },
        panels: {
          panels: panelState.panels,
          toolbarPosition: panelState.toolbarPosition
        },
        preferences: preferences.exportSettings()
      }
      
      // 创建下载链接
      const blob = new Blob([JSON.stringify(fullExport, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `smart-calendar-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      
      setMessage({ type: 'success', text: '数据导出成功！' })
    } catch (error) {
      console.error('Export failed:', error)
      setMessage({ type: 'error', text: '数据导出失败，请重试' })
    } finally {
      setLoading(false)
    }
  }
  
  // 导入数据
  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    try {
      setLoading(true)
      setMessage(null)
      
      const text = await file.text()
      const importData = JSON.parse(text)
      
      // 导入到 IndexedDB
      if (importData.data) {
        await storageService.importData(importData)
      }
      
      // 导入到其他存储
      if (importData.gtd) {
        const gtdStore = useGTDStore.getState()
        // 清空现有数据
        gtdStore.tasks.forEach(task => gtdStore.deleteTask(task.id))
        gtdStore.projects.forEach(project => gtdStore.deleteProject(project.id))
        gtdStore.contexts.forEach(context => gtdStore.deleteContext(context.id))
        
        // 导入新数据
        importData.gtd.tasks?.forEach((task: any) => gtdStore.addTask(task))
        importData.gtd.projects?.forEach((project: any) => gtdStore.addProject(project))
        importData.gtd.contexts?.forEach((context: any) => gtdStore.addContext(context))
      }
      
      if (importData.timeBudget) {
        const timeBudgetStore = useTimeBudgetStore.getState()
        // 重置并导入
        timeBudgetStore.resetWeeklyData()
        importData.timeBudget.categories?.forEach((category: any) => 
          timeBudgetStore.addCategory(category)
        )
        importData.timeBudget.entries?.forEach((entry: any) => 
          timeBudgetStore.addEntry(entry)
        )
      }
      
      if (importData.preferences) {
        preferenceStore.importSettings(
          typeof importData.preferences === 'string' 
            ? importData.preferences 
            : JSON.stringify(importData.preferences)
        )
      }
      
      // 重新加载事件
      await loadEvents()
      
      setMessage({ type: 'success', text: '数据导入成功！页面将刷新以应用更改...' })
      
      // 2秒后刷新页面
      setTimeout(() => {
        window.location.reload()
      }, 2000)
      
    } catch (error) {
      console.error('Import failed:', error)
      setMessage({ type: 'error', text: '数据导入失败，请检查文件格式' })
    } finally {
      setLoading(false)
      // 清空文件输入
      event.target.value = ''
    }
  }
  
  // 清除所有数据
  const handleClearData = async () => {
    if (!confirm('确定要清除所有数据吗？此操作不可恢复！')) return
    
    try {
      setLoading(true)
      setMessage(null)
      
      // 清除 IndexedDB
      await storageService.clearAllData()
      
      // 清除所有存储
      await clearAllEvents()
      
      // 清除其他存储
      localStorage.clear()
      
      setMessage({ type: 'success', text: '所有数据已清除！页面将刷新...' })
      
      // 2秒后刷新页面
      setTimeout(() => {
        window.location.reload()
      }, 2000)
      
    } catch (error) {
      console.error('Clear data failed:', error)
      setMessage({ type: 'error', text: '清除数据失败' })
    } finally {
      setLoading(false)
    }
  }
  
  // 重置为默认设置
  const handleResetDefaults = () => {
    if (!confirm('确定要重置所有设置为默认值吗？')) return
    
    preferenceStore.resetToDefaults()
    usePanelStore.getState().restoreLayout()
    
    setMessage({ type: 'success', text: '设置已重置为默认值' })
  }
  
  // 计算存储使用情况
  const getStorageInfo = () => {
    const gtdState = useGTDStore.getState()
    const timeBudgetState = useTimeBudgetStore.getState()
    
    return {
      events: events.length,
      tasks: gtdState.tasks.length,
      projects: gtdState.projects.length,
      timeEntries: timeBudgetState.entries.length
    }
  }
  
  const storageInfo = getStorageInfo()
  
  return (
    <div className="space-y-6">
      <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Database className="h-5 w-5 text-cyan-400" />
          数据管理
        </h3>
        
        {/* 存储统计 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-700/30 rounded-lg p-3">
            <div className="text-sm text-gray-400">日程事件</div>
            <div className="text-2xl font-bold text-cyan-400">{storageInfo.events}</div>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-3">
            <div className="text-sm text-gray-400">GTD任务</div>
            <div className="text-2xl font-bold text-green-400">{storageInfo.tasks}</div>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-3">
            <div className="text-sm text-gray-400">项目</div>
            <div className="text-2xl font-bold text-purple-400">{storageInfo.projects}</div>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-3">
            <div className="text-sm text-gray-400">时间记录</div>
            <div className="text-2xl font-bold text-orange-400">{storageInfo.timeEntries}</div>
          </div>
        </div>
        
        {/* 消息提示 */}
        {message && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {message.text}
          </div>
        )}
        
        {/* 操作按钮 */}
        <div className="space-y-4">
          {/* 导出数据 */}
          <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
            <div>
              <h4 className="font-medium text-white">导出数据</h4>
              <p className="text-sm text-gray-400 mt-1">
                将所有数据导出为JSON文件，包括日程、任务、设置等
              </p>
            </div>
            <Button
              onClick={handleExportData}
              disabled={loading}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              导出
            </Button>
          </div>
          
          {/* 导入数据 */}
          <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
            <div>
              <h4 className="font-medium text-white">导入数据</h4>
              <p className="text-sm text-gray-400 mt-1">
                从备份文件恢复所有数据
              </p>
            </div>
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                disabled={loading}
                className="hidden"
              />
              <div className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed">
                <Upload className="h-4 w-4 mr-2" />
                导入
              </div>
            </label>
          </div>
          
          {/* 重置设置 */}
          <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
            <div>
              <h4 className="font-medium text-white">重置设置</h4>
              <p className="text-sm text-gray-400 mt-1">
                将所有设置恢复为默认值，不影响数据
              </p>
            </div>
            <Button
              onClick={handleResetDefaults}
              disabled={loading}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              重置
            </Button>
          </div>
          
          {/* 清除数据 */}
          <div className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div>
              <h4 className="font-medium text-red-400">清除所有数据</h4>
              <p className="text-sm text-red-400/70 mt-1">
                永久删除所有数据，此操作不可恢复
              </p>
            </div>
            <Button
              onClick={handleClearData}
              disabled={loading}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              清除
            </Button>
          </div>
        </div>
        
        {/* 自动保存提示 */}
        <div className="mt-6 p-3 bg-gray-700/30 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Save className="h-4 w-4 text-green-400" />
            <span>所有数据会自动保存到本地，无需手动保存</span>
          </div>
        </div>
      </Card>
    </div>
  )
}