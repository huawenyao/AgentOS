"""动态本体库模块

该模块实现了智能体共享的领域本体库，支持术语映射和语义理解的一致性验证。
"""

import uuid
import json
import time
from enum import Enum
from typing import Dict, List, Set, Optional, Any, Tuple, Callable, Union
from datetime import datetime
from pydantic import BaseModel, Field, validator
from loguru import logger


class OntologyDomain(str, Enum):
    """本体领域枚举"""
    GENERAL = "general"  # 通用领域
    FINANCE = "finance"  # 金融领域
    HEALTHCARE = "healthcare"  # 医疗健康领域
    MANUFACTURING = "manufacturing"  # 制造业领域
    ENERGY = "energy"  # 能源领域
    TRANSPORTATION = "transportation"  # 交通领域
    EDUCATION = "education"  # 教育领域
    CUSTOM = "custom"  # 自定义领域


class OntologyRelationType(str, Enum):
    """本体关系类型枚举"""
    IS_A = "is_a"  # 是一种
    PART_OF = "part_of"  # 是部分
    HAS_PROPERTY = "has_property"  # 有属性
    RELATED_TO = "related_to"  # 相关
    SYNONYM = "synonym"  # 同义词
    ANTONYM = "antonym"  # 反义词
    CUSTOM = "custom"  # 自定义关系


