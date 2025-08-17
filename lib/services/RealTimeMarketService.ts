'use client'

/**
 * 实时市场数据服务 v1.0
 * 功能：WebSocket连接、实时行情数据、市场状态监控、智能预警
 */

interface MarketData {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
  high24h: number
  low24h: number
  timestamp: number
  marketCap?: number
}

interface MarketAlert {
  id: string
  type: 'volatility' | 'volume' | 'price' | 'news' | 'technical'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  timestamp: Date
  symbol?: string
  data?: Record<string, unknown>
}

interface MarketSession {
  name: string
  region: string
  isOpen: boolean
  openTime: string
  closeTime: string
  timezone: string
  nextEvent: {
    type: 'open' | 'close'
    time: Date
  }
}

interface MarketOverview {
  globalSentiment: 'fear' | 'neutral' | 'greed'
  vixLevel: number
  majorIndices: {
    [key: string]: {
      name: string
      value: number
      change: number
      changePercent: number
    }
  }
  activeSessions: MarketSession[]
  nextImportantEvents: Array<{
    time: Date
    event: string
    impact: 'low' | 'medium' | 'high'
  }>
}

class RealTimeMarketService {
  private static instance: RealTimeMarketService
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectInterval = 5000
  private isConnected = false
  private subscriptions: Map<string, Set<(data: MarketData) => void>> = new Map()
  private marketOverviewCallbacks: Set<(overview: MarketOverview) => void> = new Set()
  private alertCallbacks: Set<(alert: MarketAlert) => void> = new Set()
  private heartbeatInterval: NodeJS.Timeout | null = null
  
  // 模拟数据缓存
  private marketDataCache: Map<string, MarketData> = new Map()
  private marketOverviewCache: MarketOverview | null = null
  private alertsCache: MarketAlert[] = []

  private constructor() {
    this.initializeSimulatedData()
  }

  static getInstance(): RealTimeMarketService {
    if (!RealTimeMarketService.instance) {
      RealTimeMarketService.instance = new RealTimeMarketService()
    }
    return RealTimeMarketService.instance
  }

  /**
   * 初始化模拟数据
   */
  private initializeSimulatedData() {
    // 初始化主要市场数据
    const symbols = [
      'BTC/USDT', 'ETH/USDT', 'SPY', 'QQQ', 'NVDA', 'AAPL', 
      'TSLA', 'MSFT', 'GOOGL', 'AMZN'
    ]

    symbols.forEach(symbol => {
      this.marketDataCache.set(symbol, this.generateRandomMarketData(symbol))
    })

    // 初始化市场概况
    this.marketOverviewCache = {
      globalSentiment: 'neutral',
      vixLevel: 18.5,
      majorIndices: {
        'SPX': { name: 'S&P 500', value: 4185.47, change: 15.23, changePercent: 0.36 },
        'DJI': { name: '道琼斯', value: 33875.40, change: -50.20, changePercent: -0.15 },
        'IXIC': { name: '纳斯达克', value: 13962.68, change: 25.60, changePercent: 0.18 },
        'HSI': { name: '恒生指数', value: 20150.30, change: 120.45, changePercent: 0.60 }
      },
      activeSessions: this.generateActiveSessions(),
      nextImportantEvents: this.generateImportantEvents()
    }

    // 启动模拟数据更新
    this.startDataSimulation()
  }

  /**
   * 生成随机市场数据
   */
  private generateRandomMarketData(symbol: string): MarketData {
    const basePrice = symbol.includes('BTC') ? 45000 : 
                     symbol.includes('ETH') ? 3000 :
                     symbol.includes('SPY') ? 420 :
                     Math.random() * 300 + 50

    const change = (Math.random() - 0.5) * basePrice * 0.05
    const changePercent = (change / basePrice) * 100

    return {
      symbol,
      price: basePrice + change,
      change,
      changePercent,
      volume: Math.floor(Math.random() * 1000000 + 100000),
      high24h: basePrice * 1.05,
      low24h: basePrice * 0.95,
      timestamp: Date.now(),
      marketCap: basePrice * Math.floor(Math.random() * 1000000000 + 100000000)
    }
  }

