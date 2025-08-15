'use client'

/**
 * 人际关系管理组件
 * 执行秘书功能：联系人管理、重要日期跟踪、人情世故自动化
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../src/components/ui/card'
import { Button } from '../../src/components/ui/button'
import { Badge } from '../../src/components/ui/badge'
import { Input } from '../../src/components/ui/input'
import { Label } from '../../src/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../src/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../src/components/ui/dialog'
import { relationshipService } from '../../lib/services/RelationshipService'
import {
  ExecutiveContact,
  RelationshipType,
  InteractionFrequency,
  RelationshipTask,
  RelationshipTaskStatus,
  RelationshipInsight,
  RelationshipMetrics,
  PersonalMilestone,
  MilestoneType,
  ContactPreferences
} from '../../types/relationship'
import { Priority } from '../../types/event'

interface RelationshipManagerProps {
  className?: string
}

const RelationshipManager: React.FC<RelationshipManagerProps> = ({ className }) => {
  const [activeTab, setActiveTab] = useState<'contacts' | 'tasks' | 'insights' | 'metrics'>('contacts')
  const [contacts, setContacts] = useState<ExecutiveContact[]>([])
  const [tasks, setTasks] = useState<RelationshipTask[]>([])
  const [insights, setInsights] = useState<RelationshipInsight[]>([])
  const [metrics, setMetrics] = useState<RelationshipMetrics | null>(null)
  
  // 对话框状态
  const [showAddContactDialog, setShowAddContactDialog] = useState(false)
  const [showAddMilestoneDialog, setShowAddMilestoneDialog] = useState(false)
  const [selectedContactId, setSelectedContactId] = useState<string>('')
  
  // 表单状态
  const [newContact, setNewContact] = useState({
    name: '',
    title: '',
    department: '',
    relationship: RelationshipType.PEER,
    importanceLevel: 5,
    interactionFrequency: InteractionFrequency.WEEKLY,
    email: '',
    phone: '',
    preferences: {
      preferredCommunicationMethod: 'email' as const,
      bestTimeToContact: '9:00-17:00',
      meetingPreferences: {
        preferredDuration: 30,
        preferredLocation: 'office' as const,
        needsPreparationTime: 15
      },
      communicationStyle: 'formal' as const,
      languagePreference: 'chinese' as const
    }
  })
  
  const [newMilestone, setNewMilestone] = useState({
    type: MilestoneType.BIRTHDAY,
    description: '',
    date: '',
    priority: Priority.MEDIUM,
    isRecurring: true,
    reminderDays: [7, 3, 1]
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const contactsData = relationshipService.getAllContacts()
      const tasksData = relationshipService.getPendingRelationshipTasks()
      const insightsData = relationshipService.getRelationshipInsights()
      const metricsData = relationshipService.getRelationshipMetrics()
      
      setContacts(contactsData)
      setTasks(tasksData)
      setInsights(insightsData)
      setMetrics(metricsData)
    } catch (error) {
      console.error('加载关系数据失败:', error)
    }
  }

  const handleAddContact = () => {
    try {
      const contactData = {
        ...newContact,
        reportingLevel: newContact.relationship === RelationshipType.DIRECT_REPORT ? -1 : 0,
        personalInfo: {
          personalMilestones: []
        },
        notes: [],
        tags: [],
        isActive: true
      }
      
      relationshipService.addContact(contactData)
      loadData()
      setShowAddContactDialog(false)
      
      // 重置表单
      setNewContact({
        name: '',
        title: '',
        department: '',
        relationship: RelationshipType.PEER,
        importanceLevel: 5,
        interactionFrequency: InteractionFrequency.WEEKLY,
        email: '',
        phone: '',
        preferences: {
          preferredCommunicationMethod: 'email',
          bestTimeToContact: '9:00-17:00',
          meetingPreferences: {
            preferredDuration: 30,
            preferredLocation: 'office',
            needsPreparationTime: 15
          },
          communicationStyle: 'formal',
          languagePreference: 'chinese'
        }
      })
    } catch (error) {
      console.error('添加联系人失败:', error)
    }
  }

  const handleAddMilestone = () => {
    if (!selectedContactId) return
    
    try {
      const milestoneData = {
        ...newMilestone,
        date: new Date(newMilestone.date)
      }
      
      relationshipService.addPersonalMilestone(selectedContactId, milestoneData)
      loadData()
      setShowAddMilestoneDialog(false)
      setSelectedContactId('')
      
      // 重置表单
      setNewMilestone({
        type: MilestoneType.BIRTHDAY,
        description: '',
        date: '',
        priority: Priority.MEDIUM,
        isRecurring: true,
        reminderDays: [7, 3, 1]
      })
    } catch (error) {
      console.error('添加里程碑失败:', error)
    }
  }

  const handleCompleteTask = (taskId: string) => {
    try {
      relationshipService.completeRelationshipTask(taskId)
      loadData()
    } catch (error) {
      console.error('完成任务失败:', error)
    }
  }

  const handleRecordInteraction = (contactId: string) => {
    try {
      relationshipService.recordInteraction(contactId)
      loadData()
    } catch (error) {
      console.error('记录互动失败:', error)
    }
  }

  const generateInsights = async () => {
    try {
      await relationshipService.generateRelationshipInsights()
      loadData()
    } catch (error) {
      console.error('生成洞察失败:', error)
    }
  }

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.URGENT: return 'bg-red-500'
      case Priority.HIGH: return 'bg-orange-500'
      case Priority.MEDIUM: return 'bg-yellow-500'
      case Priority.LOW: return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getRelationshipTypeLabel = (type: RelationshipType) => {
    const labels = {
      [RelationshipType.DIRECT_REPORT]: '直接下属',
      [RelationshipType.SKIP_LEVEL]: '跨级下属',
      [RelationshipType.PEER]: '同级同事',
      [RelationshipType.MANAGER]: '直接上级',
      [RelationshipType.SENIOR_LEADER]: '高层领导',
      [RelationshipType.CLIENT]: '客户',
      [RelationshipType.VENDOR]: '供应商',
      [RelationshipType.PARTNER]: '合作伙伴',
      [RelationshipType.STAKEHOLDER]: '利益相关者',
      [RelationshipType.OTHER]: '其他'
    }
    return labels[type]
  }

  const getTaskStatusColor = (status: RelationshipTaskStatus) => {
    switch (status) {
      case RelationshipTaskStatus.PENDING: return 'bg-blue-500'
      case RelationshipTaskStatus.IN_PROGRESS: return 'bg-yellow-500'
      case RelationshipTaskStatus.COMPLETED: return 'bg-green-500'
      case RelationshipTaskStatus.CANCELLED: return 'bg-gray-500'
      case RelationshipTaskStatus.OVERDUE: return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const renderContactsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">联系人管理</h3>
        <Dialog open={showAddContactDialog} onOpenChange={setShowAddContactDialog}>
          <DialogTrigger asChild>
            <Button>添加联系人</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>添加新联系人</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">姓名 *</Label>
                  <Input
                    id="name"
                    value={newContact.name}
                    onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                    placeholder="张三"
                  />
                </div>
                <div>
                  <Label htmlFor="title">职位 *</Label>
                  <Input
                    id="title"
                    value={newContact.title}
                    onChange={(e) => setNewContact({...newContact, title: e.target.value})}
                    placeholder="产品经理"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="department">部门</Label>
                  <Input
                    id="department"
                    value={newContact.department}
                    onChange={(e) => setNewContact({...newContact, department: e.target.value})}
                    placeholder="产品部"
                  />
                </div>
                <div>
                  <Label htmlFor="relationship">关系类型</Label>
                  <Select value={newContact.relationship} onValueChange={(value: RelationshipType) => setNewContact({...newContact, relationship: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={RelationshipType.DIRECT_REPORT}>直接下属</SelectItem>
                      <SelectItem value={RelationshipType.PEER}>同级同事</SelectItem>
                      <SelectItem value={RelationshipType.MANAGER}>直接上级</SelectItem>
                      <SelectItem value={RelationshipType.CLIENT}>客户</SelectItem>
                      <SelectItem value={RelationshipType.VENDOR}>供应商</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">邮箱</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newContact.email}
                    onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                    placeholder="zhangsan@company.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">电话</Label>
                  <Input
                    id="phone"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                    placeholder="13800138000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="importance">重要程度 (1-10)</Label>
                  <Input
                    id="importance"
                    type="number"
                    min="1"
                    max="10"
                    value={newContact.importanceLevel}
                    onChange={(e) => setNewContact({...newContact, importanceLevel: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="frequency">互动频率</Label>
                  <Select value={newContact.interactionFrequency} onValueChange={(value: InteractionFrequency) => setNewContact({...newContact, interactionFrequency: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={InteractionFrequency.DAILY}>每日</SelectItem>
                      <SelectItem value={InteractionFrequency.WEEKLY}>每周</SelectItem>
                      <SelectItem value={InteractionFrequency.BIWEEKLY}>双周</SelectItem>
                      <SelectItem value={InteractionFrequency.MONTHLY}>每月</SelectItem>
                      <SelectItem value={InteractionFrequency.QUARTERLY}>每季度</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAddContactDialog(false)}>
                取消
              </Button>
              <Button onClick={handleAddContact} disabled={!newContact.name || !newContact.title}>
                添加
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {contacts.map((contact) => (
          <Card key={contact.id}>
            <CardContent className="pt-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-semibold">{contact.name}</h4>
                    <Badge variant="secondary">{contact.title}</Badge>
                    <Badge variant="outline">{getRelationshipTypeLabel(contact.relationship)}</Badge>
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 mr-1">重要程度:</span>
                      <div className="flex space-x-1">
                        {Array.from({ length: 10 }, (_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full ${
                              i < contact.importanceLevel ? 'bg-blue-500' : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    {contact.department && <p>部门: {contact.department}</p>}
                    {contact.email && <p>邮箱: {contact.email}</p>}
                    {contact.phone && <p>电话: {contact.phone}</p>}
                    <p>最后互动: {contact.lastInteraction.toLocaleDateString()}</p>
                    <p>互动总数: {contact.totalInteractions} 次</p>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2">
                  <Button size="sm" onClick={() => handleRecordInteraction(contact.id)}>
                    记录互动
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setSelectedContactId(contact.id)
                      setShowAddMilestoneDialog(true)
                    }}
                  >
                    添加里程碑
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 添加里程碑对话框 */}
      <Dialog open={showAddMilestoneDialog} onOpenChange={setShowAddMilestoneDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加重要日期</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="milestone-type">类型</Label>
              <Select value={newMilestone.type} onValueChange={(value: MilestoneType) => setNewMilestone({...newMilestone, type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={MilestoneType.BIRTHDAY}>生日</SelectItem>
                  <SelectItem value={MilestoneType.WORK_ANNIVERSARY}>工作纪念日</SelectItem>
                  <SelectItem value={MilestoneType.WEDDING_ANNIVERSARY}>结婚纪念日</SelectItem>
                  <SelectItem value={MilestoneType.CHILD_BIRTH}>孩子出生</SelectItem>
                  <SelectItem value={MilestoneType.PROMOTION}>升职</SelectItem>
                  <SelectItem value={MilestoneType.OTHER}>其他</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="milestone-description">描述</Label>
              <Input
                id="milestone-description"
                value={newMilestone.description}
                onChange={(e) => setNewMilestone({...newMilestone, description: e.target.value})}
                placeholder="生日、工作5周年等"
              />
            </div>
            
            <div>
              <Label htmlFor="milestone-date">日期</Label>
              <Input
                id="milestone-date"
                type="date"
                value={newMilestone.date}
                onChange={(e) => setNewMilestone({...newMilestone, date: e.target.value})}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="recurring"
                checked={newMilestone.isRecurring}
                onChange={(e) => setNewMilestone({...newMilestone, isRecurring: e.target.checked})}
              />
              <Label htmlFor="recurring">每年重复</Label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowAddMilestoneDialog(false)}>
              取消
            </Button>
            <Button onClick={handleAddMilestone} disabled={!newMilestone.description || !newMilestone.date}>
              添加
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )

  const renderTasksTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">人情世故任务</h3>
        <Badge variant="secondary">{tasks.length} 个待处理任务</Badge>
      </div>

      <div className="grid gap-4">
        {tasks.map((task) => {
          const contact = contacts.find(c => c.id === task.contactId)
          const isOverdue = task.dueDate && task.dueDate < new Date()
          
          return (
            <Card key={task.id} className={isOverdue ? 'border-red-200' : ''}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-semibold">{task.title}</h4>
                      <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                      <Badge className={getTaskStatusColor(task.status)}>{task.status}</Badge>
                      {isOverdue && <Badge variant="destructive">已过期</Badge>}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                    
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>联系人: {contact?.name || '未知'}</p>
                      {task.dueDate && (
                        <p className={isOverdue ? 'text-red-600' : ''}>
                          截止日期: {task.dueDate.toLocaleDateString()}
                        </p>
                      )}
                      {task.budget && <p>预算: ¥{task.budget}</p>}
                      {task.vendor && <p>建议供应商: {task.vendor}</p>}
                    </div>
                    
                    {task.suggestedActions.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-1">建议行动:</p>
                        <ul className="text-sm text-gray-600 list-disc list-inside">
                          {task.suggestedActions.map((action, index) => (
                            <li key={index}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    {task.status === RelationshipTaskStatus.PENDING && (
                      <Button size="sm" onClick={() => handleCompleteTask(task.id)}>
                        完成任务
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
        
        {tasks.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              暂无待处理的人情世故任务
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )

  const renderInsightsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">关系洞察</h3>
        <Button onClick={generateInsights}>刷新洞察</Button>
      </div>

      <div className="grid gap-4">
        {insights.map((insight) => (
          <Card key={insight.id}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-semibold">{insight.title}</h4>
                <div className="flex space-x-2">
                  <Badge variant={insight.urgency === 'high' ? 'destructive' : insight.urgency === 'medium' ? 'default' : 'secondary'}>
                    {insight.urgency === 'high' ? '高' : insight.urgency === 'medium' ? '中' : '低'}紧急
                  </Badge>
                  <Badge variant="outline">
                    置信度: {Math.round(insight.confidence * 100)}%
                  </Badge>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
              
              {insight.dataPoints.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium mb-1">数据支持:</p>
                  <ul className="text-sm text-gray-600 list-disc list-inside">
                    {insight.dataPoints.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {insight.recommendedActions.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1">建议行动:</p>
                  <div className="space-y-1">
                    {insight.recommendedActions.map((action, index) => (
                      <div key={index} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                        <span>{action.action}</span>
                        <div className="flex space-x-2">
                          <Badge className={getPriorityColor(action.priority)}>
                            {action.priority}
                          </Badge>
                          <Badge variant="outline">
                            {action.timeline}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        {insights.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              暂无关系洞察，点击"刷新洞察"生成分析
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )

  const renderMetricsTab = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">关系管理统计</h3>
      
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">联系人统计</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.activeContacts}</div>
              <p className="text-sm text-gray-600">活跃联系人</p>
              <div className="mt-2 text-xs text-gray-500">
                总计: {metrics.totalContacts} 人
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">任务统计</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{metrics.pendingTasks}</div>
              <p className="text-sm text-gray-600">待处理任务</p>
              <div className="mt-2 text-xs space-y-1">
                <div className="text-red-600">过期: {metrics.overdueTasks} 个</div>
                <div className="text-green-600">本月完成: {metrics.completedTasksThisMonth} 个</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">关系健康度</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{metrics.overallRelationshipHealth}%</div>
              <p className="text-sm text-gray-600">整体健康度</p>
              <div className="mt-2 text-xs text-gray-500">
                平均互动频率: {Math.round(metrics.averageInteractionFrequency)} 天
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">即将到来</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{metrics.upcomingMilestones}</div>
              <p className="text-sm text-gray-600">重要日期 (30天内)</p>
              <div className="mt-2 text-xs text-gray-500">
                周期事务: {metrics.upcomingPeriodicEvents} 个 (7天内)
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">按重要性分布</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>高重要性 (7-10)</span>
                  <span className="font-bold">{metrics.contactsByImportance.high}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>中重要性 (4-6)</span>
                  <span className="font-bold">{metrics.contactsByImportance.medium}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>低重要性 (1-3)</span>
                  <span className="font-bold">{metrics.contactsByImportance.low}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">按关系类型</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>直接下属</span>
                  <span className="font-bold">{metrics.contactsByRelationship.direct_report}</span>
                </div>
                <div className="flex justify-between">
                  <span>同级同事</span>
                  <span className="font-bold">{metrics.contactsByRelationship.peer}</span>
                </div>
                <div className="flex justify-between">
                  <span>客户</span>
                  <span className="font-bold">{metrics.contactsByRelationship.client}</span>
                </div>
                <div className="flex justify-between">
                  <span>其他</span>
                  <span className="font-bold">
                    {Object.entries(metrics.contactsByRelationship)
                      .filter(([key]) => !['direct_report', 'peer', 'client'].includes(key))
                      .reduce((sum, [, value]) => sum + value, 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {!metrics && (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            正在加载统计数据...
          </CardContent>
        </Card>
      )}
    </div>
  )

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>👥</span>
          <span>人际关系管理</span>
        </CardTitle>
        
        {/* 标签页导航 */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {[
            { key: 'contacts', label: '联系人', icon: '👤' },
            { key: 'tasks', label: '任务', icon: '📝' },
            { key: 'insights', label: '洞察', icon: '💡' },
            { key: 'metrics', label: '统计', icon: '📊' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm transition-colors ${
                activeTab === tab.key
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        {activeTab === 'contacts' && renderContactsTab()}
        {activeTab === 'tasks' && renderTasksTab()}
        {activeTab === 'insights' && renderInsightsTab()}
        {activeTab === 'metrics' && renderMetricsTab()}
      </CardContent>
    </Card>
  )
}

export default RelationshipManager
