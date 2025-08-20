/**
 * Performance Optimizer Utilities
 * Provides debouncing, throttling, and memoization for performance optimization
 */

import React from 'react'

/**
 * Debounce function execution
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return function debounced(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

/**
 * Throttle function execution
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  
  return function throttled(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

/**
 * Request animation frame wrapper
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null
  
  return function rafThrottled(...args: Parameters<T>) {
    if (rafId) return
    
    rafId = requestAnimationFrame(() => {
      func(...args)
      rafId = null
    })
  }
}

/**
 * Batch state updates
 */
export function batchUpdates<T>(
  updates: Array<() => void>,
  delay: number = 0
): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      updates.forEach(update => update())
      resolve()
    }, delay)
  })
}

/**
 * Lazy load component wrapper
 */
export function lazyWithPreload<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) {
  const Component = React.lazy(importFunc)
  
  // Add preload method
  ;(Component as any).preload = importFunc
  
  return Component
}

/**
 * Check if device has low performance
 */
export function isLowEndDevice(): boolean {
  // Check for reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return true
  }
  
  // Check for device memory (if available)
  const deviceMemory = (navigator as any).deviceMemory
  if (deviceMemory && deviceMemory < 4) {
    return true
  }
  
  // Check for hardware concurrency
  const hardwareConcurrency = navigator.hardwareConcurrency
  if (hardwareConcurrency && hardwareConcurrency < 4) {
    return true
  }
  
  return false
}

/**
 * Optimize render with React.memo comparison
 */
export function shallowEqual(objA: any, objB: any): boolean {
  if (objA === objB) return true
  
  if (!objA || !objB) return false
  
  const keysA = Object.keys(objA)
  const keysB = Object.keys(objB)
  
  if (keysA.length !== keysB.length) return false
  
  for (const key of keysA) {
    if (objA[key] !== objB[key]) return false
  }
  
  return true
}

/**
 * Performance monitor
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private observers: Map<string, PerformanceObserver> = new Map()
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }
  
  measureRender(componentName: string, callback: () => void) {
    performance.mark(`${componentName}-start`)
    callback()
    performance.mark(`${componentName}-end`)
    performance.measure(
      componentName,
      `${componentName}-start`,
      `${componentName}-end`
    )
  }
  
  logMetrics() {
    const entries = performance.getEntriesByType('measure')
    console.table(
      entries.map(entry => ({
        name: entry.name,
        duration: `${entry.duration.toFixed(2)}ms`
      }))
    )
  }
  
  clearMetrics() {
    performance.clearMeasures()
    performance.clearMarks()
  }
}