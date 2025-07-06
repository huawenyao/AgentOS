#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
EFIAgent命令行工具

该模块提供了EFIAgent系统的命令行接口，用于启动系统、管理智能体和监控任务。
"""

import os
import sys
import argparse
import json
from typing import Dict, Any, List, Optional
from datetime import datetime
from loguru import logger

from efiagent.config import load_config, Config
from efiagent.agent.base_agent import AgentType


def setup_logger(log_level: str = "INFO") -> None:
    """设置日志记录器
    
    Args:
        log_level: 日志级别
    """
    logger.remove()  # 移除默认处理程序
    logger.add(
        sys.stderr,
        level=log_level,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>"
    )
    logger.add(
        "logs/efiagent_{time:YYYY-MM-DD}.log",
        rotation="00:00",
        retention="7 days",
        level=log_level,
        encoding="utf-8"
    )


def start_system(config_path: Optional[str] = None, debug: bool = False) -> None:
    """启动EFIAgent系统
    
    Args:
        config_path: 配置文件路径
        debug: 是否开启调试模式
    """
    # 加载配置
    config = load_config(config_path)
    if debug:
        config.system.debug = True
        config.system.log_level = "DEBUG"
    
    # 设置日志
    setup_logger(config.system.log_level)
    
    logger.info("正在启动EFIAgent系统...")
    logger.debug(f"系统配置: {config.model_dump_json(indent=2)}")
    
    # TODO: 实现系统启动逻辑
    # 1. 初始化资源调度器
    # 2. 启动规划智能体
    # 3. 启动执行智能体池
    # 4. 启动审核智能体
    # 5. 启动API服务
    
    logger.info("EFIAgent系统已启动")


def create_agent(agent_type: str, name: str, config_path: Optional[str] = None) -> None:
    """创建智能体
    
    Args:
        agent_type: 智能体类型
        name: 智能体名称
        config_path: 配置文件路径
    """
    # 加载配置
    config = load_config(config_path)
    
    # 设置日志
    setup_logger(config.system.log_level)
    
    try:
        # 验证智能体类型
        agent_type_enum = AgentType(agent_type.lower())
        
        logger.info(f"正在创建{agent_type_enum.value}智能体: {name}...")
        
        # TODO: 实现智能体创建逻辑
        # 1. 根据类型创建不同的智能体
        # 2. 注册到资源调度器
        
        logger.info(f"{agent_type_enum.value}智能体 {name} 创建成功")
    except ValueError:
        logger.error(f"无效的智能体类型: {agent_type}")
        print(f"错误: 无效的智能体类型 {agent_type}")
        print(f"有效的智能体类型: {', '.join([t.value for t in AgentType])}")
        sys.exit(1)


def list_agents(config_path: Optional[str] = None) -> None:
    """列出所有智能体
    
    Args:
        config_path: 配置文件路径
    """
    # 加载配置
    config = load_config(config_path)
    
    # 设置日志
    setup_logger(config.system.log_level)
    
    logger.info("正在获取智能体列表...")
    
    # TODO: 实现获取智能体列表的逻辑
    # 从资源调度器获取所有注册的智能体
    
    # 模拟数据
    agents = [
        {"id": "p-001", "name": "主规划智能体", "type": "planning", "status": "idle"},
        {"id": "e-001", "name": "执行智能体1", "type": "execution", "status": "idle"},
        {"id": "e-002", "name": "执行智能体2", "type": "execution", "status": "busy"},
        {"id": "r-001", "name": "审核智能体", "type": "reviewer", "status": "idle"},
    ]
    
    # 打印智能体列表
    print("\n智能体列表:")
    print("-" * 80)
    print(f"{'ID':<10} {'名称':<20} {'类型':<15} {'状态':<10}")
    print("-" * 80)
    for agent in agents:
        print(f"{agent['id']:<10} {agent['name']:<20} {agent['type']:<15} {agent['status']:<10}")
    print("-" * 80)


def submit_task(task_file: str, config_path: Optional[str] = None) -> None:
    """提交任务
    
    Args:
        task_file: 任务文件路径
        config_path: 配置文件路径
    """
    # 加载配置
    config = load_config(config_path)
    
    # 设置日志
    setup_logger(config.system.log_level)
    
    # 检查任务文件是否存在
    if not os.path.exists(task_file):
        logger.error(f"任务文件不存在: {task_file}")
        print(f"错误: 任务文件不存在 {task_file}")
        sys.exit(1)
    
    # 读取任务文件
    try:
        with open(task_file, "r", encoding="utf-8") as f:
            task_data = json.load(f)
    except json.JSONDecodeError:
        logger.error(f"任务文件格式错误: {task_file}")
        print(f"错误: 任务文件必须是有效的JSON格式")
        sys.exit(1)
    
    logger.info(f"正在提交任务: {task_data.get('name', '未命名任务')}...")
    
    # TODO: 实现任务提交逻辑
    # 1. 验证任务数据
    # 2. 提交给规划智能体
    
    # 模拟任务ID
    task_id = f"task-{datetime.now().strftime('%Y%m%d%H%M%S')}"    
    print(f"\n任务已提交，任务ID: {task_id}")


def monitor_task(task_id: str, config_path: Optional[str] = None) -> None:
    """监控任务
    
    Args:
        task_id: 任务ID
        config_path: 配置文件路径
    """
    # 加载配置
    config = load_config(config_path)
    
    # 设置日志
    setup_logger(config.system.log_level)
    
    logger.info(f"正在监控任务: {task_id}...")
    
    # TODO: 实现任务监控逻辑
    # 1. 获取任务状态
    # 2. 获取任务DAG
    # 3. 显示任务进度
    
    # 模拟任务状态
    task_status = {
        "id": task_id,
        "name": "示例任务",
        "status": "running",
        "progress": 60,
        "start_time": "2023-11-01T10:00:00",
        "estimated_end_time": "2023-11-01T11:00:00",
        "nodes": {
            "completed": 3,
            "running": 2,
            "pending": 5,
            "failed": 0
        }
    }
    
    # 打印任务状态
    print("\n任务状态:")
    print("-" * 80)
    print(f"任务ID: {task_status['id']}")
    print(f"任务名称: {task_status['name']}")
    print(f"状态: {task_status['status']}")
    print(f"进度: {task_status['progress']}%")
    print(f"开始时间: {task_status['start_time']}")
    print(f"预计完成时间: {task_status['estimated_end_time']}")
    print(f"节点状态: 已完成({task_status['nodes']['completed']}) 运行中({task_status['nodes']['running']}) 等待中({task_status['nodes']['pending']}) 失败({task_status['nodes']['failed']})")
    print("-" * 80)


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="EFIAgent命令行工具")
    parser.add_argument("--config", "-c", help="配置文件路径")
    
    subparsers = parser.add_subparsers(dest="command", help="子命令")
    
    # 启动系统命令
    start_parser = subparsers.add_parser("start", help="启动EFIAgent系统")
    start_parser.add_argument("--debug", "-d", action="store_true", help="开启调试模式")
    
    # 创建智能体命令
    create_parser = subparsers.add_parser("create-agent", help="创建智能体")
    create_parser.add_argument("--type", "-t", required=True, help="智能体类型")
    create_parser.add_argument("--name", "-n", required=True, help="智能体名称")
    
    # 列出智能体命令
    list_parser = subparsers.add_parser("list-agents", help="列出所有智能体")
    
    # 提交任务命令
    submit_parser = subparsers.add_parser("submit-task", help="提交任务")
    submit_parser.add_argument("--file", "-f", required=True, help="任务文件路径")
    
    # 监控任务命令
    monitor_parser = subparsers.add_parser("monitor-task", help="监控任务")
    monitor_parser.add_argument("--id", "-i", required=True, help="任务ID")
    
    args = parser.parse_args()
    
    if args.command == "start":
        start_system(args.config, args.debug)
    elif args.command == "create-agent":
        create_agent(args.type, args.name, args.config)
    elif args.command == "list-agents":
        list_agents(args.config)
    elif args.command == "submit-task":
        submit_task(args.file, args.config)
    elif args.command == "monitor-task":
        monitor_task(args.id, args.config)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()