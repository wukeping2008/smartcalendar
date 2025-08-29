'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  Plus,
  Mic,
  Bot,
  FileText,
  Brain,
  Inbox,
  Zap,
  Calendar,
  Search,
  Command
} from 'lucide-react'
import { useFloatingPanels } from '../../lib/hooks/useFloatingPanels'
import { PanelType } from '../../types/floating-panel'
import AddEventButton from '../calendar/AddEventButton'
import VoiceInputFixed from '../voice/VoiceInputFixed'

interface QuickActionBarProps {
  className?: string
}

export default function QuickActionBar({ className = '' }: QuickActionBarProps) {
  const { openPanel, togglePanel } = useFloatingPanels()
  const [showCommandPalette, setShowCommandPalette] = useState(false)

  const quickActions = [
    {
      icon: <Plus className="w-4 h-4" />,
      label: '创建事件',
      action: 'create-event',
      color: 'bg-cyan-500 hover:bg-cyan-600',
      shortcut: 'Space'
    },
    {
      icon: <Mic className="w-4 h-4" />,
      label: '语音输入',
      action: 'voice',
      color: 'bg-purple-500 hover:bg-purple-600',
      shortcut: 'V'
    },
    {
      icon: <Bot className="w-4 h-4" />,
      label: 'AI助手',
      action: 'ai',
      color: 'bg-blue-500 hover:bg-blue-600',
      shortcut: 'Alt+1'
    },
    {
      icon: <FileText className="w-4 h-4" />,
      label: '今日简报',
      action: 'briefing',
      color: 'bg-green-500 hover:bg-green-600',
      shortcut: 'Alt+9'
    },
    {
      icon: <Inbox className="w-4 h-4" />,
      label: 'GTD收集',
      action: 'gtd',
      color: 'bg-orange-500 hover:bg-orange-600',
      shortcut: 'Alt+G'
    },
    {
      icon: <Brain className="w-4 h-4" />,
      label: '认知管理',
      action: 'cognitive',
      color: 'bg-pink-500 hover:bg-pink-600',
      shortcut: 'Alt+C'
    },
    {
      icon: <Zap className="w-4 h-4" />,
      label: 'Trading',
      action: 'trading',
      color: 'bg-red-500 hover:bg-red-600',
      shortcut: 'Alt+T'
    }
  ]

  const handleAction = (action: string) => {
    switch (action) {
      case 'ai':
        togglePanel(PanelType.AI_ASSISTANT)
        break
      case 'briefing':
        togglePanel(PanelType.DAILY_BRIEFING)
        break
      case 'gtd':
        togglePanel(PanelType.GTD_INBOX)
        break
      case 'cognitive':
        togglePanel(PanelType.COGNITIVE_MANAGEMENT)
        break
      case 'trading':
        togglePanel(PanelType.TRADING_FOCUS)
        break
      case 'command':
        setShowCommandPalette(true)
        break
    }
  }

  return (
    <>
      {/* 快速操作栏 - 固定在底部 */}
      <div className={`fixed bottom-0 left-0 right-0 z-30 ${className}`}>
        <div className="bg-gradient-to-t from-gray-900 via-gray-900/95 to-transparent pb-4 pt-8">
          <div className="max-w-7xl mx-auto px-4">
            <Card className="bg-gray-800/90 backdrop-blur-md border-gray-700/50 shadow-2xl">
              <div className="p-3">
                <div className="flex items-center justify-between gap-4">
                  {/* 左侧 - 主要操作 */}
                  <div className="flex items-center gap-2">
                    {/* 创建事件按钮 */}
                    <AddEventButton 
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg"
                      size="default"
                    />
                    
                    {/* 语音输入 */}
                    <VoiceInputFixed
                      size="default"
                      onResult={(text) => {
                        console.log('语音输入:', text)
                      }}
                      className="bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30"
                    />

                    <div className="h-6 w-px bg-gray-600 mx-1" />

                    {/* 快速面板按钮 */}
                    {quickActions.slice(2).map((action) => (
                      <Button
                        key={action.action}
                        size="sm"
                        variant="ghost"
                        onClick={() => handleAction(action.action)}
                        className="text-gray-300 hover:text-white hover:bg-gray-700/50 group relative"
                        title={`${action.label} (${action.shortcut})`}
                      >
                        <div className={`p-1.5 rounded ${action.color} text-white`}>
                          {action.icon}
                        </div>
                        <span className="ml-2 hidden lg:inline text-sm">{action.label}</span>
                        
                        {/* 快捷键提示 */}
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-xs text-gray-400 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          {action.shortcut}
                        </span>
                      </Button>
                    ))}
                  </div>

                  {/* 右侧 - 辅助功能 */}
                  <div className="flex items-center gap-2">
                    {/* 搜索 */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-gray-400 hover:text-white hover:bg-gray-700/50"
                      title="搜索 (Ctrl+K)"
                    >
                      <Search className="w-4 h-4" />
                      <span className="ml-2 hidden sm:inline text-sm">搜索</span>
                    </Button>

                    {/* 命令面板 */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowCommandPalette(true)}
                      className="text-gray-400 hover:text-white hover:bg-gray-700/50"
                      title="命令面板 (Ctrl+Shift+P)"
                    >
                      <Command className="w-4 h-4" />
                      <span className="ml-2 hidden sm:inline text-sm">命令</span>
                    </Button>
                  </div>
                </div>

                {/* 状态指示器 */}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-700/50 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span>系统正常</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date().toLocaleDateString('zh-CN', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>快捷键: Space 创建 • V 语音 • ? 帮助</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* 命令面板（未来实现） */}
      {showCommandPalette && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <Card className="w-full max-w-2xl bg-gray-900 border-gray-700">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">命令面板</h3>
              <p className="text-gray-400">命令面板功能即将推出...</p>
              <Button
                className="mt-4"
                onClick={() => setShowCommandPalette(false)}
              >
                关闭
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}