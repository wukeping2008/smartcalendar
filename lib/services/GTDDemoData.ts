import { getGTDTaskService } from './GTDTaskService';
import { GTDTask } from '../../types/gtd-task';

export async function initializeGTDDemoData() {
  const taskService = getGTDTaskService();
  
  // 检查是否已有数据
  const existingTasks = taskService.getTasks();
  if (existingTasks.length > 0) {
    return; // 已有数据，不重复初始化
  }

  // 演示任务列表
  const demoTasks = [
    { text: '会议', source: 'manual' as const },
    { text: '写Q4季度报告', source: 'manual' as const },
    { text: '复盘上周交易', source: 'manual' as const },
    { text: '学习Python量化', source: 'manual' as const },
    { text: '与产品经理沟通需求', source: 'manual' as const },
    { text: '整理交易笔记', source: 'manual' as const },
    { text: '等待客户回复合同', source: 'manual' as const },
    { text: '周五8am高铁去上海', source: 'manual' as const },
    { text: '处理邮件', source: 'manual' as const },
    { text: '优化交易策略', source: 'manual' as const }
  ];

  // 批量导入演示任务
  console.log('正在初始化GTD演示数据...');
  for (const task of demoTasks) {
    await taskService.addToInbox(task.text, task.source);
    // 添加小延迟，让处理更自然
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('GTD演示数据初始化完成！');
}