/**
 * StorageService - IndexedDB数据持久化服务
 * 实现本地数据存储、缓存和离线支持
 */

import { Event, EventCategory, Priority, EventStatus, EnergyLevel } from '../../types/event'

interface StorageConfig {
  dbName: string
  dbVersion: number
  stores: {
    events: string
    aiDecisions: string
    userPreferences: string
    marketData: string
  }
}

interface AIDecisionRecord {
  id: string
  type: 'market' | 'productivity' | 'energy' | 'ai_enhanced'
  priority: 'critical' | 'high' | 'medium' | 'low'
  confidence: number
  message: string
  reasoning: string
  createdAt: Date
  appliedAt?: Date
  eventId?: string
}

interface UserPreferences {
  id: string
  theme: 'dark' | 'light' | 'auto'
  language: 'zh' | 'en'
  defaultView: 'calendar' | 'flow'
  workHours: {
    start: string
    end: string
  }
  energyCurve: {
    morning: 'low' | 'medium' | 'high' | 'peak'
    afternoon: 'low' | 'medium' | 'high' | 'peak'
    evening: 'low' | 'medium' | 'high' | 'peak'
    night: 'low' | 'medium' | 'high' | 'peak'
  }
  notifications: {
    enabled: boolean
    sound: boolean
    advanceTime: number
  }
  aiSettings: {
    autoSuggestions: boolean
    marketProtection: boolean
    conflictResolution: boolean
  }
  updatedAt: Date
}

interface MarketDataCache {
  id: string
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
  timestamp: Date
  source: string
}

class StorageService {
  private db: IDBDatabase | null = null
  private config: StorageConfig = {
    dbName: 'SmartCalendarDB',
    dbVersion: 1,
    stores: {
      events: 'events',
      aiDecisions: 'aiDecisions',
      userPreferences: 'userPreferences',
      marketData: 'marketData'
    }
  }

  constructor() {
    this.initDB()
  }

