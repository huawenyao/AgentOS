"""通信协议栈模块

该模块实现了智能体之间的通信协议栈，包括控制层、语义层和数据层，支持高效的消息传递和状态同步。
"""

import uuid
import json
import time
import zlib
import base64
from enum import Enum
from typing import Dict, List, Set, Optional, Any, Tuple, Callable, Union
from datetime import datetime
from pydantic import BaseModel, Field, validator
from loguru import logger


class MessagePriority(int, Enum):
    """消息优先级枚举"""
    LOW = 0  # 低优先级
    NORMAL = 1  # 普通优先级
    HIGH = 2  # 高优先级
    CRITICAL = 3  # 关键优先级


class MessageType(str, Enum):
    """消息类型枚举"""
    COMMAND = "command"  # 命令
    QUERY = "query"  # 查询
    RESPONSE = "response"  # 响应
    NOTIFICATION = "notification"  # 通知
    EVENT = "event"  # 事件
    HEARTBEAT = "heartbeat"  # 心跳
    STATE_SYNC = "state_sync"  # 状态同步
    ERROR = "error"  # 错误


class ControlHeader(BaseModel):
    """控制层头部
    
    控制层负责消息的路由和优先级管理，使用二进制头部（2字节）
    """
    message_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sender_id: str  # 发送者ID
    receiver_id: Optional[str] = None  # 接收者ID，None表示广播
    message_type: MessageType  # 消息类型
    priority: MessagePriority = MessagePriority.NORMAL  # 消息优先级
    timestamp: datetime = Field(default_factory=datetime.now)  # 时间戳
    ttl: int = 60  # 生存时间（秒）
    hop_count: int = 0  # 跳数计数
    session_id: Optional[str] = None  # 会话ID
    
    def to_binary(self) -> bytes:
        """将头部转换为二进制格式
        
        Returns:
            bytes: 二进制头部
        """
        # 将优先级和消息类型编码到第一个字节
        first_byte = (self.priority.value << 4) | (list(MessageType).index(self.message_type) & 0x0F)
        
        # 将TTL和跳数编码到第二个字节
        second_byte = (min(self.ttl, 15) << 4) | (min(self.hop_count, 15) & 0x0F)
        
        # 返回二进制头部
        return bytes([first_byte, second_byte])
    
    @classmethod
    def from_binary(cls, binary_header: bytes, **kwargs) -> "ControlHeader":
        """从二进制格式解析头部
        
        Args:
            binary_header: 二进制头部
            **kwargs: 其他头部字段
            
        Returns:
            ControlHeader: 控制层头部对象
        """
        if len(binary_header) < 2:
            raise ValueError("二进制头部长度不足")
        
        # 解析第一个字节
        first_byte = binary_header[0]
        priority_value = (first_byte >> 4) & 0x0F
        message_type_index = first_byte & 0x0F
        
        # 解析第二个字节
        second_byte = binary_header[1]
        ttl = (second_byte >> 4) & 0x0F
        hop_count = second_byte & 0x0F
        
        # 创建头部对象
        return cls(
            priority=MessagePriority(priority_value),
            message_type=list(MessageType)[message_type_index],
            ttl=ttl,
            hop_count=hop_count,
            **kwargs
        )


class SemanticContent(BaseModel):
    """语义层内容
    
    语义层负责意图标注和参数传递，使用JSON-LD结构化消息
    """
    intent: str  # 意图
    parameters: Dict[str, Any] = Field(default_factory=dict)  # 参数
    context: Dict[str, Any] = Field(default_factory=dict)  # 上下文
    metadata: Dict[str, Any] = Field(default_factory=dict)  # 元数据
    
    def to_jsonld(self) -> Dict[str, Any]:
        """将内容转换为JSON-LD格式
        
        Returns:
            Dict[str, Any]: JSON-LD格式的内容
        """
        return {
            "@context": {
                "efiagent": "https://wumaitech.com/efiagent/context",
                "intent": "efiagent:intent",
                "parameters": "efiagent:parameters",
                "context": "efiagent:context",
                "metadata": "efiagent:metadata"
            },
            "@type": "efiagent:Message",
            "intent": self.intent,
            "parameters": self.parameters,
            "context": self.context,
            "metadata": self.metadata
        }
    
    @classmethod
    def from_jsonld(cls, jsonld_content: Dict[str, Any]) -> "SemanticContent":
        """从JSON-LD格式解析内容
        
        Args:
            jsonld_content: JSON-LD格式的内容
            
        Returns:
            SemanticContent: 语义层内容对象
        """
        return cls(
            intent=jsonld_content.get("intent", ""),
            parameters=jsonld_content.get("parameters", {}),
            context=jsonld_content.get("context", {}),
            metadata=jsonld_content.get("metadata", {})
        )


