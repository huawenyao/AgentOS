"""记忆智能体模块

该模块实现了记忆智能体，负责状态同步和经验复用，
使用分布式记忆体架构管理工作记忆、短期记忆和长期记忆。
"""

import json
import time
from typing import Dict, List, Any, Optional, Set, Tuple, Union
from datetime import datetime
from pydantic import BaseModel, Field
from loguru import logger

from efiagent.agent.base_agent import BaseAgent, AgentType
from efiagent.core.memory import (
    MemoryManager, MemoryLevel, MemoryType, MemoryEntry, VectorClock
)
from efiagent.core.communication import (
    Message, MessageType, MessagePriority, MessageBroker
)
from efiagent.core.task_dag import TaskNode, TaskStatus
from efiagent.core.ontology import DynamicOntology


class MemoryAgent(BaseAgent):
    """记忆智能体
    
    负责状态同步和经验复用，管理分布式记忆体系统
    """
    def __init__(self, agent_id: str, config: Dict[str, Any] = None):
        """初始化记忆智能体
        
        Args:
            agent_id: 智能体ID
            config: 配置字典
        """
        super().__init__(agent_id, AgentType.MEMORY)
        self.config = config or {}
        
        # 初始化记忆管理器
        self.memory_manager = MemoryManager(self.config.get("memory", {}))
        
        # 初始化消息代理
        self.message_broker = MessageBroker()
        self.message_broker.subscribe(MessageType.MEMORY_SYNC, self._handle_memory_sync)
        self.message_broker.subscribe(MessageType.MEMORY_QUERY, self._handle_memory_query)
        self.message_broker.subscribe(MessageType.STATE_SNAPSHOT, self._handle_state_snapshot)
        
        # 初始化动态本体库（用于知识映射）
        self.ontology = DynamicOntology()
        
        # 记忆冲突解决策略
        self.memory_manager.set_conflict_resolver(self._resolve_memory_conflict)
        
        # 同步间隔（秒）
        self.sync_interval = self.config.get("sync_interval", 60)
        self.last_sync_time = time.time()
        
        logger.info(f"记忆智能体 {agent_id} 初始化完成")
    
    def observe(self, observation: Dict[str, Any]) -> Dict[str, Any]:
        """观察环境
        
        处理来自环境的观察，更新记忆
        
        Args:
            observation: 观察字典
            
        Returns:
            Dict[str, Any]: 处理后的观察
        """
        # 更新工作记忆
        if "task_context" in observation:
            self.memory_manager.set(
                key=f"context:{self.context.task_id}",
                value=observation["task_context"],
                level=MemoryLevel.WORKING,
                type=MemoryType.TASK_CONTEXT,
                agent_id=self.id,
                ttl=3600  # 1小时过期
            )
        
        # 检查是否需要同步记忆
        current_time = time.time()
        if current_time - self.last_sync_time > self.sync_interval:
            self._sync_memory()
            self.last_sync_time = current_time
        
        return observation
    
    def act(self, action_type: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """执行动作
        
        Args:
            action_type: 动作类型
            params: 动作参数
            
        Returns:
            Dict[str, Any]: 动作结果
        """
        params = params or {}
        
        if action_type == "store_memory":
            return self._store_memory(params)
        elif action_type == "retrieve_memory":
            return self._retrieve_memory(params)
        elif action_type == "create_snapshot":
            return self._create_snapshot(params)
        elif action_type == "restore_snapshot":
            return self._restore_snapshot(params)
        elif action_type == "store_knowledge":
            return self._store_knowledge(params)
        elif action_type == "retrieve_knowledge":
            return self._retrieve_knowledge(params)
        else:
            logger.warning(f"未知动作类型: {action_type}")
            return {"success": False, "error": f"未知动作类型: {action_type}"}
    
    def _store_memory(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """存储记忆
        
        Args:
            params: 参数字典，包含key、value、level、type、ttl等
            
        Returns:
            Dict[str, Any]: 结果字典
        """
        try:
            key = params.get("key")
            value = params.get("value")
            level_str = params.get("level", "working")
            type_str = params.get("type", "task_context")
            ttl = params.get("ttl")
            metadata = params.get("metadata", {})
            
            if not key or value is None:
                return {"success": False, "error": "缺少必要参数: key, value"}
            
            # 转换枚举类型
            try:
                level = MemoryLevel(level_str)
                memory_type = MemoryType(type_str)
            except ValueError:
                return {"success": False, "error": f"无效的记忆层级或类型: {level_str}, {type_str}"}
            
            # 存储记忆
            entry_id = self.memory_manager.set(
                key=key,
                value=value,
                level=level,
                type=memory_type,
                agent_id=self.id,
                ttl=ttl,
                metadata=metadata
            )
            
            return {"success": True, "entry_id": entry_id}
        except Exception as e:
            logger.error(f"存储记忆失败: {e}")
            return {"success": False, "error": str(e)}
    
    def _retrieve_memory(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """检索记忆
        
        Args:
            params: 参数字典，包含key、level等
            
        Returns:
            Dict[str, Any]: 结果字典
        """
        try:
            key = params.get("key")
            level_str = params.get("level")
            
            if not key:
                return {"success": False, "error": "缺少必要参数: key"}
            
            # 转换枚举类型
            level = None
            if level_str:
                try:
                    level = MemoryLevel(level_str)
                except ValueError:
                    return {"success": False, "error": f"无效的记忆层级: {level_str}"}
            
            # 检索记忆
            entry = self.memory_manager.get(key, level)
            
            if entry is None:
                return {"success": False, "error": f"记忆不存在: {key}"}
            
            return {
                "success": True,
                "entry": {
                    "id": entry.id,
                    "key": entry.key,
                    "value": entry.value,
                    "level": entry.level.value,
                    "type": entry.type.value,
                    "agent_id": entry.agent_id,
                    "created_at": entry.created_at.isoformat(),
                    "expires_at": entry.expires_at.isoformat() if entry.expires_at else None,
                    "metadata": entry.metadata
                }
            }
        except Exception as e:
            logger.error(f"检索记忆失败: {e}")
            return {"success": False, "error": str(e)}
    
    def _create_snapshot(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """创建状态快照
        
        Args:
            params: 参数字典，包含task_id、state等
            
        Returns:
            Dict[str, Any]: 结果字典
        """
        try:
            task_id = params.get("task_id")
            state = params.get("state")
            ttl = params.get("ttl", 3600)  # 默认1小时
            
            if not task_id or state is None:
                return {"success": False, "error": "缺少必要参数: task_id, state"}
            
            # 创建快照
            snapshot_id = self.memory_manager.create_snapshot(
                task_id=task_id,
                agent_id=self.id,
                state=state,
                ttl=ttl
            )
            
            # 广播快照消息
            self._broadcast_snapshot(task_id, snapshot_id)
            
            return {"success": True, "snapshot_id": snapshot_id}
        except Exception as e:
            logger.error(f"创建快照失败: {e}")
            return {"success": False, "error": str(e)}
    
    def _restore_snapshot(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """恢复状态快照
        
        Args:
            params: 参数字典，包含task_id等
            
        Returns:
            Dict[str, Any]: 结果字典
        """
        try:
            task_id = params.get("task_id")
            snapshot_id = params.get("snapshot_id")
            
            if not task_id:
                return {"success": False, "error": "缺少必要参数: task_id"}
            
            # 如果指定了快照ID，则获取特定快照
            if snapshot_id:
                entry = self.memory_manager.get(snapshot_id)
                if entry is None or entry.type != MemoryType.STATE_SNAPSHOT:
                    return {"success": False, "error": f"快照不存在: {snapshot_id}"}
                state = entry.value
            else:
                # 否则获取最新快照
                state = self.memory_manager.get_latest_snapshot(task_id)
            
            if state is None:
                return {"success": False, "error": f"任务没有可用快照: {task_id}"}
            
            return {"success": True, "state": state}
        except Exception as e:
            logger.error(f"恢复快照失败: {e}")
            return {"success": False, "error": str(e)}
    
    def _store_knowledge(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """存储领域知识
        
        Args:
            params: 参数字典，包含key、knowledge、domains等
            
        Returns:
            Dict[str, Any]: 结果字典
        """
        try:
            key = params.get("key")
            knowledge = params.get("knowledge")
            domains = params.get("domains", [])
            metadata = params.get("metadata", {})
            
            if not key or knowledge is None:
                return {"success": False, "error": "缺少必要参数: key, knowledge"}
            
            # 存储领域知识
            entry_id = self.memory_manager.store_domain_knowledge(
                key=key,
                knowledge=knowledge,
                domains=domains,
                metadata=metadata
            )
            
            return {"success": True, "entry_id": entry_id}
        except Exception as e:
            logger.error(f"存储领域知识失败: {e}")
            return {"success": False, "error": str(e)}
    
    def _retrieve_knowledge(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """检索领域知识
        
        Args:
            params: 参数字典，包含key或domain
            
        Returns:
            Dict[str, Any]: 结果字典
        """
        try:
            key = params.get("key")
            domain = params.get("domain")
            limit = params.get("limit", 10)
            
            if key:
                # 按键检索
                knowledge = self.memory_manager.get_domain_knowledge(key)
                if knowledge is None:
                    return {"success": False, "error": f"领域知识不存在: {key}"}
                return {"success": True, "knowledge": knowledge}
            elif domain:
                # 按领域检索
                results = self.memory_manager.query_domain_knowledge(domain, limit)
                return {"success": True, "results": results}
            else:
                return {"success": False, "error": "缺少必要参数: key或domain"}
        except Exception as e:
            logger.error(f"检索领域知识失败: {e}")
            return {"success": False, "error": str(e)}
    
    def _handle_memory_sync(self, message: Message) -> None:
        """处理记忆同步消息
        
        Args:
            message: 消息对象
        """
        try:
            data = message.payload.content
            if not isinstance(data, dict):
                logger.warning(f"无效的记忆同步消息: {data}")
                return
            
            # 提取向量时钟
            if "vector_clock" in data:
                vector_clock = VectorClock(**data["vector_clock"])
                self.memory_manager.sync_vector_clock(vector_clock)
            
            # 处理记忆条目
            if "entries" in data and isinstance(data["entries"], list):
                for entry_data in data["entries"]:
                    try:
                        entry = MemoryEntry.from_dict(entry_data)
                        
                        # 根据记忆层级存储
                        if entry.level == MemoryLevel.WORKING:
                            self.memory_manager.working_memory.set(entry)
                        elif entry.level == MemoryLevel.SHORT_TERM:
                            self.memory_manager.short_term_memory.set(entry)
                        elif entry.level == MemoryLevel.LONG_TERM:
                            self.memory_manager.long_term_memory.set(entry)
                    except Exception as e:
                        logger.error(f"处理记忆条目失败: {e}")
            
            # 发送确认消息
            self._send_sync_ack(message.header.sender_id)
        except Exception as e:
            logger.error(f"处理记忆同步消息失败: {e}")
    
    def _handle_memory_query(self, message: Message) -> None:
        """处理记忆查询消息
        
        Args:
            message: 消息对象
        """
        try:
            data = message.payload.content
            if not isinstance(data, dict):
                logger.warning(f"无效的记忆查询消息: {data}")
                return
            
            query_type = data.get("query_type")
            query_params = data.get("params", {})
            
            result = {"query_id": data.get("query_id"), "success": False}
            
            if query_type == "get":
                key = query_params.get("key")
                level_str = query_params.get("level")
                
                level = None
                if level_str:
                    try:
                        level = MemoryLevel(level_str)
                    except ValueError:
                        result["error"] = f"无效的记忆层级: {level_str}"
                        self._send_query_response(message.header.sender_id, result)
                        return
                
                entry = self.memory_manager.get(key, level)
                if entry:
                    result["success"] = True
                    result["entry"] = entry.to_dict()
                else:
                    result["error"] = f"记忆不存在: {key}"
            
            elif query_type == "list":
                prefix = query_params.get("prefix", "")
                level_str = query_params.get("level")
                
                level = None
                if level_str:
                    try:
                        level = MemoryLevel(level_str)
                    except ValueError:
                        result["error"] = f"无效的记忆层级: {level_str}"
                        self._send_query_response(message.header.sender_id, result)
                        return
                
                keys = self.memory_manager.list_keys(prefix, level)
                result["success"] = True
                result["keys"] = keys
            
            elif query_type == "get_snapshot":
                task_id = query_params.get("task_id")
                if task_id:
                    state = self.memory_manager.get_latest_snapshot(task_id)
                    if state:
                        result["success"] = True
                        result["state"] = state
                    else:
                        result["error"] = f"任务没有可用快照: {task_id}"
                else:
                    result["error"] = "缺少必要参数: task_id"
            
            elif query_type == "get_knowledge":
                key = query_params.get("key")
                domain = query_params.get("domain")
                
                if key:
                    knowledge = self.memory_manager.get_domain_knowledge(key)
                    if knowledge:
                        result["success"] = True
                        result["knowledge"] = knowledge
                    else:
                        result["error"] = f"领域知识不存在: {key}"
                elif domain:
                    limit = query_params.get("limit", 10)
                    results = self.memory_manager.query_domain_knowledge(domain, limit)
                    result["success"] = True
                    result["results"] = results
                else:
                    result["error"] = "缺少必要参数: key或domain"
            
            else:
                result["error"] = f"未知查询类型: {query_type}"
            
            # 发送查询响应
            self._send_query_response(message.header.sender_id, result)
        except Exception as e:
            logger.error(f"处理记忆查询消息失败: {e}")
    
    def _handle_state_snapshot(self, message: Message) -> None:
        """处理状态快照消息
        
        Args:
            message: 消息对象
        """
        try:
            data = message.payload.content
            if not isinstance(data, dict):
                logger.warning(f"无效的状态快照消息: {data}")
                return
            
            task_id = data.get("task_id")
            state = data.get("state")
            ttl = data.get("ttl", 3600)  # 默认1小时
            
            if not task_id or state is None:
                logger.warning(f"状态快照消息缺少必要参数: {data}")
                return
            
            # 创建快照
            self.memory_manager.create_snapshot(
                task_id=task_id,
                agent_id=message.header.sender_id,
                state=state,
                ttl=ttl
            )
        except Exception as e:
            logger.error(f"处理状态快照消息失败: {e}")
    
    def _sync_memory(self) -> None:
        """同步记忆
        
        将本地记忆同步到其他智能体
        """
        try:
            # 收集需要同步的记忆条目
            entries = []
            
            # 收集工作记忆中的任务上下文
            for key in self.memory_manager.working_memory.list_keys("context:"):
                entry = self.memory_manager.working_memory.get(key)
                if entry and not entry.is_expired():
                    entries.append(entry.to_dict())
            
            # 收集短期记忆中的状态快照（最新的）
            task_snapshots = {}
            for key in self.memory_manager.short_term_memory.list_keys("snapshot:"):
                entry = self.memory_manager.short_term_memory.get(key)
                if entry and not entry.is_expired():
                    task_id = entry.metadata.get("task_id")
                    if task_id:
                        if task_id not in task_snapshots or entry.created_at > task_snapshots[task_id]["created_at"]:
                            task_snapshots[task_id] = {
                                "entry": entry.to_dict(),
                                "created_at": entry.created_at
                            }
            
            # 添加最新的快照
            for task_data in task_snapshots.values():
                entries.append(task_data["entry"])
            
            # 如果没有需要同步的条目，则跳过
            if not entries:
                return
            
            # 创建同步消息
            sync_data = {
                "vector_clock": self.memory_manager.vector_clock.dict(),
                "entries": entries
            }
            
            # 广播同步消息
            self.message_broker.publish(
                Message.create(
                    sender_id=self.id,
                    receiver_id="*",  # 广播给所有智能体
                    message_type=MessageType.MEMORY_SYNC,
                    priority=MessagePriority.NORMAL,
                    content=sync_data
                )
            )
            
            logger.debug(f"已同步 {len(entries)} 条记忆条目")
        except Exception as e:
            logger.error(f"同步记忆失败: {e}")
    
    def _send_sync_ack(self, receiver_id: str) -> None:
        """发送同步确认消息
        
        Args:
            receiver_id: 接收者ID
        """
        try:
            ack_data = {
                "status": "success",
                "timestamp": datetime.now().isoformat(),
                "vector_clock": self.memory_manager.vector_clock.dict()
            }
            
            self.message_broker.publish(
                Message.create(
                    sender_id=self.id,
                    receiver_id=receiver_id,
                    message_type=MessageType.MEMORY_SYNC_ACK,
                    priority=MessagePriority.HIGH,
                    content=ack_data
                )
            )
        except Exception as e:
            logger.error(f"发送同步确认消息失败: {e}")
    
    def _send_query_response(self, receiver_id: str, result: Dict[str, Any]) -> None:
        """发送查询响应消息
        
        Args:
            receiver_id: 接收者ID
            result: 查询结果
        """
        try:
            self.message_broker.publish(
                Message.create(
                    sender_id=self.id,
                    receiver_id=receiver_id,
                    message_type=MessageType.MEMORY_QUERY_RESPONSE,
                    priority=MessagePriority.HIGH,
                    content=result
                )
            )
        except Exception as e:
            logger.error(f"发送查询响应消息失败: {e}")
    
    def _broadcast_snapshot(self, task_id: str, snapshot_id: str) -> None:
        """广播快照消息
        
        Args:
            task_id: 任务ID
            snapshot_id: 快照ID
        """
        try:
            # 获取快照
            entry = self.memory_manager.get(snapshot_id)
            if entry is None:
                logger.warning(f"快照不存在: {snapshot_id}")
                return
            
            # 创建广播消息
            snapshot_data = {
                "task_id": task_id,
                "snapshot_id": snapshot_id,
                "state": entry.value,
                "timestamp": entry.created_at.isoformat(),
                "agent_id": self.id
            }
            
            # 广播快照消息
            self.message_broker.publish(
                Message.create(
                    sender_id=self.id,
                    receiver_id="*",  # 广播给所有智能体
                    message_type=MessageType.STATE_SNAPSHOT,
                    priority=MessagePriority.NORMAL,
                    content=snapshot_data
                )
            )
        except Exception as e:
            logger.error(f"广播快照消息失败: {e}")
    
    def _resolve_memory_conflict(self, entry1: MemoryEntry, entry2: MemoryEntry) -> MemoryEntry:
        """解决记忆冲突
        
        Args:
            entry1: 第一个记忆条目
            entry2: 第二个记忆条目
            
        Returns:
            MemoryEntry: 解决后的记忆条目
        """
        # 默认策略：保留最新的条目
        if entry1.created_at > entry2.created_at:
            return entry1
        return entry2