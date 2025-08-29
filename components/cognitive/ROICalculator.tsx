/**
 * ROI决策计算器组件
 * 帮助用户量化评估承诺的投入产出比
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { 
  Calculator,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Brain,
  Heart,
  Target,
  AlertTriangle,
  CheckCircle,
  Info,
  BarChart3,
  Lightbulb,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import { CommitmentType, CommitmentPriority } from '../../types/cognitive'
import cognitiveBandwidthService from '../../lib/services/CognitiveBandwidthService'

interface ROICalculatorProps {
  className?: string
  onDecision?: (decision: DecisionResult) => void
}

interface ROIFactors {
  timeInvestment: number      // 时间投入（分钟）
  moneyInvestment: number      // 金钱投入
  energyInvestment: number     // 精力投入（1-10）
  expectedReturn: number       // 预期回报
  successProbability: number   // 成功概率（0-1）
  strategicValue: number       // 战略价值（1-10）
  relationshipValue: number    // 关系价值（1-10）
  learningValue: number        // 学习价值（1-10）
}

interface DecisionResult {
  roi: number
  recommendation: 'strong-yes' | 'yes' | 'maybe' | 'no' | 'strong-no'
  score: number
  insights: string[]
  alternatives: string[]
}

export default function ROICalculator({
  className = '',
  onDecision
}: ROICalculatorProps) {
  const [commitmentType, setCommitmentType] = useState<CommitmentType>(CommitmentType.FAVOR)
  const [factors, setFactors] = useState<ROIFactors>({
    timeInvestment: 60,
    moneyInvestment: 0,
    energyInvestment: 5,
    expectedReturn: 1000,
    successProbability: 0.5,
    strategicValue: 5,
    relationshipValue: 5,
    learningValue: 5
  })
  const [result, setResult] = useState<DecisionResult | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const calculateROI = () => {
    const {
      timeInvestment,
      moneyInvestment,
      energyInvestment,
      expectedReturn,
      successProbability,
      strategicValue,
      relationshipValue,
      learningValue
    } = factors

    // 计算总投入（标准化）
    const timeValue = timeInvestment * 50 // 假设每小时价值3000元
    const energyValue = energyInvestment * 100
    const totalInvestment = timeValue + moneyInvestment + energyValue

    // 计算加权回报
    const directReturn = expectedReturn * successProbability
    const indirectReturn = (strategicValue + relationshipValue + learningValue) * 100
    const totalReturn = directReturn + indirectReturn

    // 计算ROI
    const roi = totalInvestment > 0 ? ((totalReturn - totalInvestment) / totalInvestment) * 100 : 0

    // 生成决策建议
    let recommendation: DecisionResult['recommendation']
    let score = 0
    const insights: string[] = []
    const alternatives: string[] = []

    // 根据承诺类型调整权重
    let typeMultiplier = 1
    switch (commitmentType) {
      case CommitmentType.CORE:
        typeMultiplier = 1.5
        break
      case CommitmentType.FINANCIAL:
        typeMultiplier = 1.2
        break
      case CommitmentType.SOCIAL:
        typeMultiplier = 0.9
        break
      case CommitmentType.FAVOR:
        typeMultiplier = 0.7
        break
    }

    score = roi * typeMultiplier

    // 生成建议
    if (score > 200) {
      recommendation = 'strong-yes'
      insights.push('极高的投入产出比，强烈建议接受')
      insights.push('这是一个难得的高价值机会')
    } else if (score > 100) {
      recommendation = 'yes'
      insights.push('良好的投资回报率')
      insights.push('风险可控，收益明确')
    } else if (score > 50) {
      recommendation = 'maybe'
      insights.push('中等回报，需要权衡')
      alternatives.push('尝试降低时间投入')
      alternatives.push('寻找合作伙伴分担')
    } else if (score > 0) {
      recommendation = 'no'
      insights.push('投入产出比偏低')
      alternatives.push('委婉拒绝，推荐他人')
      alternatives.push('要求更好的条件')
    } else {
      recommendation = 'strong-no'
      insights.push('负收益，强烈建议拒绝')
      insights.push('会消耗宝贵的认知带宽')
      alternatives.push('直接但礼貌地拒绝')
    }

    // 额外洞察
    if (timeInvestment > 180) {
      insights.push('时间投入过大，考虑分阶段进行')
    }
    if (successProbability < 0.3) {
      insights.push('成功率偏低，需要更多保障')
    }
    if (strategicValue > 7) {
      insights.push('高战略价值，长期收益可观')
    }
    if (energyInvestment > 7) {
      insights.push('高精力消耗，确保充分休息')
    }

    // 考虑当前认知负载
    const cognitiveLoad = cognitiveBandwidthService.getCognitiveLoad()
    if (cognitiveLoad.current >= cognitiveLoad.threshold) {
      insights.push('⚠️ 当前认知负载已高，建议推迟或拒绝')
      if (recommendation === 'yes') recommendation = 'maybe'
      if (recommendation === 'maybe') recommendation = 'no'
    }

    const decision: DecisionResult = {
      roi,
      recommendation,
      score,
      insights,
      alternatives
    }

    setResult(decision)
    onDecision?.(decision)
  }

  const updateFactor = (key: keyof ROIFactors, value: number | number[]) => {
    const val = Array.isArray(value) ? value[0] : value
    setFactors(prev => ({ ...prev, [key]: val }))
  }

  const getRecommendationColor = (rec: DecisionResult['recommendation']) => {
    switch (rec) {
      case 'strong-yes':
        return 'text-green-600 bg-green-50'
      case 'yes':
        return 'text-green-500 bg-green-50'
      case 'maybe':
        return 'text-yellow-600 bg-yellow-50'
      case 'no':
        return 'text-orange-600 bg-orange-50'
      case 'strong-no':
        return 'text-red-600 bg-red-50'
    }
  }

  const getRecommendationText = (rec: DecisionResult['recommendation']) => {
    switch (rec) {
      case 'strong-yes':
        return '强烈推荐'
      case 'yes':
        return '建议接受'
      case 'maybe':
        return '谨慎考虑'
      case 'no':
        return '建议拒绝'
      case 'strong-no':
        return '强烈反对'
    }
  }

  return (
    <Card className={`${className}`}>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-lg">ROI决策计算器</h3>
          </div>
          <Badge className="bg-blue-100 text-blue-700">
            量化决策
          </Badge>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* 承诺类型选择 */}
        <div>
          <Label className="text-sm font-medium mb-2 block">承诺类型</Label>
          <RadioGroup 
            value={commitmentType} 
            onValueChange={(value) => setCommitmentType(value as CommitmentType)}
            className="grid grid-cols-3 gap-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={CommitmentType.CORE} id="core" />
              <Label htmlFor="core" className="text-sm cursor-pointer">
                核心任务
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={CommitmentType.FINANCIAL} id="financial" />
              <Label htmlFor="financial" className="text-sm cursor-pointer">
                财务相关
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={CommitmentType.SOCIAL} id="social" />
              <Label htmlFor="social" className="text-sm cursor-pointer">
                社交活动
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={CommitmentType.SECRET} id="secret" />
              <Label htmlFor="secret" className="text-sm cursor-pointer">
                秘密项目
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={CommitmentType.FAVOR} id="favor" />
              <Label htmlFor="favor" className="text-sm cursor-pointer">
                人情帮忙
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* 基础参数 */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-sm">
                <Clock className="w-3 h-3 inline mr-1" />
                时间投入
              </Label>
              <span className="text-sm font-medium">{factors.timeInvestment}分钟</span>
            </div>
            <Slider
              value={[factors.timeInvestment]}
              onValueChange={(value) => updateFactor('timeInvestment', value)}
              min={15}
              max={480}
              step={15}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-sm">
                <DollarSign className="w-3 h-3 inline mr-1" />
                金钱投入
              </Label>
              <Input
                type="number"
                value={factors.moneyInvestment}
                onChange={(e) => updateFactor('moneyInvestment', Number(e.target.value))}
                className="w-24 h-7 text-right"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-sm">
                <Brain className="w-3 h-3 inline mr-1" />
                精力消耗
              </Label>
              <span className="text-sm font-medium">{factors.energyInvestment}/10</span>
            </div>
            <Slider
              value={[factors.energyInvestment]}
              onValueChange={(value) => updateFactor('energyInvestment', value)}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-sm">
                <TrendingUp className="w-3 h-3 inline mr-1" />
                预期回报
              </Label>
              <Input
                type="number"
                value={factors.expectedReturn}
                onChange={(e) => updateFactor('expectedReturn', Number(e.target.value))}
                className="w-24 h-7 text-right"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-sm">
                <Target className="w-3 h-3 inline mr-1" />
                成功概率
              </Label>
              <span className="text-sm font-medium">{(factors.successProbability * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[factors.successProbability]}
              onValueChange={(value) => updateFactor('successProbability', value)}
              min={0}
              max={1}
              step={0.1}
              className="w-full"
            />
          </div>
        </div>

        {/* 高级参数 */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm"
          >
            {showAdvanced ? '隐藏' : '显示'}高级参数
            <ArrowRight className={`w-3 h-3 ml-1 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
          </Button>
          
          {showAdvanced && (
            <div className="mt-3 space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-sm">战略价值</Label>
                  <span className="text-sm font-medium">{factors.strategicValue}/10</span>
                </div>
                <Slider
                  value={[factors.strategicValue]}
                  onValueChange={(value) => updateFactor('strategicValue', value)}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-sm">关系价值</Label>
                  <span className="text-sm font-medium">{factors.relationshipValue}/10</span>
                </div>
                <Slider
                  value={[factors.relationshipValue]}
                  onValueChange={(value) => updateFactor('relationshipValue', value)}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-sm">学习价值</Label>
                  <span className="text-sm font-medium">{factors.learningValue}/10</span>
                </div>
                <Slider
                  value={[factors.learningValue]}
                  onValueChange={(value) => updateFactor('learningValue', value)}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* 计算按钮 */}
        <Button 
          onClick={calculateROI}
          className="w-full"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          计算ROI
        </Button>

        {/* 结果展示 */}
        {result && (
          <Card className={`p-4 ${getRecommendationColor(result.recommendation)}`}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-lg">
                    {getRecommendationText(result.recommendation)}
                  </h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm">
                      ROI: {result.roi.toFixed(1)}%
                    </span>
                    <span className="text-sm">
                      综合评分: {result.score.toFixed(0)}
                    </span>
                  </div>
                </div>
                {result.recommendation.includes('yes') ? (
                  <CheckCircle className="w-6 h-6" />
                ) : result.recommendation === 'maybe' ? (
                  <Info className="w-6 h-6" />
                ) : (
                  <AlertTriangle className="w-6 h-6" />
                )}
              </div>

              {/* 洞察 */}
              {result.insights.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium mb-1 flex items-center gap-1">
                    <Lightbulb className="w-3 h-3" />
                    关键洞察
                  </h5>
                  <ul className="text-sm space-y-1">
                    {result.insights.map((insight, idx) => (
                      <li key={idx}>• {insight}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 替代方案 */}
              {result.alternatives.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    替代建议
                  </h5>
                  <ul className="text-sm space-y-1">
                    {result.alternatives.map((alt, idx) => (
                      <li key={idx}>• {alt}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* 使用提示 */}
        <Card className="p-3 bg-gray-50 border-gray-200">
          <p className="text-xs text-gray-600">
            <Info className="w-3 h-3 inline mr-1" />
            ROI计算器帮助您量化评估每个承诺的价值。记住：时间是您最宝贵的资产，
            每个"是"都意味着对其他机会说"不"。
          </p>
        </Card>
      </div>
    </Card>
  )
}