  /**
   * 初始化IndexedDB数据库
   */
  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, this.config.dbVersion)

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log('✅ IndexedDB initialized successfully')
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // 创建事件存储
        if (!db.objectStoreNames.contains(this.config.stores.events)) {
          const eventStore = db.createObjectStore(this.config.stores.events, { 
            keyPath: 'id' 
          })
          eventStore.createIndex('startTime', 'startTime', { unique: false })
          eventStore.createIndex('category', 'category', { unique: false })
          eventStore.createIndex('status', 'status', { unique: false })
          eventStore.createIndex('priority', 'priority', { unique: false })
          console.log('✅ Created events store')
        }

        // 创建AI决策存储
        if (!db.objectStoreNames.contains(this.config.stores.aiDecisions)) {
          const aiStore = db.createObjectStore(this.config.stores.aiDecisions, { 
            keyPath: 'id' 
          })
          aiStore.createIndex('type', 'type', { unique: false })
          aiStore.createIndex('priority', 'priority', { unique: false })
          aiStore.createIndex('createdAt', 'createdAt', { unique: false })
          aiStore.createIndex('eventId', 'eventId', { unique: false })
          console.log('✅ Created AI decisions store')
        }

        // 创建用户偏好存储
        if (!db.objectStoreNames.contains(this.config.stores.userPreferences)) {
          db.createObjectStore(this.config.stores.userPreferences, { 
            keyPath: 'id' 
          })
          console.log('✅ Created user preferences store')
        }

        // 创建市场数据缓存存储
        if (!db.objectStoreNames.contains(this.config.stores.marketData)) {
          const marketStore = db.createObjectStore(this.config.stores.marketData, { 
            keyPath: 'id' 
          })
          marketStore.createIndex('symbol', 'symbol', { unique: false })
          marketStore.createIndex('timestamp', 'timestamp', { unique: false })
          console.log('✅ Created market data store')
        }
      }
    })
  }

  /**
   * 确保数据库已连接
   */
  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initDB()
    }
    if (!this.db) {
      throw new Error('Failed to initialize IndexedDB')
    }
    return this.db
  }

  // ==================== 事件相关操作 ====================

  /**
   * 保存事件
   */
  async saveEvent(event: Event): Promise<void> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.config.stores.events], 'readwrite')
      const store = transaction.objectStore(this.config.stores.events)
      
      // 将Date对象转换为ISO字符串以便存储
      const eventToStore = {
        ...event,
        startTime: event.startTime.toISOString(),
        endTime: event.endTime.toISOString(),
        createdAt: event.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      const request = store.put(eventToStore)
      
      request.onsuccess = () => {
        console.log(`✅ Event saved: ${event.title}`)
        resolve()
      }
      
      request.onerror = () => {
        console.error('Failed to save event:', request.error)
        reject(request.error)
      }
    })
  }

  /**
   * 批量保存事件
   */
  async saveEvents(events: Event[]): Promise<void> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.config.stores.events], 'readwrite')
      const store = transaction.objectStore(this.config.stores.events)
      
      let savedCount = 0
      
      events.forEach(event => {
        const eventToStore = {
          ...event,
          startTime: event.startTime.toISOString(),
          endTime: event.endTime.toISOString(),
          createdAt: event.createdAt?.toISOString() || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        const request = store.put(eventToStore)
        
        request.onsuccess = () => {
          savedCount++
          if (savedCount === events.length) {
            console.log(`✅ Saved ${savedCount} events`)
            resolve()
          }
        }
        
        request.onerror = () => {
          console.error('Failed to save event:', request.error)
          reject(request.error)
        }
      })
    })
  }

  /**
   * 获取所有事件
   */
  async getAllEvents(): Promise<Event[]> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.config.stores.events], 'readonly')
      const store = transaction.objectStore(this.config.stores.events)
      const request = store.getAll()
      
      request.onsuccess = () => {
        const events = request.result.map(event => ({
          ...event,
          startTime: new Date(event.startTime),
          endTime: new Date(event.endTime),
          createdAt: event.createdAt ? new Date(event.createdAt) : undefined,
          updatedAt: event.updatedAt ? new Date(event.updatedAt) : undefined,
          reminders: event.reminders?.map((reminder: { time: string; [key: string]: unknown }) => ({
            ...reminder,
            time: new Date(reminder.time)
          })) || []
        }))
        console.log(`✅ Loaded ${events.length} events from storage`)
        resolve(events)
      }
      
      request.onerror = () => {
        console.error('Failed to get events:', request.error)
        reject(request.error)
      }
    })
  }

  /**
   * 获取指定日期范围的事件
   */
  async getEventsByDateRange(startDate: Date, endDate: Date): Promise<Event[]> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.config.stores.events], 'readonly')
      const store = transaction.objectStore(this.config.stores.events)
      const index = store.index('startTime')
      
      const range = IDBKeyRange.bound(
        startDate.toISOString(),
        endDate.toISOString()
      )
      
      const request = index.getAll(range)
      
      request.onsuccess = () => {
        const events = request.result.map(event => ({
          ...event,
          startTime: new Date(event.startTime),
          endTime: new Date(event.endTime),
          createdAt: event.createdAt ? new Date(event.createdAt) : undefined,
          updatedAt: event.updatedAt ? new Date(event.updatedAt) : undefined,
          reminders: event.reminders?.map((reminder: { time: string; [key: string]: unknown }) => ({
            ...reminder,
            time: new Date(reminder.time)
          })) || []
        }))
        resolve(events)
      }
      
      request.onerror = () => {
        console.error('Failed to get events by date range:', request.error)
        reject(request.error)
      }
    })
  }

  /**
   * 删除事件
   */
  async deleteEvent(eventId: string): Promise<void> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.config.stores.events], 'readwrite')
      const store = transaction.objectStore(this.config.stores.events)
      const request = store.delete(eventId)
      
      request.onsuccess = () => {
        console.log(`✅ Event deleted: ${eventId}`)
        resolve()
      }
      
      request.onerror = () => {
        console.error('Failed to delete event:', request.error)
        reject(request.error)
      }
    })
  }

  // ==================== AI决策相关操作 ====================

  /**
   * 保存AI决策记录
   */
  async saveAIDecision(decision: AIDecisionRecord): Promise<void> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.config.stores.aiDecisions], 'readwrite')
      const store = transaction.objectStore(this.config.stores.aiDecisions)
      
      const decisionToStore = {
        ...decision,
        createdAt: decision.createdAt.toISOString(),
        appliedAt: decision.appliedAt?.toISOString()
      }
      
      const request = store.put(decisionToStore)
      
      request.onsuccess = () => {
        console.log(`✅ AI decision saved: ${decision.message}`)
        resolve()
      }
      
      request.onerror = () => {
        console.error('Failed to save AI decision:', request.error)
        reject(request.error)
      }
    })
  }

  /**
   * 获取AI决策历史
   */
  async getAIDecisionHistory(limit: number = 100): Promise<AIDecisionRecord[]> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.config.stores.aiDecisions], 'readonly')
      const store = transaction.objectStore(this.config.stores.aiDecisions)
      const index = store.index('createdAt')
      
      const request = index.openCursor(null, 'prev')
      const decisions: AIDecisionRecord[] = []
      
      request.onsuccess = () => {
        const cursor = request.result
        if (cursor && decisions.length < limit) {
          const decision = cursor.value
          decisions.push({
            ...decision,
            createdAt: new Date(decision.createdAt),
            appliedAt: decision.appliedAt ? new Date(decision.appliedAt) : undefined
          })
          cursor.continue()
        } else {
          console.log(`✅ Loaded ${decisions.length} AI decisions from storage`)
          resolve(decisions)
        }
      }
      
      request.onerror = () => {
        console.error('Failed to get AI decision history:', request.error)
        reject(request.error)
      }
    })
  }

  // ==================== 用户偏好相关操作 ====================

  /**
   * 保存用户偏好
   */
  async saveUserPreferences(preferences: UserPreferences): Promise<void> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.config.stores.userPreferences], 'readwrite')
      const store = transaction.objectStore(this.config.stores.userPreferences)
      
      const prefsToStore = {
        ...preferences,
        updatedAt: new Date().toISOString()
      }
      
      const request = store.put(prefsToStore)
      
      request.onsuccess = () => {
        console.log('✅ User preferences saved')
        resolve()
      }
      
      request.onerror = () => {
        console.error('Failed to save user preferences:', request.error)
        reject(request.error)
      }
    })
  }

  /**
   * 获取用户偏好
   */
  async getUserPreferences(): Promise<UserPreferences | null> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.config.stores.userPreferences], 'readonly')
      const store = transaction.objectStore(this.config.stores.userPreferences)
      const request = store.get('default')
      
      request.onsuccess = () => {
        if (request.result) {
          const prefs = request.result
          resolve({
            ...prefs,
            updatedAt: new Date(prefs.updatedAt)
          })
        } else {
          resolve(null)
        }
      }
      
      request.onerror = () => {
        console.error('Failed to get user preferences:', request.error)
        reject(request.error)
      }
    })
  }

  // ==================== 市场数据相关操作 ====================

  /**
   * 保存市场数据缓存
   */
  async saveMarketData(data: MarketDataCache): Promise<void> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.config.stores.marketData], 'readwrite')
      const store = transaction.objectStore(this.config.stores.marketData)
      
      const dataToStore = {
        ...data,
        timestamp: data.timestamp.toISOString()
      }
      
      const request = store.put(dataToStore)
      
      request.onsuccess = () => {
        console.log(`✅ Market data saved: ${data.symbol}`)
        resolve()
      }
      
      request.onerror = () => {
        console.error('Failed to save market data:', request.error)
        reject(request.error)
      }
    })
  }

  /**
   * 获取市场数据缓存
   */
  async getMarketData(symbol: string): Promise<MarketDataCache | null> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.config.stores.marketData], 'readonly')
      const store = transaction.objectStore(this.config.stores.marketData)
      const index = store.index('symbol')
      
      const request = index.openCursor(IDBKeyRange.only(symbol), 'prev')
      
      request.onsuccess = () => {
        const cursor = request.result
        if (cursor) {
          const data = cursor.value
          resolve({
            ...data,
            timestamp: new Date(data.timestamp)
          })
        } else {
          resolve(null)
        }
      }
      
      request.onerror = () => {
        console.error('Failed to get market data:', request.error)
        reject(request.error)
      }
    })
  }

  /**
   * 清除过期的市场数据缓存
   */
  async clearExpiredMarketData(expiryTime: number = 86400000): Promise<void> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.config.stores.marketData], 'readwrite')
      const store = transaction.objectStore(this.config.stores.marketData)
      const index = store.index('timestamp')
      
      const cutoffTime = new Date(Date.now() - expiryTime).toISOString()
      const range = IDBKeyRange.upperBound(cutoffTime)
      
      const request = index.openCursor(range)
      let deletedCount = 0
      
      request.onsuccess = () => {
        const cursor = request.result
        if (cursor) {
          store.delete(cursor.primaryKey)
          deletedCount++
          cursor.continue()
        } else {
          console.log(`✅ Cleared ${deletedCount} expired market data entries`)
          resolve()
        }
      }
      
      request.onerror = () => {
        console.error('Failed to clear expired market data:', request.error)
        reject(request.error)
      }
    })
  }

  // ==================== 数据导入导出 ====================

  /**
   * 导出所有数据
   */
  async exportAllData(): Promise<{
    version: number;
    exportDate: string;
    data: {
      events: Event[];
      aiDecisions: AIDecisionRecord[];
      preferences: UserPreferences | null;
    };
  }> {
    const events = await this.getAllEvents()
    const aiDecisions = await this.getAIDecisionHistory(1000)
    const preferences = await this.getUserPreferences()
    
    return {
      version: this.config.dbVersion,
      exportDate: new Date().toISOString(),
      data: {
        events,
        aiDecisions,
        preferences
      }
    }
  }

  /**
   * 导入数据
   */
  async importData(data: {
    data?: {
      events?: Event[];
      aiDecisions?: AIDecisionRecord[];
      preferences?: UserPreferences;
    };
  }): Promise<void> {
    if (!data || !data.data) {
      throw new Error('Invalid import data format')
    }
    
    // 导入事件
    if (data.data.events && Array.isArray(data.data.events)) {
      await this.saveEvents(data.data.events)
    }
    
    // 导入AI决策历史
    if (data.data.aiDecisions && Array.isArray(data.data.aiDecisions)) {
      for (const decision of data.data.aiDecisions) {
        await this.saveAIDecision(decision)
      }
    }
    
    // 导入用户偏好
    if (data.data.preferences) {
      await this.saveUserPreferences(data.data.preferences)
    }
    
    console.log('✅ Data import completed successfully')
  }

  /**
   * 清除所有数据
   */
  async clearAllData(): Promise<void> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(
        [
          this.config.stores.events,
          this.config.stores.aiDecisions,
          this.config.stores.userPreferences,
          this.config.stores.marketData
        ],
        'readwrite'
      )
      
      transaction.objectStore(this.config.stores.events).clear()
      transaction.objectStore(this.config.stores.aiDecisions).clear()
      transaction.objectStore(this.config.stores.userPreferences).clear()
      transaction.objectStore(this.config.stores.marketData).clear()
      
      transaction.oncomplete = () => {
        console.log('✅ All data cleared successfully')
        resolve()
      }
      
      transaction.onerror = () => {
        console.error('Failed to clear data:', transaction.error)
        reject(transaction.error)
      }
    })
  }
}

// 导出单例实例
export const storageService = new StorageService()

// 导出类型
export type {
  AIDecisionRecord,
  UserPreferences,
  MarketDataCache
}
