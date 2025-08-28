'use client';

import React, { useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import { 
  X, 
  Minimize2, 
  Maximize2, 
  Pin, 
  PinOff, 
  Move,
  RotateCcw
} from 'lucide-react';
import {
  PanelInstance,
  PanelPosition,
  PanelSize,
  ResizeDirection,
  DragState,
  ResizeState,
  PanelType
} from '../../types/floating-panel';

interface FloatingPanelProps {
  panel: PanelInstance;
  title: string;
  children: ReactNode;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onPin: () => void;
  onUnpin: () => void;
  onMove: (position: PanelPosition) => void;
  onResize: (size: PanelSize) => void;
  onFocus: () => void;
  className?: string;
  isActive?: boolean;
}

export function FloatingPanel({
  panel,
  title,
  children,
  onClose,
  onMinimize,
  onMaximize,
  onPin,
  onUnpin,
  onMove,
  onResize,
  onFocus,
  className = '',
  isActive = false
}: FloatingPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
    offset: { x: 0, y: 0 }
  });
  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    startPosition: { x: 0, y: 0 },
    startSize: { width: 0, height: 0 },
    resizeDirection: ResizeDirection.NONE
  });

  // 处理面板拖拽
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target !== headerRef.current && !headerRef.current?.contains(e.target as Node)) {
      return;
    }

    e.preventDefault();
    onFocus();

    const rect = panelRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDragState({
      isDragging: true,
      startPosition: { x: e.clientX, y: e.clientY },
      currentPosition: { x: e.clientX, y: e.clientY },
      offset: {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
    });
  }, [onFocus]);

  // 处理调整大小
  const handleResizeMouseDown = useCallback((e: React.MouseEvent, direction: ResizeDirection) => {
    e.preventDefault();
    e.stopPropagation();
    onFocus();

    setResizeState({
      isResizing: true,
      startPosition: { x: e.clientX, y: e.clientY },
      startSize: { width: panel.size.width, height: panel.size.height },
      resizeDirection: direction
    });
  }, [onFocus, panel.size]);

  // 鼠标移动处理
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (dragState.isDragging) {
      const newPosition = {
        x: e.clientX - dragState.offset.x,
        y: e.clientY - dragState.offset.y
      };

      // 边界检查 - 考虑头部导航栏高度和边距
      const headerHeight = 70; // 头部导航栏高度
      const minPadding = 10; // 最小边距
      const constrainedPosition = {
        x: Math.max(minPadding, Math.min(newPosition.x, window.innerWidth - panel.size.width - minPadding)),
        y: Math.max(headerHeight, Math.min(newPosition.y, window.innerHeight - panel.size.height - minPadding))
      };

      onMove(constrainedPosition);
    }

    if (resizeState.isResizing) {
      const deltaX = e.clientX - resizeState.startPosition.x;
      const deltaY = e.clientY - resizeState.startPosition.y;
      let newSize = { ...resizeState.startSize };

      switch (resizeState.resizeDirection) {
        case ResizeDirection.E:
          newSize.width = Math.max(300, resizeState.startSize.width + deltaX);
          break;
        case ResizeDirection.W:
          newSize.width = Math.max(300, resizeState.startSize.width - deltaX);
          break;
        case ResizeDirection.S:
          newSize.height = Math.max(200, resizeState.startSize.height + deltaY);
          break;
        case ResizeDirection.N:
          newSize.height = Math.max(200, resizeState.startSize.height - deltaY);
          break;
        case ResizeDirection.SE:
          newSize.width = Math.max(300, resizeState.startSize.width + deltaX);
          newSize.height = Math.max(200, resizeState.startSize.height + deltaY);
          break;
        case ResizeDirection.SW:
          newSize.width = Math.max(300, resizeState.startSize.width - deltaX);
          newSize.height = Math.max(200, resizeState.startSize.height + deltaY);
          break;
        case ResizeDirection.NE:
          newSize.width = Math.max(300, resizeState.startSize.width + deltaX);
          newSize.height = Math.max(200, resizeState.startSize.height - deltaY);
          break;
        case ResizeDirection.NW:
          newSize.width = Math.max(300, resizeState.startSize.width - deltaX);
          newSize.height = Math.max(200, resizeState.startSize.height - deltaY);
          break;
      }

      onResize(newSize);
    }
  }, [dragState, resizeState, onMove, onResize, panel.size]);

  // 鼠标释放处理
  const handleMouseUp = useCallback(() => {
    setDragState(prev => ({ ...prev, isDragging: false }));
    setResizeState(prev => ({ ...prev, isResizing: false }));
  }, []);

  // 事件监听器
  useEffect(() => {
    if (dragState.isDragging || resizeState.isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = dragState.isDragging ? 'grabbing' : getResizeCursor(resizeState.resizeDirection);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
    }
  }, [dragState.isDragging, resizeState.isResizing, handleMouseMove, handleMouseUp, resizeState.resizeDirection]);

  // 获取调整大小时的鼠标样式
  const getResizeCursor = (direction: ResizeDirection): string => {
    switch (direction) {
      case ResizeDirection.N:
      case ResizeDirection.S:
        return 'ns-resize';
      case ResizeDirection.E:
      case ResizeDirection.W:
        return 'ew-resize';
      case ResizeDirection.NE:
      case ResizeDirection.SW:
        return 'nesw-resize';
      case ResizeDirection.NW:
      case ResizeDirection.SE:
        return 'nwse-resize';
      default:
        return 'default';
    }
  };

  // 如果面板被最小化，不渲染
  if (panel.isMinimized) {
    return null;
  }

  return (
    <div
      ref={panelRef}
      className={`fixed bg-gray-900/95 backdrop-blur-sm border border-gray-700/80 rounded-lg shadow-xl overflow-hidden transition-all duration-200 ${
        isActive ? 'shadow-2xl ring-2 ring-blue-500/30 border-blue-500/50' : 'shadow-lg hover:shadow-xl'
      } ${className}`}
      style={{
        left: panel.position.x,
        top: panel.position.y,
        width: panel.size.width,
        height: panel.size.height,
        zIndex: Math.max(panel.zIndex, 50) // 确保最小 z-index 为 50
      }}
      onMouseDown={onFocus}
    >
      {/* 标题栏 */}
      <div
        ref={headerRef}
        className={`flex items-center justify-between px-4 py-2 border-b border-gray-700 cursor-grab active:cursor-grabbing ${
          isActive ? 'bg-blue-900/20' : 'bg-gray-800'
        }`}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <Move className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-100 select-none">
            {title}
          </h3>
          {panel.isPinned && (
            <Pin className="w-3 h-3 text-blue-500" />
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* 钉住/取消钉住按钮 */}
          <button
            onClick={panel.isPinned ? onUnpin : onPin}
            className="p-1 rounded hover:bg-gray-700 transition-colors"
            title={panel.isPinned ? '取消钉住' : '钉住面板'}
          >
            {panel.isPinned ? (
              <PinOff className="w-3 h-3 text-gray-400" />
            ) : (
              <Pin className="w-3 h-3 text-gray-400" />
            )}
          </button>

          {/* 最小化按钮 */}
          <button
            onClick={onMinimize}
            className="p-1 rounded hover:bg-gray-700 transition-colors"
            title="最小化"
          >
            <Minimize2 className="w-3 h-3 text-gray-400" />
          </button>

          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-red-900/30 hover:text-red-400 transition-colors"
            title="关闭"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 面板内容 */}
      <div className="flex-1 overflow-auto p-4 text-gray-100" style={{ height: panel.size.height - 48 }}>
        {children}
      </div>

      {/* 调整大小手柄 */}
      <>
        {/* 边缘手柄 */}
        <div
          className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize"
          onMouseDown={(e) => handleResizeMouseDown(e, ResizeDirection.N)}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-1 cursor-ns-resize"
          onMouseDown={(e) => handleResizeMouseDown(e, ResizeDirection.S)}
        />
        <div
          className="absolute top-0 bottom-0 left-0 w-1 cursor-ew-resize"
          onMouseDown={(e) => handleResizeMouseDown(e, ResizeDirection.W)}
        />
        <div
          className="absolute top-0 bottom-0 right-0 w-1 cursor-ew-resize"
          onMouseDown={(e) => handleResizeMouseDown(e, ResizeDirection.E)}
        />

        {/* 角落手柄 */}
        <div
          className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize"
          onMouseDown={(e) => handleResizeMouseDown(e, ResizeDirection.NW)}
        />
        <div
          className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize"
          onMouseDown={(e) => handleResizeMouseDown(e, ResizeDirection.NE)}
        />
        <div
          className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize"
          onMouseDown={(e) => handleResizeMouseDown(e, ResizeDirection.SW)}
        />
        <div
          className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize"
          onMouseDown={(e) => handleResizeMouseDown(e, ResizeDirection.SE)}
        />
      </>
    </div>
  );
}

export default FloatingPanel;