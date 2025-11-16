"""
元记忆实现
Meta Memory Implementation

负责学习策略管理、自我认知和策略优化
"""

import asyncio
import time
import json
from typing import Dict, List, Optional, Any, Tuple
import numpy as np
import redis
from collections import defaultdict, deque

from .models import MetaMemoryEntry, MemoryType

class MetaMemory:
    """元记忆管理器

    功能：
    - 记录学习历史和策略效果
    - 追踪智能体的学习模式
    - 推荐最佳学习策略
    - 支持自我认知和反思
    """

    def __init__(self,
                 redis_client: Optional[redis.Redis] = None,
                 max_history_length: int = 1000):

        self.redis = redis_client
        self.max_history_length = max_history_length

        # 存储策略和效果
        self.strategies: Dict[str, MetaMemoryEntry] = {}

        # 学习模式分析
        self.learning_patterns = defaultdict(list)
        self.performance_history = deque(maxlen=max_history_length)

        # 自我认知状态
        self.self_assessment = {
            'learning_capability': 0.5,
            'problem_solving_skill': 0.5,
            'adaptation_ability': 0.5,
            'collaboration_effectiveness': 0.5
        }

        # 统计信息
        self.stats = {
            'total_strategies': 0,
            'strategy_evaluations': 0,
            'learning_insights': 0,
            'self_reflection_count': 0
        }

    async def initialize(self):
        """初始化元记忆系统"""
        try:
            # 从Redis加载现有策略
            await self._load_strategies_from_redis()

            # 初始化默认策略
            await self._initialize_default_strategies()

            print("Meta memory initialized successfully")
        except Exception as e:
            print(f"Error initializing meta memory: {e}")

    async def add_strategy(self,
                          name: str,
                          description: str,
                          initial_effectiveness: float = 0.5) -> bool:
        """添加新的学习策略"""
        try:
            if name in self.strategies:
                return False  # 策略已存在

            strategy = MetaMemoryEntry(
                strategy_name=name,
                strategy_description=description,
                effectiveness_score=initial_effectiveness
            )

            self.strategies[name] = strategy
            self.stats['total_strategies'] += 1

            # 持久化到Redis
            await self._save_strategy_to_redis(strategy)

            return True

        except Exception as e:
            print(f"Error adding strategy: {e}")
            return False

    async def evaluate_strategy(self,
                               strategy_name: str,
                               task_type: str,
                               performance: float) -> bool:
        """评估策略效果"""
        try:
            if strategy_name not in self.strategies:
                return False

            strategy = self.strategies[strategy_name]
            strategy.update_usage(task_type, performance)

            # 更新学习模式
            self.learning_patterns[task_type].append((strategy_name, performance))

            # 记录性能历史
            self.performance_history.append({
                'timestamp': time.time(),
                'strategy': strategy_name,
                'task_type': task_type,
                'performance': performance
            })

            self.stats['strategy_evaluations'] += 1

            # 持久化更新
            await self._save_strategy_to_redis(strategy)

            return True

        except Exception as e:
            print(f"Error evaluating strategy: {e}")
            return False

    async def recommend_strategy(self,
                                task_type: str,
                                context: Dict[str, Any] = None) -> Optional[str]:
        """基于历史表现推荐最佳策略"""
        try:
            # 获取相关策略
            relevant_strategies = []
            for name, strategy in self.strategies.items():
                if strategy.success_rate > 0:
                    relevant_strategies.append((name, strategy.success_rate))

            if not relevant_strategies:
                # 如果没有历史数据，返回默认策略
                return await self._get_default_strategy(task_type)

            # 考虑任务类型的特定表现
            task_specific_scores = {}
            for name, strategy in self.strategies.items():
                task_performance = [
                    record[2] for record in strategy.usage_history
                    if record[1] == task_type
                ]
                if task_performance:
                    task_specific_scores[name] = np.mean(task_performance)

            # 结合成功率和任务特定表现
            final_scores = {}
            for name, strategy in self.strategies.items():
                base_score = strategy.success_rate
                task_score = task_specific_scores.get(name, base_score)
                # 加权平均
                final_scores[name] = 0.6 * base_score + 0.4 * task_score

            # 选择最佳策略
            best_strategy = max(final_scores.items(), key=lambda x: x[1])
            return best_strategy[0] if best_strategy[1] > 0.3 else None

        except Exception as e:
            print(f"Error recommending strategy: {e}")
            return None

    async def reflect_on_performance(self,
                                   recent_performances: List[float],
                                   task_context: Dict[str, Any]) -> Dict[str, Any]:
        """自我反思和认知分析"""
        try:
            if not recent_performances:
                return {}

            # 计算性能趋势
            if len(recent_performances) >= 3:
                recent_avg = np.mean(recent_performances[-3:])
                earlier_avg = np.mean(recent_performances[:-3]) if len(recent_performances) > 3 else recent_avg[0]
                performance_trend = recent_avg - earlier_avg
            else:
                performance_trend = 0

            # 分析成功和失败模式
            success_threshold = 0.7
            successful_tasks = [p for p in recent_performances if p >= success_threshold]
            failed_tasks = [p for p in recent_performances if p < success_threshold]

            # 生成反思洞察
            insights = {
                'performance_trend': performance_trend,
                'success_rate': len(successful_tasks) / len(recent_performances),
                'average_performance': np.mean(recent_performances),
                'performance_variance': np.var(recent_performances),
                'improvement_needed': performance_trend < -0.1,
                'learning_velocity': self._calculate_learning_velocity(recent_performances),
                'adaptive_capability': self._assess_adaptive_capability(recent_performances),
                'reflection_timestamp': time.time()
            }

            # 更新自我认知
            await self._update_self_assessment(insights)

            self.stats['self_reflection_count'] += 1
            self.stats['learning_insights'] += 1

            return insights

        except Exception as e:
            print(f"Error in self-reflection: {e}")
            return {}

    async def identify_learning_patterns(self) -> Dict[str, Any]:
        """识别学习模式和知识图谱"""
        try:
            patterns = {
                'task_type_preferences': {},
                'strategy_effectiveness_by_context': defaultdict(list),
                'learning_curves': {},
                'knowledge_gaps': [],
                'strength_areas': []
            }

            # 分析任务类型偏好
            for task_type, records in self.learning_patterns.items():
                if records:
                    avg_performance = np.mean([r[1] for r in records])
                    patterns['task_type_preferences'][task_type] = avg_performance

            # 识别优势和劣势领域
            for task_type, avg_performance in patterns['task_type_preferences'].items():
                if avg_performance > 0.8:
                    patterns['strength_areas'].append(task_type)
                elif avg_performance < 0.5:
                    patterns['knowledge_gaps'].append(task_type)

            # 分析学习曲线
            for strategy_name, strategy in self.strategies.items():
                if len(strategy.usage_history) >= 5:
                    # 计算学习曲线斜率
                    recent_performances = [record[2] for record in strategy.usage_history[-10:]]
                    if len(recent_performances) >= 3:
                        x = np.arange(len(recent_performances))
                        slope = np.polyfit(x, recent_performances, 1)[0]
                        patterns['learning_curves'][strategy_name] = slope

            return dict(patterns)

        except Exception as e:
            print(f"Error identifying learning patterns: {e}")
            return {}

    async def get_self_assessment(self) -> Dict[str, float]:
        """获取自我认知评估"""
        return self.self_assessment.copy()

    async def update_adaptation_rules(self,
                                    strategy_name: str,
                                    context_conditions: Dict[str, Any],
                                    new_rules: Dict[str, Any]):
        """更新策略的适应性规则"""
        try:
            if strategy_name in self.strategies:
                strategy = self.strategies[strategy_name]
                strategy.adaptation_rules.update(new_rules)
                await self._save_strategy_to_redis(strategy)

        except Exception as e:
            print(f"Error updating adaptation rules: {e}")

    async def get_statistics(self) -> Dict[str, Any]:
        """获取元记忆统计信息"""
        strategy_effectiveness = [
            strategy.effectiveness_score for strategy in self.strategies.values()
        ]
        avg_effectiveness = np.mean(strategy_effectiveness) if strategy_effectiveness else 0

        return {
            'total_strategies': self.stats['total_strategies'],
            'average_strategy_effectiveness': avg_effectiveness,
            'strategy_evaluations': self.stats['strategy_evaluations'],
            'learning_insights': self.stats['learning_insights'],
            'self_reflection_count': self.stats['self_reflection_count'],
            'self_assessment': self.self_assessment,
            'performance_history_length': len(self.performance_history)
        }

    async def _initialize_default_strategies(self):
        """初始化默认策略"""
        default_strategies = [
            {
                'name': 'systematic_approach',
                'description': '系统性分析问题，逐步分解',
                'effectiveness': 0.6
            },
            {
                'name': 'creative_thinking',
                'description': '创造性思维，寻找非常规解决方案',
                'effectiveness': 0.5
            },
            {
                'name': 'pattern_matching',
                'description': '基于模式匹配的快速解决',
                'effectiveness': 0.7
            },
            {
                'name': 'iterative_refinement',
                'description': '迭代式改进和优化',
                'effectiveness': 0.65
            }
        ]

        for strategy_info in default_strategies:
            if strategy_info['name'] not in self.strategies:
                await self.add_strategy(**strategy_info)

    async def _get_default_strategy(self, task_type: str) -> str:
        """获取默认策略"""
        return 'systematic_approach'  # 默认返回系统性方法

    def _calculate_learning_velocity(self, performances: List[float]) -> float:
        """计算学习速度"""
        if len(performances) < 3:
            return 0.0

        # 计算最近表现的改进速度
        recent_slope = np.polyfit(range(len(performances[-5:])), performances[-5:], 1)[0]
        return recent_slope

    def _assess_adaptive_capability(self, performances: List[float]) -> float:
        """评估适应能力"""
        if len(performances) < 5:
            return 0.5

        # 计算性能的稳定性
        variance = np.var(performances)
        stability = 1.0 / (1.0 + variance)  # 方差越小，稳定性越高

        # 计算恢复能力（从低性能恢复的速度）
        recovery_events = []
        for i in range(1, len(performances)):
            if performances[i-1] < 0.5 and performances[i] > 0.7:
                recovery_events.append(i)

        recovery_score = len(recovery_events) / len(performances)

        return 0.6 * stability + 0.4 * recovery_score

    async def _update_self_assessment(self, insights: Dict[str, Any]):
        """更新自我认知评估"""
        # 基于性能洞察更新各个维度的自我评估
        performance_trend = insights.get('performance_trend', 0)
        success_rate = insights.get('success_rate', 0.5)

        # 学习能力
        if performance_trend > 0.1:
            self.self_assessment['learning_capability'] = min(1.0,
                self.self_assessment['learning_capability'] + 0.05)
        elif performance_trend < -0.1:
            self.self_assessment['learning_capability'] = max(0.1,
                self.self_assessment['learning_capability'] - 0.05)

        # 问题解决技能
        self.self_assessment['problem_solving_skill'] = (
            0.7 * self.self_assessment['problem_solving_skill'] +
            0.3 * success_rate
        )

        # 适应能力
        adaptive_score = insights.get('adaptive_capability', 0.5)
        self.self_assessment['adaptation_ability'] = (
            0.8 * self.self_assessment['adaptation_ability'] +
            0.2 * adaptive_score
        )

    async def _save_strategy_to_redis(self, strategy: MetaMemoryEntry):
        """保存策略到Redis"""
        if not self.redis:
            return

        try:
            strategy_data = {
                'strategy_name': strategy.strategy_name,
                'strategy_description': strategy.strategy_description,
                'effectiveness_score': strategy.effectiveness_score,
                'success_rate': strategy.success_rate,
                'usage_history': strategy.usage_history,
                'learning_patterns': strategy.learning_patterns,
                'adaptation_rules': strategy.adaptation_rules,
                'last_updated': strategy.last_updated
            }

            await self.redis.setex(
                f"meta_strategy:{strategy.strategy_name}",
                86400,  # 24小时过期
                json.dumps(strategy_data, default=str)
            )

        except Exception as e:
            print(f"Error saving strategy to Redis: {e}")

    async def _load_strategies_from_redis(self):
        """从Redis加载策略"""
        if not self.redis:
            return

        try:
            # 获取所有策略键
            strategy_keys = await self.redis.keys("meta_strategy:*")

            for key in strategy_keys:
                strategy_data = await self.redis.get(key)
                if strategy_data:
                    data = json.loads(strategy_data)
                    strategy = MetaMemoryEntry(
                        strategy_name=data['strategy_name'],
                        strategy_description=data['strategy_description'],
                        effectiveness_score=data['effectiveness_score'],
                        success_rate=data['success_rate'],
                        usage_history=data['usage_history'],
                        learning_patterns=data['learning_patterns'],
                        adaptation_rules=data['adaptation_rules'],
                        last_updated=data['last_updated']
                    )
                    self.strategies[strategy.strategy_name] = strategy

        except Exception as e:
            print(f"Error loading strategies from Redis: {e}")