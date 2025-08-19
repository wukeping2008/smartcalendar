/**
 * Simple Storage Service - 简化的存储服务
 * 用于v4.0功能的快速实现
 */

export class SimpleStorageService {
  private storage: Map<string, any> = new Map()
  
  constructor() {
    // 使用localStorage作为后备存储
    if (typeof window !== 'undefined' && window.localStorage) {
      // 从localStorage加载数据
      try {
        const saved = localStorage.getItem('smartcalendar_storage')
        if (saved) {
          const data = JSON.parse(saved)
          Object.entries(data).forEach(([key, value]) => {
            this.storage.set(key, value)
          })
        }
      } catch (error) {
        console.error('Failed to load from localStorage:', error)
      }
    }
  }
  
  /**
   * 获取数据
   */
  async getItem(key: string): Promise<any> {
    return this.storage.get(key) || null
  }
  
  /**
   * 设置数据
   */
  async setItem(key: string, value: any): Promise<void> {
    this.storage.set(key, value)
    
    // 同步到localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const data: Record<string, any> = {}
        this.storage.forEach((value, key) => {
          data[key] = value
        })
        localStorage.setItem('smartcalendar_storage', JSON.stringify(data))
      } catch (error) {
        console.error('Failed to save to localStorage:', error)
      }
    }
  }
  
  /**
   * 删除数据
   */
  async removeItem(key: string): Promise<void> {
    this.storage.delete(key)
    await this.syncToLocalStorage()
  }
  
  /**
   * 清空数据
   */
  async clear(): Promise<void> {
    this.storage.clear()
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('smartcalendar_storage')
    }
  }
  
  /**
   * 同步到localStorage
   */
  private async syncToLocalStorage(): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const data: Record<string, any> = {}
        this.storage.forEach((value, key) => {
          data[key] = value
        })
        localStorage.setItem('smartcalendar_storage', JSON.stringify(data))
      } catch (error) {
        console.error('Failed to sync to localStorage:', error)
      }
    }
  }
}

// 导出类
export { SimpleStorageService as StorageService }

// 导出默认实例
export default new SimpleStorageService()