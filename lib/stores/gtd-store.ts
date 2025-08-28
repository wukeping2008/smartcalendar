import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { 
  GTDTask, 
  GTDProject, 
  GTDContext, 
  GTDTaskType,
  GTDPriority,
  ProcessingStatus 
} from '../../types/gtd-task'

interface GTDStore {
  // 状态
  tasks: GTDTask[]
  projects: GTDProject[]
  contexts: GTDContext[]
  
  // 操作
  addTask: (task: Omit<GTDTask, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateTask: (id: string, updates: Partial<GTDTask>) => void
  deleteTask: (id: string) => void
  
  addProject: (project: Omit<GTDProject, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateProject: (id: string, updates: Partial<GTDProject>) => void
  deleteProject: (id: string) => void
  
  addContext: (context: Omit<GTDContext, 'id'>) => void
  updateContext: (id: string, updates: Partial<GTDContext>) => void
  deleteContext: (id: string) => void
  
  // 查询
  getTasksByType: (type: GTDTaskType) => GTDTask[]
  getTasksByProject: (projectId: string) => GTDTask[]
  getTasksByContext: (context: string) => GTDTask[]
  
  // 批量操作
  clearCompletedTasks: () => void
  moveToSomeday: (taskIds: string[]) => void
  processInboxItem: (taskId: string, decision: GTDTaskType, projectId?: string) => void
}

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export const useGTDStore = create<GTDStore>()(
  persist(
    immer((set, get) => ({
      tasks: [],
      projects: [],
      contexts: [],
      
      addTask: (taskData) => set((state) => {
        const now = new Date()
        const newTask: GTDTask = {
          ...taskData,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
          completed: false
        }
        state.tasks.push(newTask)
      }),
      
      updateTask: (id, updates) => set((state) => {
        const taskIndex = state.tasks.findIndex(t => t.id === id)
        if (taskIndex !== -1) {
          state.tasks[taskIndex] = {
            ...state.tasks[taskIndex],
            ...updates,
            updatedAt: new Date()
          }
        }
      }),
      
      deleteTask: (id) => set((state) => {
        state.tasks = state.tasks.filter(t => t.id !== id)
      }),
      
      addProject: (projectData) => set((state) => {
        const now = new Date()
        const newProject: GTDProject = {
          ...projectData,
          id: generateId(),
          createdAt: now,
          updatedAt: now
        }
        state.projects.push(newProject)
      }),
      
      updateProject: (id, updates) => set((state) => {
        const projectIndex = state.projects.findIndex(p => p.id === id)
        if (projectIndex !== -1) {
          state.projects[projectIndex] = {
            ...state.projects[projectIndex],
            ...updates,
            updatedAt: new Date()
          }
        }
      }),
      
      deleteProject: (id) => set((state) => {
        state.projects = state.projects.filter(p => p.id !== id)
        // 删除项目时，将相关任务移到inbox
        state.tasks.forEach(task => {
          if (task.projectId === id) {
            task.projectId = undefined
            task.type = GTDTaskType.INBOX
          }
        })
      }),
      
      addContext: (contextData) => set((state) => {
        const newContext: GTDContext = {
          ...contextData,
          id: generateId()
        }
        state.contexts.push(newContext)
      }),
      
      updateContext: (id, updates) => set((state) => {
        const contextIndex = state.contexts.findIndex(c => c.id === id)
        if (contextIndex !== -1) {
          state.contexts[contextIndex] = {
            ...state.contexts[contextIndex],
            ...updates
          }
        }
      }),
      
      deleteContext: (id) => set((state) => {
        state.contexts = state.contexts.filter(c => c.id !== id)
      }),
      
      getTasksByType: (type) => {
        return get().tasks.filter(t => t.type === type && !t.completed)
      },
      
      getTasksByProject: (projectId) => {
        return get().tasks.filter(t => t.projectId === projectId)
      },
      
      getTasksByContext: (context) => {
        return get().tasks.filter(t => t.contexts?.includes(context))
      },
      
      clearCompletedTasks: () => set((state) => {
        state.tasks = state.tasks.filter(t => !t.completed)
      }),
      
      moveToSomeday: (taskIds) => set((state) => {
        taskIds.forEach(id => {
          const task = state.tasks.find(t => t.id === id)
          if (task) {
            task.type = GTDTaskType.SOMEDAY
            task.updatedAt = new Date()
          }
        })
      }),
      
      processInboxItem: (taskId, decision, projectId) => set((state) => {
        const task = state.tasks.find(t => t.id === taskId)
        if (task) {
          task.type = decision
          task.processingStatus = ProcessingStatus.PROCESSED
          task.projectId = projectId
          task.updatedAt = new Date()
        }
      })
    })),
    {
      name: 'gtd-storage',
      version: 1,
      partialize: (state) => ({
        tasks: state.tasks,
        projects: state.projects,
        contexts: state.contexts
      })
    }
  )
)