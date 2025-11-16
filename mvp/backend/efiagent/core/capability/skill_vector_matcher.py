"""
高级技能向量匹配器
Advanced Skill Vector Matcher

实现多模态技能嵌入和智能匹配算法
Phase 2核心功能
"""

import asyncio
import time
import numpy as np
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from enum import Enum
import torch
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import normalize
import faiss
import networkx as nx
import json

class SkillCategory(Enum):
    """技能分类枚举"""
    ANALYSIS = "analysis"
    CREATION = "creation"
    COMMUNICATION = "communication"
    COORDINATION = "coordination"
    EXECUTION = "execution"
    LEARNING = "learning"
    SECURITY = "security"
    INTEGRATION = "integration"

class ComplexityLevel(Enum):
    """复杂度级别"""
    BASIC = 1
    INTERMEDIATE = 3
    ADVANCED = 5
    EXPERT = 8
    MASTER = 10

@dataclass
class SkillEmbedding:
    """技能嵌入向量"""
    skill_id: str
    skill_name: str
    description: str
    category: SkillCategory
    complexity: ComplexityLevel
    embedding: np.ndarray
    dependencies: List[str]
    metadata: Dict[str, Any]
    performance_history: List[Tuple[str, float]]  # (task_type, performance)
    last_updated: float

@dataclass
class MatchResult:
    """匹配结果"""
    agent_id: str
    match_score: float
    skill_coverage: float
    complexity_match: float
    performance_prediction: float
    collaboration_score: float
    details: Dict[str, Any]

class MultiModalSkillEmbedding:
    """多模态技能嵌入系统"""

    def __init__(self):
        # 多个嵌入模型
        self.models = {
            'semantic': SentenceTransformer('all-mpnet-base-v2'),
            'syntactic': SentenceTransformer('paraphrase-MiniLM-L6-v2'),
            'domain': self._load_domain_model(),
            'graph': self._load_graph_model()
        }

        # 专业词汇表
        self.domain_vocab = self._load_domain_vocabulary()

        # 技能分类体系
        self.skill_taxonomy = self._load_skill_taxonomy()

    def embed_skill(self, skill: Dict[str, Any]) -> SkillEmbedding:
        """生成技能的多模态嵌入向量"""

        # 1. 语义嵌入
        semantic_text = f"{skill['name']} {skill['description']}"
        semantic_vec = self.models['semantic'].encode(semantic_text)

        # 2. 语法嵌入
        syntactic_vec = self.models['syntactic'].encode(skill['description'])

        # 3. 领域特定嵌入
        domain_vec = self._domain_embed(skill)

        # 4. 复杂度编码
        complexity_vec = self._encode_complexity(skill.get('complexity', ComplexityLevel.INTERMEDIATE))

        # 5. 依赖关系嵌入
        dependency_vec = self._encode_dependencies(skill.get('dependencies', []))

        # 6. 性能历史编码
        performance_vec = self._encode_performance_history(skill.get('performance_history', []))

        # 7. 多模态融合
        combined_embedding = self._fuse_embeddings([
            semantic_vec,
            syntactic_vec,
            domain_vec,
            complexity_vec,
            dependency_vec,
            performance_vec
        ])

        return SkillEmbedding(
            skill_id=skill['id'],
            skill_name=skill['name'],
            description=skill['description'],
            category=SkillCategory(skill.get('category', 'execution')),
            complexity=ComplexityLevel(skill.get('complexity', 3)),
            embedding=combined_embedding,
            dependencies=skill.get('dependencies', []),
            metadata=skill.get('metadata', {}),
            performance_history=skill.get('performance_history', []),
            last_updated=time.time()
        )

    def _domain_embed(self, skill: Dict[str, Any]) -> np.ndarray:
        """领域特定嵌入"""
        domain_text = f"{skill.get('domain', 'general')} {skill.get('category', 'general')}"
        return self.models['domain'].encode(domain_text)

    def _encode_complexity(self, complexity: ComplexityLevel) -> np.ndarray:
        """复杂度编码"""
        complexity_vec = np.zeros(10)
        complexity_vec[complexity.value - 1] = 1.0
        return complexity_vec

    def _encode_dependencies(self, dependencies: List[str]) -> np.ndarray:
        """依赖关系嵌入"""
        if not dependencies:
            return np.zeros(64)

        # 使用预训练的嵌入编码依赖关系
        dep_text = " ".join(dependencies)
        return self.models['semantic'].encode(dep_text)[:64]

    def _encode_performance_history(self, history: List[Tuple[str, float]]) -> np.ndarray:
        """性能历史编码"""
        if not history:
            return np.zeros(32)

        # 计算统计特征
        performances = [h[1] for h in history]
        if len(performances) == 0:
            return np.zeros(32)

        features = [
            np.mean(performances),
            np.std(performances),
            np.max(performances),
            np.min(performances),
            len(performances)
        ]

        # 扩展到32维
        result = np.zeros(32)
        result[:len(features)] = features

        return result

    def _fuse_embeddings(self, embeddings: List[np.ndarray]) -> np.ndarray:
        """多模态嵌入融合"""
        # 标准化所有嵌入
        normalized_embeddings = []
        for emb in embeddings:
            if emb.size > 0:
                normalized_emb = normalize(emb.reshape(1, -1)).flatten()
                normalized_embeddings.append(normalized_emb)

        if not normalized_embeddings:
            return np.zeros(512)

        # 加权平均融合
        weights = [0.3, 0.2, 0.2, 0.1, 0.1, 0.1]  # 可调整权重
        weighted_sum = sum(w * emb for w, emb in zip(weights, normalized_embeddings))

        return weighted_sum

    def _load_domain_model(self):
        """加载领域特定模型"""
        # 这里可以加载预训练的领域模型
        return SentenceTransformer('all-MiniLM-L6-v2')

    def _load_graph_model(self):
        """加载图结构模型"""
        # 这里可以加载图嵌入模型
        return None

    def _load_domain_vocabulary(self) -> Dict[str, List[str]]:
        """加载领域词汇表"""
        return {
            'technical': ['algorithm', 'programming', 'database', 'api', 'framework'],
            'business': ['strategy', 'planning', 'management', 'marketing', 'finance'],
            'creative': ['design', 'writing', 'art', 'music', 'innovation'],
            'analytical': ['research', 'analysis', 'statistics', 'optimization', 'modeling']
        }

    def _load_skill_taxonomy(self) -> Dict[str, List[str]]:
        """加载技能分类体系"""
        return {
            'analysis': ['data_analysis', 'requirement_analysis', 'risk_analysis', 'market_analysis'],
            'creation': ['content_creation', 'code_generation', 'design_creation', 'solution_creation'],
            'execution': ['task_execution', 'process_execution', 'automation', 'implementation'],
            'coordination': ['project_coordination', 'team_coordination', 'resource_coordination']
        }

