"""零信任安全层模块

该模块实现了基于零信任架构的安全机制，包括审计链存证、隐私计算和动态RBAC。
"""

import uuid
import hashlib
import json
import time
from enum import Enum
from typing import Dict, List, Set, Optional, Any, Tuple, Callable, Union
from datetime import datetime, timedelta
from pydantic import BaseModel, Field, validator
from loguru import logger


class PermissionLevel(int, Enum):
    """权限级别枚举"""
    NONE = 0  # 无权限
    READ = 1  # 读取权限
    WRITE = 2  # 写入权限
    EXECUTE = 3  # 执行权限
    ADMIN = 4  # 管理员权限


class ResourceCategory(str, Enum):
    """资源类别枚举"""
    DATA = "data"  # 数据资源
    MODEL = "model"  # 模型资源
    API = "api"  # API资源
    SYSTEM = "system"  # 系统资源
    AGENT = "agent"  # 智能体资源


class AuditAction(str, Enum):
    """审计动作枚举"""
    CREATE = "create"  # 创建
    READ = "read"  # 读取
    UPDATE = "update"  # 更新
    DELETE = "delete"  # 删除
    EXECUTE = "execute"  # 执行
    LOGIN = "login"  # 登录
    LOGOUT = "logout"  # 登出
    GRANT = "grant"  # 授权
    REVOKE = "revoke"  # 撤销


class TrustLevel(int, Enum):
    """信任级别枚举"""
    UNTRUSTED = 0  # 不受信任
    LOW = 1  # 低信任
    MEDIUM = 2  # 中等信任
    HIGH = 3  # 高信任
    FULL = 4  # 完全信任


class Permission(BaseModel):
    """权限"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    resource_category: ResourceCategory  # 资源类别
    resource_id: str  # 资源ID
    level: PermissionLevel  # 权限级别
    conditions: Dict[str, Any] = Field(default_factory=dict)  # 条件
    expiration: Optional[datetime] = None  # 过期时间
    
    def is_expired(self) -> bool:
        """检查权限是否过期
        
        Returns:
            bool: 是否过期
        """
        if self.expiration is None:
            return False
        return datetime.now() > self.expiration
    
    def matches_conditions(self, context: Dict[str, Any]) -> bool:
        """检查是否满足条件
        
        Args:
            context: 上下文
            
        Returns:
            bool: 是否满足条件
        """
        for key, value in self.conditions.items():
            if key not in context or context[key] != value:
                return False
        return True


class Role(BaseModel):
    """角色"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # 角色名称
    description: Optional[str] = None  # 角色描述
    permissions: List[Permission] = Field(default_factory=list)  # 权限列表
    
    def add_permission(self, permission: Permission) -> None:
        """添加权限
        
        Args:
            permission: 权限
        """
        self.permissions.append(permission)
    
    def remove_permission(self, permission_id: str) -> bool:
        """移除权限
        
        Args:
            permission_id: 权限ID
            
        Returns:
            bool: 是否成功移除
        """
        for i, permission in enumerate(self.permissions):
            if permission.id == permission_id:
                self.permissions.pop(i)
                return True
        return False
    
    def has_permission(self, resource_category: ResourceCategory, resource_id: str, 
                      level: PermissionLevel, context: Dict[str, Any] = None) -> bool:
        """检查是否有权限
        
        Args:
            resource_category: 资源类别
            resource_id: 资源ID
            level: 权限级别
            context: 上下文
            
        Returns:
            bool: 是否有权限
        """
        if context is None:
            context = {}
        
        for permission in self.permissions:
            if permission.is_expired():
                continue
            
            if permission.resource_category == resource_category and \
               (permission.resource_id == resource_id or permission.resource_id == "*") and \
               permission.level.value >= level.value and \
               permission.matches_conditions(context):
                return True
        
        return False