class OntologyConcept(BaseModel):
    """本体概念"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # 概念名称
    domain: OntologyDomain  # 所属领域
    description: Optional[str] = None  # 概念描述
    properties: Dict[str, Any] = Field(default_factory=dict)  # 属性
    created_at: datetime = Field(default_factory=datetime.now)  # 创建时间
    updated_at: datetime = Field(default_factory=datetime.now)  # 更新时间
    confidence: float = 1.0  # 置信度
    source: Optional[str] = None  # 来源
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典
        
        Returns:
            Dict[str, Any]: 字典表示
        """
        return {
            "id": self.id,
            "name": self.name,
            "domain": self.domain.value,
            "description": self.description,
            "properties": self.properties,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "confidence": self.confidence,
            "source": self.source
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "OntologyConcept":
        """从字典创建
        
        Args:
            data: 字典数据
            
        Returns:
            OntologyConcept: 本体概念对象
        """
        return cls(
            id=data.get("id", str(uuid.uuid4())),
            name=data["name"],
            domain=OntologyDomain(data["domain"]),
            description=data.get("description"),
            properties=data.get("properties", {}),
            created_at=datetime.fromisoformat(data.get("created_at", datetime.now().isoformat())),
            updated_at=datetime.fromisoformat(data.get("updated_at", datetime.now().isoformat())),
            confidence=data.get("confidence", 1.0),
            source=data.get("source")
        )


class OntologyRelation(BaseModel):
    """本体关系"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    source_concept_id: str  # 源概念ID
    target_concept_id: str  # 目标概念ID
    relation_type: OntologyRelationType  # 关系类型
    properties: Dict[str, Any] = Field(default_factory=dict)  # 属性
    created_at: datetime = Field(default_factory=datetime.now)  # 创建时间
    updated_at: datetime = Field(default_factory=datetime.now)  # 更新时间
    confidence: float = 1.0  # 置信度
    bidirectional: bool = False  # 是否双向关系
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典
        
        Returns:
            Dict[str, Any]: 字典表示
        """
        return {
            "id": self.id,
            "source_concept_id": self.source_concept_id,
            "target_concept_id": self.target_concept_id,
            "relation_type": self.relation_type.value,
            "properties": self.properties,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "confidence": self.confidence,
            "bidirectional": self.bidirectional
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "OntologyRelation":
        """从字典创建
        
        Args:
            data: 字典数据
            
        Returns:
            OntologyRelation: 本体关系对象
        """
        return cls(
            id=data.get("id", str(uuid.uuid4())),
            source_concept_id=data["source_concept_id"],
            target_concept_id=data["target_concept_id"],
            relation_type=OntologyRelationType(data["relation_type"]),
            properties=data.get("properties", {}),
            created_at=datetime.fromisoformat(data.get("created_at", datetime.now().isoformat())),
            updated_at=datetime.fromisoformat(data.get("updated_at", datetime.now().isoformat())),
            confidence=data.get("confidence", 1.0),
            bidirectional=data.get("bidirectional", False)
        )


class OntologyMapping(BaseModel):
    """本体映射"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    source_concept_id: str  # 源概念ID
    target_concept_id: str  # 目标概念ID
    mapping_type: str  # 映射类型
    similarity_score: float  # 相似度分数
    context: Dict[str, Any] = Field(default_factory=dict)  # 上下文
    created_at: datetime = Field(default_factory=datetime.now)  # 创建时间
    updated_at: datetime = Field(default_factory=datetime.now)  # 更新时间
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典
        
        Returns:
            Dict[str, Any]: 字典表示
        """
        return {
            "id": self.id,
            "source_concept_id": self.source_concept_id,
            "target_concept_id": self.target_concept_id,
            "mapping_type": self.mapping_type,
            "similarity_score": self.similarity_score,
            "context": self.context,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "OntologyMapping":
        """从字典创建
        
        Args:
            data: 字典数据
            
        Returns:
            OntologyMapping: 本体映射对象
        """
        return cls(
            id=data.get("id", str(uuid.uuid4())),
            source_concept_id=data["source_concept_id"],
            target_concept_id=data["target_concept_id"],
            mapping_type=data["mapping_type"],
            similarity_score=data["similarity_score"],
            context=data.get("context", {}),
            created_at=datetime.fromisoformat(data.get("created_at", datetime.now().isoformat())),
            updated_at=datetime.fromisoformat(data.get("updated_at", datetime.now().isoformat()))
        )


class DynamicOntology:
    """动态本体库
    
    实现Agent共享领域本体库，支持术语映射和实时更新
    """
    def __init__(self):
        """初始化动态本体库"""
        self.concepts: Dict[str, OntologyConcept] = {}  # 概念字典，键为概念ID
        self.relations: Dict[str, OntologyRelation] = {}  # 关系字典，键为关系ID
        self.mappings: Dict[str, OntologyMapping] = {}  # 映射字典，键为映射ID
        self.concept_name_index: Dict[str, Set[str]] = {}  # 概念名称索引，键为名称，值为概念ID集合
        self.domain_index: Dict[str, Set[str]] = {}  # 领域索引，键为领域，值为概念ID集合
        self.on_concept_added: Optional[Callable[[OntologyConcept], None]] = None  # 概念添加回调
        self.on_relation_added: Optional[Callable[[OntologyRelation], None]] = None  # 关系添加回调
        self.on_mapping_added: Optional[Callable[[OntologyMapping], None]] = None  # 映射添加回调
    
    def add_concept(self, concept: OntologyConcept) -> str:
        """添加概念
        
        Args:
            concept: 本体概念
            
        Returns:
            str: 概念ID
        """
        self.concepts[concept.id] = concept
        
        # 更新索引
        if concept.name not in self.concept_name_index:
            self.concept_name_index[concept.name] = set()
        self.concept_name_index[concept.name].add(concept.id)
        
        if concept.domain.value not in self.domain_index:
            self.domain_index[concept.domain.value] = set()
        self.domain_index[concept.domain.value].add(concept.id)
        
        # 触发回调
        if self.on_concept_added:
            self.on_concept_added(concept)
        
        return concept.id
    
    def add_relation(self, relation: OntologyRelation) -> str:
        """添加关系
        
        Args:
            relation: 本体关系
            
        Returns:
            str: 关系ID
            
        Raises:
            ValueError: 源概念或目标概念不存在
        """
        if relation.source_concept_id not in self.concepts:
            raise ValueError(f"源概念不存在: {relation.source_concept_id}")
        
        if relation.target_concept_id not in self.concepts:
            raise ValueError(f"目标概念不存在: {relation.target_concept_id}")
        
        self.relations[relation.id] = relation
        
        # 触发回调
        if self.on_relation_added:
            self.on_relation_added(relation)
        
        return relation.id
    
    def add_mapping(self, mapping: OntologyMapping) -> str:
        """添加映射
        
        Args:
            mapping: 本体映射
            
        Returns:
            str: 映射ID
            
        Raises:
            ValueError: 源概念或目标概念不存在
        """
        if mapping.source_concept_id not in self.concepts:
            raise ValueError(f"源概念不存在: {mapping.source_concept_id}")
        
        if mapping.target_concept_id not in self.concepts:
            raise ValueError(f"目标概念不存在: {mapping.target_concept_id}")
        
        self.mappings[mapping.id] = mapping
        
        # 触发回调
        if self.on_mapping_added:
            self.on_mapping_added(mapping)
        
        return mapping.id
    
    def get_concept(self, concept_id: str) -> Optional[OntologyConcept]:
        """获取概念
        
        Args:
            concept_id: 概念ID
            
        Returns:
            Optional[OntologyConcept]: 本体概念，如果不存在则返回None
        """
        return self.concepts.get(concept_id)
    
    def get_relation(self, relation_id: str) -> Optional[OntologyRelation]:
        """获取关系
        
        Args:
            relation_id: 关系ID
            
        Returns:
            Optional[OntologyRelation]: 本体关系，如果不存在则返回None
        """
        return self.relations.get(relation_id)
    
    def get_mapping(self, mapping_id: str) -> Optional[OntologyMapping]:
        """获取映射
        
        Args:
            mapping_id: 映射ID
            
        Returns:
            Optional[OntologyMapping]: 本体映射，如果不存在则返回None
        """
        return self.mappings.get(mapping_id)
    
    def find_concepts_by_name(self, name: str) -> List[OntologyConcept]:
        """按名称查找概念
        
        Args:
            name: 概念名称
            
        Returns:
            List[OntologyConcept]: 概念列表
        """
        concept_ids = self.concept_name_index.get(name, set())
        return [self.concepts[concept_id] for concept_id in concept_ids]
    
    def find_concepts_by_domain(self, domain: Union[OntologyDomain, str]) -> List[OntologyConcept]:
        """按领域查找概念
        
        Args:
            domain: 领域
            
        Returns:
            List[OntologyConcept]: 概念列表
        """
        domain_value = domain.value if isinstance(domain, OntologyDomain) else domain
        concept_ids = self.domain_index.get(domain_value, set())
        return [self.concepts[concept_id] for concept_id in concept_ids]
    
    def find_relations_by_concept(self, concept_id: str) -> List[OntologyRelation]:
        """按概念查找关系
        
        Args:
            concept_id: 概念ID
            
        Returns:
            List[OntologyRelation]: 关系列表
        """
        return [
            relation for relation in self.relations.values()
            if relation.source_concept_id == concept_id or 
               (relation.bidirectional and relation.target_concept_id == concept_id)
        ]
    
    def find_mappings_by_concept(self, concept_id: str) -> List[OntologyMapping]:
        """按概念查找映射
        
        Args:
            concept_id: 概念ID
            
        Returns:
            List[OntologyMapping]: 映射列表
        """
        return [
            mapping for mapping in self.mappings.values()
            if mapping.source_concept_id == concept_id or mapping.target_concept_id == concept_id
        ]
    
    def get_concept_context(self, concept_id: str, depth: int = 1) -> Dict[str, Any]:
        """获取概念上下文
        
        Args:
            concept_id: 概念ID
            depth: 关系深度
            
        Returns:
            Dict[str, Any]: 上下文
            
        Raises:
            ValueError: 概念不存在
        """
        if concept_id not in self.concepts:
            raise ValueError(f"概念不存在: {concept_id}")
        
        concept = self.concepts[concept_id]
        context = {
            "concept": concept.to_dict(),
            "relations": [],
            "mappings": []
        }
        
        # 添加关系
        visited = {concept_id}
        self._add_relations_to_context(concept_id, context, visited, depth)
        
        # 添加映射
        for mapping in self.find_mappings_by_concept(concept_id):
            context["mappings"].append(mapping.to_dict())
        
        return context
    
    def _add_relations_to_context(self, concept_id: str, context: Dict[str, Any], 
                                 visited: Set[str], depth: int) -> None:
        """添加关系到上下文
        
        Args:
            concept_id: 概念ID
            context: 上下文
            visited: 已访问的概念ID集合
            depth: 关系深度
        """
        if depth <= 0:
            return
        
        relations = self.find_relations_by_concept(concept_id)
        for relation in relations:
            relation_dict = relation.to_dict()
            context["relations"].append(relation_dict)
            
            # 递归添加关联概念的关系
            next_concept_id = relation.target_concept_id
            if relation.source_concept_id != concept_id:
                next_concept_id = relation.source_concept_id
            
            if next_concept_id not in visited:
                visited.add(next_concept_id)
                self._add_relations_to_context(next_concept_id, context, visited, depth - 1)
    
    def disambiguate_term(self, term: str, context: Dict[str, Any] = None) -> List[Tuple[OntologyConcept, float]]:
        """消歧术语
        
        Args:
            term: 术语
            context: 上下文
            
        Returns:
            List[Tuple[OntologyConcept, float]]: 概念和置信度列表
        """
        # 首先尝试精确匹配
        exact_matches = self.find_concepts_by_name(term)
        if exact_matches and not context:
            return [(concept, 1.0) for concept in exact_matches]
        
        # 如果有上下文或没有精确匹配，进行模糊匹配
        candidates = []
        
        # 添加精确匹配的候选项
        for concept in exact_matches:
            candidates.append((concept, 0.9))  # 基础分数
        
        # TODO: 实现更复杂的模糊匹配和上下文相关性评分
        # 这里可以使用向量相似度、编辑距离等方法
        
        # 根据上下文调整分数
        if context:
            for i, (concept, score) in enumerate(candidates):
                # 检查领域匹配
                if "domain" in context and concept.domain.value == context["domain"]:
                    candidates[i] = (concept, min(score + 0.1, 1.0))
                
                # 检查属性匹配
                if "properties" in context:
                    for key, value in context["properties"].items():
                        if key in concept.properties and concept.properties[key] == value:
                            candidates[i] = (concept, min(score + 0.05, 1.0))
        
        # 排序并返回结果
        return sorted(candidates, key=lambda x: x[1], reverse=True)
    
    def verify_semantic_consistency(self, concept_id: str, interpretation: Dict[str, Any], 
                                   threshold: float = 0.75) -> Tuple[bool, float, str]:
        """验证语义一致性
        
        Args:
            concept_id: 概念ID
            interpretation: 解释
            threshold: 阈值
            
        Returns:
            Tuple[bool, float, str]: (是否一致, 一致性分数, 原因)
        """
        if concept_id not in self.concepts:
            return False, 0.0, f"概念不存在: {concept_id}"
        
        concept = self.concepts[concept_id]
        consistency_score = 0.0
        reasons = []
        
        # 检查属性一致性
        if "properties" in interpretation:
            property_score = 0.0
            property_count = 0
            
            for key, value in interpretation["properties"].items():
                property_count += 1
                if key in concept.properties:
                    if concept.properties[key] == value:
                        property_score += 1.0
                    else:
                        property_score += 0.5
                        reasons.append(f"属性'{key}'值不完全匹配")
                else:
                    reasons.append(f"属性'{key}'不存在于概念中")
            
            if property_count > 0:
                consistency_score += (property_score / property_count) * 0.6
        
        # 检查关系一致性
        if "relations" in interpretation:
            relation_score = 0.0
            relation_count = 0
            
            for relation_data in interpretation["relations"]:
                relation_count += 1
                relation_type = relation_data.get("type")
                target_name = relation_data.get("target")
                
                if not relation_type or not target_name:
                    continue
                
                # 查找目标概念
                target_concepts = self.find_concepts_by_name(target_name)
                if not target_concepts:
                    reasons.append(f"关系目标概念'{target_name}'不存在")
                    continue
                
                # 检查是否存在匹配的关系
                found_relation = False
                for target_concept in target_concepts:
                    for relation in self.find_relations_by_concept(concept_id):
                        if (relation.target_concept_id == target_concept.id and 
                            relation.relation_type.value == relation_type):
                            found_relation = True
                            relation_score += 1.0
                            break
                    
                    if found_relation:
                        break
                
                if not found_relation:
                    reasons.append(f"关系'{relation_type}'到'{target_name}'不存在")
            
            if relation_count > 0:
                consistency_score += (relation_score / relation_count) * 0.4
        
        # 判断一致性
        is_consistent = consistency_score >= threshold
        reason = "语义一致" if is_consistent else ", ".join(reasons)
        
        return is_consistent, consistency_score, reason
    
    def export_to_json(self, file_path: str) -> None:
        """导出到JSON文件
        
        Args:
            file_path: 文件路径
        """
        data = {
            "concepts": [concept.to_dict() for concept in self.concepts.values()],
            "relations": [relation.to_dict() for relation in self.relations.values()],
            "mappings": [mapping.to_dict() for mapping in self.mappings.values()]
        }
        
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    
    @classmethod
    def import_from_json(cls, file_path: str) -> "DynamicOntology":
        """从JSON文件导入
        
        Args:
            file_path: 文件路径
            
        Returns:
            DynamicOntology: 动态本体库对象
        """
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        ontology = cls()
        
        # 导入概念
        for concept_data in data.get("concepts", []):
            concept = OntologyConcept.from_dict(concept_data)
            ontology.concepts[concept.id] = concept
            
            # 更新索引
            if concept.name not in ontology.concept_name_index:
                ontology.concept_name_index[concept.name] = set()
            ontology.concept_name_index[concept.name].add(concept.id)
            
            if concept.domain.value not in ontology.domain_index:
                ontology.domain_index[concept.domain.value] = set()
            ontology.domain_index[concept.domain.value].add(concept.id)
        
        # 导入关系
        for relation_data in data.get("relations", []):
            relation = OntologyRelation.from_dict(relation_data)
            ontology.relations[relation.id] = relation
        
        # 导入映射
        for mapping_data in data.get("mappings", []):
            mapping = OntologyMapping.from_dict(mapping_data)
            ontology.mappings[mapping.id] = mapping
        
        return ontology