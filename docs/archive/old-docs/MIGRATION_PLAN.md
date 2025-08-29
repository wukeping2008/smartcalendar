# 关系管理模块合并计划

## 合并目标
将"关系管理"模块的独特功能合并到"人物卡CRM"中，避免功能重复。

## 需要迁移的功能

### 1. 联系偏好设置
从 RelationshipManager 迁移到 PersonCard：
- preferredCommunicationMethod (邮件/电话/微信)
- bestTimeToContact (最佳联系时间)
- meetingPreferences (会议偏好)
  - preferredDuration (偏好时长)
  - preferredLocation (偏好地点)
  - needsPreparationTime (准备时间)
- communicationStyle (正式/随意)
- languagePreference (语言偏好)

### 2. 礼物建议系统
- giftPreferences (礼物偏好)
- giftBudget (礼物预算)
- pastGifts (历史礼物记录)

### 3. 执行秘书功能
- 自动生成会议邀请
- 生日/节日祝福模板
- 人情往来记录

## 实施步骤

### 第一步：扩展PersonCard类型
```typescript
// 在 types/personcard.ts 中添加
interface ContactPreferences {
  communication: {
    preferred: 'email' | 'phone' | 'wechat' | 'meeting'
    bestTime: string
    style: 'formal' | 'casual' | 'friendly'
    language: string
  }
  meeting: {
    duration: number
    location: string
    prepTime: number
    preferences: string[]
  }
  gifts: {
    preferences: string[]
    budget: number
    history: GiftRecord[]
  }
}
```

### 第二步：更新PersonCardService
- 添加偏好设置管理方法
- 整合礼物建议功能
- 添加执行秘书自动化功能

### 第三步：更新UI组件
- 在PersonCardPanel中添加"偏好设置"标签页
- 添加礼物建议面板
- 整合会议安排功能

### 第四步：移除重复模块
- 从FloatingPanelSystem中移除RelationshipManager
- 从IconToolbar中移除关系管理入口
- 保留RelationshipService中的独特功能，作为PersonCardService的补充

## 数据迁移
- 将现有RelationshipService中的联系人数据迁移到PersonCardService
- 保留所有历史记录和交互数据
- 合并重复的联系人记录

## 时间预估
- 类型定义更新：30分钟
- 服务整合：1小时
- UI更新：1小时
- 测试验证：30分钟
- 总计：3小时

## 风险评估
- 低风险：大部分是功能整合，不影响核心逻辑
- 需要注意数据迁移的完整性
- 确保用户体验的连续性

## 最终效果
- 统一的人脉管理入口
- 更强大的CRM功能
- 减少系统复杂度
- 提升用户体验