'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Folder,
  FolderPlus,
  Target,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Archive,
  Trash2,
  ChevronRight,
  BarChart3,
  Users,
  FileText,
  Plus
} from 'lucide-react'
import { GTDTask, GTDTaskCategory, GTDProject } from '../../types/gtd-task'
import { getGTDTaskService } from '../../lib/services/GTDTaskService'

interface ProjectManagerProps {
  className?: string
}

export default function ProjectManager({ className = '' }: ProjectManagerProps) {
  const [projects, setProjects] = useState<GTDProject[]>([])
  const [selectedProject, setSelectedProject] = useState<GTDProject | null>(null)
  const [tasks, setTasks] = useState<GTDTask[]>([])
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  const gtdService = getGTDTaskService()

  useEffect(() => {
    loadProjects()
    loadTasks()
  }, [])

  const loadProjects = async () => {
    const allProjects = await gtdService.getAllProjects()
    setProjects(allProjects)
    if (allProjects.length > 0 && !selectedProject) {
      setSelectedProject(allProjects[0])
    }
  }

  const loadTasks = async () => {
    const allTasks = await gtdService.getAllTasks()
    setTasks(allTasks)
  }

  const createProject = async () => {
    if (!newProjectName.trim()) return

    const project: GTDProject = {
      id: `proj_${Date.now()}`,
      name: newProjectName,
      description: newProjectDescription,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      completedTaskCount: 0,
      totalTaskCount: 0,
      progress: 0,
      dueDate: undefined,
      tags: [],
      stakeholders: []
    }

    await gtdService.createProject(project)
    setNewProjectName('')
    setNewProjectDescription('')
    setIsCreatingProject(false)
    loadProjects()
  }

  const getProjectTasks = (projectId: string): GTDTask[] => {
    return tasks.filter(task => task.projectId === projectId)
  }

  const getProjectProgress = (projectId: string): number => {
    const projectTasks = getProjectTasks(projectId)
    if (projectTasks.length === 0) return 0
    
    const completedTasks = projectTasks.filter(task => task.status === 'completed')
    return Math.round((completedTasks.length / projectTasks.length) * 100)
  }

  const getProjectStats = (projectId: string) => {
    const projectTasks = getProjectTasks(projectId)
    
    return {
      total: projectTasks.length,
      completed: projectTasks.filter(t => t.status === 'completed').length,
      inProgress: projectTasks.filter(t => t.status === 'in_progress').length,
      pending: projectTasks.filter(t => t.status === 'pending').length,
      overdue: projectTasks.filter(t => 
        t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
      ).length
    }
  }

  const archiveProject = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (project) {
      project.status = 'archived'
      project.updatedAt = new Date()
      await gtdService.updateProject(project)
      loadProjects()
    }
  }

  const deleteProject = async (projectId: string) => {
    if (confirm('确定要删除这个项目吗？所有相关任务也会被删除。')) {
      await gtdService.deleteProject(projectId)
      if (selectedProject?.id === projectId) {
        setSelectedProject(null)
      }
      loadProjects()
      loadTasks()
    }
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            GTD项目管理
          </CardTitle>
          <Button
            size="sm"
            onClick={() => setIsCreatingProject(true)}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            <FolderPlus className="h-4 w-4 mr-1" />
            新建项目
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex gap-4 overflow-hidden">
        {/* 项目列表 */}
        <div className="w-1/3 min-w-[250px] overflow-y-auto">
          <div className="space-y-2">
            {/* 新建项目表单 */}
            {isCreatingProject && (
              <Card className="p-3 border-cyan-600/50 bg-gray-800/50">
                <Input
                  placeholder="项目名称"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="mb-2 bg-gray-700/50"
                />
                <Input
                  placeholder="项目描述（可选）"
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  className="mb-2 bg-gray-700/50"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={createProject}
                    className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                  >
                    创建
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsCreatingProject(false)
                      setNewProjectName('')
                      setNewProjectDescription('')
                    }}
                    className="flex-1"
                  >
                    取消
                  </Button>
                </div>
              </Card>
            )}

            {/* 项目卡片列表 */}
            {projects.filter(p => p.status !== 'archived').map(project => {
              const stats = getProjectStats(project.id)
              const isSelected = selectedProject?.id === project.id
              
              return (
                <Card
                  key={project.id}
                  className={`p-3 cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-cyan-500 bg-cyan-500/10' 
                      : 'border-gray-700 hover:border-gray-600 bg-gray-800/30'
                  }`}
                  onClick={() => setSelectedProject(project)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-100">{project.name}</h4>
                      {project.description && (
                        <p className="text-xs text-gray-400 mt-1">{project.description}</p>
                      )}
                    </div>
                    <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${
                      isSelected ? 'rotate-90' : ''
                    }`} />
                  </div>
                  
                  <div className="space-y-2">
                    <Progress value={getProjectProgress(project.id)} className="h-1" />
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">
                        {stats.completed}/{stats.total} 完成
                      </span>
                      {stats.overdue > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {stats.overdue} 逾期
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>

        {/* 项目详情 */}
        {selectedProject ? (
          <div className="flex-1 overflow-hidden">
            <Card className="h-full flex flex-col bg-gray-800/30">
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-100">
                      {selectedProject.name}
                    </h3>
                    {selectedProject.description && (
                      <p className="text-sm text-gray-400 mt-1">
                        {selectedProject.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => archiveProject(selectedProject.id)}
                      className="text-gray-400 hover:text-gray-200"
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteProject(selectedProject.id)}
                      className="text-red-400 hover:text-red-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* 项目统计 */}
                <div className="grid grid-cols-4 gap-3 mt-4">
                  {(() => {
                    const stats = getProjectStats(selectedProject.id)
                    return (
                      <>
                        <StatCard
                          label="总任务"
                          value={stats.total}
                          icon={<FileText className="h-4 w-4" />}
                          color="text-blue-400"
                        />
                        <StatCard
                          label="已完成"
                          value={stats.completed}
                          icon={<CheckCircle2 className="h-4 w-4" />}
                          color="text-green-400"
                        />
                        <StatCard
                          label="进行中"
                          value={stats.inProgress}
                          icon={<Clock className="h-4 w-4" />}
                          color="text-yellow-400"
                        />
                        <StatCard
                          label="逾期"
                          value={stats.overdue}
                          icon={<AlertCircle className="h-4 w-4" />}
                          color="text-red-400"
                        />
                      </>
                    )
                  })()}
                </div>
              </div>

              {/* 项目内容标签页 */}
              <div className="flex-1 overflow-hidden">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                  <TabsList className="grid grid-cols-4 w-full bg-gray-800/50">
                    <TabsTrigger value="overview">概览</TabsTrigger>
                    <TabsTrigger value="tasks">任务</TabsTrigger>
                    <TabsTrigger value="timeline">时间线</TabsTrigger>
                    <TabsTrigger value="review">回顾</TabsTrigger>
                  </TabsList>
                  
                  <div className="flex-1 overflow-y-auto p-4">
                    <TabsContent value="overview" className="space-y-4 mt-0">
                      <ProjectOverview project={selectedProject} tasks={getProjectTasks(selectedProject.id)} />
                    </TabsContent>
                    
                    <TabsContent value="tasks" className="mt-0">
                      <ProjectTasks project={selectedProject} tasks={getProjectTasks(selectedProject.id)} />
                    </TabsContent>
                    
                    <TabsContent value="timeline" className="mt-0">
                      <ProjectTimeline project={selectedProject} tasks={getProjectTasks(selectedProject.id)} />
                    </TabsContent>
                    
                    <TabsContent value="review" className="mt-0">
                      <ProjectReview project={selectedProject} tasks={getProjectTasks(selectedProject.id)} />
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </Card>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Folder className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>选择一个项目查看详情</p>
            </div>
          </div>
        )}
      </CardContent>
    </div>
  )
}

// 统计卡片组件
function StatCard({ 
  label, 
  value, 
  icon, 
  color 
}: { 
  label: string
  value: number
  icon: React.ReactNode
  color: string 
}) {
  return (
    <div className="bg-gray-900/50 rounded-lg p-3">
      <div className={`flex items-center gap-2 ${color} mb-1`}>
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-100">{value}</div>
    </div>
  )
}

// 项目概览组件
function ProjectOverview({ project, tasks }: { project: GTDProject; tasks: GTDTask[] }) {
  const categoryStats = tasks.reduce((acc, task) => {
    acc[task.category] = (acc[task.category] || 0) + 1
    return acc
  }, {} as Record<GTDTaskCategory, number>)

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-gray-900/30">
        <h4 className="text-sm font-medium text-gray-400 mb-3">任务分布</h4>
        <div className="space-y-2">
          {Object.entries(categoryStats).map(([category, count]) => (
            <div key={category} className="flex items-center justify-between">
              <span className="text-sm text-gray-300">{category}</span>
              <Badge variant="secondary">{count}</Badge>
            </div>
          ))}
        </div>
      </Card>

      {project.dueDate && (
        <Card className="p-4 bg-gray-900/30">
          <h4 className="text-sm font-medium text-gray-400 mb-2">截止日期</h4>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-cyan-400" />
            <span className="text-gray-200">
              {new Date(project.dueDate).toLocaleDateString('zh-CN')}
            </span>
          </div>
        </Card>
      )}

      {project.stakeholders && project.stakeholders.length > 0 && (
        <Card className="p-4 bg-gray-900/30">
          <h4 className="text-sm font-medium text-gray-400 mb-2">相关人员</h4>
          <div className="flex flex-wrap gap-2">
            {project.stakeholders.map(person => (
              <Badge key={person} variant="outline">
                <Users className="h-3 w-3 mr-1" />
                {person}
              </Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

// 项目任务列表组件
function ProjectTasks({ project, tasks }: { project: GTDProject; tasks: GTDTask[] }) {
  return (
    <div className="space-y-2">
      {tasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>该项目还没有任务</p>
          <Button size="sm" className="mt-3 bg-cyan-600 hover:bg-cyan-700">
            <Plus className="h-4 w-4 mr-1" />
            添加第一个任务
          </Button>
        </div>
      ) : (
        tasks.map(task => (
          <Card key={task.id} className="p-3 bg-gray-900/30 hover:bg-gray-900/50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`h-4 w-4 ${
                    task.status === 'completed' ? 'text-green-400' : 'text-gray-500'
                  }`} />
                  <span className={`text-sm ${
                    task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-200'
                  }`}>
                    {task.title}
                  </span>
                </div>
                {task.description && (
                  <p className="text-xs text-gray-400 mt-1 ml-6">{task.description}</p>
                )}
              </div>
              <Badge variant="secondary" className="text-xs">
                {task.category}
              </Badge>
            </div>
          </Card>
        ))
      )}
    </div>
  )
}

// 项目时间线组件
function ProjectTimeline({ project, tasks }: { project: GTDProject; tasks: GTDTask[] }) {
  const sortedTasks = [...tasks].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-700"></div>
        {sortedTasks.map((task, index) => (
          <div key={task.id} className="flex items-start gap-3 mb-4">
            <div className={`relative z-10 w-6 h-6 rounded-full border-2 ${
              task.status === 'completed' 
                ? 'bg-green-500 border-green-400' 
                : 'bg-gray-700 border-gray-600'
            }`}>
              {task.status === 'completed' && (
                <CheckCircle2 className="h-3 w-3 text-white absolute inset-0 m-auto" />
              )}
            </div>
            <div className="flex-1">
              <div className="bg-gray-900/30 rounded-lg p-3">
                <div className="flex items-start justify-between mb-1">
                  <span className="text-sm font-medium text-gray-200">{task.title}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(task.createdAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>
                {task.description && (
                  <p className="text-xs text-gray-400">{task.description}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 项目回顾组件
function ProjectReview({ project, tasks }: { project: GTDProject; tasks: GTDTask[] }) {
  const completedTasks = tasks.filter(t => t.status === 'completed')
  const avgCompletionTime = completedTasks.length > 0
    ? completedTasks.reduce((sum, task) => {
        if (task.completedAt) {
          return sum + (new Date(task.completedAt).getTime() - new Date(task.createdAt).getTime())
        }
        return sum
      }, 0) / completedTasks.length / (1000 * 60 * 60 * 24) // Convert to days
    : 0

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-gray-900/30">
        <h4 className="text-sm font-medium text-gray-400 mb-3">项目成就</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-bold text-cyan-400">{completedTasks.length}</div>
            <div className="text-xs text-gray-500">已完成任务</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">
              {avgCompletionTime.toFixed(1)}天
            </div>
            <div className="text-xs text-gray-500">平均完成时间</div>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-gray-900/30">
        <h4 className="text-sm font-medium text-gray-400 mb-3">项目总结</h4>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500">最大成就</label>
            <p className="text-sm text-gray-300 mt-1">
              {completedTasks.length > 0 
                ? `完成了 ${completedTasks.length} 个任务` 
                : '项目进行中...'}
            </p>
          </div>
          <div>
            <label className="text-xs text-gray-500">改进空间</label>
            <p className="text-sm text-gray-300 mt-1">
              {tasks.filter(t => t.status === 'pending').length > 0
                ? `还有 ${tasks.filter(t => t.status === 'pending').length} 个任务待处理`
                : '所有任务都在进行中！'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}