  /**
   * 生成活跃交易时段
   */
  private generateActiveSessions(): MarketSession[] {
    const now = new Date()
    const hour = now.getHours()
    
    return [
      {
        name: '亚洲市场',
        region: 'Asia',
        isOpen: hour >= 9 && hour < 17,
        openTime: '09:00',
        closeTime: '17:00',
        timezone: 'Asia/Shanghai',
        nextEvent: {
          type: hour >= 9 && hour < 17 ? 'close' : 'open',
          time: new Date(now.getTime() + (hour >= 9 && hour < 17 ? (17 - hour) * 3600000 : (33 - hour) * 3600000))
        }
      },
      {
        name: '欧洲市场',
        region: 'Europe',
        isOpen: hour >= 16 && hour < 24,
        openTime: '16:00',
        closeTime: '00:00',
        timezone: 'Europe/London',
        nextEvent: {
          type: hour >= 16 && hour < 24 ? 'close' : 'open',
          time: new Date(now.getTime() + (hour >= 16 && hour < 24 ? (24 - hour) * 3600000 : (40 - hour) * 3600000))
        }
      },
      {
        name: '美国市场',
        region: 'Americas',
        isOpen: (hour >= 21 && hour < 24) || (hour >= 0 && hour < 4),
        openTime: '21:30',
        closeTime: '04:00',
        timezone: 'America/New_York',
        nextEvent: {
          type: (hour >= 21 && hour < 24) || (hour >= 0 && hour < 4) ? 'close' : 'open',
          time: new Date(now.getTime() + 2 * 3600000)
        }
      }
    ]
  }

  /**
   * 生成重要事件
   */
  private generateImportantEvents() {
    const now = new Date()
    return [
      {
        time: new Date(now.getTime() + 2 * 3600000),
        event: 'Fed利率决议',
        impact: 'high' as const
      },
      {
        time: new Date(now.getTime() + 6 * 3600000),
        event: 'CPI数据发布',
        impact: 'medium' as const
      },
      {
        time: new Date(now.getTime() + 12 * 3600000),
        event: '非农就业数据',
        impact: 'high' as const
      }
    ]
  }

  /**
   * 启动数据模拟
   */
  private startDataSimulation() {
    // 每3秒更新一次价格数据
    setInterval(() => {
      this.marketDataCache.forEach((data, symbol) => {
        const newData = this.updateMarketData(data)
        this.marketDataCache.set(symbol, newData)
        
        // 通知订阅者
        const callbacks = this.subscriptions.get(symbol)
        if (callbacks) {
          callbacks.forEach(callback => callback(newData))
        }
      })

      // 更新市场概况
      if (this.marketOverviewCache) {
        this.marketOverviewCache = this.updateMarketOverview(this.marketOverviewCache)
        this.marketOverviewCallbacks.forEach(callback => callback(this.marketOverviewCache!))
      }

      // 随机生成预警
      if (Math.random() < 0.05) { // 5%概率生成预警
        const alert = this.generateRandomAlert()
        this.alertsCache.push(alert)
        this.alertCallbacks.forEach(callback => callback(alert))
        
        // 保持最近50条预警
        if (this.alertsCache.length > 50) {
          this.alertsCache.shift()
        }
      }
    }, 3000)

    // 每30秒更新一次市场时段状态
    setInterval(() => {
      if (this.marketOverviewCache) {
        this.marketOverviewCache.activeSessions = this.generateActiveSessions()
        this.marketOverviewCallbacks.forEach(callback => callback(this.marketOverviewCache!))
      }
    }, 30000)
  }

  /**
   * 更新市场数据
   */
  private updateMarketData(data: MarketData): MarketData {
    const volatility = 0.02 // 2%波动率
    const randomChange = (Math.random() - 0.5) * data.price * volatility
    const newPrice = Math.max(data.price + randomChange, data.price * 0.5) // 防止价格过低

    const change = newPrice - (data.price - data.change) // 相对于昨日收盘价的变化
    const changePercent = (change / (data.price - data.change)) * 100

    return {
      ...data,
      price: newPrice,
      change,
      changePercent,
      volume: data.volume + Math.floor(Math.random() * 10000),
      timestamp: Date.now()
    }
  }

  /**
   * 更新市场概况
   */
  private updateMarketOverview(overview: MarketOverview): MarketOverview {
    // 更新VIX和指数
    const vixChange = (Math.random() - 0.5) * 2
    const newVix = Math.max(10, Math.min(50, overview.vixLevel + vixChange))
    
    // 根据VIX确定市场情绪
    let sentiment: 'fear' | 'neutral' | 'greed' = 'neutral'
    if (newVix > 25) sentiment = 'fear'
    else if (newVix < 15) sentiment = 'greed'

    // 更新主要指数
    const updatedIndices = { ...overview.majorIndices }
    Object.keys(updatedIndices).forEach(key => {
      const randomChange = (Math.random() - 0.5) * updatedIndices[key].value * 0.01
      updatedIndices[key] = {
        ...updatedIndices[key],
        value: updatedIndices[key].value + randomChange,
        change: updatedIndices[key].change + randomChange,
        changePercent: ((updatedIndices[key].change + randomChange) / updatedIndices[key].value) * 100
      }
    })

    return {
      ...overview,
      globalSentiment: sentiment,
      vixLevel: newVix,
      majorIndices: updatedIndices
    }
  }

