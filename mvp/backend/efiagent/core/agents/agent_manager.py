"""
智能体管理器
Agent Manager

负责智能体的创建、管理、调度和生命周期
"""

import asyncio
import uuid
from typing import Dict, List, Optional, Any
import logging

from .base_agent import BaseAgent
from .agent_types import PlanningAgent, ExecutionAgent, AuditAgent
from .models import AgentType, AgentStatus, Task, AgentProfile, Capability

class AgentManager:
    """智能体管理器

    职责：
    - 智能体创建和销毁
    - 任务分配和调度
    - 智能体状态监控
    - 资源管理
    """

    def __init__(self, memory_system=None):
        self.memory_system = memory_system
        self.agents: Dict[str, BaseAgent] = {}
        self.agent_profiles: Dict[str, AgentProfile] = {}
        self.task_queue: asyncio.Queue = asyncio.Queue()
        self.running = False

        # 管理器配置
        self.config = {
            'max_agents': 50,
            'default_planning_agents': 2,
            'default_execution_agents': 5,
            'default_audit_agents': 2,
            'task_scheduling_interval': 1.0
        }

        self.logger = logging.getLogger("AgentManager")

    async def initialize(self) -> bool:
        """初始化智能体管理器"""
        try:
            self.logger.info("Initializing Agent Manager...")

            # 创建默认智能体
            await self._create_default_agents()

            # 启动任务调度器
            self.running = True
            asyncio.create_task(self._task_scheduler())

            self.logger.info("Agent Manager initialized successfully")
            return True

        except Exception as e:
            self.logger.error(f"Failed to initialize Agent Manager: {e}")
            return False

    async def create_agent(self,
                          agent_type: AgentType,
                          capabilities: List[Capability] = None,
                          config: Dict[str, Any] = None) -> str:
        """创建新的智能体"""
        try:
            if len(self.agents) >= self.config['max_agents']:
                raise Exception("Maximum agent limit reached")

            agent_id = f"{agent_type.value}_{uuid.uuid4().hex[:8]}"

            # 创建智能体实例
            if agent_type == AgentType.PLANNING:
                agent = PlanningAgent(agent_id, self.memory_system)
            elif agent_type == AgentType.EXECUTION:
                specialty = config.get('specialty', 'general') if config else 'general'
                agent = ExecutionAgent(agent_id, specialty, self.memory_system)
            elif agent_type == AgentType.AUDIT:
                agent = AuditAgent(agent_id, self.memory_system)
            else:
                raise Exception(f"Unsupported agent type: {agent_type}")

            # 初始化智能体
            if await agent.initialize():
                self.agents[agent_id] = agent

                # 创建智能体画像
                profile = AgentProfile(
                    agent_id=agent_id,
                    agent_type=agent_type,
                    capabilities=capabilities or agent.capabilities
                )
                self.agent_profiles[agent_id] = profile

                self.logger.info(f"Created agent {agent_id} of type {agent_type.value}")
                return agent_id
            else:
                raise Exception("Failed to initialize agent")

        except Exception as e:
            self.logger.error(f"Error creating agent: {e}")
            raise

    async def submit_task(self, task: Task) -> str:
        """提交任务到队列"""
        try:
            await self.task_queue.put(task)
            self.logger.info(f"Task {task.id} submitted to queue")
            return task.id

        except Exception as e:
            self.logger.error(f"Error submitting task {task.id}: {e}")
            raise

    async def get_agent_status(self, agent_id: str) -> Dict[str, Any]:
        """获取智能体状态"""
        if agent_id not in self.agents:
            raise Exception(f"Agent {agent_id} not found")

        agent = self.agents[agent_id]
        return await agent.get_status()

    async def get_all_agents_status(self) -> Dict[str, Any]:
        """获取所有智能体状态"""
        status = {}
        for agent_id in self.agents:
            try:
                status[agent_id] = await self.get_agent_status(agent_id)
            except Exception as e:
                self.logger.error(f"Error getting status for agent {agent_id}: {e}")
                status[agent_id] = {"error": str(e)}

        return status

    async def shutdown(self):
        """关闭智能体管理器"""
        try:
            self.logger.info("Shutting down Agent Manager...")
            self.running = False

            # 停止所有智能体
            for agent_id, agent in self.agents.items():
                try:
                    await agent.stop()
                    self.logger.info(f"Agent {agent_id} stopped")
                except Exception as e:
                    self.logger.error(f"Error stopping agent {agent_id}: {e}")

            self.agents.clear()
            self.agent_profiles.clear()

            self.logger.info("Agent Manager shutdown completed")

        except Exception as e:
            self.logger.error(f"Error during shutdown: {e}")

    async def _create_default_agents(self):
        """创建默认智能体"""
        try:
            # 创建规划智能体
            for i in range(self.config['default_planning_agents']):
                await self.create_agent(AgentType.PLANNING)

            # 创建执行智能体
            specialties = ['analyst', 'developer', 'designer', 'general']
            for i in range(self.config['default_execution_agents']):
                specialty = specialties[i % len(specialties)]
                await self.create_agent(
                    AgentType.EXECUTION,
                    config={'specialty': specialty}
                )

            # 创建审核智能体
            for i in range(self.config['default_audit_agents']):
                await self.create_agent(AgentType.AUDIT)

            self.logger.info(f"Created {len(self.agents)} default agents")

        except Exception as e:
            self.logger.error(f"Error creating default agents: {e}")
            raise

    async def _task_scheduler(self):
        """任务调度器"""
        while self.running:
            try:
                # 从队列获取任务
                task = await asyncio.wait_for(
                    self.task_queue.get(),
                    timeout=self.config['task_scheduling_interval']
                )

                # 分配任务给合适的智能体
                await self._assign_task(task)

            except asyncio.TimeoutError:
                # 队列为空，继续等待
                continue
            except Exception as e:
                self.logger.error(f"Error in task scheduler: {e}")

    async def _assign_task(self, task: Task):
        """分配任务给智能体"""
        try:
            # 寻找合适的智能体
            suitable_agents = await self._find_suitable_agents(task)

            if not suitable_agents:
                self.logger.warning(f"No suitable agents found for task {task.id}")
                task.status = TaskStatus.FAILED
                task.error_message = "No suitable agents available"
                return

            # 选择最佳智能体（负载最低的）
            best_agent_id = min(
                suitable_agents,
                key=lambda agent_id: len(self.agents[agent_id].current_tasks)
            )

            best_agent = self.agents[best_agent_id]

            # 提交任务给智能体
            self.logger.info(f"Assigning task {task.id} to agent {best_agent_id}")
            asyncio.create_task(best_agent.process_task(task))

        except Exception as e:
            self.logger.error(f"Error assigning task {task.id}: {e}")
            task.status = TaskStatus.FAILED
            task.error_message = str(e)

    async def _find_suitable_agents(self, task: Task) -> List[str]:
        """寻找适合处理任务的智能体"""
        suitable_agents = []

        for agent_id, agent in self.agents.items():
            # 检查智能体状态
            if agent.status != AgentStatus.IDLE:
                continue

            # 检查能力匹配
            if await agent._can_handle_task(task):
                suitable_agents.append(agent_id)

        return suitable_agents