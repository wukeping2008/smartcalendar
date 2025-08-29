'use client'

import React from 'react'
import DailyBriefingPanel from '@/components/briefing/DailyBriefingPanel'

export default function TestBriefingPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">测试今日简报组件</h1>
        
        {/* 测试完整模式 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">完整模式:</h2>
          <DailyBriefingPanel />
        </div>
        
        {/* 测试紧凑模式 */}
        <div>
          <h2 className="text-lg font-semibold mb-4">紧凑模式:</h2>
          <DailyBriefingPanel compact={true} />
        </div>
      </div>
    </div>
  )
}