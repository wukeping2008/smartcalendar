'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  SkipForward,
  HelpCircle,
  Sparkles,
  Target,
  CheckCircle
} from 'lucide-react';
import { warmGuidanceService } from '../../lib/services/WarmGuidanceService';
import {
  GuidanceStep,
  GuidanceTour,
  GuidanceContext,
  TourStatus
} from '../../types/guidance';

interface WarmGuidanceOverlayProps {
  className?: string;
}

export function WarmGuidanceOverlay({ className = '' }: WarmGuidanceOverlayProps) {
  const [context, setContext] = useState<GuidanceContext | null>(null);
  const [currentStep, setCurrentStep] = useState<GuidanceStep | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, percentage: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [highlightElement, setHighlightElement] = useState<HTMLElement | null>(null);

  // 订阅引导服务
  useEffect(() => {
    const unsubscribe = warmGuidanceService.subscribe((newContext) => {
      setContext(newContext);
      
      if (newContext.currentTour) {
        const step = warmGuidanceService.getCurrentStep();
        setCurrentStep(step);
        setProgress(warmGuidanceService.getProgress());
        setIsVisible(true);
        
        // 高亮目标元素
        if (step?.target) {
          const element = document.querySelector(step.target) as HTMLElement;
          setHighlightElement(element);
        } else {
          setHighlightElement(null);
        }
      } else {
        setIsVisible(false);
        setCurrentStep(null);
        setHighlightElement(null);
      }
    });

    return unsubscribe;
  }, []);

  // 处理下一步
  const handleNext = useCallback(async () => {
    await warmGuidanceService.nextStep();
  }, []);

  // 处理上一步
  const handlePrevious = useCallback(async () => {
    await warmGuidanceService.previousStep();
  }, []);

  // 处理跳过
  const handleSkip = useCallback(async () => {
    if (confirm('确定要跳过这个引导吗？您可以随时在帮助中心重新开始。')) {
      await warmGuidanceService.skipTour();
    }
  }, []);

  // 计算提示框位置
  const getTooltipStyle = useCallback(() => {
    if (!highlightElement || !currentStep) {
      return {
        position: 'fixed' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      };
    }

    const rect = highlightElement.getBoundingClientRect();
    const position = currentStep.position || 'bottom';
    
    const styles: React.CSSProperties = {
      position: 'fixed',
      zIndex: 10001
    };

    const offset = 20;
    const tooltipWidth = 400;
    const tooltipHeight = 200;

    switch (position) {
      case 'top':
        styles.bottom = window.innerHeight - rect.top + offset;
        styles.left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        styles.top = rect.bottom + offset;
        styles.left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        styles.top = rect.top + rect.height / 2 - tooltipHeight / 2;
        styles.right = window.innerWidth - rect.left + offset;
        break;
      case 'right':
        styles.top = rect.top + rect.height / 2 - tooltipHeight / 2;
        styles.left = rect.right + offset;
        break;
      case 'center':
        styles.top = '50%';
        styles.left = '50%';
        styles.transform = 'translate(-50%, -50%)';
        break;
    }

    // 确保不超出视口
    if (styles.left && typeof styles.left === 'number') {
      styles.left = Math.max(20, Math.min(styles.left, window.innerWidth - tooltipWidth - 20));
    }
    if (styles.top && typeof styles.top === 'number') {
      styles.top = Math.max(20, Math.min(styles.top, window.innerHeight - tooltipHeight - 20));
    }

    return styles;
  }, [highlightElement, currentStep]);

  if (!isVisible || !currentStep || !context?.currentTour) {
    return null;
  }

  const tour = context.currentTour;
  const isFirstStep = progress.current === 1;
  const isLastStep = progress.current === progress.total;

  return (
    <>
      {/* 遮罩层 */}
      {currentStep.style?.overlay && (
        <div 
          className="fixed inset-0 bg-black/50 z-[9999]"
          onClick={currentStep.skippable ? handleSkip : undefined}
        />
      )}

      {/* 高亮框 */}
      {highlightElement && currentStep.style?.highlight && (
        <div
          className="fixed border-4 border-blue-500 rounded-lg pointer-events-none z-[10000]"
          style={{
            top: highlightElement.getBoundingClientRect().top - 4,
            left: highlightElement.getBoundingClientRect().left - 4,
            width: highlightElement.getBoundingClientRect().width + 8,
            height: highlightElement.getBoundingClientRect().height + 8,
            animation: currentStep.style.animation === 'pulse' 
              ? 'pulse 2s infinite' 
              : currentStep.style.animation === 'bounce'
              ? 'bounce 1s infinite'
              : undefined
          }}
        />
      )}

      {/* 引导提示框 */}
      <div
        className={`w-[400px] bg-white rounded-xl shadow-2xl border border-gray-200 p-6 z-[10001] ${className}`}
        style={getTooltipStyle()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900">{tour.name}</span>
          </div>
          {currentStep.skippable && (
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="跳过引导"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 进度条 */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>步骤 {progress.current} / {progress.total}</span>
            <span>{progress.percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>

        {/* 内容 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {currentStep.title}
          </h3>
          <p className="text-gray-600 leading-relaxed">
            {currentStep.description}
          </p>
        </div>

        {/* 动作提示 */}
        {currentStep.action && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700">
              <Target className="w-4 h-4" />
              <span className="text-sm">
                {currentStep.action.type === 'click' && '点击高亮的元素继续'}
                {currentStep.action.type === 'input' && '输入所需内容'}
                {currentStep.action.type === 'scroll' && '滚动到指定位置'}
                {currentStep.action.type === 'hover' && '将鼠标悬停在元素上'}
              </span>
            </div>
          </div>
        )}

        {/* 底部按钮 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <button
                onClick={handlePrevious}
                className="px-3 py-1.5 text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                上一步
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep.skippable && !isLastStep && (
              <button
                onClick={handleSkip}
                className="px-3 py-1.5 text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1"
              >
                <SkipForward className="w-4 h-4" />
                跳过
              </button>
            )}
            
            {isLastStep ? (
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                完成
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1"
              >
                下一步
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 个性化消息 */}
        {tour.personality?.messages?.encouragement && progress.current > 1 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500 italic">
              {tour.personality.messages.encouragement[
                Math.floor(Math.random() * tour.personality.messages.encouragement.length)
              ]}
            </p>
          </div>
        )}
      </div>

      {/* 帮助按钮 */}
      <button
        className="fixed bottom-6 right-6 w-12 h-12 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors flex items-center justify-center z-[10000]"
        onClick={() => console.log('Open help center')}
        title="帮助中心"
      >
        <HelpCircle className="w-6 h-6" />
      </button>

      {/* 动画样式 */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }
        
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </>
  );
}

export default WarmGuidanceOverlay;