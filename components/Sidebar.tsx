'use client'

import { useState, useEffect } from 'react'

interface SidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
  onSettingsClick: () => void
  onCollapseChange?: (isCollapsed: boolean) => void
}

interface MenuItem {
  id: string
  label: string
  icon: string
}

export default function Sidebar({ activeSection, onSectionChange, onSettingsClick, onCollapseChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  // Load collapsed state from localStorage after hydration
  useEffect(() => {
    setIsHydrated(true)
    const savedState = localStorage.getItem('sidebarCollapsed')
    if (savedState !== null) {
      const collapsed = savedState === 'true'
      setIsCollapsed(collapsed)
      onCollapseChange?.(collapsed)
    }
  }, [onCollapseChange])

  const handleCollapseToggle = () => {
    const newCollapsedState = !isCollapsed
    setIsCollapsed(newCollapsedState)
    localStorage.setItem('sidebarCollapsed', String(newCollapsedState))
    onCollapseChange?.(newCollapsedState)
  }

  const menuItems: MenuItem[] = [
    { 
      id: 'file-upload', 
      label: 'File Upload', 
      icon: '📤'
    },
    { 
      id: 'filters', 
      label: 'Filters', 
      icon: '🔍'
    },
    { 
      id: 'overview', 
      label: 'Overview', 
      icon: '📊'
    },
    { 
      id: 'performance', 
      label: 'Performance', 
      icon: '📈'
    },
    { 
      id: 'analytics', 
      label: 'Advanced Analytics', 
      icon: '🔬'
    },
    { 
      id: 'positions', 
      label: 'Position History', 
      icon: '📋'
    },
    { 
      id: 'ai-insights', 
      label: 'AI Insights', 
      icon: '🤖'
    },
  ]

  const handleSectionChange = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const offset = 100 // Account for any fixed headers
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      })
    }
    onSectionChange(sectionId)
    setIsMobileOpen(false)
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-30 p-2 bg-white dark:bg-dark-elevated rounded-lg shadow-lg border border-gray-200 dark:border-dark-border"
      >
        {isMobileOpen ? '✕' : '☰'}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-10"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`${
          isCollapsed ? 'w-16' : 'w-64'
        } bg-white dark:bg-gradient-to-b dark:from-dark-surface dark:to-dark-elevated border-r border-gray-200 dark:border-dark-border flex flex-col ${
          isHydrated ? 'transition-all duration-300' : ''
        } fixed h-screen z-20 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } overflow-hidden`}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-transparent rounded-full blur-2xl pointer-events-none -z-10"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-500/5 to-transparent rounded-full blur-2xl pointer-events-none -z-10"></div>
      {/* Header */}
      <div className={`p-4 border-b border-gray-200 dark:border-dark-border flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && (
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              My Bet Visualizer
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Event-Contract Analytics
            </p>
          </div>
        )}
        <button
          onClick={handleCollapseToggle}
          className="p-2 hover:bg-gray-100 dark:hover:bg-dark-elevated rounded-lg transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleSectionChange(item.id)}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-2.5 rounded-lg transition-colors ${
              activeSection === item.id
                ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium border border-transparent dark:border-blue-500/20'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-elevated border border-transparent'
            }`}
            title={isCollapsed ? item.label : undefined}
          >
            <span className="text-lg">{item.icon}</span>
            {!isCollapsed && <span className="flex-1 text-left text-sm">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Settings Button */}
      <div className="p-4 border-t border-gray-200 dark:border-dark-border">
        <button
          onClick={onSettingsClick}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-elevated transition-colors`}
          title={isCollapsed ? 'Settings' : undefined}
        >
          <span className="text-xl">⚙️</span>
          {!isCollapsed && <span>Settings</span>}
        </button>
      </div>
    </div>
    </>
  )
}

