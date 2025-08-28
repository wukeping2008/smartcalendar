'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../src/components/ui/card';
import { Button } from '../../src/components/ui/button';
import { Input } from '../../src/components/ui/input';
import { Badge } from '../../src/components/ui/badge';
import { ScrollArea } from '../../src/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../src/components/ui/tabs';
import { 
  Inbox, 
  Plus, 
  Send, 
  Trash2, 
  Archive, 
  CheckCircle,
  Clock,
  Users,
  Lock,
  Zap,
  Brain,
  HelpCircle,
  FileText,
  MessageSquare,
  Loader2
} from 'lucide-react';
import { getGTDTaskService } from '../../lib/services/GTDTaskService';
import FeatureGuide from '../help/FeatureGuide';
import { GTDTask, GTDTaskCategory, InboxItem } from '../../types/gtd-task';
import { initializeGTDDemoData } from '../../lib/services/GTDDemoData';
import VoiceInputFixed from '../voice/VoiceInputFixed';

const categoryIcons = {
  [GTDTaskCategory.TRASH]: Trash2,
  [GTDTaskCategory.STORE]: Archive,
  [GTDTaskCategory.DO]: CheckCircle,
  [GTDTaskCategory.ASK]: Users,
  [GTDTaskCategory.WAITING]: Clock,
  [GTDTaskCategory.LOCK]: Lock,
  [GTDTaskCategory.QUICK_WIN]: Zap,
  [GTDTaskCategory.THINK]: Brain
};

const categoryLabels = {
  [GTDTaskCategory.TRASH]: '[弃] 废弃',
  [GTDTaskCategory.STORE]: '#存 存档',
  [GTDTaskCategory.DO]: '#做 执行',
  [GTDTaskCategory.ASK]: '#问 协作',
  [GTDTaskCategory.WAITING]: '[等] 等待',
  [GTDTaskCategory.LOCK]: '#锁 锁定',
  [GTDTaskCategory.QUICK_WIN]: '#快 见缝插针',
  [GTDTaskCategory.THINK]: '#想 思考'
};

const categoryColors = {
  [GTDTaskCategory.TRASH]: 'bg-gray-500',
  [GTDTaskCategory.STORE]: 'bg-blue-500',
  [GTDTaskCategory.DO]: 'bg-green-500',
  [GTDTaskCategory.ASK]: 'bg-purple-500',
  [GTDTaskCategory.WAITING]: 'bg-yellow-500',
  [GTDTaskCategory.LOCK]: 'bg-red-500',
  [GTDTaskCategory.QUICK_WIN]: 'bg-orange-500',
  [GTDTaskCategory.THINK]: 'bg-indigo-500'
};

