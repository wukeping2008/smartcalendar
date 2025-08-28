'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Users,
  UserPlus,
  Phone,
  Mail,
  Calendar,
  Star,
  MessageCircle,
  TrendingUp,
  Heart,
  AlertCircle,
  Clock,
  CheckCircle,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  RefreshCw,
  Mic
} from 'lucide-react'
import { personCardService } from '../../lib/services/PersonCardService'
import FeatureGuide from '../help/FeatureGuide'
import {
  PersonCard,
  PersonCategory,
  RelationshipStrength,
  InteractionType,
  TaskStatus,
  Sentiment,
  ImportanceLevel
} from '../../types/personcard'

interface PersonCardPanelProps {
  className?: string
}

export function PersonCardPanel({ className = '' }: PersonCardPanelProps) {
  const [persons, setPersons] = useState<PersonCard[]>([])
  const [selectedPerson, setSelectedPerson] = useState<PersonCard | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [reminders, setReminders] = useState<Array<{person: PersonCard, daysSinceContact: number}>>([])
  const [upcomingDates, setUpcomingDates] = useState<Array<{person: PersonCard, date: any}>>([])

  useEffect(() => {
    // 订阅人物卡变化
    const unsubscribe = personCardService.subscribe((updatedPersons) => {
      setPersons(updatedPersons)
    })

    // 加载初始数据
    setPersons(personCardService.getAllPersons())
    
    // 获取联系提醒
    setReminders(personCardService.getContactReminders())
    
    // 获取即将到来的重要日期
    setUpcomingDates(personCardService.getUpcomingImportantDates(30))

    return unsubscribe
  }, [])

  // 搜索过滤
  const filteredPersons = persons.filter(person =>
    person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    person.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    person.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // 获取关系强度标签颜色
  const getStrengthColor = (strength: RelationshipStrength) => {
    const colors = {
      very_close: 'bg-green-500',
      close: 'bg-blue-500',
      moderate: 'bg-yellow-500',
      weak: 'bg-orange-500',
      very_weak: 'bg-red-500'
    }
    return colors[strength] || 'bg-gray-500'
  }

  // 获取重要性图标
  const getImportanceIcon = (importance: ImportanceLevel) => {
    switch (importance) {
      case ImportanceLevel.CRITICAL:
        return <Star className="w-4 h-4 text-red-500 fill-red-500" />
      case ImportanceLevel.HIGH:
        return <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
      case ImportanceLevel.MEDIUM:
        return <Star className="w-4 h-4 text-yellow-500" />
      default:
        return null
    }
  }

  // 格式化最后联系时间
  const formatLastContact = (date?: Date) => {
    if (!date) return '从未联系'
    const days = Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000))
    if (days === 0) return '今天'
    if (days === 1) return '昨天'
    if (days < 7) return `${days}天前`
    if (days < 30) return `${Math.floor(days / 7)}周前`
    if (days < 365) return `${Math.floor(days / 30)}个月前`
    return `${Math.floor(days / 365)}年前`
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* 头部 */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">人物卡CRM</h2>
          </div>
          <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
            <UserPlus className="w-4 h-4 mr-1" />
            添加联系人
          </Button>
        </div>

        {/* 搜索与操作 */}
        <div className="flex items-center gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="手动搜索或点击麦克风语音输入..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button size="icon" variant="outline" onClick={() => alert('语音搜索功能待实现')}>
            <Mic className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <FeatureGuide
        title="人脉CRM"
        steps={[
          '在"总览"标签页查看关键指标和提醒。',
          '在"联系人"标签页浏览、搜索和筛选您的人脉网络。',
          '点击一个联系人卡片以查看或编辑详细信息。',
          '在"提醒"标签页处理待办的联系任务和重要日期提醒。',
          '在"分析"标签页获取关于您社交网络的AI洞察。',
          '使用上方的搜索框通过手动或语音进行快速查找。'
        ]}
        className="m-4"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="mx-4">
          <TabsTrigger value="overview">总览</TabsTrigger>
          <TabsTrigger value="contacts">联系人</TabsTrigger>
          <TabsTrigger value="reminders">提醒</TabsTrigger>
          <TabsTrigger value="analytics">分析</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 px-4">
          <TabsContent value="overview" className="space-y-4">
            {/* 统计卡片 */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-3">
                <div className="text-2xl font-bold">{persons.length}</div>
                <div className="text-sm text-gray-500">总联系人</div>
              </Card>
              <Card className="p-3">
                <div className="text-2xl font-bold text-orange-500">{reminders.length}</div>
                <div className="text-sm text-gray-500">待联系</div>
              </Card>
              <Card className="p-3">
                <div className="text-2xl font-bold text-blue-500">
                  {persons.filter(p => p.category === PersonCategory.VIP).length}
                </div>
                <div className="text-sm text-gray-500">VIP客户</div>
              </Card>
              <Card className="p-3">
                <div className="text-2xl font-bold text-green-500">{upcomingDates.length}</div>
                <div className="text-sm text-gray-500">重要日期</div>
              </Card>
            </div>

            {/* 快速提醒 */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                需要联系
              </h3>
              <div className="space-y-2">
                {reminders.slice(0, 3).map(({ person, daysSinceContact }) => (
                  <div key={person.id} className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {person.name[0]}
                      </div>
                      <div>
                        <div className="font-medium">{person.name}</div>
                        <div className="text-xs text-gray-500">{daysSinceContact}天未联系</div>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Phone className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            {/* 即将到来的重要日期 */}
            {upcomingDates.length > 0 && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  重要日期
                </h3>
                <div className="space-y-2">
                  {upcomingDates.slice(0, 3).map(({ person, date }) => (
                    <div key={`${person.id}-${date.id}`} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                      <div>
                        <div className="font-medium">{person.name}</div>
                        <div className="text-xs text-gray-500">{date.description}</div>
                      </div>
                      <Badge variant="outline">
                        {new Date(date.date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="contacts" className="space-y-3">
            {filteredPersons.map(person => (
              <Card 
                key={person.id} 
                className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedPerson(person)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                      {person.name[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{person.name}</span>
                        {getImportanceIcon(person.importance)}
                        <div className={`w-2 h-2 rounded-full ${getStrengthColor(person.relationship.strength)}`} />
                      </div>
                      <div className="text-sm text-gray-500">
                        {person.title} · {person.company}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatLastContact(person.lastContactedAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          {person.interactions.length} 互动
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {person.relationship.trustLevel}% 信任度
                        </span>
                      </div>
                      {person.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {person.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="reminders" className="space-y-3">
            <Card className="p-4">
              <h3 className="font-semibold mb-3">联系提醒</h3>
              <div className="space-y-3">
                {reminders.map(({ person, daysSinceContact }) => (
                  <div key={person.id} className="border-l-4 border-orange-500 pl-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{person.name}</div>
                        <div className="text-sm text-gray-500">
                          {person.relationship.frequency === 'weekly' ? '每周联系' : 
                           person.relationship.frequency === 'monthly' ? '每月联系' : 
                           '定期联系'} · 已{daysSinceContact}天未联系
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Phone className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Mail className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* 待办任务 */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">待办任务</h3>
              <div className="space-y-2">
                {persons.flatMap(person => 
                  person.tasks
                    .filter(task => task.status !== TaskStatus.COMPLETED)
                    .map(task => ({ person, task }))
                ).slice(0, 5).map(({ person, task }) => (
                  <div key={task.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-gray-400" />
                    <div className="flex-1">
                      <div className="text-sm">{task.title}</div>
                      <div className="text-xs text-gray-500">{person.name}</div>
                    </div>
                    {task.dueDate && (
                      <Badge variant="outline" className="text-xs">
                        {new Date(task.dueDate).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            {/* 关系健康度分析 */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                关系健康度
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>平均信任度</span>
                  <span className="font-medium">
                    {Math.round(persons.reduce((sum, p) => sum + p.relationship.trustLevel, 0) / persons.length)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>活跃关系</span>
                  <span className="font-medium">
                    {persons.filter(p => p.relationship.status === 'active').length}/{persons.length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>本月互动</span>
                  <span className="font-medium">
                    {persons.reduce((sum, p) => {
                      const thisMonth = p.interactions.filter(i => {
                        const date = new Date(i.date)
                        const now = new Date()
                        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
                      })
                      return sum + thisMonth.length
                    }, 0)}次
                  </span>
                </div>
              </div>
            </Card>

            {/* 关系分布 */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">关系分布</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">VIP客户</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full" 
                        style={{ width: `${(persons.filter(p => p.category === PersonCategory.VIP).length / persons.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {persons.filter(p => p.category === PersonCategory.VIP).length}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">重要联系人</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full" 
                        style={{ width: `${(persons.filter(p => p.category === PersonCategory.KEY_CONTACT).length / persons.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {persons.filter(p => p.category === PersonCategory.KEY_CONTACT).length}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">普通联系人</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${(persons.filter(p => p.category === PersonCategory.REGULAR).length / persons.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {persons.filter(p => p.category === PersonCategory.REGULAR).length}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* AI洞察 */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-purple-500" />
                AI洞察
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• 您与VIP客户的平均联系间隔为7天，建议增加互动频率</p>
                <p>• 李经理最近互动频率下降，可能需要主动关怀</p>
                <p>• 下周有2个重要客户生日，建议提前准备祝福</p>
              </div>
            </Card>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  )
}

export default PersonCardPanel
