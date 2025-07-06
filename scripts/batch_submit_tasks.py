#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
批量提交任务脚本

该脚本用于批量提交任务文件夹中的所有任务。
"""

import os
import sys
import argparse
import subprocess
from glob import glob

def main():
    parser = argparse.ArgumentParser(description="批量提交任务")
    parser.add_argument("--dir", "-d", required=True, help="任务文件夹路径")
    parser.add_argument("--config", "-c", help="配置文件路径")
    args = parser.parse_args()
    
    # 检查文件夹是否存在
    if not os.path.isdir(args.dir):
        print(f"错误: 文件夹不存在 {args.dir}")
        sys.exit(1)
    
    # 获取所有JSON文件
    task_files = glob(os.path.join(args.dir, "*.json"))
    if not task_files:
        print(f"错误: 文件夹中没有JSON任务文件 {args.dir}")
        sys.exit(1)
    
    # 批量提交任务
    success_count = 0
    for task_file in task_files:
        cmd = ["efiagent", "submit-task", "--file", task_file]
        if args.config:
            cmd.extend(["--config", args.config])
        
        try:
            result = subprocess.run(cmd, check=True, capture_output=True, text=True)
            print(f"成功提交任务: {os.path.basename(task_file)}")
            print(result.stdout)
            success_count += 1
        except subprocess.CalledProcessError as e:
            print(f"提交任务失败: {os.path.basename(task_file)}")
            print(e.stderr)
    
    print(f"\n总结: 成功提交 {success_count}/{len(task_files)} 个任务")

if __name__ == "__main__":
    main()