class Subject(BaseModel):
    """主体
    
    可以是用户、智能体或系统组件
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # 主体名称
    type: str  # 主体类型（user, agent, system）
    roles: List[str] = Field(default_factory=list)  # 角色ID列表
    direct_permissions: List[Permission] = Field(default_factory=list)  # 直接权限列表
    attributes: Dict[str, Any] = Field(default_factory=dict)  # 属性
    trust_level: TrustLevel = TrustLevel.MEDIUM  # 信任级别
    trust_score: float = 50.0  # 信任分数（0-100）
    last_activity: datetime = Field(default_factory=datetime.now)  # 最后活动时间
    
    def add_role(self, role_id: str) -> None:
        """添加角色
        
        Args:
            role_id: 角色ID
        """
        if role_id not in self.roles:
            self.roles.append(role_id)
    
    def remove_role(self, role_id: str) -> bool:
        """移除角色
        
        Args:
            role_id: 角色ID
            
        Returns:
            bool: 是否成功移除
        """
        if role_id in self.roles:
            self.roles.remove(role_id)
            return True
        return False
    
    def add_direct_permission(self, permission: Permission) -> None:
        """添加直接权限
        
        Args:
            permission: 权限
        """
        self.direct_permissions.append(permission)
    
    def remove_direct_permission(self, permission_id: str) -> bool:
        """移除直接权限
        
        Args:
            permission_id: 权限ID
            
        Returns:
            bool: 是否成功移除
        """
        for i, permission in enumerate(self.direct_permissions):
            if permission.id == permission_id:
                self.direct_permissions.pop(i)
                return True
        return False
    
    def update_trust_score(self, delta: float) -> None:
        """更新信任分数
        
        Args:
            delta: 分数变化量
        """
        self.trust_score = max(0, min(100, self.trust_score + delta))
        
        # 根据分数更新信任级别
        if self.trust_score < 20:
            self.trust_level = TrustLevel.UNTRUSTED
        elif self.trust_score < 40:
            self.trust_level = TrustLevel.LOW
        elif self.trust_score < 70:
            self.trust_level = TrustLevel.MEDIUM
        elif self.trust_score < 90:
            self.trust_level = TrustLevel.HIGH
        else:
            self.trust_level = TrustLevel.FULL
    
    def update_activity(self) -> None:
        """更新活动时间"""
        self.last_activity = datetime.now()


class AuditRecord(BaseModel):
    """审计记录"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = Field(default_factory=datetime.now)  # 时间戳
    subject_id: str  # 主体ID
    subject_type: str  # 主体类型
    action: AuditAction  # 动作
    resource_category: ResourceCategory  # 资源类别
    resource_id: str  # 资源ID
    status: bool  # 状态（成功/失败）
    details: Dict[str, Any] = Field(default_factory=dict)  # 详情
    ip_address: Optional[str] = None  # IP地址
    hash_value: Optional[str] = None  # 哈希值
    
    def compute_hash(self, previous_hash: Optional[str] = None) -> str:
        """计算哈希值
        
        Args:
            previous_hash: 前一条记录的哈希值
            
        Returns:
            str: 哈希值
        """
        # 构建要哈希的数据
        data = {
            "id": self.id,
            "timestamp": self.timestamp.isoformat(),
            "subject_id": self.subject_id,
            "subject_type": self.subject_type,
            "action": self.action.value,
            "resource_category": self.resource_category.value,
            "resource_id": self.resource_id,
            "status": self.status,
            "details": self.details,
            "ip_address": self.ip_address,
            "previous_hash": previous_hash
        }
        
        # 计算哈希值
        data_str = json.dumps(data, sort_keys=True)
        self.hash_value = hashlib.sha256(data_str.encode()).hexdigest()
        return self.hash_value