class DataPayload(BaseModel):
    """数据层负载
    
    数据层负责高效传输，使用差分压缩（Δ状态更新）
    """
    content: Any  # 内容
    content_type: str = "application/json"  # 内容类型
    encoding: str = "utf-8"  # 编码
    compression: bool = False  # 是否压缩
    is_delta: bool = False  # 是否为差分更新
    base_state_id: Optional[str] = None  # 基础状态ID（用于差分更新）
    checksum: Optional[str] = None  # 校验和
    
    def serialize(self) -> bytes:
        """序列化负载
        
        Returns:
            bytes: 序列化后的数据
        """
        # 序列化内容
        if isinstance(self.content, (dict, list, tuple, set)):
            content_bytes = json.dumps(self.content).encode(self.encoding)
        elif isinstance(self.content, str):
            content_bytes = self.content.encode(self.encoding)
        elif isinstance(self.content, bytes):
            content_bytes = self.content
        else:
            content_bytes = str(self.content).encode(self.encoding)
        
        # 计算校验和
        self.checksum = hex(zlib.crc32(content_bytes) & 0xffffffff)[2:]
        
        # 压缩（如果需要）
        if self.compression:
            content_bytes = zlib.compress(content_bytes)
        
        return content_bytes
    
    @classmethod
    def deserialize(cls, data: bytes, content_type: str, encoding: str = "utf-8", 
                   compression: bool = False, is_delta: bool = False, 
                   base_state_id: Optional[str] = None) -> "DataPayload":
        """反序列化负载
        
        Args:
            data: 序列化后的数据
            content_type: 内容类型
            encoding: 编码
            compression: 是否压缩
            is_delta: 是否为差分更新
            base_state_id: 基础状态ID
            
        Returns:
            DataPayload: 数据层负载对象
        """
        # 解压缩（如果需要）
        if compression:
            data = zlib.decompress(data)
        
        # 计算校验和
        checksum = hex(zlib.crc32(data) & 0xffffffff)[2:]
        
        # 反序列化内容
        if content_type == "application/json":
            content = json.loads(data.decode(encoding))
        elif content_type.startswith("text/"):
            content = data.decode(encoding)
        else:
            content = data
        
        return cls(
            content=content,
            content_type=content_type,
            encoding=encoding,
            compression=compression,
            is_delta=is_delta,
            base_state_id=base_state_id,
            checksum=checksum
        )
    
    def apply_delta(self, base_state: Any) -> Any:
        """应用差分更新
        
        Args:
            base_state: 基础状态
            
        Returns:
            Any: 更新后的状态
            
        Raises:
            ValueError: 不是差分更新或基础状态类型不匹配
        """
        if not self.is_delta:
            raise ValueError("不是差分更新")
        
        if not isinstance(self.content, dict) or not isinstance(base_state, dict):
            raise ValueError("基础状态类型不匹配，差分更新仅支持字典类型")
        
        # 深拷贝基础状态
        result = base_state.copy()
        
        # 应用差分更新
        for key, value in self.content.items():
            if value is None:
                # 删除键
                if key in result:
                    del result[key]
            else:
                # 更新或添加键
                result[key] = value
        
        return result
    
    @classmethod
    def create_delta(cls, old_state: Dict[str, Any], new_state: Dict[str, Any], 
                     base_state_id: str) -> "DataPayload":
        """创建差分更新
        
        Args:
            old_state: 旧状态
            new_state: 新状态
            base_state_id: 基础状态ID
            
        Returns:
            DataPayload: 差分更新负载
        """
        if not isinstance(old_state, dict) or not isinstance(new_state, dict):
            raise ValueError("状态类型不匹配，差分更新仅支持字典类型")
        
        # 计算差分
        delta = {}
        
        # 找出新增或修改的键
        for key, value in new_state.items():
            if key not in old_state or old_state[key] != value:
                delta[key] = value
        
        # 找出删除的键
        for key in old_state:
            if key not in new_state:
                delta[key] = None
        
        return cls(
            content=delta,
            content_type="application/json",
            is_delta=True,
            base_state_id=base_state_id
        )


