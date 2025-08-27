import { GTDTaskCategory } from '../../types/gtd-task';

interface AutoCompletePattern {
  keywords: string[];
  template: string;
  category: GTDTaskCategory;
  priority?: number;
  contextHints?: string[];
  examples?: string[];
}

export class TaskAutoCompleteService {
  private patterns: AutoCompletePattern[] = [];
  private userPatterns: Map<string, AutoCompletePattern> = new Map();
  private aiService: any = null; // Will be injected

  constructor() {
    this.initializePatterns();
  }

  private initializePatterns() {
    this.patterns = [
      // 会议相关
      {
        keywords: ['会议', 'meeting', '开会'],
        template: '参加[会议名称]会议 - 准备会议资料，记录要点，整理会议纪要，跟进行动项',
        category: GTDTaskCategory.LOCK,
        priority: 4,
        contextHints: ['准备材料', '记录要点', '整理纪要', '跟进事项'],
        examples: [
          '参加产品评审会议 - 准备产品设计文档，记录反馈意见，整理改进方案',
          '参加周例会 - 汇报本周工作进展，讨论下周计划安排'
        ]
      },
      
      // 报告相关
      {
        keywords: ['报告', 'report', '汇报'],
        template: '撰写[报告类型]报告 - 收集数据资料，分析核心内容，编写报告文档，提交审核确认',
        category: GTDTaskCategory.DO,
        priority: 3,
        contextHints: ['数据收集', '内容分析', '文档编写', '审核提交'],
        examples: [
          '撰写月度工作报告 - 统计本月完成事项，分析问题和改进点',
          '撰写项目进展报告 - 整理项目里程碑，评估风险点'
        ]
      },
      
      // 复盘相关
      {
        keywords: ['复盘', 'review', '总结', '回顾'],
        template: '进行[事项]复盘 - 整理相关数据，分析得失原因，总结经验教训，制定改进计划',
        category: GTDTaskCategory.THINK,
        priority: 3,
        contextHints: ['数据整理', '原因分析', '经验总结', '改进计划'],
        examples: [
          '进行项目复盘 - 评估项目目标达成情况，分析成功因素和不足',
          '进行交易复盘 - 回顾交易决策过程，总结盈亏原因'
        ]
      },
      
      // 学习相关
      {
        keywords: ['学习', 'learn', 'study', '研究'],
        template: '学习[技能/知识] - 查找学习资源，制定学习计划，实践练习巩固，总结笔记心得',
        category: GTDTaskCategory.THINK,
        priority: 2,
        contextHints: ['资源查找', '计划制定', '实践练习', '笔记总结'],
        examples: [
          '学习Python编程 - 找教程视频，每日练习1小时，完成实战项目',
          '学习投资理财 - 阅读经典书籍，研究案例分析'
        ]
      },
      
      // 邮件相关
      {
        keywords: ['邮件', 'email', 'mail'],
        template: '处理邮件 - 阅读重要邮件，分类归档存储，回复紧急事项，标记待办任务',
        category: GTDTaskCategory.QUICK_WIN,
        priority: 2,
        contextHints: ['阅读筛选', '分类归档', '及时回复', '任务标记']
      },
      
      // 沟通相关
      {
        keywords: ['沟通', '联系', '协调', '讨论'],
        template: '与[人员]沟通[事项] - 准备沟通要点，预约合适时间，进行有效沟通，确认后续行动',
        category: GTDTaskCategory.ASK,
        priority: 3,
        contextHints: ['准备要点', '预约时间', '有效沟通', '确认行动'],
        examples: [
          '与产品经理沟通需求 - 整理需求疑问点，讨论实现方案',
          '与客户沟通合作事宜 - 准备合作方案，商讨具体条款'
        ]
      },
      
      // 计划相关
      {
        keywords: ['计划', 'plan', '规划', '安排'],
        template: '制定[计划类型] - 明确目标要求，分解具体任务，设置时间节点，分配资源责任',
        category: GTDTaskCategory.THINK,
        priority: 4,
        contextHints: ['目标明确', '任务分解', '时间安排', '资源分配']
      },
      
      // 审核相关
      {
        keywords: ['审核', '审批', 'review', '检查'],
        template: '审核[文档/方案] - 检查完整性，评估合理性，提出修改建议，给出审核结论',
        category: GTDTaskCategory.DO,
        priority: 3,
        contextHints: ['完整性检查', '合理性评估', '修改建议', '审核结论']
      },
      
      // 准备相关
      {
        keywords: ['准备', 'prepare', '筹备'],
        template: '准备[事项] - 列出所需清单，收集必要材料，检查完备性，提前预演测试',
        category: GTDTaskCategory.DO,
        priority: 3,
        contextHints: ['清单列出', '材料收集', '完备检查', '预演测试']
      },
      
      // 跟进相关
      {
        keywords: ['跟进', 'follow', '追踪', '跟踪'],
        template: '跟进[事项]进展 - 了解当前状态，识别阻塞问题，协调解决方案，更新进度记录',
        category: GTDTaskCategory.WAITING,
        priority: 3,
        contextHints: ['状态了解', '问题识别', '方案协调', '进度更新']
      },
      
      // 分析相关
      {
        keywords: ['分析', 'analyze', '研究', '调研'],
        template: '分析[主题] - 收集相关数据，运用分析方法，得出关键洞察，形成分析报告',
        category: GTDTaskCategory.THINK,
        priority: 3,
        contextHints: ['数据收集', '方法运用', '洞察提炼', '报告形成']
      },
      
      // 优化相关
      {
        keywords: ['优化', 'optimize', '改进', '提升'],
        template: '优化[对象] - 评估现状问题，设计改进方案，实施优化措施，验证改进效果',
        category: GTDTaskCategory.DO,
        priority: 3,
        contextHints: ['现状评估', '方案设计', '措施实施', '效果验证']
      },
      
      // 文档相关
      {
        keywords: ['文档', 'doc', '文件', '资料'],
        template: '整理[文档类型] - 收集相关内容，组织文档结构，编写核心内容，格式美化调整',
        category: GTDTaskCategory.DO,
        priority: 2,
        contextHints: ['内容收集', '结构组织', '内容编写', '格式调整']
      },
      
      // 反馈相关
      {
        keywords: ['反馈', 'feedback', '意见', '建议'],
        template: '提供[事项]反馈 - 体验评估分析，整理问题要点，给出改进建议，跟进落实情况',
        category: GTDTaskCategory.ASK,
        priority: 2,
        contextHints: ['体验评估', '问题整理', '建议给出', '落实跟进']
      },
      
      // 整理相关
      {
        keywords: ['整理', 'organize', '归档', '清理'],
        template: '整理[对象] - 分类归纳内容，清理无用项目，优化组织结构，建立索引目录',
        category: GTDTaskCategory.QUICK_WIN,
        priority: 2,
        contextHints: ['分类归纳', '清理无用', '结构优化', '索引建立']
      }
    ];
  }

