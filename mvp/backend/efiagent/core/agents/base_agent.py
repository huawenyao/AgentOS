"""
基础智能体类
Base Agent Class

所有智能体的基类，定义通用接口和行为
"""

import asyncio
import time
import uuid
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any, Callable
from datetime import datetime
import logging

from .models import (
    AgentType, AgentStatus, Task, TaskStatus, Message, MessageType,
    AgentProfile, AgentMetrics, Capability
)
from ..memory.memory_system import ThreeLayerMemorySystem

class BaseAgent(ABC):
    """基础智能体抽象类

    所有智能体都应继承此类并实现必要的抽象方法
    """

    def __init__(self,
                 agent_id: str,
                 agent_type: AgentType,
                 capabilities: List[Capability],
                 memory_system: Optional[ThreeLayerMemorySystem] = None,
                 max_concurrent_tasks: int = 5):

        self.agent_id = agent_id
        self.agent_type = agent_type
        self.capabilities = capabilities
        self.memory_system = memory_system
        self.max_concurrent_tasks = max_concurrent_tasks

        # 状态管理
        self.status = AgentStatus.INITIALIZING
        self.current_tasks: Dict[str, Task] = {}
        self.completed_tasks: List[Task] = []
        self.message_handlers: Dict[MessageType, Callable] = {}

        # 性能指标
        self.metrics = AgentMetrics(agent_id=agent_id)

        # 配置
        self.config = {
            'heartbeat_interval': 30.0,
            'task_timeout': 300.0,
            'max_retries': 3,
            'retry_delay': 1.0
        }

        # 日志
        self.logger = logging.getLogger(f"Agent.{agent_id}")

        # 事件循环
        self._running = False
        self._background_tasks = []

        # 注册默认消息处理器
        self._register_default_handlers()

    async def initialize(self) -> bool:
        """初始化智能体"""
        try:
            self.logger.info(f"Initializing agent {self.agent_id}")

            # 执行子类特定的初始化
            await self._on_initialize()

            # 启动后台任务
            await self._start_background_tasks()

            self.status = AgentStatus.IDLE
            self.logger.info(f"Agent {self.agent_id} initialized successfully")

            return True

        except Exception as e:
            self.logger.error(f"Failed to initialize agent {self.agent_id}: {e}")
            self.status = AgentStatus.ERROR
            return False

    async def start(self) -> bool:
        """启动智能体"""
        if self.status == AgentStatus.OFFLINE:
            success = await self.initialize()
            if not success:
                return False

        self._running = True
        self.status = AgentStatus.IDLE

        self.logger.info(f"Agent {self.agent_id} started")
        return True

    async def stop(self):
        """停止智能体"""
        self.logger.info(f"Stopping agent {self.agent_id}")

        self._running = False

        # 取消所有后台任务
        for task in self._background_tasks:
            task.cancel()

        # 等待当前任务完成或超时
        if self.current_tasks:
            self.logger.warning(f"Agent {self.agent_id} has {len(self.current_tasks)} active tasks")

        self.status = AgentStatus.OFFLINE
        self.logger.info(f"Agent {self.agent_id} stopped")

    async def process_task(self, task: Task) -> Task:
        """处理任务的主要接口"""
        try:
            # 检查能力匹配
            if not await self._can_handle_task(task):
                task.status = TaskStatus.FAILED
                task.error_message = "Agent lacks required capabilities"
                return task

            # 检查并发限制
            if len(self.current_tasks) >= self.max_concurrent_tasks:
                task.status = TaskStatus.FAILED
                task.error_message = "Agent at maximum capacity"
                return task

            # 分配任务
            task.assigned_agent_id = self.agent_id
            task.status = TaskStatus.RUNNING
            task.started_at = datetime.now()
            self.current_tasks[task.id] = task

            self.status = AgentStatus.BUSY
            start_time = time.time()

            try:
                # 存储任务到记忆系统
                if self.memory_system:
                    await self.memory_system.store_experience(
                        content=f"Starting task: {task.name}",
                        importance=0.7,
                        context={
                            'task_id': task.id,
                            'task_type': task.task_type,
                            'agent_id': self.agent_id
                        }
                    )

                # 执行任务（由子类实现）
                result = await self._execute_task(task)

                # 任务完成
                task.status = TaskStatus.COMPLETED
                task.completed_at = datetime.now()
                task.output_data = result

                # 更新指标
                duration = time.time() - start_time
                self._update_metrics(True, duration)

                # 存储完成记忆
                if self.memory_system:
                    await self.memory_system.store_experience(
                        content=f"Completed task: {task.name}",
                        importance=0.8,
                        context={
                            'task_id': task.id,
                            'duration': duration,
                            'success': True,
                            'agent_id': self.agent_id
                        }
                    )

                self.logger.info(f"Task {task.id} completed successfully")

            except Exception as e:
                # 任务失败
                task.status = TaskStatus.FAILED
                task.error_message = str(e)
                task.completed_at = datetime.now()

                duration = time.time() - start_time
                self._update_metrics(False, duration)

                # 存储失败记忆
                if self.memory_system:
                    await self.memory_system.store_experience(
                        content=f"Failed task: {task.name} - {str(e)}",
                        importance=0.6,
                        context={
                            'task_id': task.id,
                            'error': str(e),
                            'duration': duration,
                            'success': False,
                            'agent_id': self.agent_id
                        }
                    )

                self.logger.error(f"Task {task.id} failed: {e}")

            finally:
                # 清理
                if task.id in self.current_tasks:
                    del self.current_tasks[task.id]
                self.completed_tasks.append(task)

                # 更新状态
                if not self.current_tasks:
                    self.status = AgentStatus.IDLE

            return task

        except Exception as e:
            self.logger.error(f"Unexpected error processing task {task.id}: {e}")
            task.status = TaskStatus.FAILED
            task.error_message = f"Unexpected error: {str(e)}"
            return task

    async def send_message(self, message: Message) -> bool:
        """发送消息"""
        try:
            # 这里应该通过消息总线发送
            # 在MVP版本中，我们简化处理
            self.logger.debug(f"Sending message {message.id} to {message.receiver_id}")
            return True

        except Exception as e:
            self.logger.error(f"Failed to send message {message.id}: {e}")
            return False

    async def receive_message(self, message: Message) -> bool:
        """接收并处理消息"""
        try:
            self.logger.debug(f"Received message {message.id} from {message.sender_id}")

            # 查找消息处理器
            handler = self.message_handlers.get(message.message_type)
            if handler:
                await handler(message)
                return True
            else:
                self.logger.warning(f"No handler for message type: {message.message_type}")
                return False

        except Exception as e:
            self.logger.error(f"Failed to process message {message.id}: {e}")
            return False

    async def get_capabilities(self) -> List[Capability]:
        """获取智能体能力列表"""
        return self.capabilities.copy()

    async def get_status(self) -> Dict[str, Any]:
        """获取智能体状态"""
        return {
            'agent_id': self.agent_id,
            'agent_type': self.agent_type.value,
            'status': self.status.value,
            'current_tasks': len(self.current_tasks),
            'completed_tasks': len(self.completed_tasks),
            'metrics': {
                'tasks_completed': self.metrics.tasks_completed,
                'tasks_failed': self.metrics.tasks_failed,
                'success_rate': self.metrics.success_rate,
                'average_duration': self.metrics.average_task_duration
            },
            'capabilities': [cap.name for cap in self.capabilities]
        }

    # 抽象方法，必须由子类实现
    @abstractmethod
    async def _execute_task(self, task: Task) -> Dict[str, Any]:
        """执行任务的具体逻辑（子类必须实现）"""
        pass

    @abstractmethod
    async def _on_initialize(self):
        """初始化时的自定义逻辑（子类可选实现）"""
        pass

    # 受保护的辅助方法
    async def _can_handle_task(self, task: Task) -> bool:
        """检查是否能处理指定任务"""
        required_caps = set(task.required_capabilities)
        available_caps = set(cap.id for cap in self.capabilities)
        return required_caps.issubset(available_caps)

    def _update_metrics(self, success: bool, duration: float):
        """更新性能指标"""
        if success:
            self.metrics.tasks_completed += 1
        else:
            self.metrics.tasks_failed += 1

        total_tasks = self.metrics.tasks_completed + self.metrics.tasks_failed
        if total_tasks > 0:
            self.metrics.success_rate = self.metrics.tasks_completed / total_tasks

        # 更新平均持续时间
        completed_duration = (self.metrics.average_task_duration * (self.metrics.tasks_completed - 1) + duration)
        self.metrics.average_task_duration = completed_duration / self.metrics.tasks_completed

        self.metrics.last_updated = datetime.now()

    def _register_default_handlers(self):
        """注册默认消息处理器"""
        self.message_handlers[MessageType.HEARTBEAT] = self._handle_heartbeat
        self.message_handlers[MessageType.STATUS_UPDATE] = self._handle_status_update
        self.message_handlers[MessageType.TASK_REQUEST] = self._handle_task_request

    async def _handle_heartbeat(self, message: Message):
        """处理心跳消息"""
        response = Message(
            sender_id=self.agent_id,
            receiver_id=message.sender_id,
            message_type=MessageType.STATUS_UPDATE,
            payload={'status': self.status.value, 'timestamp': datetime.now()}
        )
        await self.send_message(response)

    async def _handle_status_update(self, message: Message):
        """处理状态更新消息"""
        self.logger.debug(f"Received status update from {message.sender_id}")

    async def _handle_task_request(self, message: Message):
        """处理任务请求消息"""
        task_data = message.payload.get('task')
        if task_data:
            task = Task(**task_data)
            # 异步处理任务
            asyncio.create_task(self.process_task(task))

    async def _start_background_tasks(self):
        """启动后台任务"""
        # 心跳任务
        heartbeat_task = asyncio.create_task(self._heartbeat_loop())
        self._background_tasks.append(heartbeat_task)

        # 记忆维护任务
        if self.memory_system:
            memory_task = asyncio.create_task(self._memory_maintenance_loop())
            self._background_tasks.append(memory_task)

    async def _heartbeat_loop(self):
        """心跳循环"""
        while self._running:
            try:
                await asyncio.sleep(self.config['heartbeat_interval'])
                # 心跳逻辑可以在这里实现
            except asyncio.CancelledError:
                break
            except Exception as e:
                self.logger.error(f"Error in heartbeat loop: {e}")

    async def _memory_maintenance_loop(self):
        """记忆维护循环"""
        while self._running and self.memory_system:
            try:
                await asyncio.sleep(600)  # 每10分钟检查一次
                # 记忆维护逻辑
                await self.memory_system.consolidate_memories()
            except asyncio.CancelledError:
                break
            except Exception as e:
                self.logger.error(f"Error in memory maintenance loop: {e}")