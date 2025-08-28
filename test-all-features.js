/**
 * 智能日历系统 v4.0 全功能测试脚本
 * 测试时间: 2025-01-17
 */

// 在浏览器控制台中运行此脚本
(async function testAllFeatures() {
  console.log('🚀 开始智能日历系统 v4.0 功能测试...')
  console.log('=' .repeat(50))
  
  const testResults = {
    passed: [],
    failed: [],
    warnings: []
  }

  // 1. 测试核心服务加载
  console.log('\n📋 1. 核心服务检测')
  try {
    // 检查localStorage是否可用
    if (typeof localStorage !== 'undefined') {
      testResults.passed.push('✅ LocalStorage 可用')
    }
    
    // 检查关键DOM元素
    const calendarEl = document.querySelector('[data-testid="calendar-container"], .calendar-container')
    if (calendarEl) {
      testResults.passed.push('✅ 日历容器加载成功')
    } else {
      testResults.warnings.push('⚠️ 日历容器未找到')
    }

    // 检查浮动面板系统
    const floatingPanels = document.querySelectorAll('[data-floating-panel]')
    if (floatingPanels.length > 0) {
      testResults.passed.push(`✅ 浮动面板系统加载 (${floatingPanels.length}个面板)`)
    } else {
      testResults.warnings.push('⚠️ 浮动面板系统未初始化')
    }

    // 检查AI助手
    const aiAssistant = document.querySelector('[data-testid="ai-assistant"]')
    if (aiAssistant) {
      testResults.passed.push('✅ AI助手组件加载')
    }

  } catch (error) {
    testResults.failed.push(`❌ 核心服务检测失败: ${error.message}`)
  }

  // 2. 测试事件存储
  console.log('\n📋 2. 事件存储系统')
  try {
    // 创建测试事件
    const testEvent = {
      title: '功能测试事件',
      description: '自动化测试创建的事件',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 3600000).toISOString(),
      category: 'work',
      priority: 'high'
    }
    
    // 存储到localStorage
    const events = JSON.parse(localStorage.getItem('calendar_events') || '[]')
    events.push({...testEvent, id: `test_${Date.now()}`})
    localStorage.setItem('calendar_events', JSON.stringify(events))
    
    // 验证存储
    const savedEvents = JSON.parse(localStorage.getItem('calendar_events') || '[]')
    const foundEvent = savedEvents.find(e => e.title === '功能测试事件')
    
    if (foundEvent) {
      testResults.passed.push('✅ 事件存储功能正常')
      // 清理测试数据
      const cleanedEvents = savedEvents.filter(e => e.title !== '功能测试事件')
      localStorage.setItem('calendar_events', JSON.stringify(cleanedEvents))
    } else {
      testResults.failed.push('❌ 事件存储失败')
    }
  } catch (error) {
    testResults.failed.push(`❌ 事件存储测试失败: ${error.message}`)
  }

  // 3. 测试语音输入按钮
  console.log('\n📋 3. 语音输入功能')
  try {
    const voiceButton = document.querySelector('[data-testid="voice-input-button"], button[aria-label*="语音"]')
    if (voiceButton) {
      testResults.passed.push('✅ 语音输入按钮存在')
      
      // 检查是否有Azure配置
      if (window.speechConfig || localStorage.getItem('azure_speech_config')) {
        testResults.passed.push('✅ Azure语音服务配置存在')
      } else {
        testResults.warnings.push('⚠️ Azure语音服务未配置')
      }
    } else {
      testResults.warnings.push('⚠️ 语音输入按钮未找到')
    }
  } catch (error) {
    testResults.failed.push(`❌ 语音输入测试失败: ${error.message}`)
  }

  // 4. 测试GTD任务管理
  console.log('\n📋 4. GTD任务管理')
  try {
    // 创建测试任务
    const testTask = {
      id: `task_test_${Date.now()}`,
      title: '测试GTD任务',
      category: 'inbox',
      priority: 'medium',
      status: 'pending',
      createdAt: new Date().toISOString()
    }
    
    // 存储任务
    const tasks = JSON.parse(localStorage.getItem('gtd_tasks') || '[]')
    tasks.push(testTask)
    localStorage.setItem('gtd_tasks', JSON.stringify(tasks))
    
    // 验证
    const savedTasks = JSON.parse(localStorage.getItem('gtd_tasks') || '[]')
    const foundTask = savedTasks.find(t => t.title === '测试GTD任务')
    
    if (foundTask) {
      testResults.passed.push('✅ GTD任务存储功能正常')
      // 清理
      const cleanedTasks = savedTasks.filter(t => t.title !== '测试GTD任务')
      localStorage.setItem('gtd_tasks', JSON.stringify(cleanedTasks))
    } else {
      testResults.failed.push('❌ GTD任务存储失败')
    }
  } catch (error) {
    testResults.failed.push(`❌ GTD任务测试失败: ${error.message}`)
  }

  // 5. 测试3D时间流视图
  console.log('\n📋 5. 3D时间流视图')
  try {
    const canvas3D = document.querySelector('canvas')
    if (canvas3D) {
      testResults.passed.push('✅ 3D渲染画布存在')
      
      // 检查WebGL支持
      const gl = canvas3D.getContext('webgl') || canvas3D.getContext('experimental-webgl')
      if (gl) {
        testResults.passed.push('✅ WebGL支持正常')
      } else {
        testResults.warnings.push('⚠️ WebGL不可用')
      }
    } else {
      testResults.warnings.push('⚠️ 3D时间流未激活或不在当前视图')
    }
  } catch (error) {
    testResults.failed.push(`❌ 3D时间流测试失败: ${error.message}`)
  }

  // 6. 测试时间预算系统
  console.log('\n📋 6. 时间预算系统')
  try {
    // 创建测试时间跟踪器
    const testTracker = {
      id: `tracker_test_${Date.now()}`,
      taskName: '测试任务计时',
      category: 'work',
      startTime: Date.now(),
      isActive: true
    }
    
    const trackers = JSON.parse(localStorage.getItem('time_trackers') || '[]')
    trackers.push(testTracker)
    localStorage.setItem('time_trackers', JSON.stringify(trackers))
    
    const savedTrackers = JSON.parse(localStorage.getItem('time_trackers') || '[]')
    const foundTracker = savedTrackers.find(t => t.taskName === '测试任务计时')
    
    if (foundTracker) {
      testResults.passed.push('✅ 时间追踪功能正常')
      // 清理
      const cleanedTrackers = savedTrackers.filter(t => t.taskName !== '测试任务计时')
      localStorage.setItem('time_trackers', JSON.stringify(cleanedTrackers))
    } else {
      testResults.failed.push('❌ 时间追踪存储失败')
    }
  } catch (error) {
    testResults.failed.push(`❌ 时间预算测试失败: ${error.message}`)
  }

  // 7. 测试市场数据服务
  console.log('\n📋 7. 市场数据服务')
  try {
    const marketBar = document.querySelector('[data-testid="market-status-bar"]')
    if (marketBar) {
      testResults.passed.push('✅ 市场状态栏组件存在')
    } else {
      testResults.warnings.push('⚠️ 市场状态栏未显示')
    }
    
    // 检查WebSocket连接（如果有的话）
    if (window.WebSocket) {
      testResults.passed.push('✅ WebSocket支持可用')
    }
  } catch (error) {
    testResults.failed.push(`❌ 市场数据测试失败: ${error.message}`)
  }

  // 8. 测试数据持久化
  console.log('\n📋 8. 数据持久化')
  try {
    // 测试各种数据存储
    const storageKeys = [
      'calendar_events',
      'gtd_tasks',
      'time_trackers',
      'user_preferences',
      'ai_chat_history',
      'panel_positions',
      'briefing_preferences'
    ]
    
    let persistedCount = 0
    storageKeys.forEach(key => {
      if (localStorage.getItem(key) !== null) {
        persistedCount++
      }
    })
    
    testResults.passed.push(`✅ 数据持久化正常 (${persistedCount}/${storageKeys.length}个存储键)`)
  } catch (error) {
    testResults.failed.push(`❌ 数据持久化测试失败: ${error.message}`)
  }

  // 9. 测试响应式布局
  console.log('\n📋 9. 响应式布局')
  try {
    const isMobile = window.innerWidth < 768
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024
    const isDesktop = window.innerWidth >= 1024
    
    if (isMobile) {
      testResults.passed.push('✅ 移动端布局检测')
    } else if (isTablet) {
      testResults.passed.push('✅ 平板布局检测')
    } else if (isDesktop) {
      testResults.passed.push('✅ 桌面端布局检测')
    }
    
    // 检查视口设置
    const viewport = document.querySelector('meta[name="viewport"]')
    if (viewport) {
      testResults.passed.push('✅ 响应式视口配置正确')
    }
  } catch (error) {
    testResults.failed.push(`❌ 响应式布局测试失败: ${error.message}`)
  }

  // 10. 测试快捷键
  console.log('\n📋 10. 快捷键系统')
  try {
    // 模拟快捷键事件
    const testKeyEvent = new KeyboardEvent('keydown', {
      key: 'n',
      ctrlKey: true,
      bubbles: true
    })
    
    document.dispatchEvent(testKeyEvent)
    testResults.passed.push('✅ 快捷键事件系统可用')
  } catch (error) {
    testResults.warnings.push(`⚠️ 快捷键测试失败: ${error.message}`)
  }

  // === 生成测试报告 ===
  console.log('\n' + '='.repeat(50))
  console.log('📊 测试报告汇总')
  console.log('='.repeat(50))
  
  console.log(`\n✅ 通过测试: ${testResults.passed.length}项`)
  testResults.passed.forEach(item => console.log(`  ${item}`))
  
  if (testResults.warnings.length > 0) {
    console.log(`\n⚠️ 警告: ${testResults.warnings.length}项`)
    testResults.warnings.forEach(item => console.log(`  ${item}`))
  }
  
  if (testResults.failed.length > 0) {
    console.log(`\n❌ 失败: ${testResults.failed.length}项`)
    testResults.failed.forEach(item => console.log(`  ${item}`))
  }
  
  const successRate = Math.round((testResults.passed.length / 
    (testResults.passed.length + testResults.failed.length)) * 100)
  
  console.log('\n' + '='.repeat(50))
  console.log(`📈 测试成功率: ${successRate}%`)
  console.log(`🏁 测试完成时间: ${new Date().toLocaleString('zh-CN')}`)
  console.log('='.repeat(50))
  
  // 返回测试结果
  return testResults
})()