"""
三层记忆系统统一接口
Three-Layer Memory System Unified Interface

协调工作记忆、长期记忆和元记忆的协同工作
"""

import asyncio
import time
from typing import Dict, List, Optional, Any, Tuple
import numpy as np
import redis
import json

from .working_memory import WorkingMemory
from .long_term_memory import LongTermMemory
from .meta_memory import MetaMemory
from .models import MemoryChunk, MemorySearchResult, MemoryType

class ThreeLayerMemorySystem:
    """三层记忆系统

    架构：
    - 工作记忆：当前任务上下文（~32K tokens）
    - 长期记忆：持久化知识存储（向量数据库）
    - 元记忆：学习策略和自我认知

    工作流程：
    1. 新信息进入工作记忆
    2. 重要信息压缩到长期记忆
    3. 元记忆分析学习效果
    4. 三层记忆协同检索
    """

    def __init__(self,
                 redis_url: str = "redis://localhost:6379",
                 weaviate_url: str = "http://localhost:8080",
                 embedding_model: str = "all-MiniLM-L6-v2"):

        # Redis客户端
        self.redis = redis.from_url(redis_url)

        # 初始化三层记忆
        self.working_memory = WorkingMemory(
            context_window_size=32,
            embedding_model=embedding_model,
            redis_client=self.redis
        )

        self.long_term_memory = LongTermMemory(
            embedding_model=embedding_model,
            redis_client=self.redis,
            weaviate_url=weaviate_url
        )

        self.meta_memory = MetaMemory(
            redis_client=self.redis
        )

        # 系统配置
        self.config = {
            'compression_threshold': 0.3,  # 工作记忆压缩阈值
            'compression_interval': 300,   # 压缩检查间隔（秒）
            'decay_interval': 3600,        # 衰减检查间隔（秒）
            'max_working_memory_size': 32,
            'importance_boost_factor': 1.2  # 访问时的增强因子
        }

        # 统计信息
        self.system_stats = {
            'total_operations': 0,
            'compression_cycles': 0,
            'decay_cycles': 0,
            'inter_memory_transfers': 0
        }

        # 后台任务
        self._background_tasks = []
        self._shutdown = False

    async def initialize(self):
        """初始化记忆系统"""
        try:
            # 初始化各层记忆
            await self.long_term_memory.initialize()
            await self.meta_memory.initialize()

            # 启动后台任务
            await self._start_background_tasks()

            print("Three-layer memory system initialized successfully")
            return True

        except Exception as e:
            print(f"Error initializing memory system: {e}")
            return False

    async def store_experience(self,
                              content: str,
                              importance: float = 0.5,
                              context: Dict[str, Any] = None,
                              strategy_used: str = None) -> str:
        """存储经验到记忆系统"""

        try:
            self.system_stats['total_operations'] += 1

            # 1. 添加到工作记忆
            memory_id = await self.working_memory.add_memory(
                content=content,
                importance=importance,
                tags=context.get('tags', []) if context else [],
                metadata=context or {}
            )

            # 2. 异步压缩检查
            if importance < self.config['compression_threshold']:
                asyncio.create_task(self._check_compression_needed())

            # 3. 更新元记忆（如果提供了策略信息）
            if strategy_used and context:
                performance = context.get('performance', 0.5)
                task_type = context.get('task_type', 'unknown')
                await self.meta_memory.evaluate_strategy(strategy_used, task_type, performance)

            return memory_id

        except Exception as e:
            print(f"Error storing experience: {e}")
            raise

    async def retrieve_relevant_memories(self,
                                        query: str,
                                        max_results: int = 10,
                                        include_working: bool = True,
                                        include_long_term: bool = True) -> List[MemoryChunk]:
        """跨层检索相关记忆"""

        try:
            all_results = []

            # 1. 从工作记忆检索
            if include_working:
                working_results = await self.working_memory.search_memory(query, max_results // 2)
                for chunk in working_results.chunks:
                    chunk.metadata['source'] = 'working_memory'
                    chunk.metadata['relevance_type'] = 'current_context'
                all_results.extend(working_results.chunks)

            # 2. 从长期记忆检索
            if include_long_term:
                long_term_results = await self.long_term_memory.search_memory(query, max_results // 2)
                for chunk in long_term_results.chunks:
                    chunk.metadata['source'] = 'long_term_memory'
                    chunk.metadata['relevance_type'] = 'historical_knowledge'
                all_results.extend(long_term_results.chunks)

            # 3. 增强访问的记忆片段重要性
            for chunk in all_results:
                if chunk.metadata.get('source') == 'long_term_memory':
                    await self.long_term_memory.update_memory_importance(
                        chunk.id,
                        chunk.importance_score * self.config['importance_boost_factor']
                    )

            # 4. 按相关性和重要性综合排序
            all_results.sort(key=lambda x: (
                x.metadata.get('similarity', 0) * 0.6 +
                x.importance_score * 0.4
            ), reverse=True)

            return all_results[:max_results]

        except Exception as e:
            print(f"Error retrieving memories: {e}")
            return []

    async def meta_reasoning(self,
                            current_task: str,
                            performance_feedback: float,
                            task_context: Dict[str, Any] = None) -> Dict[str, Any]:
        """元认知推理 - 基于历史表现推荐策略"""

        try:
            # 1. 分析当前任务类型
            task_type = self._classify_task_type(current_task)

            # 2. 从元记忆获取推荐策略
            recommended_strategy = await self.meta_memory.recommend_strategy(
                task_type, task_context
            )

            # 3. 自我反思
            recent_performances = task_context.get('recent_performances', [performance_feedback])
            reflection_insights = await self.meta_memory.reflect_on_performance(
                recent_performances, task_context or {}
            )

            # 4. 识别学习模式
            learning_patterns = await self.meta_memory.identify_learning_patterns()

            # 5. 获取自我认知评估
            self_assessment = await self.meta_memory.get_self_assessment()

            return {
                'recommended_strategy': recommended_strategy,
                'task_type': task_type,
                'reflection_insights': reflection_insights,
                'learning_patterns': learning_patterns,
                'self_assessment': self_assessment,
                'meta_reasoning_timestamp': time.time()
            }

        except Exception as e:
            print(f"Error in meta-reasoning: {e}")
            return {}

    async def get_context_summary(self) -> Dict[str, Any]:
        """获取当前上下文摘要"""

        try:
            # 工作记忆摘要
            working_summary = await self.working_memory.get_memory_summary()

            # 长期记忆摘要
            long_term_summary = await self.long_term_memory.get_statistics()

            # 元记忆摘要
            meta_summary = await self.meta_memory.get_statistics()

            # 综合上下文向量
            context_vector = await self.working_memory.get_context_vector()

            return {
                'working_memory': working_summary,
                'long_term_memory': long_term_summary,
                'meta_memory': meta_summary,
                'context_vector': context_vector.tolist(),
                'system_stats': self.system_stats,
                'timestamp': time.time()
            }

        except Exception as e:
            print(f"Error getting context summary: {e}")
            return {}

    async def consolidate_memories(self, force: bool = False) -> int:
        """记忆整合 - 压缩和归档"""

        try:
            consolidated_count = 0

            # 1. 压缩工作记忆中的低重要性记忆
            if force or working_summary['capacity_usage'] > 0.8:
                compressed = await self.working_memory.compress_old_memories(
                    self.config['compression_threshold']
                )
                consolidated_count += len(compressed)

            # 2. 压缩长期记忆中的低重要性记忆
            compressed = await self.long_term_memory.compress_low_importance_memories(0.2)
            consolidated_count += compressed

            # 3. 应用时间衰减
            await self.long_term_memory.decay_memories()

            self.system_stats['compression_cycles'] += 1

            return consolidated_count

        except Exception as e:
            print(f"Error consolidating memories: {e}")
            return 0

    async def shutdown(self):
        """关闭记忆系统"""
        try:
            self._shutdown = True

            # 取消后台任务
            for task in self._background_tasks:
                task.cancel()

            # 保存最终状态
            await self.long_term_memory._save_index_to_redis()

            # 关闭Redis连接
            if self.redis:
                await self.redis.close()

            print("Memory system shutdown completed")

        except Exception as e:
            print(f"Error during shutdown: {e}")

    async def _start_background_tasks(self):
        """启动后台维护任务"""

        # 记忆压缩任务
        compression_task = asyncio.create_task(self._periodic_compression())
        self._background_tasks.append(compression_task)

        # 记忆衰减任务
        decay_task = asyncio.create_task(self._periodic_decay())
        self._background_tasks.append(decay_task)

    async def _periodic_compression(self):
        """定期记忆压缩"""
        while not self._shutdown:
            try:
                await asyncio.sleep(self.config['compression_interval'])
                await self.consolidate_memories()
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Error in periodic compression: {e}")

    async def _periodic_decay(self):
        """定期记忆衰减"""
        while not self._shutdown:
            try:
                await asyncio.sleep(self.config['decay_interval'])
                await self.long_term_memory.decay_memories()
                self.system_stats['decay_cycles'] += 1
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Error in periodic decay: {e}")

    async def _check_compression_needed(self):
        """检查是否需要压缩"""
        try:
            working_summary = await self.working_memory.get_memory_summary()
            if working_summary['capacity_usage'] > 0.8:
                await self.consolidate_memories()
        except Exception as e:
            print(f"Error checking compression: {e}")

    def _classify_task_type(self, task_description: str) -> str:
        """简单的任务类型分类"""
        task_lower = task_description.lower()

        if any(word in task_lower for word in ['analyze', 'research', 'investigate']):
            return 'analysis'
        elif any(word in task_lower for word in ['create', 'generate', 'design', 'build']):
            return 'creation'
        elif any(word in task_lower for word in ['solve', 'fix', 'resolve', 'debug']):
            return 'problem_solving'
        elif any(word in task_lower for word in ['plan', 'organize', 'coordinate']):
            return 'planning'
        elif any(word in task_lower for word in ['learn', 'study', 'understand']):
            return 'learning'
        else:
            return 'general'