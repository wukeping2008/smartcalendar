'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useEventStore } from '../../lib/stores/event-store'
import { EventCategory, Priority, EventStatus } from '../../types/event'

export default function TradingTaskTemplates() {
  const { addEvent } = useEventStore()

  const createWatchlistTask = () => {
    const now = new Date()
    const nextHour = new Date(now)
    nextHour.setMinutes(0, 0, 0)
    nextHour.setHours(nextHour.getHours() + 1)
    
    const eventData = {
      title: '扫watchlist',
      description: '每小时整点扫描watchlist - 5分钟',
      startTime: nextHour,
      endTime: new Date(nextHour.getTime() + 5 * 60 * 1000),
      category: EventCategory.WORK,
      priority: Priority.HIGH,
      status: EventStatus.PLANNED,
      position: { x: 0, y: 0, z: 0 },
      size: { width: 200, height: 80, depth: 20 },
      color: '#dc2626',
      opacity: 0.8,
      isSelected: false,
      isDragging: false,
      isHovered: false,
      isConflicted: false,
      energyRequired: 'medium' as any,
      estimatedDuration: 5,
      isMarketProtected: true,
      flexibilityScore: 30,
      tags: ['Trading', 'hourly', 'watchlist'],
      reminders: []
    }

    addEvent(eventData)
  }

  return (
    <Card className="bg-black/30 border-white/20 p-4">
      <h3 className="text-white font-semibold mb-4">Trading任务模板</h3>
      <div className="space-y-2">
        <Button
          onClick={createWatchlistTask}
          className="w-full bg-red-600 hover:bg-red-700 text-white"
          size="sm"
        >
          📊 扫watchlist (5分钟)
        </Button>
      </div>
    </Card>
  )
}