  /**
   * 生成随机预警
   */
  private generateRandomAlert(): MarketAlert {
    const types: MarketAlert['type'][] = ['volatility', 'volume', 'price', 'news', 'technical']
    const severities: MarketAlert['severity'][] = ['low', 'medium', 'high', 'critical']
    const symbols = Array.from(this.marketDataCache.keys())
    
    const type = types[Math.floor(Math.random() * types.length)]
    const severity = severities[Math.floor(Math.random() * severities.length)]
    const symbol = symbols[Math.floor(Math.random() * symbols.length)]

    const alertMessages = {
      volatility: `${symbol} 波动率突然增加`,
      volume: `${symbol} 交易量异常放大`,
      price: `${symbol} 价格突破关键阻力位`,
      news: '重要市场新闻发布',
      technical: `${symbol} 技术指标发出信号`
    }

    return {
      id: `alert_${Date.now()}_${Math.random()}`,
      type,
      severity,
      title: alertMessages[type],
      message: `检测到${alertMessages[type]}，建议关注相关交易策略调整。`,
      timestamp: new Date(),
      symbol: type !== 'news' ? symbol : undefined,
      data: {
        currentPrice: this.marketDataCache.get(symbol)?.price,
        changePercent: this.marketDataCache.get(symbol)?.changePercent
      }
    }
  }

  /**
   * 连接WebSocket (实际生产环境中使用)
   */
  async connect(): Promise<boolean> {
    // 在实际环境中，这里会连接到真实的WebSocket API
    // 例如：Binance、Alpha Vantage、Yahoo Finance等
    // 模拟WebSocket连接已建立
    this.isConnected = true
    return true
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.isConnected = false
    // WebSocket连接已断开
  }

  /**
   * 订阅单个股票/币种数据
   */
  subscribe(symbol: string, callback: (data: MarketData) => void): void {
    if (!this.subscriptions.has(symbol)) {
      this.subscriptions.set(symbol, new Set())
    }
    this.subscriptions.get(symbol)!.add(callback)

    // 立即发送当前缓存数据
    const cachedData = this.marketDataCache.get(symbol)
    if (cachedData) {
      callback(cachedData)
    }
  }

  /**
   * 取消订阅
   */
  unsubscribe(symbol: string, callback?: (data: MarketData) => void): void {
    if (callback) {
      const callbacks = this.subscriptions.get(symbol)
      if (callbacks) {
        callbacks.delete(callback)
      }
    } else {
      this.subscriptions.delete(symbol)
    }
  }

  /**
   * 订阅市场概况
   */
  subscribeMarketOverview(callback: (overview: MarketOverview) => void): void {
    this.marketOverviewCallbacks.add(callback)
    
    // 立即发送当前数据
    if (this.marketOverviewCache) {
      callback(this.marketOverviewCache)
    }
  }

  /**
   * 取消市场概况订阅
   */
  unsubscribeMarketOverview(callback: (overview: MarketOverview) => void): void {
    this.marketOverviewCallbacks.delete(callback)
  }

  /**
   * 订阅预警
   */
  subscribeAlerts(callback: (alert: MarketAlert) => void): void {
    this.alertCallbacks.add(callback)
  }

  /**
   * 取消预警订阅
   */
  unsubscribeAlerts(callback: (alert: MarketAlert) => void): void {
    this.alertCallbacks.delete(callback)
  }

  /**
   * 获取历史预警
   */
  getRecentAlerts(limit = 10): MarketAlert[] {
    return this.alertsCache.slice(-limit)
  }

  /**
   * 获取当前市场数据
   */
  getMarketData(symbol: string): MarketData | null {
    return this.marketDataCache.get(symbol) || null
  }

  /**
   * 获取所有市场数据
   */
  getAllMarketData(): Map<string, MarketData> {
    return new Map(this.marketDataCache)
  }

  /**
   * 获取市场概况
   */
  getMarketOverview(): MarketOverview | null {
    return this.marketOverviewCache
  }

  /**
   * 获取连接状态
   */
  getConnectionStatus(): boolean {
    return this.isConnected
  }

  /**
   * 健康检查
   */
  healthCheck(): {
    connected: boolean
    dataFresh: boolean
    subscriptionCount: number
    lastUpdate: number
    alerts: number
  } {
    const now = Date.now()
    const lastUpdate = Math.max(...Array.from(this.marketDataCache.values()).map(d => d.timestamp))
    
    return {
      connected: this.isConnected,
      dataFresh: (now - lastUpdate) < 30000, // 30秒内的数据认为是新鲜的
      subscriptionCount: this.subscriptions.size,
      lastUpdate,
      alerts: this.alertsCache.length
    }
  }
}

// 导出单例和类型
export const marketService = RealTimeMarketService.getInstance()
export type { MarketData, MarketAlert, MarketSession, MarketOverview }
export default RealTimeMarketService
