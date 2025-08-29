'use client'

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-4">测试页面</h1>
      <p>如果你能看到这个页面，说明Next.js运行正常。</p>
      <div className="mt-8 p-4 bg-gray-800 rounded">
        <h2 className="text-xl mb-2">系统状态</h2>
        <ul className="list-disc list-inside">
          <li>Next.js: ✅ 运行中</li>
          <li>React: ✅ 工作正常</li>
          <li>Tailwind CSS: ✅ 样式加载</li>
        </ul>
      </div>
    </div>
  )
}