export function TaskInbox() {
  const [inputText, setInputText] = useState('');
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [tasks, setTasks] = useState<GTDTask[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<GTDTaskCategory | 'all'>('all');
  const [statistics, setStatistics] = useState<any>({});

  const taskService = getGTDTaskService();

  useEffect(() => {
    // 初始化演示数据
    initializeGTDDemoData().then(() => {
      loadData();
    });
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    setInboxItems(taskService.getInboxItems(false));
    setTasks(taskService.getTasks());
    setStatistics(taskService.getStatistics());
  };

  const handleAddToInbox = async () => {
    if (!inputText.trim()) return;
    
    setIsProcessing(true);
    await taskService.addToInbox(inputText, 'manual');
    setInputText('');
    setTimeout(() => {
      loadData();
      setIsProcessing(false);
    }, 500);
  };

  const handleQuickAdd = (template: string) => {
    setInputText(template);
  };

  const filteredTasks = selectedCategory === 'all' 
    ? tasks 
    : tasks.filter(t => t.category === selectedCategory);

  const TaskCard = ({ task }: { task: GTDTask }) => {
    const Icon = categoryIcons[task.category];
    
    return (
      <div className="mb-3 bg-gray-800/30 border border-gray-700/50 rounded-lg hover:bg-gray-800/50 hover:border-gray-600/50 transition-all duration-200">
        <div className="p-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-gray-400" />
                <Badge className={`${categoryColors[task.category]} text-white text-xs px-2 py-0.5`}>
                  {categoryLabels[task.category]}
                </Badge>
                <Badge className="bg-gray-700/50 text-gray-300 border-gray-600 text-xs px-2 py-0.5">
                  优先级 {task.priority}
                </Badge>
              </div>
              <h4 className="font-medium text-sm text-gray-100 mb-1 leading-relaxed">{task.title}</h4>
              {task.expandedContent && (
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">{task.expandedContent}</p>
              )}
              {task.aiAnalysis && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-500">
                    AI置信度: {(task.aiAnalysis.confidence * 100).toFixed(0)}%
                  </span>
                  {task.aiAnalysis.extractedKeywords && (
                    <div className="flex gap-1 flex-wrap">
                      {task.aiAnalysis.extractedKeywords.slice(0, 3).map((kw, i) => (
                        <Badge key={i} className="bg-gray-700/50 text-gray-300 border-gray-600 text-xs py-0 px-1">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-green-500/20 hover:text-green-400">
                <CheckCircle className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-red-500/20 hover:text-red-400">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-gray-900 text-gray-100 rounded-lg overflow-hidden">
      <div className="bg-gray-800/50 border-b border-gray-700/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Inbox className="w-5 h-5 text-cyan-400" />
          <h2 className="font-semibold text-lg text-gray-100">GTD任务收集箱</h2>
          <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
            {statistics.inboxPending || 0} 待处理
          </Badge>
        </div>
      </div>
      <div className="p-4">
        <FeatureGuide
          title="GTD任务收集箱"
          steps={[
            '使用顶部的输入框快速捕获任何想法或任务。',
            '点击麦克风图标可以通过语音快速输入。',
            '捕获的任务会进入收集箱，等待AI自动分类和处理。',
            '使用下方的分类标签（#做、#问、#锁等）来筛选和查看不同类型的任务。',
            'AI会自动为任务添加优先级、关键词和分析，帮助您更好地管理。'
          ]}
          className="mb-4"
        />
        <div className="space-y-4">
          {/* 快速输入区 */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="输入任务、想法或备忘..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddToInbox()}
                className="flex-1 bg-gray-800/50 border-gray-700 text-gray-100 placeholder:text-gray-400 focus:border-cyan-500 focus:ring-cyan-500/20"
              />
              {/* 语音输入按钮 */}
              <VoiceInputFixed
                size="sm"
                onResult={(text) => {
                  setInputText(text.trim())
                }}
              />
              <Button 
                onClick={handleAddToInbox} 
                disabled={!inputText.trim() || isProcessing}
                className="bg-cyan-600 hover:bg-cyan-700 text-white border-cyan-600"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            
            {/* 快速模板 */}
            <div className="flex gap-2 flex-wrap">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleQuickAdd('会议')}
                className="text-xs bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white hover:border-gray-500"
              >
                <MessageSquare className="w-3 h-3 mr-1" />
                会议
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleQuickAdd('报告')}
                className="text-xs bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white hover:border-gray-500"
              >
                <FileText className="w-3 h-3 mr-1" />
                报告
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleQuickAdd('复盘')}
                className="text-xs bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white hover:border-gray-500"
              >
                <Brain className="w-3 h-3 mr-1" />
                复盘
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleQuickAdd('学习')}
                className="text-xs bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white hover:border-gray-500"
              >
                <HelpCircle className="w-3 h-3 mr-1" />
                学习
              </Button>
            </div>
          </div>

          {/* 统计信息 */}
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
              <div className="text-xl font-bold text-gray-100">{statistics.total || 0}</div>
              <div className="text-xs text-gray-400 mt-1">总任务</div>
            </div>
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
              <div className="text-xl font-bold text-green-400">
                {statistics.byStatus?.pending || 0}
              </div>
              <div className="text-xs text-green-300 mt-1">待处理</div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <div className="text-xl font-bold text-blue-400">
                {statistics.byStatus?.in_progress || 0}
              </div>
              <div className="text-xs text-blue-300 mt-1">进行中</div>
            </div>
            <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-3">
              <div className="text-xl font-bold text-gray-300">
                {statistics.byStatus?.completed || 0}
              </div>
              <div className="text-xs text-gray-400 mt-1">已完成</div>
            </div>
          </div>

          {/* 任务列表 */}
          <div className="w-full">
            <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-1">
              <div className="grid grid-cols-5 gap-1">
                <Button 
                  variant={selectedCategory === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedCategory('all')}
                  className={`text-xs justify-center ${selectedCategory === 'all' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'}`}
                >
                  全部 ({tasks.length})
                </Button>
                <Button 
                  variant={selectedCategory === GTDTaskCategory.DO ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedCategory(GTDTaskCategory.DO)}
                  className={`text-xs justify-center ${selectedCategory === GTDTaskCategory.DO ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'}`}
                >
                  #做 ({statistics.byCategory?.[GTDTaskCategory.DO] || 0})
                </Button>
                <Button 
                  variant={selectedCategory === GTDTaskCategory.ASK ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedCategory(GTDTaskCategory.ASK)}
                  className={`text-xs justify-center ${selectedCategory === GTDTaskCategory.ASK ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'}`}
                >
                  #问 ({statistics.byCategory?.[GTDTaskCategory.ASK] || 0})
                </Button>
                <Button 
                  variant={selectedCategory === GTDTaskCategory.LOCK ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedCategory(GTDTaskCategory.LOCK)}
                  className={`text-xs justify-center ${selectedCategory === GTDTaskCategory.LOCK ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'}`}
                >
                  #锁 ({statistics.byCategory?.[GTDTaskCategory.LOCK] || 0})
                </Button>
                <Button 
                  variant={selectedCategory === GTDTaskCategory.THINK ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedCategory(GTDTaskCategory.THINK)}
                  className={`text-xs justify-center ${selectedCategory === GTDTaskCategory.THINK ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'}`}
                >
                  #想 ({statistics.byCategory?.[GTDTaskCategory.THINK] || 0})
                </Button>
              </div>
            </div>
            
            <div className="mt-3">
              <ScrollArea className="h-[350px] pr-2">
                <div className="space-y-2">
                  {filteredTasks.length > 0 ? (
                    filteredTasks.map(task => (
                      <TaskCard key={task.id} task={task} />
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-500 text-sm">
                        {selectedCategory === 'all' ? '暂无任务' : `暂无${categoryLabels[selectedCategory as GTDTaskCategory]}任务`}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaskInbox;
