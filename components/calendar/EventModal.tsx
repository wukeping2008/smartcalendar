'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Event, EventCategory, Priority, EventStatus } from '../../types/event'
import { useEventStore } from '../../lib/stores/event-store'

interface EventModalProps {
  children: React.ReactNode
  event?: Event | null
  onClose?: () => void
}

export default function EventModal({ children, event, onClose }: EventModalProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')
  const [category, setCategory] = useState<EventCategory>(EventCategory.WORK)
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM)
  const [status, setStatus] = useState<EventStatus>(EventStatus.PLANNED)
  const [tags, setTags] = useState('')

  const { addEvent, updateEvent } = useEventStore()

  // 当事件prop变化时，填充表单
  useEffect(() => {
    if (event) {
      setTitle(event.title)
      setDescription(event.description || '')
      setStartDate(event.startTime.toISOString().split('T')[0])
      setStartTime(event.startTime.toTimeString().slice(0, 5))
      setEndDate(event.endTime.toISOString().split('T')[0])
      setEndTime(event.endTime.toTimeString().slice(0, 5))
      setCategory(event.category)
      setPriority(event.priority)
      setStatus(event.status)
      setTags(event.tags.join(', '))
    } else {
      // 重置表单
      clearForm()
    }
  }, [event])

  const clearForm = () => {
    setTitle('')
    setDescription('')
    const now = new Date()
    setStartDate(now.toISOString().split('T')[0])
    setStartTime('09:00')
    setEndDate(now.toISOString().split('T')[0])
    setEndTime('10:00')
    setCategory(EventCategory.WORK)
    setPriority(Priority.MEDIUM)
    setStatus(EventStatus.PLANNED)
    setTags('')
  }

  const handleSubmit = () => {
    if (!title.trim()) {
      alert('请输入事件标题')
      return
    }

    const startDateTime = new Date(`${startDate}T${startTime}`)
    const endDateTime = new Date(`${endDate}T${endTime}`)

    if (startDateTime >= endDateTime) {
      alert('结束时间必须晚于开始时间')
      return
    }

    const eventData = {
      title: title.trim(),
      description: description.trim(),
      startTime: startDateTime,
      endTime: endDateTime,
      category,
      priority,
      status,
      position: { x: 0, y: 0, z: 0 },
      size: { width: 200, height: 80, depth: 20 },
      color: '#6366f1',
      opacity: 0.8,
      isSelected: false,
      isDragging: false,
      isHovered: false,
      isConflicted: false,
      energyRequired: EnergyLevel.MEDIUM,
      estimatedDuration: Math.floor((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60)),
      isMarketProtected: false,
      flexibilityScore: 50,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
      reminders: []
    }

    if (event) {
      // 更新现有事件
      updateEvent(event.id, eventData)
    } else {
      // 创建新事件
      addEvent(eventData)
    }

    setOpen(false)
    onClose?.()
    if (!event) {
      clearForm()
    }
  }

  const handleClose = () => {
    setOpen(false)
    onClose?.()
    if (!event) {
      clearForm()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">
            {event ? '编辑事件' : '创建新事件'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* 标题 */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white">标题</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入事件标题..."
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          {/* 描述 */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">描述</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="输入事件描述..."
              className="bg-slate-700 border-slate-600 text-white"
              rows={3}
            />
          </div>

          {/* 时间设置 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">开始日期</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">开始时间</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">结束日期</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">结束时间</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>

          {/* 按钮 */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline" 
              onClick={handleClose}
              className="text-white border-slate-600"
            >
              取消
            </Button>
            <Button 
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {event ? '更新' : '创建'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