class ZeroTrustSecurity:
    """零信任安全
    
    实现基于零信任架构的安全机制，包括审计链存证、隐私计算和动态RBAC
    """
    def __init__(self):
        """初始化零信任安全"""
        self.roles: Dict[str, Role] = {}  # 角色字典，键为角色ID
        self.subjects: Dict[str, Subject] = {}  # 主体字典，键为主体ID
        self.audit_records: List[AuditRecord] = []  # 审计记录列表
        self.last_hash: Optional[str] = None  # 最后一条审计记录的哈希值
        self.trust_decay_rate: float = 0.1  # 信任衰减率（每天）
        self.trust_boost_factors: Dict[AuditAction, float] = {  # 信任提升因子
            AuditAction.CREATE: 0.5,
            AuditAction.READ: 0.1,
            AuditAction.UPDATE: 0.3,
            AuditAction.DELETE: 0.2,
            AuditAction.EXECUTE: 0.4,
            AuditAction.LOGIN: 0.2,
            AuditAction.LOGOUT: 0.0,
            AuditAction.GRANT: 0.3,
            AuditAction.REVOKE: 0.2
        }
        self.trust_penalty_factors: Dict[AuditAction, float] = {  # 信任惩罚因子
            AuditAction.CREATE: -2.0,
            AuditAction.READ: -1.0,
            AuditAction.UPDATE: -2.0,
            AuditAction.DELETE: -3.0,
            AuditAction.EXECUTE: -2.0,
            AuditAction.LOGIN: -1.0,
            AuditAction.LOGOUT: 0.0,
            AuditAction.GRANT: -3.0,
            AuditAction.REVOKE: -2.0
        }
    
    def create_role(self, name: str, description: Optional[str] = None) -> str:
        """创建角色
        
        Args:
            name: 角色名称
            description: 角色描述
            
        Returns:
            str: 角色ID
        """
        role = Role(name=name, description=description)
        self.roles[role.id] = role
        return role.id
    
    def delete_role(self, role_id: str) -> bool:
        """删除角色
        
        Args:
            role_id: 角色ID
            
        Returns:
            bool: 是否成功删除
        """
        if role_id not in self.roles:
            return False
        
        # 从所有主体中移除该角色
        for subject in self.subjects.values():
            subject.remove_role(role_id)
        
        del self.roles[role_id]
        return True
    
    def create_subject(self, name: str, subject_type: str) -> str:
        """创建主体
        
        Args:
            name: 主体名称
            subject_type: 主体类型
            
        Returns:
            str: 主体ID
        """
        subject = Subject(name=name, type=subject_type)
        self.subjects[subject.id] = subject
        return subject.id
    
    def delete_subject(self, subject_id: str) -> bool:
        """删除主体
        
        Args:
            subject_id: 主体ID
            
        Returns:
            bool: 是否成功删除
        """
        if subject_id not in self.subjects:
            return False
        
        del self.subjects[subject_id]
        return True
    
    def assign_role(self, subject_id: str, role_id: str) -> bool:
        """分配角色
        
        Args:
            subject_id: 主体ID
            role_id: 角色ID
            
        Returns:
            bool: 是否成功分配
        """
        if subject_id not in self.subjects or role_id not in self.roles:
            return False
        
        self.subjects[subject_id].add_role(role_id)
        return True
    
    def revoke_role(self, subject_id: str, role_id: str) -> bool:
        """撤销角色
        
        Args:
            subject_id: 主体ID
            role_id: 角色ID
            
        Returns:
            bool: 是否成功撤销
        """
        if subject_id not in self.subjects:
            return False
        
        return self.subjects[subject_id].remove_role(role_id)
    
    def add_permission_to_role(self, role_id: str, resource_category: ResourceCategory, 
                              resource_id: str, level: PermissionLevel, 
                              conditions: Dict[str, Any] = None, 
                              expiration: Optional[datetime] = None) -> Optional[str]:
        """向角色添加权限
        
        Args:
            role_id: 角色ID
            resource_category: 资源类别
            resource_id: 资源ID
            level: 权限级别
            conditions: 条件
            expiration: 过期时间
            
        Returns:
            Optional[str]: 权限ID，如果失败则返回None
        """
        if role_id not in self.roles:
            return None
        
        if conditions is None:
            conditions = {}
        
        permission = Permission(
            resource_category=resource_category,
            resource_id=resource_id,
            level=level,
            conditions=conditions,
            expiration=expiration
        )
        
        self.roles[role_id].add_permission(permission)
        return permission.id
    
    def add_direct_permission(self, subject_id: str, resource_category: ResourceCategory, 
                             resource_id: str, level: PermissionLevel, 
                             conditions: Dict[str, Any] = None, 
                             expiration: Optional[datetime] = None) -> Optional[str]:
        """向主体添加直接权限
        
        Args:
            subject_id: 主体ID
            resource_category: 资源类别
            resource_id: 资源ID
            level: 权限级别
            conditions: 条件
            expiration: 过期时间
            
        Returns:
            Optional[str]: 权限ID，如果失败则返回None
        """
        if subject_id not in self.subjects:
            return None
        
        if conditions is None:
            conditions = {}
        
        permission = Permission(
            resource_category=resource_category,
            resource_id=resource_id,
            level=level,
            conditions=conditions,
            expiration=expiration
        )
        
        self.subjects[subject_id].add_direct_permission(permission)
        return permission.id
    
    def check_permission(self, subject_id: str, resource_category: ResourceCategory, 
                        resource_id: str, level: PermissionLevel, 
                        context: Dict[str, Any] = None) -> bool:
        """检查权限
        
        Args:
            subject_id: 主体ID
            resource_category: 资源类别
            resource_id: 资源ID
            level: 权限级别
            context: 上下文
            
        Returns:
            bool: 是否有权限
        """
        if subject_id not in self.subjects:
            return False
        
        if context is None:
            context = {}
        
        subject = self.subjects[subject_id]
        
        # 检查信任级别
        min_trust_level = self._get_min_trust_level(level)
        if subject.trust_level.value < min_trust_level.value:
            return False
        
        # 检查直接权限
        for permission in subject.direct_permissions:
            if permission.is_expired():
                continue
            
            if permission.resource_category == resource_category and \
               (permission.resource_id == resource_id or permission.resource_id == "*") and \
               permission.level.value >= level.value and \
               permission.matches_conditions(context):
                return True
        
        # 检查角色权限
        for role_id in subject.roles:
            if role_id in self.roles and self.roles[role_id].has_permission(
                resource_category, resource_id, level, context):
                return True
        
        return False
    
    def record_audit(self, subject_id: str, action: AuditAction, 
                    resource_category: ResourceCategory, resource_id: str, 
                    status: bool, details: Dict[str, Any] = None, 
                    ip_address: Optional[str] = None) -> str:
        """记录审计
        
        Args:
            subject_id: 主体ID
            action: 动作
            resource_category: 资源类别
            resource_id: 资源ID
            status: 状态（成功/失败）
            details: 详情
            ip_address: IP地址
            
        Returns:
            str: 审计记录ID
        """
        if details is None:
            details = {}
        
        subject_type = self.subjects[subject_id].type if subject_id in self.subjects else "unknown"
        
        # 创建审计记录
        record = AuditRecord(
            subject_id=subject_id,
            subject_type=subject_type,
            action=action,
            resource_category=resource_category,
            resource_id=resource_id,
            status=status,
            details=details,
            ip_address=ip_address
        )
        
        # 计算哈希值
        record.compute_hash(self.last_hash)
        self.last_hash = record.hash_value
        
        # 添加到审计记录列表
        self.audit_records.append(record)
        
        # 更新主体信任分数
        if subject_id in self.subjects:
            subject = self.subjects[subject_id]
            subject.update_activity()
            
            if status:
                # 成功操作，提升信任分数
                boost = self.trust_boost_factors.get(action, 0.1)
                subject.update_trust_score(boost)
            else:
                # 失败操作，降低信任分数
                penalty = self.trust_penalty_factors.get(action, -1.0)
                subject.update_trust_score(penalty)
        
        return record.id
    
    def verify_audit_chain(self) -> bool:
        """验证审计链
        
        检查审计记录链是否完整
        
        Returns:
            bool: 是否完整
        """
        if not self.audit_records:
            return True
        
        previous_hash = None
        for record in self.audit_records:
            # 重新计算哈希值
            computed_hash = record.compute_hash(previous_hash)
            
            # 检查哈希值是否匹配
            if record.hash_value != computed_hash:
                return False
            
            previous_hash = computed_hash
        
        return True
    
    def decay_trust_scores(self) -> None:
        """衰减信任分数
        
        随时间衰减所有主体的信任分数
        """
        now = datetime.now()
        
        for subject in self.subjects.values():
            # 计算自上次活动以来的天数
            days_since_activity = (now - subject.last_activity).total_seconds() / (24 * 3600)
            
            # 计算衰减量
            decay = self.trust_decay_rate * days_since_activity
            
            # 应用衰减
            if decay > 0:
                subject.update_trust_score(-decay)
    
    def _get_min_trust_level(self, permission_level: PermissionLevel) -> TrustLevel:
        """获取最小信任级别
        
        根据权限级别确定所需的最小信任级别
        
        Args:
            permission_level: 权限级别
            
        Returns:
            TrustLevel: 最小信任级别
        """
        if permission_level == PermissionLevel.NONE:
            return TrustLevel.UNTRUSTED
        elif permission_level == PermissionLevel.READ:
            return TrustLevel.LOW
        elif permission_level == PermissionLevel.WRITE:
            return TrustLevel.MEDIUM
        elif permission_level == PermissionLevel.EXECUTE:
            return TrustLevel.HIGH
        elif permission_level == PermissionLevel.ADMIN:
            return TrustLevel.FULL
        else:
            return TrustLevel.MEDIUM
    
    def get_audit_records(self, subject_id: Optional[str] = None, 
                         action: Optional[AuditAction] = None, 
                         resource_category: Optional[ResourceCategory] = None, 
                         start_time: Optional[datetime] = None, 
                         end_time: Optional[datetime] = None, 
                         limit: int = 100) -> List[AuditRecord]:
        """获取审计记录
        
        Args:
            subject_id: 主体ID
            action: 动作
            resource_category: 资源类别
            start_time: 开始时间
            end_time: 结束时间
            limit: 限制数量
            
        Returns:
            List[AuditRecord]: 审计记录列表
        """
        filtered_records = self.audit_records
        
        # 应用过滤条件
        if subject_id is not None:
            filtered_records = [r for r in filtered_records if r.subject_id == subject_id]
        
        if action is not None:
            filtered_records = [r for r in filtered_records if r.action == action]
        
        if resource_category is not None:
            filtered_records = [r for r in filtered_records if r.resource_category == resource_category]
        
        if start_time is not None:
            filtered_records = [r for r in filtered_records if r.timestamp >= start_time]
        
        if end_time is not None:
            filtered_records = [r for r in filtered_records if r.timestamp <= end_time]
        
        # 按时间戳排序并限制数量
        filtered_records.sort(key=lambda r: r.timestamp, reverse=True)
        return filtered_records[:limit]
    
    def export_audit_records(self, format: str = "json") -> str:
        """导出审计记录
        
        Args:
            format: 导出格式（json, csv）
            
        Returns:
            str: 导出的审计记录
            
        Raises:
            ValueError: 不支持的格式
        """
        if format == "json":
            records_dict = [record.dict() for record in self.audit_records]
            for record in records_dict:
                record["timestamp"] = record["timestamp"].isoformat()
            return json.dumps(records_dict, indent=2)
        elif format == "csv":
            header = "id,timestamp,subject_id,subject_type,action,resource_category,resource_id,status,hash_value\n"
            rows = []
            for record in self.audit_records:
                row = f"{record.id},{record.timestamp.isoformat()},{record.subject_id},{record.subject_type},"
                row += f"{record.action.value},{record.resource_category.value},{record.resource_id},"
                row += f"{record.status},{record.hash_value}\n"
                rows.append(row)
            return header + "".join(rows)
        else:
            raise ValueError(f"不支持的格式: {format}")