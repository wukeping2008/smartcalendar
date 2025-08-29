/**
 * 统一的面板功能指南组件
 * 为所有浮动面板提供一致的帮助体验
 */

'use client'

import React from 'react'
import { Card } from '../../src/components/ui/card'
import { Button } from '../../src/components/ui/button'
import {
  HelpCircle,
  X,
  Keyboard,
  Lightbulb,
  ChevronRight,
  Info
} from 'lucide-react'

export interface GuideSection {
  title: string
  items: string[]
  icon?: React.ReactNode
}

export interface PanelGuideProps {
  title: string
  description: string
  sections: GuideSection[]
  shortcuts?: { key: string; action: string }[]
  tips?: string[]
  isOpen: boolean
  onClose: () => void
  className?: string
}

export function PanelGuide({
  title,
  description,
  sections,
  shortcuts,
  tips,
  isOpen,
  onClose,
  className = ''
}: PanelGuideProps) {
  if (!isOpen) return null

  return (
    <div className={`absolute top-12 right-2 z-50 w-80 ${className}`}>
      <Card className="bg-gray-900/95 backdrop-blur-sm border-gray-700 shadow-2xl">
        {/* 头部 */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold text-white">{title}</h3>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="h-6 w-6 p-0 hover:bg-gray-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-400 mt-2">{description}</p>
        </div>

        {/* 功能区块 */}
        <div className="p-4 space-y-4">
          {sections.map((section, idx) => (
            <div key={idx}>
              <div className="flex items-center gap-2 mb-2">
                {section.icon || <ChevronRight className="w-4 h-4 text-gray-500" />}
                <h4 className="text-sm font-medium text-gray-300">{section.title}</h4>
              </div>
              <ul className="space-y-1 ml-6">
                {section.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="text-xs text-gray-400 flex items-start">
                    <span className="mr-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* 快捷键区域 */}
          {shortcuts && shortcuts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Keyboard className="w-4 h-4 text-gray-500" />
                <h4 className="text-sm font-medium text-gray-300">快捷键</h4>
              </div>
              <div className="space-y-1 ml-6">
                {shortcuts.map((shortcut, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">{shortcut.action}</span>
                    <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-300 font-mono">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 提示区域 */}
          {tips && tips.length > 0 && (
            <div className="pt-3 border-t border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                <h4 className="text-sm font-medium text-gray-300">专业提示</h4>
              </div>
              <ul className="space-y-1 ml-6">
                {tips.map((tip, idx) => (
                  <li key={idx} className="text-xs text-yellow-400/80">
                    💡 {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* 底部 */}
        <div className="px-4 py-2 bg-gray-800/50 rounded-b-lg">
          <p className="text-xs text-gray-500 text-center">
            按 ESC 关闭帮助
          </p>
        </div>
      </Card>
    </div>
  )
}

/**
 * 面板帮助按钮 - 统一的触发器
 */
export function PanelHelpButton({
  onClick,
  className = ''
}: {
  onClick: () => void
  className?: string
}) {
  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={onClick}
      className={`h-7 w-7 p-0 hover:bg-gray-800 ${className}`}
      title="功能指南"
    >
      <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-200" />
    </Button>
  )
}