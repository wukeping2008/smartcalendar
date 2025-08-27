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
import { GTDTask, GTDTaskCategory, InboxItem } from '../../types/gtd-task';
import { initializeGTDDemoData } from '../../lib/services/GTDDemoData';

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
      <Card className="mb-2 hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-gray-600" />
                <Badge className={`${categoryColors[task.category]} text-white text-xs`}>
                  {categoryLabels[task.category]}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  优先级 {task.priority}
                </Badge>
              </div>
              <h4 className="font-medium text-sm">{task.title}</h4>
              {task.expandedContent && (
                <p className="text-xs text-gray-600 mt-1">{task.expandedContent}</p>
              )}
              {task.aiAnalysis && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">
                    AI置信度: {(task.aiAnalysis.confidence * 100).toFixed(0)}%
                  </span>
                  {task.aiAnalysis.extractedKeywords && (
                    <div className="flex gap-1">
                      {task.aiAnalysis.extractedKeywords.slice(0, 3).map((kw, i) => (
                        <Badge key={i} variant="outline" className="text-xs py-0">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                <CheckCircle className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Inbox className="w-5 h-5" />
          GTD任务收集箱
          <Badge variant="secondary">
            {statistics.inboxPending || 0} 待处理
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 快速输入区 */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="输入任务、想法或备忘..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddToInbox()}
                className="flex-1"
              />
              <Button 
                onClick={handleAddToInbox} 
                disabled={!inputText.trim() || isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            
            {/* 快速模板 */}
            <div className="flex gap-1 flex-wrap">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleQuickAdd('会议')}
                className="text-xs"
              >
                <MessageSquare className="w-3 h-3 mr-1" />
                会议
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleQuickAdd('报告')}
                className="text-xs"
              >
                <FileText className="w-3 h-3 mr-1" />
                报告
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleQuickAdd('复盘')}
                className="text-xs"
              >
                <Brain className="w-3 h-3 mr-1" />
                复盘
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleQuickAdd('学习')}
                className="text-xs"
              >
                <HelpCircle className="w-3 h-3 mr-1" />
                学习
              </Button>
            </div>
          </div>

          {/* 统计信息 */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-gray-50 rounded p-2">
              <div className="text-xl font-bold">{statistics.total || 0}</div>
              <div className="text-xs text-gray-600">总任务</div>
            </div>
            <div className="bg-green-50 rounded p-2">
              <div className="text-xl font-bold text-green-600">
                {statistics.byStatus?.pending || 0}
              </div>
              <div className="text-xs text-gray-600">待处理</div>
            </div>
            <div className="bg-blue-50 rounded p-2">
              <div className="text-xl font-bold text-blue-600">
                {statistics.byStatus?.in_progress || 0}
              </div>
              <div className="text-xs text-gray-600">进行中</div>
            </div>
            <div className="bg-gray-50 rounded p-2">
              <div className="text-xl font-bold text-gray-600">
                {statistics.byStatus?.completed || 0}
              </div>
              <div className="text-xs text-gray-600">已完成</div>
            </div>
          </div>

          {/* 任务列表 */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid grid-cols-5 h-8">
              <TabsTrigger value="all" className="text-xs">
                全部 ({tasks.length})
              </TabsTrigger>
              <TabsTrigger value="do" className="text-xs">
                #做 ({statistics.byCategory?.[GTDTaskCategory.DO] || 0})
              </TabsTrigger>
              <TabsTrigger value="ask" className="text-xs">
                #问 ({statistics.byCategory?.[GTDTaskCategory.ASK] || 0})
              </TabsTrigger>
              <TabsTrigger value="lock" className="text-xs">
                #锁 ({statistics.byCategory?.[GTDTaskCategory.LOCK] || 0})
              </TabsTrigger>
              <TabsTrigger value="think" className="text-xs">
                #想 ({statistics.byCategory?.[GTDTaskCategory.THINK] || 0})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-2">
              <ScrollArea className="h-[400px] pr-2">
                {filteredTasks.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="do">
              <ScrollArea className="h-[400px] pr-2">
                {tasks.filter(t => t.category === GTDTaskCategory.DO).map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="ask">
              <ScrollArea className="h-[400px] pr-2">
                {tasks.filter(t => t.category === GTDTaskCategory.ASK).map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="lock">
              <ScrollArea className="h-[400px] pr-2">
                {tasks.filter(t => t.category === GTDTaskCategory.LOCK).map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="think">
              <ScrollArea className="h-[400px] pr-2">
                {tasks.filter(t => t.category === GTDTaskCategory.THINK).map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}