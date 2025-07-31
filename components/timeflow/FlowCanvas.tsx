'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { Event, EventCategory } from '../../types/event'
import { TimeFlowConfig, FlowPosition, Particle } from '../../types/timeflow'

// 时间流画布属性
interface FlowCanvasProps {
  events: Event[]
  currentTime: Date
  timeRange: { start: Date; end: Date }
  onEventSelect?: (event: Event) => void
  onEventDrag?: (eventId: string, newPosition: FlowPosition) => void
  className?: string
}

// 事件卡片3D组件
function EventCard3D({ 
  event, 
  position, 
  onSelect, 
  onDragStart 
}: {
  event: Event
  position: FlowPosition
  onSelect: (event: Event) => void
  onDragStart: (event: Event, position: FlowPosition) => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  // 根据事件类别获取颜色
  const getEventColor = (category: EventCategory): string => {
    const colors = {
      [EventCategory.WORK]: '#3b82f6',
      [EventCategory.PERSONAL]: '#10b981',
      [EventCategory.MEETING]: '#f59e0b',
      [EventCategory.BREAK]: '#8b5cf6',
      [EventCategory.EXERCISE]: '#ef4444',
      [EventCategory.MEAL]: '#f97316',
      [EventCategory.TRAVEL]: '#06b6d4',
      [EventCategory.OTHER]: '#6b7280',
      // Trading专业类别颜色
      [EventCategory.TRADING]: '#dc2626',        // 红色 - 交易相关
      [EventCategory.LIFE_ROUTINE]: '#059669',   // 绿色 - 生活例程
      [EventCategory.PREPARATION]: '#7c3aed'     // 紫色 - 准备工作
    }
    return colors[category] || colors[EventCategory.OTHER]
  }

  // 动画循环
  useFrame((state) => {
    if (!meshRef.current) return

    // 浮动动画
    const time = state.clock.getElapsedTime()
    meshRef.current.position.y = position.y + Math.sin(time * 2 + position.x * 0.1) * 0.1
    
    // 悬停效果
    if (hovered) {
      meshRef.current.scale.setScalar(1.1)
      meshRef.current.rotation.y = Math.sin(time * 4) * 0.1
    } else {
      meshRef.current.scale.setScalar(1)
      meshRef.current.rotation.y = 0
    }
  })

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* 主要卡片 */}
      <mesh
        ref={meshRef}
        onClick={() => onSelect(event)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onPointerDown={() => onDragStart(event, position)}
      >
        <boxGeometry args={[2, 0.8, 0.2]} />
        <meshStandardMaterial 
          color={getEventColor(event.category)}
          transparent
          opacity={hovered ? 0.9 : 0.7}
        />
      </mesh>
      
      {/* 优先级指示器 */}
      <mesh position={[0.8, 0, 0.15]}>
        <sphereGeometry args={[0.1]} />
        <meshStandardMaterial 
          color={event.priority === 'urgent' ? '#ef4444' : '#10b981'}
          emissive={event.priority === 'urgent' ? '#ef4444' : '#10b981'}
          emissiveIntensity={0.3}
        />
      </mesh>
    </group>
  )
}

// 时间轴组件
function TimeAxis({ 
  timeRange, 
  currentTime 
}: { 
  timeRange: { start: Date; end: Date }
  currentTime: Date 
}) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (!groupRef.current) return
    
    // 时间流动动画
    const progress = (currentTime.getTime() - timeRange.start.getTime()) / 
                    (timeRange.end.getTime() - timeRange.start.getTime())
    groupRef.current.position.y = -progress * 10
  })

  return (
    <group ref={groupRef}>
      {/* 主时间轴 */}
      <mesh position={[0, 0, -1]}>
        <cylinderGeometry args={[0.02, 0.02, 20]} />
        <meshStandardMaterial color="#4f46e5" />
      </mesh>
      
      {/* 当前时间指示器 */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.1]} />
        <meshStandardMaterial 
          color="#ef4444" 
          emissive="#ef4444"
          emissiveIntensity={0.5}
        />
      </mesh>
      
      {/* 时间刻度 */}
      {Array.from({ length: 24 }, (_, i) => (
        <mesh key={i} position={[0, i - 12, -0.5]}>
          <boxGeometry args={[0.2, 0.02, 0.02]} />
          <meshStandardMaterial color="#6b7280" />
        </mesh>
      ))}
    </group>
  )
}

// 主时间流画布组件
export default function FlowCanvas({
  events = [],
  currentTime,
  timeRange,
  onEventSelect,
  onEventDrag,
  className = ""
}: FlowCanvasProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

  const handleEventSelect = useCallback((event: Event) => {
    setSelectedEvent(event)
    onEventSelect?.(event)
  }, [onEventSelect])

  const handleEventDragStart = useCallback((event: Event, position: FlowPosition) => {
    // 拖拽逻辑稍后实现
    console.log('Drag start:', event.title, position)
  }, [])

  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas camera={{ position: [5, 5, 5], fov: 75 }}>
        {/* 环境光 */}
        <ambientLight intensity={0.6} />
        
        {/* 定向光 */}
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1}
          castShadow
        />
        
        {/* 时间轴 */}
        <TimeAxis timeRange={timeRange} currentTime={currentTime} />
        
        {/* 渲染所有事件 */}
        {events.map((event, index) => (
          <EventCard3D
            key={event.id}
            event={event}
            position={{ x: index * 3 - events.length * 1.5, y: 0, z: 0 }}
            onSelect={handleEventSelect}
            onDragStart={handleEventDragStart}
          />
        ))}
        
        {/* 轨道控制器 */}
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={3}
          maxDistance={20}
        />
      </Canvas>
    </div>
  )
}
