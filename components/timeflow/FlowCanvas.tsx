'use client'

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { Event, EventCategory, EnergyLevel } from '../../types/event'
import { TimeFlowConfig, FlowPosition, Particle, Ripple } from '../../types/timeflow'

// 河流着色器材质
const RiverMaterial = shaderMaterial(
  {
    time: 0,
    flowSpeed: 1.0,
    opacity: 0.6,
    color: new THREE.Color('#4f46e5')
  },
  // 顶点着色器
  `
    varying vec2 vUv;
    varying vec3 vPosition;
    uniform float time;
    
    void main() {
      vUv = uv;
      vPosition = position;
      
      vec3 pos = position;
      pos.y += sin(pos.x * 0.5 + time * 2.0) * 0.1;
      pos.y += sin(pos.z * 0.3 + time * 1.5) * 0.05;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  // 片段着色器
  `
    uniform float time;
    uniform float flowSpeed;
    uniform float opacity;
    uniform vec3 color;
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      vec2 uv = vUv;
      
      // 流水纹理效果
      float flow1 = sin(uv.y * 10.0 - time * flowSpeed * 3.0) * 0.5 + 0.5;
      float flow2 = sin(uv.y * 15.0 + uv.x * 5.0 - time * flowSpeed * 2.0) * 0.3 + 0.7;
      float flow = flow1 * flow2;
      
      // 渐变效果
      float gradient = smoothstep(0.0, 0.3, uv.x) * smoothstep(1.0, 0.7, uv.x);
      
      vec3 finalColor = color * flow * gradient;
      gl_FragColor = vec4(finalColor, opacity * gradient);
    }
  `
)

extend({ RiverMaterial })

// 智能时间流画布属性
interface EnhancedFlowCanvasProps {
  events: Event[]
  currentTime: Date
  timeRange: { start: Date; end: Date }
  onEventSelect?: (event: Event) => void
  onEventDrag?: (eventId: string, newPosition: FlowPosition) => void
  onEventDrop?: (eventId: string, newTime: Date) => void
  className?: string
  // 新增河流式时间流特性
  riverFlow: {
    enabled: boolean
    flowSpeed: number
    currentTimeCenter: boolean
    rippleEffects: boolean
  }
  // 智能交互
  smartInteraction: {
    dragPreview: boolean
    conflictAvoidance: boolean
    snapToSlots: boolean
    energyOptimization: boolean
  }
}

// 涟漪效果组件
function RippleEffect({ 
  ripples, 
  onRippleComplete 
}: { 
  ripples: Ripple[]
  onRippleComplete: (rippleId: string) => void 
}) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    if (!groupRef.current) return

    ripples.forEach((ripple, index) => {
      const mesh = groupRef.current!.children[index] as THREE.Mesh
      if (!mesh) return

      // 更新涟漪动画
      ripple.radius = Math.min(ripple.radius + ripple.speed * delta, ripple.maxRadius)
      ripple.life -= delta
      ripple.intensity = Math.max(0, ripple.life / 2)

      // 应用到网格
      mesh.scale.setScalar(ripple.radius)
      const material = mesh.material as THREE.MeshBasicMaterial
      material.opacity = ripple.intensity * 0.3

      // 检查生命周期结束
      if (ripple.life <= 0) {
        onRippleComplete(ripple.id)
      }
    })
  })

  return (
    <group ref={groupRef}>
      {ripples.map((ripple) => (
        <mesh key={ripple.id} position={[ripple.center.x, ripple.center.y, ripple.center.z + 0.1]}>
          <ringGeometry args={[0.8, 1.0, 32]} />
          <meshBasicMaterial
            color={ripple.color}
            transparent
            opacity={ripple.intensity * 0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  )
}

// 船只式事件卡片3D组件 - 升级版
function BoatEventCard3D({ 
  event, 
  position, 
  onSelect, 
  onDragStart,
  isDragging = false,
  isConflicted = false,
  energyOptimization = false
}: {
  event: Event
  position: FlowPosition
  onSelect: (event: Event) => void
  onDragStart: (event: Event, position: FlowPosition) => void
  isDragging?: boolean
  isConflicted?: boolean
  energyOptimization?: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const shadowRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  // 根据事件类别和精力需求获取船只样式
  const getBoatStyle = (category: EventCategory, energy: EnergyLevel) => {
    const baseColors = {
      [EventCategory.WORK]: '#3b82f6',
      [EventCategory.PERSONAL]: '#10b981', 
      [EventCategory.MEETING]: '#f59e0b',
      [EventCategory.BREAK]: '#8b5cf6',
      [EventCategory.EXERCISE]: '#ef4444',
      [EventCategory.MEAL]: '#f97316',
      [EventCategory.TRAVEL]: '#06b6d4',
      [EventCategory.OTHER]: '#6b7280',
      [EventCategory.TRADING]: '#dc2626',        // 交易红色
      [EventCategory.LIFE_ROUTINE]: '#059669',   // 生活绿色
      [EventCategory.PREPARATION]: '#7c3aed'     // 准备紫色
    }

    // 根据重要性调整船只大小
    const getSize = (priority: string, duration: number) => {
      const baseSize = Math.max(1.5, Math.min(4, duration / 30)) // 根据时长调整
      const priorityMultiplier = {
        'urgent': 1.3,
        'high': 1.1,
        'medium': 1.0,
        'low': 0.8
      }[priority] || 1.0

      return [baseSize * priorityMultiplier, 0.6, 0.3]
    }

    return {
      color: baseColors[category] || baseColors[EventCategory.OTHER],
      size: getSize(event.priority, event.estimatedDuration),
      glowIntensity: energy === EnergyLevel.PEAK ? 0.5 : energy === EnergyLevel.HIGH ? 0.3 : 0.1
    }
  }

  const boatStyle = getBoatStyle(event.category, event.energyRequired)

  // 河流浮动动画
  useFrame((state) => {
    if (!meshRef.current || !shadowRef.current) return

    const time = state.clock.getElapsedTime()
    
    // 船只在河流中的浮动效果
    const waveOffset = Math.sin(time * 1.5 + position.x * 0.2) * 0.15
    const currentOffset = Math.sin(time * 0.8 + position.z * 0.1) * 0.05
    
    meshRef.current.position.y = position.y + waveOffset + currentOffset
    meshRef.current.rotation.z = waveOffset * 0.1
    meshRef.current.rotation.x = currentOffset * 0.2

    // 阴影跟随
    shadowRef.current.position.y = position.y - 0.1
    shadowRef.current.scale.setScalar(1 + Math.abs(waveOffset) * 0.2)

    // 拖拽状态效果
    if (isDragging) {
      meshRef.current.position.z = position.z + 0.5
      meshRef.current.scale.setScalar(1.2)
    } else if (hovered) {
      meshRef.current.scale.setScalar(1.1)
      meshRef.current.rotation.y = Math.sin(time * 3) * 0.05
    } else {
      meshRef.current.scale.setScalar(1)
      meshRef.current.rotation.y = 0
    }

    // 冲突警告效果
    if (isConflicted && meshRef.current.material) {
      const pulse = Math.sin(time * 8) * 0.5 + 0.5
      const material = meshRef.current.material as THREE.MeshStandardMaterial
      material.emissiveIntensity = pulse * 0.3
    }
  })

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* 船只阴影 */}
      <mesh
        ref={shadowRef}
        position={[0, -0.1, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[boatStyle.size[0] * 1.2, boatStyle.size[2] * 1.2]} />
        <meshBasicMaterial 
          color="#000000"
          transparent
          opacity={0.2}
        />
      </mesh>

      {/* 主船体 - 船只形状 */}
      <mesh
        ref={meshRef}
        onClick={() => onSelect(event)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onPointerDown={() => onDragStart(event, position)}
      >
        {/* 使用椭球几何创建船只形状 */}
        <sphereGeometry args={[boatStyle.size[0], 16, 8]} />
        <meshStandardMaterial 
          color={boatStyle.color}
          transparent
          opacity={isDragging ? 0.8 : hovered ? 0.9 : 0.75}
          emissive={boatStyle.color}
          emissiveIntensity={boatStyle.glowIntensity}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
      
      {/* 船帆 - 优先级指示器 */}
      <mesh position={[0, boatStyle.size[1] * 0.8, 0]}>
        <coneGeometry args={[0.3, 0.8, 3]} />
        <meshStandardMaterial 
          color={event.priority === 'urgent' ? '#ef4444' : 
                event.priority === 'high' ? '#f59e0b' : 
                event.priority === 'medium' ? '#10b981' : '#6b7280'}
          emissive={event.priority === 'urgent' ? '#ef4444' : '#000000'}
          emissiveIntensity={event.priority === 'urgent' ? 0.4 : 0}
        />
      </mesh>

      {/* 精力匹配指示灯 */}
      {energyOptimization && (
        <mesh position={[-boatStyle.size[0] * 0.4, 0, boatStyle.size[2] * 0.8]}>
          <sphereGeometry args={[0.08]} />
          <meshStandardMaterial 
            color={event.energyRequired === EnergyLevel.PEAK ? '#ff0000' :
                  event.energyRequired === EnergyLevel.HIGH ? '#ff8800' :
                  event.energyRequired === EnergyLevel.MEDIUM ? '#00ff00' : '#0088ff'}
            emissive={event.energyRequired === EnergyLevel.PEAK ? '#ff0000' : '#000000'}
            emissiveIntensity={0.6}
          />
        </mesh>
      )}

      {/* 市场保护标识 */}
      {event.isMarketProtected && (
        <mesh position={[boatStyle.size[0] * 0.4, 0, boatStyle.size[2] * 0.8]}>
          <octahedronGeometry args={[0.1]} />
          <meshStandardMaterial 
            color="#fbbf24"
            emissive="#fbbf24"
            emissiveIntensity={0.5}
          />
        </mesh>
      )}
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

// 河流式时间轴组件 - 升级版
function RiverTimeAxis({ 
  timeRange, 
  currentTime,
  riverFlow
}: { 
  timeRange: { start: Date; end: Date }
  currentTime: Date
  riverFlow: { enabled: boolean; flowSpeed: number; currentTimeCenter: boolean }
}) {
  const riverRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!riverRef.current || !groupRef.current) return
    
    const time = state.clock.getElapsedTime()
    
    // 河流流动效果
    if (riverFlow.enabled) {
      const material = riverRef.current.material as THREE.ShaderMaterial
      if (material.uniforms) {
        material.uniforms.time.value = time
        material.uniforms.flowSpeed.value = riverFlow.flowSpeed
      }
    }
    
    // 当前时间居中
    if (riverFlow.currentTimeCenter) {
      const progress = (currentTime.getTime() - timeRange.start.getTime()) / 
                      (timeRange.end.getTime() - timeRange.start.getTime())
      groupRef.current.position.y = -progress * 10
    }
  })

  return (
    <group ref={groupRef}>
      {/* 河流底面 */}
      {riverFlow.enabled && (
        <mesh ref={riverRef} position={[0, 0, -2]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[20, 40]} />
          <meshStandardMaterial 
            color="#4f46e5"
            transparent
            opacity={0.3}
            roughness={0.8}
            metalness={0.1}
          />
        </mesh>
      )}
      
      {/* 主时间轴 */}
      <mesh position={[0, 0, -1]}>
        <cylinderGeometry args={[0.02, 0.02, 20]} />
        <meshStandardMaterial color="#4f46e5" />
      </mesh>
      
      {/* 当前时间指示器 - 始终在中心 */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.15]} />
        <meshStandardMaterial 
          color="#ef4444" 
          emissive="#ef4444"
          emissiveIntensity={0.6}
        />
      </mesh>
      
      {/* 时间刻度线 */}
      {Array.from({ length: 24 }, (_, i) => (
        <group key={i} position={[0, (i - 12) * 0.8, -0.5]}>
          <mesh>
            <boxGeometry args={[0.3, 0.03, 0.03]} />
            <meshStandardMaterial color="#6b7280" />
          </mesh>
          {/* 时间标签 */}
          <mesh position={[0.5, 0, 0]}>
            <boxGeometry args={[0.1, 0.1, 0.01]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// 主河流时间流画布组件 - 升级版
export default function EnhancedFlowCanvas({
  events = [],
  currentTime,
  timeRange,
  onEventSelect,
  onEventDrag,
  onEventDrop,
  className = "",
  riverFlow = {
    enabled: true,
    flowSpeed: 1.0,
    currentTimeCenter: true,
    rippleEffects: true
  },
  smartInteraction = {
    dragPreview: true,
    conflictAvoidance: true,
    snapToSlots: true,
    energyOptimization: true
  }
}: EnhancedFlowCanvasProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [draggedEvent, setDraggedEvent] = useState<string | null>(null)
  const [ripples, setRipples] = useState<Ripple[]>([])

  const handleEventSelect = useCallback((event: Event) => {
    setSelectedEvent(event)
    onEventSelect?.(event)
  }, [onEventSelect])

  const handleEventDragStart = useCallback((event: Event, position: FlowPosition) => {
    setDraggedEvent(event.id)
    
    // 创建拖拽涟漪效果
    if (riverFlow.rippleEffects) {
      const newRipple: Ripple = {
        id: `ripple-${Date.now()}`,
        center: position,
        radius: 0,
        maxRadius: 3,
        intensity: 1,
        speed: 2,
        color: '#4f46e5',
        life: 2
      }
      setRipples(prev => [...prev, newRipple])
    }
    
    console.log('🌊 Drag start:', event.title, position)
  }, [riverFlow.rippleEffects])

  const handleRippleComplete = useCallback((rippleId: string) => {
    setRipples(prev => prev.filter(r => r.id !== rippleId))
  }, [])

  // 智能事件位置计算
  const calculateEventPositions = useMemo(() => {
    return events.map((event: Event, index: number) => {
      // 根据时间计算Y位置
      const timeProgress = (event.startTime.getTime() - timeRange.start.getTime()) / 
                          (timeRange.end.getTime() - timeRange.start.getTime())
      
      // 根据类别计算X位置（分泳道）
      const categoryLanes = {
        [EventCategory.TRADING]: -4,
        [EventCategory.WORK]: -2,
        [EventCategory.MEETING]: 0,
        [EventCategory.PERSONAL]: 2,
        [EventCategory.LIFE_ROUTINE]: 4,
        [EventCategory.PREPARATION]: -1,
        [EventCategory.BREAK]: 3,
        [EventCategory.EXERCISE]: 1,
        [EventCategory.MEAL]: -3,
        [EventCategory.TRAVEL]: 5,
        [EventCategory.OTHER]: 0
      }
      
      return {
        ...event,
        position: {
          x: categoryLanes[event.category] || (index % 5 - 2) * 2,
          y: riverFlow.currentTimeCenter ? (timeProgress - 0.5) * 20 : timeProgress * 20,
          z: event.priority === 'urgent' ? 0.5 : 0
        }
      }
    })
  }, [events, timeRange, riverFlow.currentTimeCenter])

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
        
        {/* 河流时间轴 */}
        <RiverTimeAxis 
          timeRange={timeRange} 
          currentTime={currentTime}
          riverFlow={riverFlow}
        />
        
        {/* 涟漪效果 */}
        {riverFlow.rippleEffects && (
          <RippleEffect 
            ripples={ripples}
            onRippleComplete={handleRippleComplete}
          />
        )}
        
        {/* 渲染所有船只式事件卡片 */}
        {calculateEventPositions.map((eventWithPosition) => (
          <BoatEventCard3D
            key={eventWithPosition.id}
            event={eventWithPosition}
            position={eventWithPosition.position}
            onSelect={handleEventSelect}
            onDragStart={handleEventDragStart}
            isDragging={draggedEvent === eventWithPosition.id}
            isConflicted={eventWithPosition.isConflicted}
            energyOptimization={smartInteraction.energyOptimization}
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
