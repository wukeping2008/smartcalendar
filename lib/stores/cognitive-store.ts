/**
 * 认知带宽状态管理
 * 使用Zustand管理全局认知状态
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  Commitment,
  CommitmentType,
  CommitmentPriority,
  CommitmentStatus,
  CognitiveLoad,
  CognitiveItem,
  TradingFocusMode,
  ROICalculation,
  RejectionTemplate
} from '../../types/cognitive'
import cognitiveBandwidthService from '../services/CognitiveBandwidthService'

interface CognitiveStore {
  // 状态
  cognitiveLoad: CognitiveLoad
  commitments: Commitment[]
  tradingMode: TradingFocusMode
  rejectionTemplates: RejectionTemplate[]
  lastROICalculation: ROICalculation | null
  
  // 基础操作
  refreshCognitiveLoad: () => void
  addCommitment: (commitment: Omit<Commitment, 'id' | 'createdAt'>) => Promise<string>
  removeCommitment: (id: string) => void
  updateCommitmentStatus: (id: string, status: CommitmentStatus) => void
  
  // Trading模式
  enterTradingMode: (duration?: number) => void
  exitTradingMode: () => void
  isInTradingMode: () => boolean
  
  // ROI计算
  calculateActivityROI: (
    activity: string,
    timeHours: number,
    expectedReturn: number
  ) => ROICalculation
  
  // 智能拒绝
  getRejectionTemplate: (type: CommitmentType) => RejectionTemplate | null
  addCustomRejectionTemplate: (template: Omit<RejectionTemplate, 'id' | 'usage'>) => void
  
  // 批量操作
  clearNonCriticalCommitments: () => number
  archiveExpiredCommitments: () => void
  
  // 快捷操作
  quickAddCommitment: (content: string, type: CommitmentType) => Promise<string>
  quickReject: (commitmentId: string, templateId?: string) => void
  
  // 统计
  getActiveCommitmentCount: () => number
  getCriticalCommitmentCount: () => number
  getAvailableBandwidth: () => number
}

export const useCognitiveStore = create<CognitiveStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      cognitiveLoad: {
        current: 0,
        max: 7,
        threshold: 5,
        level: 'low' as any,
        activeItems: [],
        archivedItems: []
      },
      commitments: [],
      tradingMode: {
        enabled: false,
        blockAllInterruptions: true,
        allowedContacts: [],
        decisionTimeLimit: 60
      },
      rejectionTemplates: [],
      lastROICalculation: null,
      
      // 刷新认知负载
      refreshCognitiveLoad: () => {
        const load = cognitiveBandwidthService.getCognitiveLoad()
        set({ cognitiveLoad: load })
      },
      
      // 添加承诺
      addCommitment: async (commitment) => {
        try {
          const id = cognitiveBandwidthService.addCommitment(commitment)
          const newCommitment: Commitment = {
            ...commitment,
            id,
            createdAt: new Date()
          }
          
          set(state => ({
            commitments: [...state.commitments, newCommitment]
          }))
          
          get().refreshCognitiveLoad()
          return id
        } catch (error) {
          throw error
        }
      },
      
      // 移除承诺
      removeCommitment: (id) => {
        set(state => ({
          commitments: state.commitments.filter(c => c.id !== id)
        }))
        get().refreshCognitiveLoad()
      },
      
      // 更新承诺状态
      updateCommitmentStatus: (id, status) => {
        set(state => ({
          commitments: state.commitments.map(c =>
            c.id === id ? { ...c, status } : c
          )
        }))
        get().refreshCognitiveLoad()
      },
      
      // 进入Trading模式
      enterTradingMode: (duration = 60) => {
        cognitiveBandwidthService.enterTradingFocusMode(duration)
        set({
          tradingMode: {
            enabled: true,
            startTime: new Date(),
            duration,
            blockAllInterruptions: true,
            allowedContacts: ['野猪老师', '量化工程师'],
            decisionTimeLimit: 60
          }
        })
        get().refreshCognitiveLoad()
      },
      
      // 退出Trading模式
      exitTradingMode: () => {
        cognitiveBandwidthService.exitTradingFocusMode()
        set(state => ({
          tradingMode: {
            ...state.tradingMode,
            enabled: false,
            startTime: undefined,
            duration: undefined
          }
        }))
        get().refreshCognitiveLoad()
      },
      
      // 是否在Trading模式
      isInTradingMode: () => {
        return get().tradingMode.enabled
      },
      
      // 计算ROI
      calculateActivityROI: (activity, timeHours, expectedReturn) => {
        const calculation = cognitiveBandwidthService.calculateROI(
          activity,
          timeHours,
          expectedReturn
        )
        set({ lastROICalculation: calculation })
        return calculation
      },
      
      // 获取拒绝模板
      getRejectionTemplate: (type) => {
        return cognitiveBandwidthService.suggestRejection(type)
      },
      
      // 添加自定义拒绝模板
      addCustomRejectionTemplate: (template) => {
        const newTemplate: RejectionTemplate = {
          ...template,
          id: `template_${Date.now()}`,
          usage: 0
        }
        set(state => ({
          rejectionTemplates: [...state.rejectionTemplates, newTemplate]
        }))
      },
      
      // 清理非关键承诺
      clearNonCriticalCommitments: () => {
        const cleared = cognitiveBandwidthService.clearNonCritical()
        set(state => ({
          commitments: state.commitments.map(c =>
            c.priority !== CommitmentPriority.CRITICAL && c.status === CommitmentStatus.ACTIVE
              ? { ...c, status: CommitmentStatus.ARCHIVED }
              : c
          )
        }))
        get().refreshCognitiveLoad()
        return cleared
      },
      
      // 归档过期承诺
      archiveExpiredCommitments: () => {
        const now = new Date()
        set(state => ({
          commitments: state.commitments.map(c =>
            c.expiresAt && new Date(c.expiresAt) < now && c.status === CommitmentStatus.ACTIVE
              ? { ...c, status: CommitmentStatus.EXPIRED }
              : c
          )
        }))
        get().refreshCognitiveLoad()
      },
      
      // 快速添加承诺
      quickAddCommitment: async (content, type) => {
        const commitment: Omit<Commitment, 'id' | 'createdAt'> = {
          type,
          content,
          source: '快速添加',
          priority: type === CommitmentType.CORE ? CommitmentPriority.HIGH : CommitmentPriority.MEDIUM,
          status: CommitmentStatus.ACTIVE,
          cognitiveLoad: type === CommitmentType.CORE ? 2 : 1,
          isAutoDismissible: type === CommitmentType.SOCIAL,
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48小时后过期
        }
        return get().addCommitment(commitment)
      },
      
      // 快速拒绝
      quickReject: (commitmentId, templateId) => {
        set(state => ({
          commitments: state.commitments.map(c =>
            c.id === commitmentId
              ? { ...c, status: CommitmentStatus.REJECTED }
              : c
          )
        }))
        get().refreshCognitiveLoad()
      },
      
      // 获取活跃承诺数量
      getActiveCommitmentCount: () => {
        return get().commitments.filter(c => c.status === CommitmentStatus.ACTIVE).length
      },
      
      // 获取关键承诺数量
      getCriticalCommitmentCount: () => {
        return get().commitments.filter(
          c => c.priority === CommitmentPriority.CRITICAL && c.status === CommitmentStatus.ACTIVE
        ).length
      },
      
      // 获取可用带宽
      getAvailableBandwidth: () => {
        const load = get().cognitiveLoad
        return Math.max(0, load.max - load.current)
      }
    }),
    {
      name: 'cognitive-bandwidth-store',
      partialize: (state) => ({
        commitments: state.commitments,
        rejectionTemplates: state.rejectionTemplates
      })
    }
  )
)