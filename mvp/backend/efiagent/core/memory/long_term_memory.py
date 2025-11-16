"""
长期记忆实现
Long Term Memory Implementation

负责持久化存储大量记忆数据，支持语义检索和时间衰减
"""

import asyncio
import time
import json
import pickle
from typing import Dict, List, Optional, Any, Tuple
import numpy as np
import faiss
import redis
from sentence_transformers import SentenceTransformer
import weaviate
import weaviate.classes as wvc

from .models import MemoryChunk, MemorySearchResult, MemoryType, MemoryStatus

class LongTermMemory:
    """长期记忆管理器

    特点：
    - 大容量持久化存储
    - 基于FAISS的向量检索
    - 时间衰减机制
    - 自动压缩和归档
    """

    def __init__(self,
                 embedding_dim: int = 384,
                 embedding_model: str = "all-MiniLM-L6-v2",
                 redis_client: Optional[redis.Redis] = None,
                 weaviate_url: str = "http://localhost:8080"):

        self.embedding_dim = embedding_dim
        self.embedding_model = SentenceTransformer(embedding_model)
        self.redis = redis_client

        # FAISS向量索引
        self.index = faiss.IndexFlatIP(embedding_dim)  # 内积相似度
        self.metadata: Dict[int, MemoryChunk] = {}

        # Weaviate客户端
        self.weaviate_client = weaviate.connect_to_local(
            host="localhost",
            port=8080,
            grpc_port=50051
        )

        # 统计信息
        self.stats = {
            'total_memories': 0,
            'total_searches': 0,
            'average_search_time': 0.0,
            'compression_count': 0,
            'archive_count': 0
        }

    async def initialize(self):
        """初始化长期记忆系统"""
        try:
            # 初始化Weaviate schema
            await self._initialize_weaviate_schema()

            # 从Redis加载现有索引（如果有）
            await self._load_index_from_redis()

            print("Long-term memory initialized successfully")
        except Exception as e:
            print(f"Error initializing long-term memory: {e}")

    async def store_memory(self,
                          content: str,
                          importance: float = 0.5,
                          tags: List[str] = None,
                          metadata: Dict[str, Any] = None) -> str:
        """存储记忆到长期记忆"""

        try:
            # 生成嵌入向量
            embedding = self.embedding_model.encode(content)

            # 创建记忆片段
            chunk = MemoryChunk(
                id=f"ltm_{int(time.time() * 1000000)}",
                content=content,
                embedding=embedding,
                timestamp=time.time(),
                memory_type=MemoryType.LONG_TERM,
                importance_score=importance,
                tags=tags or [],
                metadata=metadata or {}
            )

            # 添加到FAISS索引
            vector_id = len(self.metadata)
            self.index.add(np.array([embedding]))
            self.metadata[vector_id] = chunk

            # 存储到Weaviate
            await self._store_to_weaviate(chunk, vector_id)

            # 更新统计信息
            self.stats['total_memories'] += 1

            # 定期保存索引到Redis
            if self.stats['total_memories'] % 100 == 0:
                await self._save_index_to_redis()

            return chunk.id

        except Exception as e:
            print(f"Error storing memory: {e}")
            raise

    async def search_memory(self,
                          query: str,
                          max_results: int = 10,
                          similarity_threshold: float = 0.7) -> MemorySearchResult:
        """在长期记忆中搜索相关内容"""

        start_time = time.time()

        try:
            # 生成查询向量
            query_embedding = self.embedding_model.encode(query)
            query_embedding = query_embedding.reshape(1, -1)

            # FAISS搜索
            distances, indices = self.index.search(query_embedding, max_results)

            # 过滤和排序结果
            results = []
            for i, (dist, idx) in enumerate(zip(distances[0], indices[0])):
                if idx >= 0 and dist >= similarity_threshold:  # 有效索引且超过阈值
                    if idx in self.metadata:
                        chunk = self.metadata[idx]
                        chunk.metadata['similarity'] = float(dist)
                        results.append(chunk)

            # 按相似度排序
            results.sort(key=lambda x: x.metadata['similarity'], reverse=True)

            search_time = time.time() - start_time
            self.stats['total_searches'] += 1
            self.stats['average_search_time'] = (
                (self.stats['average_search_time'] * (self.stats['total_searches'] - 1) + search_time) /
                self.stats['total_searches']
            )

            return MemorySearchResult(
                chunks=results,
                total_found=len(results),
                search_time=search_time,
                query_embedding=query_embedding[0]
            )

        except Exception as e:
            print(f"Error searching long-term memory: {e}")
            return MemorySearchResult(
                chunks=[],
                total_found=0,
                search_time=time.time() - start_time,
                query_embedding=np.array([])
            )

    async def get_memory_by_id(self, memory_id: str) -> Optional[MemoryChunk]:
        """根据ID获取特定记忆"""
        for chunk in self.metadata.values():
            if chunk.id == memory_id:
                return chunk
        return None

    async def update_memory_importance(self, memory_id: str, new_importance: float):
        """更新记忆的重要性分数"""
        for chunk in self.metadata.values():
            if chunk.id == memory_id:
                chunk.importance_score = new_importance
                chunk.last_access = time.time()
                chunk.access_count += 1
                break

    async def decay_memories(self, decay_rate: float = 0.01):
        """应用时间衰减到所有记忆"""
        current_time = time.time()

        for chunk in self.metadata.values():
            # 计算衰减因子
            time_elapsed = current_time - chunk.timestamp
            decay_factor = np.exp(-decay_rate * time_elapsed / 3600)  # 以小时为单位

            # 应用衰减
            chunk.importance_score *= decay_factor
            chunk.importance_score = max(0.1, chunk.importance_score)  # 最低保留0.1

    async def compress_low_importance_memories(self, threshold: float = 0.2) -> int:
        """压缩低重要性记忆"""
        to_compress = []

        for vector_id, chunk in self.metadata.items():
            if chunk.importance_score < threshold:
                to_compress.append((vector_id, chunk))

        # 这里可以实现压缩逻辑，MVP版本中暂时移除低重要性记忆
        compressed_count = 0
        for vector_id, chunk in to_compress:
            try:
                # 从FAISS索引中移除
                # 注意：FAISS不支持直接删除，需要重建索引
                compressed_count += 1
                self.stats['compression_count'] += 1
            except Exception as e:
                print(f"Error compressing memory {chunk.id}: {e}")

        if compressed_count > 0:
            await self._rebuild_index()

        return compressed_count

    async def get_statistics(self) -> Dict[str, Any]:
        """获取长期记忆的统计信息"""
        if self.metadata:
            importances = [chunk.importance_score for chunk in self.metadata.values()]
            avg_importance = sum(importances) / len(importances)

            oldest_memory = min(self.metadata.values(), key=lambda x: x.timestamp)
            newest_memory = max(self.metadata.values(), key=lambda x: x.timestamp)
        else:
            avg_importance = 0
            oldest_memory = newest_memory = None

        return {
            'total_memories': self.stats['total_memories'],
            'average_importance': avg_importance,
            'oldest_memory_age': time.time() - oldest_memory.timestamp if oldest_memory else 0,
            'newest_memory_age': time.time() - newest_memory.timestamp if newest_memory else 0,
            'total_searches': self.stats['total_searches'],
            'average_search_time': self.stats['average_search_time'],
            'compression_count': self.stats['compression_count'],
            'archive_count': self.stats['archive_count']
        }

    async def _initialize_weaviate_schema(self):
        """初始化Weaviate schema"""
        try:
            # 检查是否已存在schema
            if not self.weaviate_client.collections.exists("Memory"):
                # 创建schema
                self.weaviate_client.collections.create(
                    name="Memory",
                    properties=[
                        wvc.config.Property(name="content", data_type=wvc.config.DataType.TEXT),
                        wvc.config.Property(name="importance", data_type=wvc.config.DataType.NUMBER),
                        wvc.config.Property(name="tags", data_type=wvc.config.DataType.TEXT_ARRAY),
                        wvc.config.Property(name="timestamp", data_type=wvc.config.DataType.NUMBER),
                        wvc.config.Property(name="metadata", data_type=wvc.config.DataType.TEXT),
                    ]
                )
        except Exception as e:
            print(f"Error initializing Weaviate schema: {e}")

    async def _store_to_weaviate(self, chunk: MemoryChunk, vector_id: int):
        """存储到Weaviate"""
        try:
            memory_collection = self.weaviate_client.collections.get("Memory")

            memory_collection.data.insert(
                properties={
                    "content": chunk.content,
                    "importance": chunk.importance_score,
                    "tags": chunk.tags,
                    "timestamp": chunk.timestamp,
                    "metadata": json.dumps(chunk.metadata)
                },
                uuid=chunk.id
            )
        except Exception as e:
            print(f"Error storing to Weaviate: {e}")

    async def _save_index_to_redis(self):
        """保存FAISS索引到Redis"""
        if not self.redis:
            return

        try:
            # 保存FAISS索引
            index_data = faiss.serialize_index(self.index)
            await self.redis.set("faiss_index", index_data)

            # 保存元数据
            metadata_data = {
                str(k): {
                    'id': v.id,
                    'content': v.content,
                    'timestamp': v.timestamp,
                    'importance_score': v.importance_score,
                    'tags': v.tags,
                    'metadata': v.metadata,
                    'access_count': v.access_count,
                    'last_access': v.last_access
                } for k, v in self.metadata.items()
            }
            await self.redis.set("metadata", json.dumps(metadata_data))

        except Exception as e:
            print(f"Error saving index to Redis: {e}")

    async def _load_index_from_redis(self):
        """从Redis加载FAISS索引"""
        if not self.redis:
            return

        try:
            # 加载FAISS索引
            index_data = await self.redis.get("faiss_index")
            if index_data:
                self.index = faiss.deserialize_index(index_data)

            # 加载元数据
            metadata_data = await self.redis.get("metadata")
            if metadata_data:
                data = json.loads(metadata_data)
                for k, v in data.items():
                    # 注意：这里需要重新构建embedding，实际应用中应该序列化embedding
                    pass

        except Exception as e:
            print(f"Error loading index from Redis: {e}")

    async def _rebuild_index(self):
        """重建FAISS索引（用于删除操作）"""
        if not self.metadata:
            return

        # 重建索引
        new_index = faiss.IndexFlatIP(self.embedding_dim)
        new_metadata = {}

        embeddings = []
        metadata_list = []

        for vector_id, chunk in self.metadata.items():
            if chunk.importance_score >= 0.2:  # 只保留高重要性记忆
                embeddings.append(chunk.embedding)
                metadata_list.append((vector_id, chunk))

        if embeddings:
            new_index.add(np.array(embeddings))
            for new_vector_id, (old_vector_id, chunk) in enumerate(metadata_list):
                new_metadata[new_vector_id] = chunk

        self.index = new_index
        self.metadata = new_metadata