  // 根据输入文本获取自动补全建议
  async getCompletions(input: string): Promise<Array<{
    text: string;
    category: GTDTaskCategory;
    confidence: number;
    source: 'pattern' | 'user' | 'ai';
  }>> {
    const suggestions = [];
    const inputLower = input.toLowerCase();
    
    // 1. 检查内置模式
    for (const pattern of this.patterns) {
      for (const keyword of pattern.keywords) {
        if (inputLower.includes(keyword)) {
          const expanded = this.expandTemplate(pattern.template, input);
          suggestions.push({
            text: expanded,
            category: pattern.category,
            confidence: 0.9,
            source: 'pattern' as const
          });
          break;
        }
      }
    }
    
    // 2. 检查用户自定义模式
    for (const [key, pattern] of this.userPatterns) {
      if (inputLower.includes(key)) {
        suggestions.push({
          text: pattern.template,
          category: pattern.category,
          confidence: 0.85,
          source: 'user' as const
        });
      }
    }
    
    // 3. 如果没有匹配，使用AI建议
    if (suggestions.length === 0 && this.aiService) {
      try {
        const aiSuggestion = await this.getAISuggestion(input);
        if (aiSuggestion) {
          suggestions.push({
            text: aiSuggestion.text,
            category: aiSuggestion.category,
            confidence: aiSuggestion.confidence,
            source: 'ai' as const
          });
        }
      } catch (error) {
        console.error('AI suggestion failed:', error);
      }
    }
    
    // 排序：按置信度降序
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  // 扩展模板
  private expandTemplate(template: string, input: string): string {
    // 尝试从输入中提取具体信息来替换模板占位符
    let expanded = template;
    
    // 提取可能的具体内容
    const matches = input.match(/["'「」]([^"'「」]+)["'」]/g);
    if (matches && matches.length > 0) {
      const content = matches[0].replace(/["'「」]/g, '');
      expanded = expanded.replace(/\[[^\]]+\]/, content);
    } else {
      // 如果没有引号内容，尝试智能提取
      const words = input.split(/\s+/);
      if (words.length > 1) {
        // 移除关键词，使用剩余部分
        const keywords = this.patterns.flatMap(p => p.keywords);
        const meaningful = words.filter(w => !keywords.includes(w.toLowerCase()));
        if (meaningful.length > 0) {
          expanded = expanded.replace(/\[[^\]]+\]/, meaningful.join(' '));
        }
      }
    }
    
    return expanded;
  }

  // 获取AI建议（需要集成AI服务）
  private async getAISuggestion(input: string): Promise<{
    text: string;
    category: GTDTaskCategory;
    confidence: number;
  } | null> {
    // 这里应该调用实际的AI服务
    // 暂时返回基于规则的简单扩展
    
    // 基于输入长度和内容的简单规则
    if (input.length < 5) {
      return null;
    }
    
    // 默认扩展
    const defaultExpansion = `${input} - 分析需求，制定计划，执行任务，验证结果`;
    
    // 尝试智能分类
    let category = GTDTaskCategory.DO;
    let confidence = 0.6;
    
    if (input.includes('想') || input.includes('考虑')) {
      category = GTDTaskCategory.THINK;
      confidence = 0.7;
    } else if (input.includes('等') || input.includes('待')) {
      category = GTDTaskCategory.WAITING;
      confidence = 0.7;
    } else if (input.includes('问') || input.includes('请')) {
      category = GTDTaskCategory.ASK;
      confidence = 0.7;
    }
    
    return {
      text: defaultExpansion,
      category,
      confidence
    };
  }

  // 学习用户模式
  learnPattern(keyword: string, expandedText: string, category: GTDTaskCategory) {
    this.userPatterns.set(keyword.toLowerCase(), {
      keywords: [keyword],
      template: expandedText,
      category,
      priority: 3
    });
    
    // 持久化到localStorage
    if (typeof window !== 'undefined') {
      const patterns = Array.from(this.userPatterns.entries());
      localStorage.setItem('user_task_patterns', JSON.stringify(patterns));
    }
  }

  // 加载用户模式
  loadUserPatterns() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user_task_patterns');
      if (stored) {
        try {
          const patterns = JSON.parse(stored);
          patterns.forEach(([key, value]: [string, AutoCompletePattern]) => {
            this.userPatterns.set(key, value);
          });
        } catch (error) {
          console.error('Failed to load user patterns:', error);
        }
      }
    }
  }

  // 获取相似任务建议
  getSimilarTasks(input: string): string[] {
    const suggestions = [];
    const inputWords = new Set(input.toLowerCase().split(/\s+/));
    
    for (const pattern of this.patterns) {
      // 计算关键词匹配度
      const matchCount = pattern.keywords.filter(k => 
        Array.from(inputWords).some(w => w.includes(k) || k.includes(w))
      ).length;
      
      if (matchCount > 0 && pattern.examples) {
        suggestions.push(...pattern.examples);
      }
    }
    
    return suggestions.slice(0, 5); // 返回前5个建议
  }

  // 获取任务扩展提示
  getExpansionHints(category: GTDTaskCategory): string[] {
    const hints: Record<GTDTaskCategory, string[]> = {
      [GTDTaskCategory.DO]: [
        '明确具体行动步骤',
        '设定完成时限',
        '准备所需资源',
        '定义完成标准'
      ],
      [GTDTaskCategory.THINK]: [
        '列出需要考虑的要点',
        '收集相关信息',
        '设定决策截止时间',
        '明确预期产出'
      ],
      [GTDTaskCategory.ASK]: [
        '明确请求内容',
        '提供背景信息',
        '设定回复期限',
        '准备替代方案'
      ],
      [GTDTaskCategory.WAITING]: [
        '记录等待原因',
        '设置提醒时间',
        '准备后续行动',
        '考虑超时处理'
      ],
      [GTDTaskCategory.LOCK]: [
        '确认具体时间',
        '添加到日历',
        '准备相关材料',
        '设置提醒'
      ],
      [GTDTaskCategory.QUICK_WIN]: [
        '估算所需时间',
        '准备必要工具',
        '明确完成标志',
        '安排执行时机'
      ],
      [GTDTaskCategory.STORE]: [
        '选择存储位置',
        '添加标签分类',
        '记录关键信息',
        '设置回顾提醒'
      ],
      [GTDTaskCategory.TRASH]: [
        '确认不再需要',
        '考虑存档价值',
        '清理相关资源',
        '更新任务列表'
      ]
    };
    
    return hints[category] || ['添加更多细节', '明确下一步行动'];
  }

  // 设置AI服务
  setAIService(service: any) {
    this.aiService = service;
  }
}

// 单例实例
let instance: TaskAutoCompleteService | null = null;

export function getTaskAutoCompleteService(): TaskAutoCompleteService {
  if (!instance) {
    instance = new TaskAutoCompleteService();
    instance.loadUserPatterns();
  }
  return instance;
}