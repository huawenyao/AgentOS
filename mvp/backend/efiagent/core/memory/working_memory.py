"""
工作记忆实现
Working Memory Implementation

负责管理当前任务的上下文信息，具有有限容量和快速访问特性
"""

import asyncio
import time
from typing import Dict, List, Optional, Any
import numpy as np
import torch
from sentence_transformers import SentenceTransformer
import redis
import json
import pickle

from .models import MemoryChunk, WorkingMemoryState, MemorySearchResult, MemoryType

class WorkingMemory:
    """工作记忆管理器

    特点：
    - 有限容量 (32K tokens equivalent)
    - 快速访问和更新
    - 基于重要度的智能淘汰
    - 支持注意力权重调整
    """

    def __init__(self,
                 context_window_size: int = 32,
                 embedding_model: str = "all-MiniLM-L6-v2",
                 redis_client: Optional[redis.Redis] = None):

        self.state = WorkingMemoryState(context_window_size=context_window_size)
        self.embedding_model = SentenceTransformer(embedding_model)
        self.redis = redis_client

        # 统计信息
        self.stats = {
            'total_additions': 0,
            'total_evictions': 0,
            'total_accesses': 0,
            'average_chunk_size': 0
        }

    async def add_memory(self,
                        content: str,
                        importance: float = 0.5,
                        tags: List[str] = None,
                        metadata: Dict[str, Any] = None) -> str:
        """添加记忆片段到工作记忆"""

        try:
            # 生成嵌入向量
            embedding = self.embedding_model.encode(content)

            # 创建记忆片段
            chunk = MemoryChunk(
                id=f"wm_{int(time.time() * 1000000)}",
                content=content,
                embedding=embedding,
                timestamp=time.time(),
                memory_type=MemoryType.WORKING,
                importance_score=importance,
                tags=tags or [],
                metadata=metadata or {}
            )

            # 添加到工作记忆
            self.state.add_chunk(chunk)

            # 更新统计信息
            self.stats['total_additions'] += 1
            self._update_average_chunk_size()

            # 异步持久化到Redis（如果配置了）
            if self.redis:
                await self._persist_to_redis(chunk)

            return chunk.id

        except Exception as e:
            print(f"Error adding memory to working memory: {e}")
            raise

    async def search_memory(self,
                          query: str,
                          max_results: int = 5) -> MemorySearchResult:
        """在工作记忆中搜索相关内容"""

        start_time = time.time()

        try:
            # 生成查询向量
            query_embedding = self.embedding_model.encode(query)

            # 计算相似度
            similarities = []
            for chunk_id, chunk in self.state.active_chunks.items():
                similarity = np.dot(chunk.embedding, query_embedding) / (
                    np.linalg.norm(chunk.embedding) * np.linalg.norm(query_embedding)
                )
                similarities.append((chunk, similarity))

            # 按相似度排序
            similarities.sort(key=lambda x: x[1], reverse=True)

            # 返回结果
            results = [chunk for chunk, _ in similarities[:max_results]]
            search_time = time.time() - start_time

            return MemorySearchResult(
                chunks=results,
                total_found=len(results),
                search_time=search_time,
                query_embedding=query_embedding
            )

        except Exception as e:
            print(f"Error searching working memory: {e}")
            return MemorySearchResult(
                chunks=[],
                total_found=0,
                search_time=time.time() - start_time,
                query_embedding=np.array([])
            )

    async def get_context_vector(self) -> np.ndarray:
        """获取当前上下文的综合向量表示"""

        if not self.state.active_chunks:
            return np.zeros(384)  # 默认embedding维度

        # 加权平均所有活跃记忆片段
        vectors = []
        weights = []

        for chunk_id, chunk in self.state.active_chunks.items():
            vectors.append(chunk.embedding)
            weight = self.state.attention_weights.get(chunk_id, 1.0)
            weights.append(weight)

        # 归一化权重
        weights = np.array(weights)
        weights = weights / np.sum(weights)

        # 计算加权平均
        context_vector = np.average(np.array(vectors), axis=0, weights=weights)

        return context_vector

    async def update_attention(self, chunk_id: str, attention_weight: float):
        """更新特定记忆片段的注意力权重"""

        if chunk_id in self.state.attention_weights:
            self.state.attention_weights[chunk_id] = attention_weight

            # 更新访问统计
            if chunk_id in self.state.active_chunks:
                self.state.active_chunks[chunk_id].access_count += 1
                self.state.active_chunks[chunk_id].last_access = time.time()

            self.stats['total_accesses'] += 1

    async def set_current_goal(self, goal: str):
        """设置当前目标"""
        # 如果有旧目标，降低其重要性
        if self.state.current_goal:
            for chunk in self.state.active_chunks.values():
                if 'goal' in chunk.tags:
                    chunk.importance_score *= 0.8

        # 添加新目标
        await self.add_memory(
            content=goal,
            importance=1.0,
            tags=['goal', 'current'],
            metadata={'type': 'goal'}
        )

        self.state.current_goal = goal

    async def get_memory_summary(self) -> Dict[str, Any]:
        """获取工作记忆的统计摘要"""

        total_importance = sum(chunk.importance_score for chunk in self.state.active_chunks.values())
        avg_importance = total_importance / len(self.state.active_chunks) if self.state.active_chunks else 0

        oldest_memory = min(self.state.active_chunks.values(), key=lambda x: x.timestamp) if self.state.active_chunks else None
        newest_memory = max(self.state.active_chunks.values(), key=lambda x: x.timestamp) if self.state.active_chunks else None

        return {
            'total_chunks': len(self.state.active_chunks),
            'capacity_usage': len(self.state.active_chunks) / self.state.context_window_size,
            'average_importance': avg_importance,
            'current_goal': self.state.current_goal,
            'oldest_memory_age': time.time() - oldest_memory.timestamp if oldest_memory else 0,
            'newest_memory_age': time.time() - newest_memory.timestamp if newest_memory else 0,
            'stats': self.stats
        }

    async def compress_old_memories(self, threshold: float = 0.3) -> List[str]:
        """压缩重要性低的记忆片段"""

        to_compress = []
        for chunk_id, chunk in self.state.active_chunks.items():
            if (chunk.importance_score < threshold and
                time.time() - chunk.timestamp > 3600):  # 1小时以上的低重要性记忆
                to_compress.append(chunk_id)

        # 这里可以实现压缩逻辑，MVP版本中暂时移除
        for chunk_id in to_compress:
            del self.state.active_chunks[chunk_id]
            if chunk_id in self.state.attention_weights:
                del self.state.attention_weights[chunk_id]

        return to_compress

    def _update_average_chunk_size(self):
        """更新平均记忆片段大小"""
        if self.state.active_chunks:
            total_size = sum(len(chunk.content) for chunk in self.state.active_chunks.values())
            self.stats['average_chunk_size'] = total_size / len(self.state.active_chunks)

    async def _persist_to_redis(self, chunk: MemoryChunk):
        """异步持久化到Redis"""
        try:
            data = {
                'id': chunk.id,
                'content': chunk.content,
                'embedding': chunk.embedding.tolist(),
                'timestamp': chunk.timestamp,
                'importance_score': chunk.importance_score,
                'tags': chunk.tags,
                'metadata': chunk.metadata
            }

            await self.redis.setex(
                f"working_memory:{chunk.id}",
                3600,  # 1小时过期
                json.dumps(data)
            )
        except Exception as e:
            print(f"Error persisting to Redis: {e}")