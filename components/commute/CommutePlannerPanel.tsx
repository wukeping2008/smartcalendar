'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import {
  Train,
  Car,
  Clock,
  PlayCircle,
  PauseCircle,
  CheckCircle,
  Book,
  Headphones,
  FileText,
  Brain,
  Coffee,
  Activity,
  Zap,
  TrendingUp,
  MapPin,
  Wifi,
  Volume2,
  Users,
  BarChart3,
  Target,
  Sparkles
} from 'lucide-react'
import {
  CommuteSession,
  SessionType,
  TransportMode,
  ActivityType,
  ActivityCategory,
  ActivityStatus,
  PlannedActivity,
  CommuteStatistics
} from '../../types/commuteplanner'

interface CommutePlannerPanelProps {
  className?: string
}

export function CommutePlannerPanel({ className = '' }: CommutePlannerPanelProps) {
  const [activeSession, setActiveSession] = useState<CommuteSession | null>(null)
  const [currentActivity, setCurrentActivity] = useState<PlannedActivity | null>(null)
  const [statistics, setStatistics] = useState<CommuteStatistics | null>(null)
  const [activeTab, setActiveTab] = useState('current')
  const [isTracking, setIsTracking] = useState(false)

  // 模拟统计数据
  useEffect(() => {
    setStatistics({
      totalMinutes: 3250,
      dailyAverage: 65,
      weeklyTotal: 325,
      monthlyTotal: 1300,
      productiveMinutes: 2600,
      utilizationRate: 80,
      averageProductivity: 75,
      activitiesCompleted: 156,
      mostFrequentActivities: [
        { type: ActivityType.READING, count: 45, totalMinutes: 890, averageProductivity: 85 },
        { type: ActivityType.LISTENING, count: 38, totalMinutes: 760, averageProductivity: 90 },
        { type: ActivityType.LEARNING, count: 25, totalMinutes: 500, averageProductivity: 80 }
      ],
      contentConsumed: {
        articles: 89,
        podcasts: 42,
        videos: 15,
        books: 3,
        courses: 2
      },
      wellbeingImpact: {
        stressReduction: 25,
        learningGains: 40,
        socialConnections: 15,
        physicalActivity: 10
      }
    })
  }, [])

  // 获取交通方式图标
  const getTransportIcon = (mode: TransportMode) => {
    switch (mode) {
      case TransportMode.TRAIN:
      case TransportMode.SUBWAY:
        return <Train className="w-4 h-4" />
      case TransportMode.DRIVING:
      case TransportMode.TAXI:
        return <Car className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  // 获取活动图标
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case ActivityType.READING:
        return <Book className="w-4 h-4" />
      case ActivityType.LISTENING:
        return <Headphones className="w-4 h-4" />
      case ActivityType.WRITING:
        return <FileText className="w-4 h-4" />
      case ActivityType.THINKING:
        return <Brain className="w-4 h-4" />
      case ActivityType.RESTING:
        return <Coffee className="w-4 h-4" />
      case ActivityType.EXERCISING:
        return <Activity className="w-4 h-4" />
      default:
        return <Zap className="w-4 h-4" />
    }
  }

  // 开始通勤会话
  const startCommuteSession = (mode: TransportMode) => {
    const session: CommuteSession = {
      id: `session-${Date.now()}`,
      type: SessionType.COMMUTE,
      startTime: new Date(),
      duration: 0,
      location: {
        type: 'home_to_work',
        start: { name: '家', coordinates: { lat: 0, lng: 0 } },
        end: { name: '办公室', coordinates: { lat: 0, lng: 0 } }
      },
      transport: {
        mode,
        isDriver: mode === TransportMode.DRIVING,
        hasInternet: true,
        hasTable: mode === TransportMode.TRAIN,
        hasPower: mode === TransportMode.TRAIN,
        noiseLevel: 'moderate',
        crowdedness: 'moderate',
        stability: mode === TransportMode.TRAIN ? 'stable' : 'slightly_moving'
      },
      activities: [],
      conditions: {
        lighting: 'adequate',
        temperature: 'comfortable',
        seating: 'comfortable',
        privacy: 'semi-private',
        connectivity: {
          cellular: 'good',
          wifi: mode === TransportMode.TRAIN ? 'available' : 'unavailable',
          stability: 'stable'
        }
      },
      productivity: {
        score: 0,
        utilization: 0,
        focusQuality: 0,
        outputValue: 0,
        positiveFactors: [],
        negativeFactors: [],
        improvements: []
      }
    }
    setActiveSession(session)
    setIsTracking(true)
  }

  // 推荐活动列表
  const recommendedActivities: PlannedActivity[] = [
    {
      id: 'act-1',
      type: ActivityType.READING,
      category: ActivityCategory.LEARNING,
      title: '阅读专业文章',
      description: '阅读收藏的技术文章',
      plannedDuration: 15,
      suitability: {
        overall: 85,
        factors: {
          environment: 80,
          resources: 90,
          focus: 85,
          safety: 100,
          comfort: 80
        },
        reasoning: '地铁环境适合阅读，网络稳定'
      },
      requirements: {
        focus: 'medium',
        tools: ['手机'],
        internet: true,
        quiet: false,
        privacy: false,
        power: false,
        stable: true,
        hands: 'one_hand'
      },
      status: ActivityStatus.PLANNED
    },
    {
      id: 'act-2',
      type: ActivityType.LISTENING,
      category: ActivityCategory.LEARNING,
      title: '听播客',
      description: '技术或商业播客',
      plannedDuration: 30,
      suitability: {
        overall: 95,
        factors: {
          environment: 100,
          resources: 100,
          focus: 70,
          safety: 100,
          comfort: 90
        },
        reasoning: '通勤最佳选择，可以闭眼放松'
      },
      requirements: {
        focus: 'low',
        tools: ['耳机'],
        internet: false,
        quiet: false,
        privacy: false,
        power: false,
        stable: false,
        hands: 'hands_free'
      },
      status: ActivityStatus.PLANNED
    },
    {
      id: 'act-3',
      type: ActivityType.PLANNING,
      category: ActivityCategory.WORK,
      title: '规划今日任务',
      description: '整理和优先排序今天的工作',
      plannedDuration: 10,
      suitability: {
        overall: 75,
        factors: {
          environment: 70,
          resources: 80,
          focus: 75,
          safety: 90,
          comfort: 70
        },
        reasoning: '需要一定专注度，建议在稳定环境'
      },
      requirements: {
        focus: 'medium',
        tools: ['手机', '笔记本'],
        internet: false,
        quiet: false,
        privacy: false,
        power: false,
        stable: true,
        hands: 'two_hands'
      },
      status: ActivityStatus.PLANNED
    }
  ]

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* 头部 */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Train className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-semibold">通勤时间规划</h2>
          </div>
          {!isTracking ? (
            <Button size="sm" className="bg-purple-500 hover:bg-purple-600" onClick={() => startCommuteSession(TransportMode.SUBWAY)}>
              <PlayCircle className="w-4 h-4 mr-1" />
              开始通勤
            </Button>
          ) : (
            <Button size="sm" variant="destructive" onClick={() => setIsTracking(false)}>
              <PauseCircle className="w-4 h-4 mr-1" />
              结束
            </Button>
          )}
        </div>

        {/* 当前状态 */}
        {activeSession && (
          <Card className="p-3 bg-purple-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getTransportIcon(activeSession.transport.mode)}
                <div>
                  <div className="font-medium">正在通勤中</div>
                  <div className="text-xs text-gray-500">地铁 · 预计35分钟</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-green-500" />
                <Volume2 className="w-4 h-4 text-orange-500" />
                <Users className="w-4 h-4 text-yellow-500" />
              </div>
            </div>
          </Card>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="mx-4">
          <TabsTrigger value="current">当前</TabsTrigger>
          <TabsTrigger value="activities">活动库</TabsTrigger>
          <TabsTrigger value="statistics">统计</TabsTrigger>
          <TabsTrigger value="settings">设置</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 px-4">
          <TabsContent value="current" className="space-y-4">
            {/* 推荐活动 */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                智能推荐
              </h3>
              <div className="space-y-3">
                {recommendedActivities.map(activity => (
                  <div key={activity.id} className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{activity.title}</div>
                          <div className="text-sm text-gray-500">{activity.description}</div>
                          <div className="flex items-center gap-4 mt-2 text-xs">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {activity.plannedDuration}分钟
                            </span>
                            <span className="flex items-center gap-1">
                              <Target className="w-3 h-3" />
                              {activity.suitability.overall}% 适合度
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => setCurrentActivity(activity)}
                        disabled={currentActivity?.id === activity.id}
                      >
                        {currentActivity?.id === activity.id ? '进行中' : '开始'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* 当前活动 */}
            {currentActivity && (
              <Card className="p-4 border-purple-500">
                <h3 className="font-semibold mb-3">当前活动</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      {getActivityIcon(currentActivity.type)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{currentActivity.title}</div>
                      <Progress value={65} className="mt-2" />
                      <div className="text-xs text-gray-500 mt-1">已进行 10/15 分钟</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <PauseCircle className="w-4 h-4 mr-1" />
                      暂停
                    </Button>
                    <Button size="sm" className="bg-green-500 hover:bg-green-600">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      完成
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* 环境状态 */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">环境评估</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">稳定性</span>
                  <Badge variant="outline" className="bg-green-50">良好</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">噪音</span>
                  <Badge variant="outline" className="bg-yellow-50">中等</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">网络</span>
                  <Badge variant="outline" className="bg-green-50">4G</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">拥挤度</span>
                  <Badge variant="outline" className="bg-orange-50">较挤</Badge>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="activities" className="space-y-4">
            {/* 活动分类 */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer">
                <Book className="w-5 h-5 text-blue-500 mb-2" />
                <div className="font-medium">阅读</div>
                <div className="text-xs text-gray-500">文章、电子书</div>
              </Card>
              <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer">
                <Headphones className="w-5 h-5 text-purple-500 mb-2" />
                <div className="font-medium">音频</div>
                <div className="text-xs text-gray-500">播客、有声书</div>
              </Card>
              <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer">
                <Brain className="w-5 h-5 text-green-500 mb-2" />
                <div className="font-medium">思考</div>
                <div className="text-xs text-gray-500">冥想、规划</div>
              </Card>
              <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer">
                <FileText className="w-5 h-5 text-orange-500 mb-2" />
                <div className="font-medium">写作</div>
                <div className="text-xs text-gray-500">笔记、日记</div>
              </Card>
            </div>

            {/* 内容推荐 */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">今日推荐内容</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                  <Badge className="bg-blue-100 text-blue-700">文章</Badge>
                  <div className="flex-1">
                    <div className="text-sm font-medium">深度学习最新进展</div>
                    <div className="text-xs text-gray-500">15分钟 · 技术</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                  <Badge className="bg-purple-100 text-purple-700">播客</Badge>
                  <div className="flex-1">
                    <div className="text-sm font-medium">创业者访谈</div>
                    <div className="text-xs text-gray-500">30分钟 · 商业</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                  <Badge className="bg-green-100 text-green-700">课程</Badge>
                  <div className="flex-1">
                    <div className="text-sm font-medium">项目管理基础 - 第3章</div>
                    <div className="text-xs text-gray-500">20分钟 · 学习</div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="statistics" className="space-y-4">
            {statistics && (
              <>
                {/* 时间统计 */}
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-500" />
                    时间利用
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">本月通勤时间</span>
                      <span className="font-semibold">{Math.floor(statistics.monthlyTotal / 60)}小时</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">有效利用率</span>
                      <div className="flex items-center gap-2">
                        <Progress value={statistics.utilizationRate} className="w-20" />
                        <span className="font-semibold">{statistics.utilizationRate}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">平均生产力</span>
                      <Badge className="bg-green-100 text-green-700">{statistics.averageProductivity}分</Badge>
                    </div>
                  </div>
                </Card>

                {/* 内容消费 */}
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">内容消费</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-500">{statistics.contentConsumed.articles}</div>
                      <div className="text-xs text-gray-500">文章</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-500">{statistics.contentConsumed.podcasts}</div>
                      <div className="text-xs text-gray-500">播客</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-500">{statistics.contentConsumed.books}</div>
                      <div className="text-xs text-gray-500">书籍</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-500">{statistics.contentConsumed.courses}</div>
                      <div className="text-xs text-gray-500">课程</div>
                    </div>
                  </div>
                </Card>

                {/* 健康影响 */}
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    积极影响
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">压力减少</span>
                      <div className="flex items-center gap-2">
                        <Progress value={statistics.wellbeingImpact.stressReduction} className="w-20" />
                        <span className="text-sm font-medium">{statistics.wellbeingImpact.stressReduction}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">学习收获</span>
                      <div className="flex items-center gap-2">
                        <Progress value={statistics.wellbeingImpact.learningGains} className="w-20" />
                        <span className="text-sm font-medium">{statistics.wellbeingImpact.learningGains}%</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-3">通勤偏好</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">默认交通方式</span>
                  <Badge variant="outline">地铁</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">平均通勤时间</span>
                  <Badge variant="outline">35分钟</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">活动偏好</span>
                  <Badge variant="outline">学习优先</Badge>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-3">智能提醒</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">通勤开始提醒</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">活动切换提醒</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">到站提醒</span>
                </label>
              </div>
            </Card>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  )
}

export default CommutePlannerPanel