class Message(BaseModel):
    """完整消息
    
    包含控制层头部、语义层内容和数据层负载
    """
    header: ControlHeader
    semantic: SemanticContent
    payload: DataPayload
    
    def serialize(self) -> bytes:
        """序列化消息
        
        Returns:
            bytes: 序列化后的消息
        """
        # 序列化头部
        header_binary = self.header.to_binary()
        
        # 序列化语义内容
        semantic_json = json.dumps(self.semantic.to_jsonld()).encode("utf-8")
        
        # 序列化负载
        payload_binary = self.payload.serialize()
        
        # 组合消息
        # 格式：[头部长度(2字节)][语义内容长度(4字节)][头部][语义内容][负载]
        header_length = len(header_binary)
        semantic_length = len(semantic_json)
        
        message = bytearray()
        message.extend(header_length.to_bytes(2, byteorder="big"))
        message.extend(semantic_length.to_bytes(4, byteorder="big"))
        message.extend(header_binary)
        message.extend(semantic_json)
        message.extend(payload_binary)
        
        return bytes(message)
    
    @classmethod
    def deserialize(cls, data: bytes) -> "Message":
        """反序列化消息
        
        Args:
            data: 序列化后的消息
            
        Returns:
            Message: 消息对象
            
        Raises:
            ValueError: 数据格式错误
        """
        if len(data) < 6:
            raise ValueError("数据长度不足")
        
        # 解析长度
        header_length = int.from_bytes(data[0:2], byteorder="big")
        semantic_length = int.from_bytes(data[2:6], byteorder="big")
        
        if len(data) < 6 + header_length + semantic_length:
            raise ValueError("数据长度不足")
        
        # 解析头部
        header_binary = data[6:6+header_length]
        header_kwargs = {
            "message_id": str(uuid.uuid4()),
            "sender_id": "",
            "timestamp": datetime.now()
        }
        header = ControlHeader.from_binary(header_binary, **header_kwargs)
        
        # 解析语义内容
        semantic_json = data[6+header_length:6+header_length+semantic_length]
        semantic_dict = json.loads(semantic_json.decode("utf-8"))
        semantic = SemanticContent.from_jsonld(semantic_dict)
        
        # 解析负载
        payload_binary = data[6+header_length+semantic_length:]
        content_type = semantic.metadata.get("content_type", "application/json")
        encoding = semantic.metadata.get("encoding", "utf-8")
        compression = semantic.metadata.get("compression", False)
        is_delta = semantic.metadata.get("is_delta", False)
        base_state_id = semantic.metadata.get("base_state_id")
        
        payload = DataPayload.deserialize(
            payload_binary,
            content_type=content_type,
            encoding=encoding,
            compression=compression,
            is_delta=is_delta,
            base_state_id=base_state_id
        )
        
        return cls(header=header, semantic=semantic, payload=payload)


