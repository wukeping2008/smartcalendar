'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { MarketStatus } from '../../types/event'
import { marketService, MarketOverview, MarketAlert } from '../../lib/services/RealTimeMarketService'

interface MarketStatusBarProps {
  className?: string
}

export default function MarketStatusBar({ className = "" }: MarketStatusBarProps) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [marketStatus, setMarketStatus] = useState<MarketStatus>({
    isOpen: false,
    currentSession: '休市',
    nextImportantTime: new Date(),
    volatility: 'low'
  })
  const [mounted, setMounted] = useState(false)

  // 客户端挂载检测
  useEffect(() => {
    setMounted(true)
    setCurrentTime(new Date())
  }, [])

  // 更新时间和市场状态
  useEffect(() => {
    if (!mounted) return

    const updateMarketStatus = () => {
      const now = new Date()
      setCurrentTime(now)
      
      const hour = now.getHours()
      const minute = now.getMinutes()
      const currentMinutes = hour * 60 + minute
      
      // 市场时段判断 (北京时间)
      let isOpen = false
      let currentSession = '休市'
      let volatility: 'low' | 'medium' | 'high' = 'low'
      let nextImportantTime = new Date()
      
      // 亚洲市场 (09:00-17:00)
      if (currentMinutes >= 9 * 60 && currentMinutes < 17 * 60) {
        isOpen = true
        currentSession = '亚洲市场'
        volatility = 'medium'
        // 下一个重要时间点：美国开盘
        const nextOpen = new Date(now)
        nextOpen.setHours(21, 30, 0, 0)
        if (nextOpen < now) {
          nextOpen.setDate(nextOpen.getDate() + 1)
        }
        nextImportantTime = nextOpen
      }
      // 美国市场 (21:30-04:00)
      else if (currentMinutes >= 21 * 60 + 30 || currentMinutes < 4 * 60) {
        isOpen = true
        currentSession = '美国市场'
        volatility = 'high'
        // 下一个重要时间点：美国收盘
        const nextClose = new Date(now)
        if (currentMinutes >= 21 * 60 + 30) {
          nextClose.setDate(nextClose.getDate() + 1)
          nextClose.setHours(4, 0, 0, 0)
        } else {
          nextClose.setHours(4, 0, 0, 0)
        }
        nextImportantTime = nextClose
      }
      // 欧洲市场 (16:00-00:30)
      else if (currentMinutes >= 16 * 60 && currentMinutes < 24 * 60 + 30) {
        isOpen = true
        currentSession = '欧洲市场'
        volatility = 'medium'
        // 下一个重要时间点：美国开盘
        const nextOpen = new Date(now)
        nextOpen.setHours(21, 30, 0, 0)
        nextImportantTime = nextOpen
      }
      // 休市时间
      else {
        isOpen = false
        currentSession = '休市中'
        volatility = 'low'
        // 下一个开盘时间
        const nextOpen = new Date(now)
        if (currentMinutes < 9 * 60) {
          nextOpen.setHours(9, 0, 0, 0)
        } else {
          nextOpen.setDate(nextOpen.getDate() + 1)
          nextOpen.setHours(9, 0, 0, 0)
        }
        nextImportantTime = nextOpen
      }
      
      setMarketStatus({
        isOpen,
        currentSession,
        nextImportantTime,
        volatility
      })
    }

    // 立即更新一次
    updateMarketStatus()
    
    // 每分钟更新一次
    const interval = setInterval(updateMarketStatus, 60000)
    
    return () => clearInterval(interval)
  }, [mounted])

  // 服务器端渲染时显示加载状态
  if (!mounted || !currentTime) {
    return (
      <Card className={`bg-black/40 backdrop-blur-sm border-white/20 p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-gray-400 opacity-60" />
              <span className="font-semibold text-gray-400">加载中...</span>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-white font-mono text-lg">--:--:--</div>
              <div className="text-gray-400 text-xs">加载中</div>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  const getStatusColor = (isOpen: boolean): string => {
    return isOpen ? 'text-green-400' : 'text-red-400'
  }

  const getVolatilityColor = (volatility: string): string => {
    switch (volatility) {
      case 'high': return 'text-red-400'
      case 'medium': return 'text-yellow-400'
      case 'low': return 'text-green-400'
      default: return 'text-gray-400'
    }
  }

  const getVolatilityLabel = (volatility: string): string => {
    switch (volatility) {
      case 'high': return '高波动'
      case 'medium': return '中波动'
      case 'low': return '低波动'
      default: return '未知'
    }
  }

  const formatTimeUntil = (targetTime: Date): string => {
    const now = currentTime
    const diffMs = targetTime.getTime() - now.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (diffHours > 0) {
      return `${diffHours}小时${diffMinutes}分钟`
    } else if (diffMinutes > 0) {
      return `${diffMinutes}分钟`
    } else {
      return '即将开始'
    }
  }

  return (
    <Card className={`bg-black/40 backdrop-blur-sm border-white/20 p-4 ${className}`}>
      <div className="flex items-center justify-between">
        {/* 市场状态 */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${marketStatus.isOpen ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className={`font-semibold ${getStatusColor(marketStatus.isOpen)}`}>
              {marketStatus.currentSession}
            </span>
          </div>
          
          <div className="h-4 w-px bg-white/20" />
          
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-sm">波动性:</span>
            <span className={`text-sm font-medium ${getVolatilityColor(marketStatus.volatility)}`}>
              {getVolatilityLabel(marketStatus.volatility)}
            </span>
          </div>
        </div>

        {/* 时间信息 */}
        <div className="flex items-center space-x-6">
          <div className="text-center">
            <div className="text-white font-mono text-lg">
              {currentTime.toLocaleTimeString('zh-CN', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
              })}
            </div>
            <div className="text-gray-400 text-xs">
              {currentTime.toLocaleDateString('zh-CN', { 
                month: 'short', 
                day: 'numeric',
                weekday: 'short'
              })}
            </div>
          </div>
          
          <div className="h-8 w-px bg-white/20" />
          
            <div className="text-center">
            <div className="text-cyan-300 text-sm font-medium">
              {marketStatus.isOpen ? '距离收盘' : '距离开盘'}
            </div>
            <div className="text-white text-sm">
              {formatTimeUntil(marketStatus.nextImportantTime)}
            </div>
          </div>
        </div>
      </div>

      {/* 交易提示 */}
      {marketStatus.isOpen && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-yellow-400">⚡</span>
              <span className="text-gray-300">
                {marketStatus.currentSession === '美国市场' && '关注美股开盘，波动加剧'}
                {marketStatus.currentSession === '亚洲市场' && '亚洲交易时段，适合策略执行'}
                {marketStatus.currentSession === '欧洲市场' && '欧洲交易活跃，关注重要数据'}
              </span>
            </div>
            <div className="text-cyan-300">
              🛡️ 市场保护时段活跃
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
