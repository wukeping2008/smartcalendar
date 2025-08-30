/**
 * 智能拒绝助手组件
 * 帮助用户优雅地拒绝低价值请求，保护认知带宽
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '../../src/components/ui/card'
import { Button } from '../../src/components/ui/button'
import { Textarea } from '../../src/components/ui/textarea'
import { Badge } from '../../src/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../src/components/ui/tabs'
import { 
  Shield,
  Copy,
  Send,
  Edit,
  Sparkles,
  Clock,
  Users,
  DollarSign,
  Heart,
  Target,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  MessageSquare,
  Zap,
  RefreshCcw
} from 'lucide-react'
import cognitiveBandwidthService from '../../lib/services/CognitiveBandwidthService'
import { CommitmentType, RejectionTemplate } from '../../types/cognitive'

interface RejectionAssistantProps {
  className?: string
  onReject?: (message: string) => void
}

interface RequestAnalysis {
  type: CommitmentType
  estimatedTime: number
  roi: number
  recommendation: 'reject' | 'consider' | 'accept'
  reasons: string[]
}

export default function RejectionAssistant({
  className = '',
  onReject
}: RejectionAssistantProps) {
  const [templates, setTemplates] = useState<RejectionTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<RejectionTemplate | null>(null)
  const [customMessage, setCustomMessage] = useState('')
  const [requestText, setRequestText] = useState('')
  const [analysis, setAnalysis] = useState<RequestAnalysis | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = () => {
    const allTemplates = cognitiveBandwidthService.getRejectionTemplates()
    setTemplates(allTemplates)
  }

  const analyzeRequest = () => {
    if (!requestText.trim()) return

    // 简单的请求分析逻辑
    const lowerText = requestText.toLowerCase()
    let type: CommitmentType = CommitmentType.FAVOR
    let estimatedTime = 30
    let roi = 0.3

    // 识别请求类型
    if (lowerText.includes('投资') || lowerText.includes('钱') || lowerText.includes('资金')) {
      type = CommitmentType.FINANCIAL
      estimatedTime = 120
      roi = 0.2
    } else if (lowerText.includes('会议') || lowerText.includes('聚会') || lowerText.includes('见面')) {
      type = CommitmentType.SOCIAL
      estimatedTime = 180
      roi = 0.4
    } else if (lowerText.includes('紧急') || lowerText.includes('重要') || lowerText.includes('项目')) {
      type = CommitmentType.CORE
      estimatedTime = 240
      roi = 0.7
    }

    // 生成建议
    const reasons: string[] = []
    let recommendation: 'reject' | 'consider' | 'accept' = 'consider'

    if (roi < 0.3) {
      recommendation = 'reject'
      reasons.push('投入产出比过低')
    }
    if (estimatedTime > 120) {
      reasons.push('占用时间过长')
      if (recommendation === 'consider') recommendation = 'reject'
    }
    if (type === CommitmentType.FAVOR && cognitiveBandwidthService.getCognitiveLoad().current > 5) {
      recommendation = 'reject'
      reasons.push('当前认知负载已高')
    }

    setAnalysis({
      type,
      estimatedTime,
      roi,
      recommendation,
      reasons
    })

    // 自动选择合适的模板
    const matchedTemplates = templates.filter(t => t.type === type)
    if (matchedTemplates.length > 0) {
      setSelectedTemplate(matchedTemplates[0])
      setCustomMessage(matchedTemplates[0].message)
    }
  }

  const generateAIResponse = async () => {
    setIsGenerating(true)
    
    // 模拟AI生成
    setTimeout(() => {
      const aiResponses = [
        `感谢您的邀请。目前我正专注于一个重要的交易窗口期，需要保持最大程度的专注。这段时间我必须谢绝所有非核心承诺。期待未来有机会时再合作。`,
        `谢谢您想到我。不过这个时间段我已有其他安排，恐怕无法参与。建议您可以找[其他人名]，他在这方面很有经验。祝一切顺利！`,
        `感谢信任。仔细考虑后，这个项目与我当前的核心目标不太契合，为了保证双方的最佳结果，我需要婉拒这次机会。相信您能找到更合适的人选。`
      ]
      
      const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)]
      setCustomMessage(randomResponse)
      setIsGenerating(false)
    }, 1500)
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleSend = () => {
    if (customMessage && onReject) {
      onReject(customMessage)
    }
  }

  const getTypeIcon = (type: CommitmentType) => {
    switch (type) {
      case CommitmentType.CORE:
        return <Target className="w-4 h-4" />
      case CommitmentType.SOCIAL:
        return <Users className="w-4 h-4" />
      case CommitmentType.FINANCIAL:
        return <DollarSign className="w-4 h-4" />
      case CommitmentType.SECRET:
        return <Shield className="w-4 h-4" />
      case CommitmentType.FAVOR:
        return <Heart className="w-4 h-4" />
      default:
        return <MessageSquare className="w-4 h-4" />
    }
  }

  const getTypeBadgeColor = (type: CommitmentType) => {
    switch (type) {
      case CommitmentType.CORE:
        return 'bg-purple-600 text-white'
      case CommitmentType.SOCIAL:
        return 'bg-blue-600 text-white'
      case CommitmentType.FINANCIAL:
        return 'bg-green-600 text-white'
      case CommitmentType.SECRET:
        return 'bg-gray-700 text-white'
      case CommitmentType.FAVOR:
        return 'bg-pink-600 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  return (
    <Card className={`${className}`}>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-lg">智能拒绝助手</h3>
          </div>
          <Badge className="bg-purple-100 text-purple-700">
            保护认知边界
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="analyze" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analyze">请求分析</TabsTrigger>
          <TabsTrigger value="templates">拒绝模板</TabsTrigger>
          <TabsTrigger value="custom">自定义回复</TabsTrigger>
        </TabsList>

        <TabsContent value="analyze" className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              粘贴或输入请求内容
            </label>
            <Textarea
              value={requestText}
              onChange={(e) => setRequestText(e.target.value)}
              placeholder="例如：能否参加下周的投资分享会？大概需要2小时..."
              className="min-h-[100px]"
            />
            <Button
              onClick={analyzeRequest}
              className="mt-2"
              disabled={!requestText.trim()}
            >
              <Sparkles className="w-4 h-4 mr-1" />
              分析请求
            </Button>
          </div>

          {analysis && (
            <Card className="p-4 bg-gray-50">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                分析结果
              </h4>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">请求类型:</span>
                  <Badge className={getTypeBadgeColor(analysis.type)}>
                    {getTypeIcon(analysis.type)}
                    <span className="ml-1">{analysis.type}</span>
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">预计耗时:</span>
                  <span className="text-sm font-medium">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {analysis.estimatedTime}分钟
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">投入产出比:</span>
                  <span className={`text-sm font-medium ${
                    analysis.roi > 0.5 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(analysis.roi * 100).toFixed(0)}%
                  </span>
                </div>
                
                <div className="pt-2 border-t">
                  <div className={`p-2 rounded ${
                    analysis.recommendation === 'reject' 
                      ? 'bg-red-100 text-red-700'
                      : analysis.recommendation === 'accept'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    <div className="font-medium text-sm mb-1">
                      建议: {
                        analysis.recommendation === 'reject' ? '拒绝' :
                        analysis.recommendation === 'accept' ? '接受' : '谨慎考虑'
                      }
                    </div>
                    {analysis.reasons.length > 0 && (
                      <ul className="text-xs space-y-1">
                        {analysis.reasons.map((reason, idx) => (
                          <li key={idx}>• {reason}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="templates" className="p-4 space-y-3">
          <div className="text-sm text-gray-600 mb-3">
            选择合适的拒绝模板，点击可预览和编辑
          </div>
          
          {templates.map(template => (
            <Card
              key={template.id}
              className={`p-3 cursor-pointer transition-all ${
                selectedTemplate?.id === template.id 
                  ? 'ring-2 ring-purple-500 bg-purple-50' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => {
                setSelectedTemplate(template)
                setCustomMessage(template.message)
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={`text-xs ${getTypeBadgeColor(template.type)}`}>
                      {template.type}
                    </Badge>
                    {template.tone && (
                      <Badge variant="outline" className="text-xs">
                        {template.tone}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {template.message}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCopy(template.message, template.id)
                  }}
                >
                  {copiedId === template.id ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="custom" className="p-4 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">
                编辑回复内容
              </label>
              <Button
                size="sm"
                variant="outline"
                onClick={generateAIResponse}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <RefreshCcw className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 mr-1" />
                )}
                AI生成
              </Button>
            </div>
            
            <Textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="输入您的拒绝回复..."
              className="min-h-[150px]"
            />
            
            <div className="flex gap-2 mt-3">
              <Button
                onClick={() => handleCopy(customMessage, 'custom')}
                variant="outline"
                disabled={!customMessage}
              >
                <Copy className="w-4 h-4 mr-1" />
                复制
              </Button>
              <Button
                onClick={handleSend}
                disabled={!customMessage}
              >
                <Send className="w-4 h-4 mr-1" />
                发送
              </Button>
            </div>
          </div>

          {/* 快速提示 */}
          <Card className="p-3 bg-blue-50 border-blue-200">
            <h4 className="text-sm font-medium text-blue-800 mb-2">
              拒绝的艺术
            </h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• 感谢对方的邀请或信任</li>
              <li>• 简要说明原因，不必过度解释</li>
              <li>• 提供替代方案或推荐他人</li>
              <li>• 保持礼貌但坚定的语气</li>
              <li>• 避免留下&ldquo;下次&rdquo;的承诺</li>
            </ul>
          </Card>
        </TabsContent>
      </Tabs>
    </Card>
  )
}