'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useEventStore } from '../../lib/stores/event-store'
import { EventCategory, Priority, EventStatus, EnergyLevel } from '../../types/event'

export default function AddEventButton() {
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const { addEvent } = useEventStore()

  const handleSubmit = () => {
    if (!title.trim()) {
      alert('请输入事件标题')
      return
    }

    const now = new Date()
    const startTime = new Date(now.getTime() + 60 * 60 * 1000) // 1小时后
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000) // 持续1小时

    addEvent({
      title: title.trim(),
      description: description.trim(),
      startTime,
      endTime,
      category: EventCategory.WORK,
      priority: Priority.MEDIUM,
      status: EventStatus.PLANNED,
      position: { x: 0, y: 0, z: 0 },
      size: { width: 200, height: 80, depth: 20 },
      color: '#6366f1',
      opacity: 0.8,
      isSelected: false,
      isDragging: false,
      isHovered: false,
      isConflicted: false,
      energyRequired: EnergyLevel.MEDIUM,
      estimatedDuration: 60,
      isMarketProtected: false,
      flexibilityScore: 50,
      tags: [],
      reminders: []
    })

    // 重置表单
    setTitle('')
    setDescription('')
    setShowForm(false)
    
    // New event created successfully
  }

  const handleCancel = () => {
    setTitle('')
    setDescription('')
    setShowForm(false)
  }

  if (showForm) {
    return (
      <Card className="bg-black/30 border-white/20 p-4">
        <h3 className="text-white font-semibold mb-4">创建新事件</h3>
        <div className="space-y-3">
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="事件标题..."
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-gray-400"
            />
          </div>
          <div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="事件描述..."
              rows={3}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-gray-400 resize-none"
            />
          </div>
          <div className="flex space-x-2">
            <Button 
              onClick={handleSubmit}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              size="sm"
            >
              创建
            </Button>
            <Button 
              onClick={handleCancel}
              variant="outline" 
              className="flex-1 text-white border-white/20"
              size="sm"
            >
              取消
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Button 
      onClick={() => setShowForm(true)}
      className="w-full bg-purple-600 hover:bg-purple-700" 
      size="sm"
    >
      ➕ 新建事件
    </Button>
  )
}
