"""配置管理模块

该模块负责加载和管理系统的各种配置参数，支持从环境变量、配置文件等多种来源加载配置。
"""

import os
import json
from pathlib import Path
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from loguru import logger

# 加载环境变量
load_dotenv()

# 基础配置路径
BASE_DIR = Path(__file__).parent.parent
CONFIG_DIR = BASE_DIR / "config"


class SystemConfig(BaseModel):
    """系统基础配置"""
    debug: bool = Field(default=False, description="是否开启调试模式")
    log_level: str = Field(default="INFO", description="日志级别")
    api_host: str = Field(default="0.0.0.0", description="API服务主机")
    api_port: int = Field(default=8000, description="API服务端口")
    secret_key: str = Field(default="efiagent-secret-key", description="系统密钥")


class AgentConfig(BaseModel):
    """智能体配置"""
    max_agents: int = Field(default=100, description="最大智能体数量")
    default_timeout: int = Field(default=30, description="默认超时时间(秒)")
    retry_attempts: int = Field(default=3, description="重试次数")
    planning_model: str = Field(default="gpt-4", description="规划模型")
    execution_model: str = Field(default="gpt-3.5-turbo", description="执行模型")
    audit_model: str = Field(default="gpt-4", description="审核模型")


class CommunicationConfig(BaseModel):
    """通信配置"""
    protocol: str = Field(default="grpc", description="通信协议")
    message_queue_url: str = Field(default="amqp://guest:guest@localhost:5672/", description="消息队列URL")
    max_message_size: int = Field(default=10 * 1024 * 1024, description="最大消息大小(字节)")
    heartbeat_interval: int = Field(default=30, description="心跳间隔(秒)")


class StorageConfig(BaseModel):
    """存储配置"""
    memory_db_url: str = Field(default="mongodb://localhost:27017/efiagent", description="记忆数据库URL")
    knowledge_graph_url: str = Field(default="bolt://localhost:7687", description="知识图谱URL")
    vector_db_path: str = Field(default=str(BASE_DIR / "data" / "vector_db"), description="向量数据库路径")
    cache_url: str = Field(default="redis://localhost:6379/0", description="缓存URL")


class SecurityConfig(BaseModel):
    """安全配置"""
    token_expire_minutes: int = Field(default=60, description="令牌过期时间(分钟)")
    password_min_length: int = Field(default=8, description="密码最小长度")
    allowed_origins: list = Field(default=["*"], description="允许的跨域来源")
    ssl_enabled: bool = Field(default=False, description="是否启用SSL")
    ssl_cert_path: Optional[str] = Field(default=None, description="SSL证书路径")
    ssl_key_path: Optional[str] = Field(default=None, description="SSL密钥路径")


class MonitoringConfig(BaseModel):
    """监控配置"""
    prometheus_enabled: bool = Field(default=True, description="是否启用Prometheus")
    prometheus_port: int = Field(default=9090, description="Prometheus端口")
    jaeger_enabled: bool = Field(default=True, description="是否启用Jaeger")
    jaeger_host: str = Field(default="localhost", description="Jaeger主机")
    jaeger_port: int = Field(default=6831, description="Jaeger端口")
    log_retention_days: int = Field(default=30, description="日志保留天数")


class Config(BaseModel):
    """总配置"""
    system: SystemConfig = Field(default_factory=SystemConfig)
    agent: AgentConfig = Field(default_factory=AgentConfig)
    communication: CommunicationConfig = Field(default_factory=CommunicationConfig)
    storage: StorageConfig = Field(default_factory=StorageConfig)
    security: SecurityConfig = Field(default_factory=SecurityConfig)
    monitoring: MonitoringConfig = Field(default_factory=MonitoringConfig)


def load_config() -> Config:
    """加载配置
    
    从环境变量和配置文件加载配置，环境变量优先级高于配置文件
    
    Returns:
        Config: 配置对象
    """
    # 默认配置
    config = Config()
    
    # 从配置文件加载
    config_file = os.environ.get("EFIAGENT_CONFIG", str(CONFIG_DIR / "config.json"))
    if os.path.exists(config_file):
        try:
            with open(config_file, "r", encoding="utf-8") as f:
                config_data = json.load(f)
                config = Config.parse_obj(config_data)
                logger.info(f"Loaded configuration from {config_file}")
        except Exception as e:
            logger.error(f"Failed to load configuration from {config_file}: {e}")
    
    # 从环境变量加载覆盖配置
    _override_from_env(config)
    
    return config


def _override_from_env(config: Config) -> None:
    """从环境变量覆盖配置
    
    环境变量格式: EFIAGENT_{SECTION}_{KEY}，例如 EFIAGENT_SYSTEM_DEBUG
    
    Args:
        config (Config): 配置对象
    """
    prefix = "EFIAGENT_"
    for key, value in os.environ.items():
        if key.startswith(prefix):
            parts = key[len(prefix):].lower().split("_", 1)
            if len(parts) == 2:
                section, option = parts
                if hasattr(config, section) and hasattr(getattr(config, section), option):
                    section_obj = getattr(config, section)
                    option_type = type(getattr(section_obj, option))
                    try:
                        if option_type == bool:
                            setattr(section_obj, option, value.lower() in ("true", "1", "yes"))
                        elif option_type == int:
                            setattr(section_obj, option, int(value))
                        elif option_type == float:
                            setattr(section_obj, option, float(value))
                        elif option_type == list:
                            setattr(section_obj, option, value.split(","))
                        else:
                            setattr(section_obj, option, value)
                        logger.debug(f"Override config {section}.{option} from environment variable")
                    except Exception as e:
                        logger.error(f"Failed to override config {section}.{option} from environment variable: {e}")


# 全局配置实例
config = load_config()