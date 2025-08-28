'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Menu, X, Calendar, Brain, Clock, CheckSquare, Users } from 'lucide-react'

interface ResponsiveMobileWrapperProps {
  children: React.ReactNode
  className?: string
}

export default function ResponsiveMobileWrapper({ 
  children, 
  className = '' 
}: ResponsiveMobileWrapperProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  // Desktop view - return children as is
  if (!isMobile) {
    return <>{children}</>
  }

  // Mobile view - wrap with mobile-optimized layout
  return (
    <div className={`min-h-screen bg-gray-900 ${className}`}>
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-lg border-b border-gray-700/50">
        <div className="flex items-center justify-between p-3">
          <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            智能日历
          </h1>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-gray-300 hover:text-white"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-gray-900/95 backdrop-blur-lg">
          <div className="p-4 pt-16">
            <nav className="space-y-2">
              <MobileNavItem
                icon={<Calendar className="h-5 w-5" />}
                label="日历视图"
                onClick={() => setIsMenuOpen(false)}
              />
              <MobileNavItem
                icon={<Brain className="h-5 w-5" />}
                label="AI助手"
                onClick={() => setIsMenuOpen(false)}
              />
              <MobileNavItem
                icon={<CheckSquare className="h-5 w-5" />}
                label="GTD任务"
                onClick={() => setIsMenuOpen(false)}
              />
              <MobileNavItem
                icon={<Clock className="h-5 w-5" />}
                label="时间预算"
                onClick={() => setIsMenuOpen(false)}
              />
              <MobileNavItem
                icon={<Users className="h-5 w-5" />}
                label="人脉卡片"
                onClick={() => setIsMenuOpen(false)}
              />
            </nav>
          </div>
        </div>
      )}

      {/* Mobile Content */}
      <main className="pb-16">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-lg border-t border-gray-700/50 z-30">
        <div className="grid grid-cols-4 gap-1 p-2">
          <MobileBottomNavItem
            icon={<Calendar className="h-5 w-5" />}
            label="日历"
            active={true}
          />
          <MobileBottomNavItem
            icon={<CheckSquare className="h-5 w-5" />}
            label="任务"
          />
          <MobileBottomNavItem
            icon={<Brain className="h-5 w-5" />}
            label="AI"
          />
          <MobileBottomNavItem
            icon={<Clock className="h-5 w-5" />}
            label="预算"
          />
        </div>
      </nav>
    </div>
  )
}

// Mobile navigation item component
function MobileNavItem({ 
  icon, 
  label, 
  onClick 
}: { 
  icon: React.ReactNode
  label: string
  onClick?: () => void 
}) {
  return (
    <Button
      variant="ghost"
      className="w-full justify-start gap-3 text-gray-300 hover:text-white hover:bg-gray-800/50"
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </Button>
  )
}

// Mobile bottom navigation item component
function MobileBottomNavItem({ 
  icon, 
  label, 
  active = false 
}: { 
  icon: React.ReactNode
  label: string
  active?: boolean 
}) {
  return (
    <button
      className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
        active 
          ? 'text-cyan-400 bg-cyan-400/10' 
          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
      }`}
    >
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </button>
  )
}