class AdvancedSkillVectorMatcher:
    """高级技能向量匹配器"""

    def __init__(self, embedding_dim=512):
        self.embedding_dim = embedding_dim
        self.multimodal_embedding = MultiModalSkillEmbedding()

        # FAISS索引
        self.skill_index = faiss.IndexFlatIP(embedding_dim)
        self.skill_embeddings: Dict[str, SkillEmbedding] = {}

        # 技能图谱
        self.skill_graph = nx.DiGraph()

        # 匹配算法配置
        self.config = {
            'semantic_weight': 0.35,
            'performance_weight': 0.25,
            'complexity_weight': 0.20,
            'collaboration_weight': 0.15,
            'learning_weight': 0.05
        }

    async def register_skill(self, skill: Dict[str, Any]) -> bool:
        """注册技能到系统"""
        try:
            # 生成嵌入
            embedding = self.multimodal_embedding.embed_skill(skill)

            # 添加到索引
            vector_id = len(self.skill_embeddings)
            self.skill_index.add(np.array([embedding.embedding]))
            self.skill_embeddings[skill['id']] = embedding

            # 更新技能图谱
            self._update_skill_graph(embedding)

            return True

        except Exception as e:
            print(f"Error registering skill {skill['id']}: {e}")
            return False

    async def advanced_agent_task_matching(
        self,
        task_requirements: Dict[str, Any],
        available_agents: List[Dict[str, Any]],
        context: Dict[str, Any] = None
    ) -> List[MatchResult]:
        """高级智能体-任务匹配"""

        # 1. 生成任务需求向量
        task_embedding = await self._embed_task_requirements(task_requirements)

        # 2. 初步筛选候选智能体
        candidates = await self._filter_candidates(task_requirements, available_agents)

        # 3. 详细匹配评分
        match_results = []
        for agent in candidates:
            result = await self._calculate_match_score(
                agent, task_embedding, task_requirements, context
            )
            match_results.append(result)

        # 4. 综合排序
        match_results.sort(key=lambda x: x.match_score, reverse=True)

        return match_results

    async def dynamic_team_composition(
        self,
        task_complexity: Dict[str, Any],
        team_size_constraint: Tuple[int, int],
        available_agents: List[Dict[str, Any]],
        diversity_requirement: float = 0.7
    ) -> List[str]:
        """动态团队组成优化"""

        # 1. 分析任务需求
        required_skills = await self._analyze_task_complexity(task_complexity)

        # 2. 多目标优化
        optimal_team = await self._multi_objective_optimization(
            candidates=available_agents,
            objectives=[
                self._skill_coverage_objective,
                self._diversity_objective,
                self._collaboration_efficiency_objective,
                self._load_balance_objective
            ],
            constraints=[
                self._team_size_constraint(team_size_constraint),
                self._skill_coverage_constraint(required_skills),
                self._diversity_constraint(diversity_requirement)
            ],
            required_skills=required_skills
        )

        return optimal_team

    async def learning_adaptive_matching(
        self,
        agent: Dict[str, Any],
        task: Dict[str, Any],
        historical_performance: Dict[str, float]
    ) -> MatchResult:
        """学习自适应匹配"""

        # 1. 基础技能匹配
        base_result = await self._calculate_match_score(
            agent, None, task, {'historical_performance': historical_performance}
        )

        # 2. 学习能力评估
        learning_score = await self._assess_learning_capability(
            agent, historical_performance
        )

        # 3. 自适应调整
        adapted_score = base_result.match_score * (1 + 0.1 * learning_score)

        return MatchResult(
            agent_id=agent['id'],
            match_score=adapted_score,
            skill_coverage=base_result.skill_coverage,
            complexity_match=base_result.complexity_match,
            performance_prediction=base_result.performance_prediction,
            collaboration_score=base_result.collaboration_score,
            details={
                **base_result.details,
                'learning_score': learning_score,
                'adaptation_applied': True
            }
        )

    async def _embed_task_requirements(self, task_requirements: Dict[str, Any]) -> np.ndarray:
        """嵌入任务需求向量"""
        text_components = []

        # 从需求中提取文本
        if 'description' in task_requirements:
            text_components.append(task_requirements['description'])
        if 'requirements' in task_requirements:
            text_components.extend(task_requirements['requirements'])
        if 'skills_needed' in task_requirements:
            text_components.extend(task_requirements['skills_needed'])

        combined_text = " ".join(text_components)
        return self.multimodal_embedding.models['semantic'].encode(combined_text)

    async def _filter_candidates(
        self,
        task_requirements: Dict[str, Any],
        available_agents: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """筛选候选智能体"""
        candidates = []
        required_skills = set(task_requirements.get('required_skills', []))

        for agent in available_agents:
            agent_skills = set(agent.get('skills', []))

            # 检查技能匹配度
            skill_match_ratio = len(required_skills & agent_skills) / max(len(required_skills), 1)

            if skill_match_ratio > 0.3:  # 至少30%技能匹配
                candidates.append(agent)

        return candidates

    async def _calculate_match_score(
        self,
        agent: Dict[str, Any],
        task_embedding: Optional[np.ndarray],
        task_requirements: Dict[str, Any],
        context: Dict[str, Any] = None
    ) -> MatchResult:
        """计算匹配分数"""

        # 1. 技能匹配度
        skill_coverage = await self._calculate_skill_coverage(agent, task_requirements)

        # 2. 复杂度匹配
        complexity_match = await self._calculate_complexity_match(agent, task_requirements)

        # 3. 性能预测
        performance_prediction = await self._predict_performance(agent, task_requirements)

        # 4. 协作兼容性
        collaboration_score = await self._assess_collaboration_compatibility(agent, context)

        # 5. 综合评分
        total_score = (
            skill_coverage * self.config['semantic_weight'] +
            performance_prediction * self.config['performance_weight'] +
            complexity_match * self.config['complexity_weight'] +
            collaboration_score * self.config['collaboration_weight']
        )

        return MatchResult(
            agent_id=agent['id'],
            match_score=total_score,
            skill_coverage=skill_coverage,
            complexity_match=complexity_match,
            performance_prediction=performance_prediction,
            collaboration_score=collaboration_score,
            details={
                'agent_type': agent.get('type', 'unknown'),
                'agent_status': agent.get('status', 'unknown'),
                'match_breakdown': {
                    'skill_coverage': skill_coverage,
                    'complexity_match': complexity_match,
                    'performance_prediction': performance_prediction,
                    'collaboration_score': collaboration_score
                }
            }
        )

    def _update_skill_graph(self, skill_embedding: SkillEmbedding):
        """更新技能图谱"""
        self.skill_graph.add_node(skill_embedding.skill_id, **{
            'name': skill_embedding.skill_name,
            'category': skill_embedding.category.value,
            'complexity': skill_embedding.complexity.value
        })

        # 添加依赖关系
        for dep_id in skill_embedding.dependencies:
            if dep_id in self.skill_embeddings:
                self.skill_graph.add_edge(dep_id, skill_embedding.skill_id)

    async def _multi_objective_optimization(
        self,
        candidates: List[Dict[str, Any]],
        objectives: List[callable],
        constraints: List[callable],
        required_skills: List[str]
    ) -> List[str]:
        """多目标优化算法"""

        # 简化的NSGA-II实现
        population_size = min(len(candidates), 50)
        generations = 50

        # 初始化种群
        population = []
        for _ in range(population_size):
            individual = np.random.choice(
                [c['id'] for c in candidates],
                size=np.random.randint(2, 8),
                replace=False
            )
            population.append(individual)

        # 进化过程
        for generation in range(generations):
            # 评估适应度
            fitness_scores = []
            for individual in population:
                scores = []
                for obj_func in objectives:
                    score = obj_func(individual, candidates, required_skills)
                    scores.append(score)
                fitness_scores.append(scores)

            # 选择、交叉、变异
            new_population = []
            for _ in range(population_size):
                # 锦标赛选择
                parent1, parent2 = self._tournament_selection(population, fitness_scores, 2)
                child = self._crossover(parent1, parent2, candidates)
                child = self._mutate(child, candidates)
                new_population.append(child)

            population = new_population

        # 选择最优解
        best_individual = max(population, key=lambda x: self._calculate_total_fitness(x, candidates, required_skills))

        return best_individual.tolist()

    def _tournament_selection(self, population, fitness_scores, k):
        """锦标赛选择"""
        selected = []
        for _ in range(k):
            indices = np.random.choice(len(population), 3, replace=False)
            fitness_values = [fitness_scores[i][0] for i in indices]  # 使用第一个目标函数
            winner_idx = indices[np.argmax(fitness_values)]
            selected.append(population[winner_idx])
        return selected

    def _crossover(self, parent1, parent2, candidates):
        """交叉操作"""
        # 简单的单点交叉
        crossover_point = np.random.randint(1, min(len(parent1), len(parent2)))
        child = np.concatenate([parent1[:crossover_point], parent2[crossover_point:]])
        return child

    def _mutate(self, individual, candidates):
        """变异操作"""
        if np.random.random() < 0.1:  # 10%变异概率
            mutation_point = np.random.randint(0, len(individual))
            available_agents = [c['id'] for c in candidates if c['id'] not in individual]
            if available_agents:
                individual[mutation_point] = np.random.choice(available_agents)
        return individual

    def _calculate_total_fitness(self, individual, candidates, required_skills):
        """计算总适应度"""
        team_agents = [c for c in candidates if c['id'] in individual]

        # 技能覆盖度
        team_skills = set()
        for agent in team_agents:
            team_skills.update(agent.get('skills', []))
        skill_coverage = len(team_skills & set(required_skills)) / len(required_skills)

        # 团队多样性
        agent_types = [agent.get('type', 'unknown') for agent in team_agents]
        diversity = len(set(agent_types)) / len(agent_types) if agent_types else 0

        return 0.7 * skill_coverage + 0.3 * diversity

    # 目标函数
    def _skill_coverage_objective(self, team, candidates, required_skills):
        """技能覆盖度目标函数"""
        team_agents = [c for c in candidates if c['id'] in team]
        team_skills = set()
        for agent in team_agents:
            team_skills.update(agent.get('skills', []))
        return len(team_skills & set(required_skills)) / len(required_skills)

    def _diversity_objective(self, team, candidates, required_skills):
        """团队多样性目标函数"""
        team_agents = [c for c in candidates if c['id'] in team]
        if not team_agents:
            return 0

        # 计算多样性指标
        agent_types = [agent.get('type', 'unknown') for agent in team_agents]
        type_diversity = len(set(agent_types)) / len(agent_types)

        # 技能多样性
        all_skills = []
        for agent in team_agents:
            all_skills.extend(agent.get('skills', []))
        skill_diversity = len(set(all_skills)) / len(all_skills) if all_skills else 0

        return (type_diversity + skill_diversity) / 2

    def _collaboration_efficiency_objective(self, team, candidates, required_skills):
        """协作效率目标函数"""
        team_agents = [c for c in candidates if c['id'] in team]
        if len(team_agents) <= 1:
            return 0

        # 基于历史协作数据评估
        total_collaboration_score = 0
        for agent in team_agents:
            total_collaboration_score += agent.get('collaboration_score', 0.5)

        return total_collaboration_score / len(team_agents)

    def _load_balance_objective(self, team, candidates, required_skills):
        """负载平衡目标函数"""
        team_agents = [c for c in candidates if c['id'] in team]
        if not team_agents:
            return 0

        # 计算负载方差（假设负载均匀分布为最优）
        loads = [agent.get('current_load', 0.5) for agent in team_agents]
        mean_load = np.mean(loads)
        variance = np.var(loads)

        # 转换为最大化问题（方差越小越好）
        return 1.0 / (1.0 + variance)

    # 约束函数
    def _team_size_constraint(self, size_range: Tuple[int, int]):
        """团队大小约束"""
        def constraint(team, candidates, required_skills):
            return size_range[0] <= len(team) <= size_range[1]
        return constraint

    def _skill_coverage_constraint(self, required_skills):
        """技能覆盖约束"""
        def constraint(team, candidates, required_skills):
            team_agents = [c for c in candidates if c['id'] in team]
            team_skills = set()
            for agent in team_agents:
                team_skills.update(agent.get('skills', []))
            return len(team_skills & set(required_skills)) >= len(required_skills) * 0.8
        return constraint

    def _diversity_constraint(self, min_diversity):
        """多样性约束"""
        def constraint(team, candidates, required_skills):
            team_agents = [c for c in candidates if c['id'] in team]
            if len(team_agents) <= 1:
                return False

            agent_types = [agent.get('type', 'unknown') for agent in team_agents]
            diversity = len(set(agent_types)) / len(agent_types)
            return diversity >= min_diversity
        return constraint

    # 辅助方法
    async def _calculate_skill_coverage(self, agent: Dict[str, Any], task_requirements: Dict[str, Any]) -> float:
        """计算技能覆盖度"""
        required_skills = set(task_requirements.get('required_skills', []))
        agent_skills = set(agent.get('skills', []))

        if not required_skills:
            return 0.5

        return len(required_skills & agent_skills) / len(required_skills)

    async def _calculate_complexity_match(self, agent: Dict[str, Any], task_requirements: Dict[str, Any]) -> float:
        """计算复杂度匹配"""
        agent_complexity = agent.get('complexity_level', 5)
        task_complexity = task_requirements.get('complexity_level', 5)

        # 复杂度差异越小越好
        complexity_diff = abs(agent_complexity - task_complexity)
        max_diff = 9  # 最大复杂度差异

        return 1.0 - (complexity_diff / max_diff)

    async def _predict_performance(self, agent: Dict[str, Any], task_requirements: Dict[str, Any]) -> float:
        """预测性能"""
        base_performance = agent.get('average_performance', 0.7)

        # 根据任务类型调整
        task_type = task_requirements.get('type', 'general')
        agent_specialties = agent.get('specialties', [])

        if task_type in agent_specialties:
            return min(base_performance + 0.2, 1.0)
        else:
            return max(base_performance - 0.1, 0.3)

    async def _assess_collaboration_compatibility(self, agent: Dict[str, Any], context: Dict[str, Any] = None) -> float:
        """评估协作兼容性"""
        base_collaboration = agent.get('collaboration_score', 0.5)

        # 根据团队组成调整
        if context and 'existing_team' in context:
            existing_team = context['existing_team']
            team_types = [a.get('type', 'unknown') for a in existing_team]
            agent_type = agent.get('type', 'unknown')

            # 计算类型多样性
            if agent_type not in team_types:
                return base_collaboration + 0.1
            else:
                return base_collaboration - 0.05

        return base_collaboration

    async def _assess_learning_capability(self, agent: Dict[str, Any], historical_performance: Dict[str, float]) -> float:
        """评估学习能力"""
        if not historical_performance:
            return 0.5

        # 计算改进趋势
        performances = list(historical_performance.values())
        if len(performances) < 2:
            return 0.5

        recent_avg = np.mean(performances[-3:])
        earlier_avg = np.mean(performances[:-3]) if len(performances) > 3 else performances[0]

        improvement = (recent_avg - earlier_avg) / max(earlier_avg, 0.1)

        # 归一化到0-1范围
        return max(0.0, min(1.0, 0.5 + improvement))

    async def _analyze_task_complexity(self, task_complexity: Dict[str, Any]) -> List[str]:
        """分析任务复杂度"""
        # 简化实现，实际应该更复杂
        base_skills = ['analysis', 'planning', 'execution', 'coordination']

        if task_complexity.get('level', 'medium') == 'high':
            return base_skills + ['optimization', 'monitoring', 'troubleshooting']
        elif task_complexity.get('level', 'medium') == 'low':
            return base_skills[:2]
        else:
            return base_skills[:3]