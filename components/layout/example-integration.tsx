// 这是一个示例文件，展示如何将浮动面板系统集成到现有的 src/app/page.tsx 中

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Settings, Brain, HelpCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// 现有组件
import EnhancedFlowCanvas from '../../timeflow/FlowCanvas';
import CalendarContainer from '../../calendar/CalendarContainer';
import SmartEventCreator from '../../calendar/SmartEventCreator';
import FloatingTips from '../../help/FloatingTips';
import FeatureGuideModal from '../../help/FeatureGuideModal';

// 新的浮动面板系统
import { FloatingPanelSystem } from './FloatingPanelSystem';

// 类型和状态
import { Event } from '../../../types/event';
import { useEventStore } from '../../../lib/stores/event-store';

export default function EnhancedHomePage() {
  const { events, selectEvent, addEvent, deleteEvent } = useEventStore();
  const [currentTime] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [initialized, setInitialized] = useState(false);
  const [viewMode, setViewMode] = useState<'flow' | 'calendar'>('calendar');
  const [showFeatureGuide, setShowFeatureGuide] = useState(false);

  // ... 其他现有的逻辑保持不变 ...

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900">
      {/* 头部导航 - 保持不变 */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white">
                秉笔太监智能日历系统
              </h1>
              <span className="text-sm text-cyan-300">
                {viewMode === 'calendar' ? '专业日历规划' : '3D时间流体验'}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex bg-black/30 rounded-lg border border-white/20 p-1">
                <Button
                  size="sm"
                  variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                  className={viewMode === 'calendar' ? 'bg-cyan-600 text-white' : 'text-white hover:bg-white/10'}
                  onClick={() => setViewMode('calendar')}
                >
                  📅 日历视图
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'flow' ? 'default' : 'ghost'}
                  className={viewMode === 'flow' ? 'bg-cyan-600 text-white' : 'text-white hover:bg-white/10'}
                  onClick={() => setViewMode('flow')}
                >
                  🌊 时间流
                </Button>
              </div>
              <Link 
                href="/settings" 
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                <Brain className="h-4 w-4" />
                <span className="text-sm font-medium">AI助手</span>
              </Link>
              <Link 
                href="/settings" 
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span className="text-sm">设置</span>
              </Link>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowFeatureGuide(true)}
                className="flex items-center gap-2 text-white border-cyan-500/50 hover:bg-cyan-500/20"
              >
                <HelpCircle className="h-4 w-4" />
                <span className="text-sm">功能指南</span>
              </Button>
              <div className="text-sm text-cyan-300">
                v4.0 - 智能生活管家
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区域 - 移除侧边栏，使用全宽度 */}
      <main className="flex-1">
        {/* 主视图区域 - 现在占满整个宽度 */}
        <div className="w-full relative">
          <div className="absolute inset-4">
            {viewMode === 'calendar' ? (
              /* 传统日历视图 - 主视图 */
              <>
                <CalendarContainer
                  initialDate={currentTime}
                  initialView="month"
                />
                
                {/* 空状态提示 */}
                {events.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-xl">
                    <Card className="bg-black/80 backdrop-blur-sm border-cyan-500/50 p-8 text-center max-w-md">
                      <div className="text-6xl mb-4">🚀</div>
                      <h3 className="text-xl font-bold text-cyan-300 mb-2">
                        欢迎使用智能日历 v4.0
                      </h3>
                      <p className="text-gray-300 mb-4">
                        全新浮动面板系统！点击右侧图标体验
                      </p>
                      <Button
                        onClick={() => setShowFeatureGuide(true)}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white mb-3"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        查看新功能
                      </Button>
                      <div className="text-sm text-gray-400 text-center">
                        使用 Alt+1-8 快捷键或右侧图标打开面板
                      </div>
                    </Card>
                  </div>
                )}

                {/* 快速操作浮动卡片 - 简化版，不占用太多空间 */}
                <div className="absolute top-4 left-4 z-10">
                  <Card className="bg-black/30 border-white/20 p-3 backdrop-blur-sm">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">🎤</span>
                      <h3 className="text-white font-semibold text-sm">快速创建</h3>
                    </div>
                    <SmartEventCreator />
                  </Card>
                </div>
              </>
            ) : (
              /* 3D时间流视图 - 现在可以使用更大空间 */
              <>
                <div className="w-full h-full rounded-xl bg-black/30 backdrop-blur-sm border border-white/10 overflow-hidden relative">
                  <EnhancedFlowCanvas
                    events={events}
                    currentTime={currentTime}
                    timeRange={{
                      start: new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), 0, 0),
                      end: new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), 23, 59)
                    }}
                    onEventSelect={(event) => {
                      setSelectedEvent(event);
                      selectEvent(event.id);
                    }}
                    onEventDrag={(eventId, newPosition) => {
                      // Event dragged
                    }}
                    riverFlow={{
                      enabled: true,
                      flowSpeed: 1.0,
                      currentTimeCenter: true,
                      rippleEffects: true
                    }}
                    smartInteraction={{
                      dragPreview: true,
                      conflictAvoidance: true,
                      snapToSlots: true,
                      energyOptimization: true
                    }}
                    className="w-full h-full"
                  />
                  
                  {/* 3D视图说明 */}
                  <div className="absolute top-4 left-4">
                    <Card className="bg-black/80 backdrop-blur-sm border-cyan-500/50 p-3">
                      <p className="text-xs text-cyan-300">
                        🌊 3D时间流可视化 • 拖拽旋转 • 滚轮缩放 • 点击选择
                      </p>
                    </Card>
                  </div>
                  
                  {/* 空状态提示 */}
                  {events.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Card className="bg-black/80 backdrop-blur-sm border-cyan-500/50 p-8 text-center max-w-md">
                        <div className="text-6xl mb-4">🌊</div>
                        <h3 className="text-xl font-bold text-cyan-300 mb-2">
                          3D时间流体验
                        </h3>
                        <p className="text-gray-300 mb-4">
                          创建事件后可以在这里体验革命性的3D时间管理方式！
                        </p>
                        <Button
                          variant="outline"
                          className="text-white border-white/20"
                          onClick={() => setViewMode('calendar')}
                        >
                          ← 返回日历视图
                        </Button>
                      </Card>
                    </div>
                  )}
                </div>
                
                {/* 时间流控制器 */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                  <Card className="bg-black/40 backdrop-blur-sm border-white/20 p-4">
                    <div className="text-center mb-3">
                      <p className="text-xs text-gray-400">时间流控制器</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-white border-white/20 hover:bg-white/10"
                        title="回到今天"
                      >
                        ⏮️ 今天
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-white border-white/20 hover:bg-white/10"
                        title="暂停时间流动画"
                      >
                        ⏸️ 暂停
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-white border-white/20 hover:bg-white/10"
                        title="播放时间流动画"
                      >
                        ⏯️ 播放
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-white border-white/20 hover:bg-white/10"
                        title="查看明天"
                      >
                        ⏭️ 明天
                      </Button>
                    </div>
                    <div className="text-center mt-2">
                      <p className="text-xs text-gray-500">使用右侧面板获得更好的规划体验</p>
                    </div>
                  </Card>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* 🚀 新的浮动面板系统 - 替换固定侧边栏 */}
      <FloatingPanelSystem />

      {/* 浮动提示系统 - 保持不变 */}
      <FloatingTips 
        currentView={viewMode === 'flow' ? 'flow-view' : 'calendar'}
        isVisible={true}
      />
      
      {/* v4.0 功能指南弹窗 - 保持不变 */}
      <FeatureGuideModal 
        isOpen={showFeatureGuide}
        onClose={() => setShowFeatureGuide(false)}
      />

      {/* 版本信息和快捷键提示 - 新增 */}
      <div className="fixed bottom-4 left-4 z-10">
        <Card className="bg-black/80 backdrop-blur-sm border-white/20 p-3">
          <div className="text-xs text-gray-400">
            <div className="font-semibold text-cyan-300 mb-1">v4.0 浮动面板系统</div>
            <div>Alt+1-8: 快速打开面板</div>
            <div>ESC: 关闭所有面板</div>
            <div className="text-yellow-300 mt-1">🎯 右侧图标根据时间智能高亮</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

/*
集成说明:

1. 移除了原有的固定侧边栏 (w-96 的那个div)
2. 主内容区域现在使用全宽度，提供更好的视觉体验
3. 添加了 <FloatingPanelSystem /> 组件来提供新的交互方式
4. 在空状态提示中添加了对新功能的介绍
5. 添加了快捷键提示卡片
6. 保留了一个简化的快速创建浮动卡片在日历视图左上角

主要优势:
- 更大的主内容显示区域
- 按需显示的面板，减少界面混乱
- 智能优先级引导，提升用户体验
- 键盘快捷键支持，提高操作效率
- 完全可定制的面板位置和大小
*/