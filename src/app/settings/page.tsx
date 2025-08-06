'use client'

import React from 'react'
import { AIDecisionHistory } from '../../../components/ai/AIDecisionHistory'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Settings, Brain, Database, Palette, Bell } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="h-8 w-8" />
          系统设置
        </h1>
        <p className="text-gray-600 mt-2">管理您的智能日历偏好和AI助手设置</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 侧边导航 */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">设置导航</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-3 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                <Brain className="h-4 w-4" />
                <span className="text-sm font-medium">AI助手</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer">
                <Database className="h-4 w-4" />
                <span className="text-sm">数据管理</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer">
                <Palette className="h-4 w-4" />
                <span className="text-sm">外观设置</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer">
                <Bell className="h-4 w-4" />
                <span className="text-sm">通知提醒</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 主要内容 */}
        <div className="lg:col-span-3">
          <AIDecisionHistory limit={100} showStats={true} />
        </div>
      </div>
    </div>
  )
}
