/**
 * Time Bank Panel - 时间银行面板
 * 展示时间银行余额和交易历史
 */

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Wallet, TrendingUp, TrendingDown, Award, 
  Clock, History, Coins, Target
} from 'lucide-react'
import TimeBudgetService from '../../lib/services/TimeBudgetService'
import { TimeBank, TimeBankTransaction, TimeBankTransactionType } from '../../types/timebudget'

interface TimeBankPanelProps {
  compact?: boolean
}

export default function TimeBankPanel({ compact = false }: TimeBankPanelProps) {
  const [timeBank, setTimeBank] = useState<TimeBank | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    loadTimeBank()
    
    // 每分钟刷新一次
    const interval = setInterval(loadTimeBank, 60000)
    return () => clearInterval(interval)
  }, [])

  const loadTimeBank = () => {
    const bank = TimeBudgetService.getTimeBank()
    setTimeBank(bank)
  }

  // 格式化时间
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`
    }
    return `${minutes}分钟`
  }

  // 获取交易类型图标
  const getTransactionIcon = (type: TimeBankTransactionType) => {
    switch (type) {
      case TimeBankTransactionType.SAVE:
        return <TrendingUp className="h-4 w-4 text-green-400" />
      case TimeBankTransactionType.BORROW:
        return <TrendingDown className="h-4 w-4 text-red-400" />
      case TimeBankTransactionType.EARN:
        return <Coins className="h-4 w-4 text-yellow-400" />
      case TimeBankTransactionType.SPEND:
        return <TrendingDown className="h-4 w-4 text-orange-400" />
      case TimeBankTransactionType.BONUS:
        return <Award className="h-4 w-4 text-purple-400" />
      case TimeBankTransactionType.PENALTY:
        return <TrendingDown className="h-4 w-4 text-red-400" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  // 获取交易类型名称
  const getTransactionTypeName = (type: TimeBankTransactionType) => {
    const names: Record<TimeBankTransactionType, string> = {
      [TimeBankTransactionType.SAVE]: '存入',
      [TimeBankTransactionType.BORROW]: '借用',
      [TimeBankTransactionType.EARN]: '赚取',
      [TimeBankTransactionType.SPEND]: '支出',
      [TimeBankTransactionType.BONUS]: '奖励',
      [TimeBankTransactionType.PENALTY]: '扣除'
    }
    return names[type] || type
  }

  // 获取交易颜色
  const getTransactionColor = (type: TimeBankTransactionType) => {
    const colors: Record<TimeBankTransactionType, string> = {
      [TimeBankTransactionType.SAVE]: 'text-green-400',
      [TimeBankTransactionType.BORROW]: 'text-red-400',
      [TimeBankTransactionType.EARN]: 'text-yellow-400',
      [TimeBankTransactionType.SPEND]: 'text-orange-400',
      [TimeBankTransactionType.BONUS]: 'text-purple-400',
      [TimeBankTransactionType.PENALTY]: 'text-red-400'
    }
    return colors[type] || 'text-gray-400'
  }

  if (!timeBank) {
    return (
      <Card className="bg-black/30 border-white/20 p-4">
        <div className="text-center text-gray-400">
          <Wallet className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">时间银行初始化中...</p>
        </div>
      </Card>
    )
  }

  if (compact) {
    // 紧凑模式
    return (
      <Card className="bg-black/30 border-white/20 p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Wallet className="h-4 w-4 text-cyan-400" />
            <span className="text-white font-semibold text-sm">时间银行</span>
          </div>
          <div className="flex items-center space-x-1">
            <Award className="h-3 w-3 text-yellow-400" />
            <span className="text-xs text-yellow-400">Lv.{timeBank.efficiency.level}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-black/50 rounded-lg p-2">
            <div className="text-xs text-gray-400">可用余额</div>
            <div className="text-lg font-bold text-cyan-400">
              {Math.floor(timeBank.balance.available / 60)}分
            </div>
          </div>
          <div className="bg-black/50 rounded-lg p-2">
            <div className="text-xs text-gray-400">效率积分</div>
            <div className="text-lg font-bold text-yellow-400">
              {timeBank.efficiency.score}
            </div>
          </div>
        </div>

        {timeBank.transactions.length > 0 && (
          <div className="mt-2 pt-2 border-t border-white/10">
            <div className="text-xs text-gray-400 mb-1">最近交易</div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getTransactionIcon(timeBank.transactions[0].type)}
                <span className={`text-xs ${getTransactionColor(timeBank.transactions[0].type)}`}>
                  {getTransactionTypeName(timeBank.transactions[0].type)}
                </span>
              </div>
              <span className="text-xs text-white">
                +{Math.floor(timeBank.transactions[0].amount / 60)}分
              </span>
            </div>
          </div>
        )}
      </Card>
    )
  }

  // 完整模式
  return (
    <Card className="bg-black/30 border-white/20 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold flex items-center">
          <Wallet className="h-5 w-5 mr-2" />
          时间银行
        </h3>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-500/20 rounded-lg">
            <Award className="h-4 w-4 text-yellow-400" />
            <span className="text-sm text-yellow-400 font-semibold">
              Lv.{timeBank.efficiency.level}
            </span>
          </div>
        </div>
      </div>

      {/* 余额卡片 */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/30 p-3">
          <div className="flex items-center justify-between mb-1">
            <TrendingUp className="h-4 w-4 text-cyan-400" />
            <span className="text-xs text-cyan-400">节省</span>
          </div>
          <div className="text-xl font-bold text-white">
            {Math.floor(timeBank.balance.saved / 3600)}h
          </div>
          <div className="text-xs text-gray-400">
            {Math.floor((timeBank.balance.saved % 3600) / 60)}分钟
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-pink-500/10 border-red-500/30 p-3">
          <div className="flex items-center justify-between mb-1">
            <TrendingDown className="h-4 w-4 text-red-400" />
            <span className="text-xs text-red-400">借用</span>
          </div>
          <div className="text-xl font-bold text-white">
            {Math.floor(timeBank.balance.borrowed / 3600)}h
          </div>
          <div className="text-xs text-gray-400">
            {Math.floor((timeBank.balance.borrowed % 3600) / 60)}分钟
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30 p-3">
          <div className="flex items-center justify-between mb-1">
            <Wallet className="h-4 w-4 text-green-400" />
            <span className="text-xs text-green-400">可用</span>
          </div>
          <div className="text-xl font-bold text-white">
            {Math.floor(timeBank.balance.available / 3600)}h
          </div>
          <div className="text-xs text-gray-400">
            {Math.floor((timeBank.balance.available % 3600) / 60)}分钟
          </div>
        </Card>
      </div>

      {/* 效率积分进度 */}
      <div className="bg-black/50 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">效率积分</span>
          <span className="text-sm text-yellow-400">
            {timeBank.efficiency.score} / {timeBank.efficiency.nextLevelScore}
          </span>
        </div>
        <div className="w-full bg-black/50 rounded-full h-2 mb-2">
          <div 
            className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all"
            style={{ 
              width: `${(timeBank.efficiency.score / timeBank.efficiency.nextLevelScore) * 100}%` 
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>Level {timeBank.efficiency.level}</span>
          <span>下一级: Level {timeBank.efficiency.level + 1}</span>
        </div>
      </div>

      {/* 统计数据 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-black/50 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <Target className="h-4 w-4 text-purple-400" />
            <span className="text-xs text-gray-400">连续天数</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-white">
              {timeBank.stats.currentStreak}
            </span>
            <span className="text-xs text-gray-400">
              / 最佳: {timeBank.stats.bestStreak}天
            </span>
          </div>
        </div>

        <div className="bg-black/50 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <Coins className="h-4 w-4 text-yellow-400" />
            <span className="text-xs text-gray-400">累计赚取</span>
          </div>
          <div className="text-lg font-bold text-white">
            {formatTime(timeBank.stats.totalEarned)}
          </div>
        </div>
      </div>

      {/* 交易历史 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400 flex items-center">
            <History className="h-4 w-4 mr-1" />
            交易历史
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowHistory(!showHistory)}
            className="text-xs text-cyan-400 hover:text-cyan-300"
          >
            {showHistory ? '收起' : '展开'}
          </Button>
        </div>

        {showHistory && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {timeBank.transactions.slice(0, 10).map(transaction => (
              <div 
                key={transaction.id} 
                className="flex items-center justify-between bg-black/50 rounded-lg p-2"
              >
                <div className="flex items-center space-x-2">
                  {getTransactionIcon(transaction.type)}
                  <div>
                    <div className={`text-sm ${getTransactionColor(transaction.type)}`}>
                      {getTransactionTypeName(transaction.type)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {transaction.description}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-mono ${
                    [TimeBankTransactionType.SAVE, TimeBankTransactionType.EARN, TimeBankTransactionType.BONUS]
                      .includes(transaction.type) ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {[TimeBankTransactionType.SAVE, TimeBankTransactionType.EARN, TimeBankTransactionType.BONUS]
                      .includes(transaction.type) ? '+' : '-'}
                    {formatTime(transaction.amount)}
                  </div>
                  <div className="text-xs text-gray-400">
                    余额: {formatTime(Math.abs(transaction.balance))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 设置提示 */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">
            {timeBank.settings.autoSave ? '✓ 自动存入' : '✗ 手动存入'}
          </span>
          <span className="text-gray-400">
            借用上限: {formatTime(timeBank.settings.borrowLimit)}
          </span>
        </div>
      </div>
    </Card>
  )
}