class MessageBroker:
    """消息代理
    
    负责消息的发送、接收和路由
    """
    def __init__(self):
        """初始化消息代理"""
        self.subscribers: Dict[str, List[Callable[[Message], None]]] = {}  # 订阅者字典，键为消息类型
        self.message_cache: Dict[str, Message] = {}  # 消息缓存，键为消息ID
        self.state_cache: Dict[str, Any] = {}  # 状态缓存，键为状态ID
        self.max_cache_size = 1000  # 最大缓存大小
        self.max_message_age = 3600  # 最大消息年龄（秒）
    
    def subscribe(self, message_type: MessageType, callback: Callable[[Message], None]) -> None:
        """订阅消息
        
        Args:
            message_type: 消息类型
            callback: 回调函数
        """
        if message_type.value not in self.subscribers:
            self.subscribers[message_type.value] = []
        self.subscribers[message_type.value].append(callback)
    
    def unsubscribe(self, message_type: MessageType, callback: Callable[[Message], None]) -> None:
        """取消订阅
        
        Args:
            message_type: 消息类型
            callback: 回调函数
        """
        if message_type.value in self.subscribers:
            self.subscribers[message_type.value].remove(callback)
    
    def publish(self, message: Message) -> None:
        """发布消息
        
        Args:
            message: 消息对象
        """
        # 缓存消息
        self.message_cache[message.header.message_id] = message
        
        # 如果是状态同步消息，缓存状态
        if message.header.message_type == MessageType.STATE_SYNC and not message.payload.is_delta:
            state_id = message.semantic.metadata.get("state_id")
            if state_id:
                self.state_cache[state_id] = message.payload.content
        
        # 清理过期缓存
        self._clean_cache()
        
        # 通知订阅者
        message_type = message.header.message_type.value
        if message_type in self.subscribers:
            for callback in self.subscribers[message_type]:
                try:
                    callback(message)
                except Exception as e:
                    logger.error(f"处理消息时出错: {e}")
    
    def send(self, sender_id: str, receiver_id: str, intent: str, parameters: Dict[str, Any], 
             content: Any, message_type: MessageType = MessageType.COMMAND, 
             priority: MessagePriority = MessagePriority.NORMAL, 
             session_id: Optional[str] = None) -> str:
        """发送消息
        
        Args:
            sender_id: 发送者ID
            receiver_id: 接收者ID
            intent: 意图
            parameters: 参数
            content: 内容
            message_type: 消息类型
            priority: 消息优先级
            session_id: 会话ID
            
        Returns:
            str: 消息ID
        """
        # 创建消息
        header = ControlHeader(
            sender_id=sender_id,
            receiver_id=receiver_id,
            message_type=message_type,
            priority=priority,
            session_id=session_id
        )
        
        semantic = SemanticContent(
            intent=intent,
            parameters=parameters
        )
        
        payload = DataPayload(
            content=content
        )
        
        message = Message(
            header=header,
            semantic=semantic,
            payload=payload
        )
        
        # 发布消息
        self.publish(message)
        
        return header.message_id
    
    def send_delta_update(self, sender_id: str, receiver_id: str, intent: str, 
                         old_state: Dict[str, Any], new_state: Dict[str, Any], 
                         base_state_id: str, priority: MessagePriority = MessagePriority.NORMAL, 
                         session_id: Optional[str] = None) -> str:
        """发送差分更新
        
        Args:
            sender_id: 发送者ID
            receiver_id: 接收者ID
            intent: 意图
            old_state: 旧状态
            new_state: 新状态
            base_state_id: 基础状态ID
            priority: 消息优先级
            session_id: 会话ID
            
        Returns:
            str: 消息ID
        """
        # 创建差分更新负载
        payload = DataPayload.create_delta(old_state, new_state, base_state_id)
        
        # 创建消息
        header = ControlHeader(
            sender_id=sender_id,
            receiver_id=receiver_id,
            message_type=MessageType.STATE_SYNC,
            priority=priority,
            session_id=session_id
        )
        
        semantic = SemanticContent(
            intent=intent,
            parameters={},
            metadata={
                "is_delta": True,
                "base_state_id": base_state_id
            }
        )
        
        message = Message(
            header=header,
            semantic=semantic,
            payload=payload
        )
        
        # 发布消息
        self.publish(message)
        
        return header.message_id
    
    def get_message(self, message_id: str) -> Optional[Message]:
        """获取消息
        
        Args:
            message_id: 消息ID
            
        Returns:
            Optional[Message]: 消息对象，如果不存在则返回None
        """
        return self.message_cache.get(message_id)
    
    def get_state(self, state_id: str) -> Optional[Any]:
        """获取状态
        
        Args:
            state_id: 状态ID
            
        Returns:
            Optional[Any]: 状态，如果不存在则返回None
        """
        return self.state_cache.get(state_id)
    
    def _clean_cache(self) -> None:
        """清理过期缓存"""
        # 清理过期消息
        now = datetime.now()
        expired_messages = [
            message_id for message_id, message in self.message_cache.items()
            if (now - message.header.timestamp).total_seconds() > self.max_message_age
        ]
        for message_id in expired_messages:
            del self.message_cache[message_id]
        
        # 如果缓存过大，清理最旧的消息
        if len(self.message_cache) > self.max_cache_size:
            sorted_messages = sorted(
                self.message_cache.items(),
                key=lambda x: x[1].header.timestamp
            )
            for message_id, _ in sorted_messages[:len(self.message_cache) - self.max_cache_size]:
                del self.message_cache[message_id]