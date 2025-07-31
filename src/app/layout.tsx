import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "秉笔太监智能秘书系统",
  description: "基于3D时间流的智能日历管理系统，支持Trading专业任务和语音创建",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className="font-sans antialiased"
      >
        {children}
      </body>
    </html>
  );
}
