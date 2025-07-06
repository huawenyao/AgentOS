#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
系统状态监控脚本

该脚本用于监控EFIAgent系统状态，包括智能体状态、任务状态和资源使用情况。
"""

import os
import sys
import time
import argparse
import json
import subprocess
from datetime import datetime

def get_agents_status():
    """获取智能体状态"""
    try:
        result = subprocess.run(["efiagent", "list-agents"], 
                               check=True, capture_output=True, text=True)
        return result.stdout
    except subprocess.CalledProcessError as e:
        return f"获取智能体状态失败: {e.stderr}"

def get_tasks_status():
    """获取任务状态（示例实现）"""
    # 这里应该实现获取所有任务状态的逻辑
    # 由于没有现成的命令，这里只是模拟数据
    return "\n任务状态:\n" + "-" * 80 + "\n" + \
           "运行中任务: 3\n" + \
           "等待中任务: 2\n" + \
           "已完成任务: 10\n" + \
           "失败任务: 1\n" + \
           "-" * 80

def get_resource_usage():
    """获取资源使用情况（示例实现）"""
    # 这里应该实现获取资源使用情况的逻辑
    # 由于没有现成的命令，这里只是模拟数据
    return "\n资源使用情况:\n" + "-" * 80 + "\n" + \
           "CPU使用率: 45%\n" + \
           "内存使用率: 60%\n" + \
           "GPU使用率: 30%\n" + \
           "-" * 80

def main():
    parser = argparse.ArgumentParser(description="系统状态监控")
    parser.add_argument("--interval", "-i", type=int, default=60, 
                        help="监控间隔（秒）")
    parser.add_argument("--count", "-n", type=int, default=0, 
                        help="监控次数（0表示持续监控）")
    args = parser.parse_args()
    
    count = 0
    try:
        while args.count == 0 or count < args.count:
            os.system('cls' if os.name == 'nt' else 'clear')
            print(f"EFIAgent系统状态监控 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print("=" * 80)
            
            # 获取并显示智能体状态
            print(get_agents_status())
            
            # 获取并显示任务状态
            print(get_tasks_status())
            
            # 获取并显示资源使用情况
            print(get_resource_usage())
            
            count += 1
            if args.count == 0 or count < args.count:
                print(f"\n下次更新将在 {args.interval} 秒后...按Ctrl+C退出")
                time.sleep(args.interval)
    except KeyboardInterrupt:
        print("\n监控已停止")

if __name__ == "__main__":
    main()