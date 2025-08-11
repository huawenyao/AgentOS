#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
高考志愿填报报告生成智能体

该模块实现了高考志愿填报报告生成智能体，负责收集考生信息、分析匹配度并生成专属H5报告。
"""

import uuid
import json
import time
from enum import Enum
from typing import Dict, List, Set, Optional, Any, Tuple, Callable, Union
from datetime import datetime
from pydantic import BaseModel, Field, validator
from loguru import logger

from efiagent.agent.base_agent import (
    BaseAgent, AgentConfig, AgentType, AgentStatus, AgentCapability,
    AgentContext, AgentObservation, AgentAction, AgentResult
)


class StudentProfile(BaseModel):
    """考生档案模型"""
    # 基本信息
    name: str  # 姓名
    province: str  # 省份
    subject_combination: str  # 选科组合（如"物化生"、"史地政"）
    
    # 成绩信息
    total_score: int  # 高考总分
    province_rank: int  # 全省排名
    subject_scores: Dict[str, int] = Field(default_factory=dict)  # 单科成绩
    
    # 个人特质
    interests: List[str] = Field(default_factory=list)  # 兴趣爱好
    personality_type: Optional[str] = None  # 性格类型（MBTI等）
    career_tendency: Optional[str] = None  # 职业倾向（霍兰德类型）
    awards: List[str] = Field(default_factory=list)  # 获奖经历
    
    # 身体条件
    physical_limitations: List[str] = Field(default_factory=list)  # 身体限制
    height: Optional[float] = None  # 身高（cm）
    weight: Optional[float] = None  # 体重（kg）
    
    # 职业规划
    career_plan: str = "就业"  # 就业/考研/留学
    preferred_industries: List[str] = Field(default_factory=list)  # 偏好行业
    target_positions: List[str] = Field(default_factory=list)  # 目标岗位
    
    # 家庭条件
    budget_range: Tuple[int, int] = (4000, 8000)  # 学费预算范围（元/年）
    location_preference: List[str] = Field(default_factory=list)  # 地域偏好
    family_industry: Optional[str] = None  # 家庭行业背景
    
    # 家长期望
    stability_preference: bool = True  # 是否偏好稳定职业
    risk_tolerance: str = "中等"  # 风险承受能力：低/中等/高
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典
        
        Returns:
            Dict[str, Any]: 字典表示
        """
        return {
            "name": self.name,
            "province": self.province,
            "subject_combination": self.subject_combination,
            "total_score": self.total_score,
            "province_rank": self.province_rank,
            "subject_scores": self.subject_scores,
            "interests": self.interests,
            "personality_type": self.personality_type,
            "career_tendency": self.career_tendency,
            "awards": self.awards,
            "physical_limitations": self.physical_limitations,
            "height": self.height,
            "weight": self.weight,
            "career_plan": self.career_plan,
            "preferred_industries": self.preferred_industries,
            "target_positions": self.target_positions,
            "budget_range": self.budget_range,
            "location_preference": self.location_preference,
            "family_industry": self.family_industry,
            "stability_preference": self.stability_preference,
            "risk_tolerance": self.risk_tolerance
        }


class UniversityMajor(BaseModel):
    """大学专业模型"""
    university_name: str  # 大学名称
    major_name: str  # 专业名称
    major_code: str  # 专业代码
    subject_requirements: List[str] = Field(default_factory=list)  # 选科要求
    score_requirement: int  # 分数要求
    rank_requirement: int  # 位次要求
    tuition_fee: int  # 学费（元/年）
    employment_rate: float = 0.0  # 就业率
    average_salary: int = 0  # 平均薪资
    major_category: str  # 专业类别
    degree_level: str = "本科"  # 学位层次
    
    # 专业特色
    core_courses: List[str] = Field(default_factory=list)  # 核心课程
    career_directions: List[str] = Field(default_factory=list)  # 就业方向
    physical_requirements: List[str] = Field(default_factory=list)  # 身体要求
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典
        
        Returns:
            Dict[str, Any]: 字典表示
        """
        return {
            "university_name": self.university_name,
            "major_name": self.major_name,
            "major_code": self.major_code,
            "subject_requirements": self.subject_requirements,
            "score_requirement": self.score_requirement,
            "rank_requirement": self.rank_requirement,
            "tuition_fee": self.tuition_fee,
            "employment_rate": self.employment_rate,
            "average_salary": self.average_salary,
            "major_category": self.major_category,
            "degree_level": self.degree_level,
            "core_courses": self.core_courses,
            "career_directions": self.career_directions,
            "physical_requirements": self.physical_requirements
        }


class RecommendationLevel(str, Enum):
    """推荐等级枚举"""
    RUSH = "冲刺"  # 冲刺院校
    STABLE = "稳妥"  # 稳妥院校
    SAFE = "保底"  # 保底院校


class MajorRecommendation(BaseModel):
    """专业推荐模型"""
    major: UniversityMajor  # 专业信息
    recommendation_level: RecommendationLevel  # 推荐等级
    match_score: float  # 匹配度分数（0-100）
    match_reasons: List[str] = Field(default_factory=list)  # 匹配原因
    risk_factors: List[str] = Field(default_factory=list)  # 风险因素
    advantages: List[str] = Field(default_factory=list)  # 优势分析
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典
        
        Returns:
            Dict[str, Any]: 字典表示
        """
        return {
            "major": self.major.to_dict(),
            "recommendation_level": self.recommendation_level.value,
            "match_score": self.match_score,
            "match_reasons": self.match_reasons,
            "risk_factors": self.risk_factors,
            "advantages": self.advantages
        }


class AdmissionReport(BaseModel):
    """志愿填报报告模型"""
    report_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_profile: StudentProfile  # 考生档案
    recommendations: List[MajorRecommendation] = Field(default_factory=list)  # 推荐列表
    analysis_summary: Dict[str, Any] = Field(default_factory=dict)  # 分析摘要
    strategy_advice: List[str] = Field(default_factory=list)  # 策略建议
    risk_warnings: List[str] = Field(default_factory=list)  # 风险提醒
    generated_at: datetime = Field(default_factory=datetime.now)  # 生成时间
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典
        
        Returns:
            Dict[str, Any]: 字典表示
        """
        return {
            "report_id": self.report_id,
            "student_profile": self.student_profile.to_dict(),
            "recommendations": [r.to_dict() for r in self.recommendations],
            "analysis_summary": self.analysis_summary,
            "strategy_advice": self.strategy_advice,
            "risk_warnings": self.risk_warnings,
            "generated_at": self.generated_at.isoformat()
        }


class CollegeAdmissionAgent(BaseAgent):
    """高考志愿填报报告生成智能体
    
    负责收集考生信息、分析匹配度并生成专属H5报告
    """
    
    def __init__(self, config: AgentConfig):
        """初始化高考志愿填报智能体
        
        Args:
            config: 智能体配置
        """
        super().__init__(config)
        self.major_database: List[UniversityMajor] = []
        self.current_student: Optional[StudentProfile] = None
        self.current_report: Optional[AdmissionReport] = None
        
        # 初始化能力
        self._initialize_capabilities()
        
        # 加载专业数据库
        self._load_major_database()
    
    def _initialize_capabilities(self) -> None:
        """初始化智能体能力"""
        capabilities = [
            AgentCapability(
                name="student_profile_collection",
                description="收集考生个人信息、成绩、兴趣等档案数据",
                parameters={"required_fields": ["name", "province", "total_score", "province_rank"]},
                skill_vector=[0.9, 0.8, 0.7, 0.6]
            ),
            AgentCapability(
                name="major_matching_analysis",
                description="基于考生档案进行专业匹配度分析",
                parameters={"matching_algorithms": ["score_based", "interest_based", "career_based"]},
                skill_vector=[0.95, 0.9, 0.85, 0.8]
            ),
            AgentCapability(
                name="risk_assessment",
                description="评估志愿填报风险和录取概率",
                parameters={"risk_factors": ["score_gap", "competition", "policy_change"]},
                skill_vector=[0.8, 0.85, 0.9, 0.75]
            ),
            AgentCapability(
                name="strategy_recommendation",
                description="生成个性化的志愿填报策略建议",
                parameters={"strategy_types": ["conservative", "balanced", "aggressive"]},
                skill_vector=[0.85, 0.9, 0.8, 0.85]
            ),
            AgentCapability(
                name="report_generation",
                description="生成专属H5页面的志愿填报报告",
                parameters={"output_formats": ["html", "pdf", "json"]},
                skill_vector=[0.9, 0.85, 0.8, 0.9]
            )
        ]
        
        self.capabilities.extend(capabilities)
    
    def _load_major_database(self) -> None:
        """加载专业数据库
        
        这里使用模拟数据，实际应用中应从数据库或API加载
        """
        # 模拟专业数据
        sample_majors = [
            UniversityMajor(
                university_name="清华大学",
                major_name="计算机科学与技术",
                major_code="080901",
                subject_requirements=["物理", "化学"],
                score_requirement=680,
                rank_requirement=100,
                tuition_fee=5000,
                employment_rate=98.5,
                average_salary=180000,
                major_category="工学",
                core_courses=["数据结构", "算法设计", "计算机网络", "操作系统"],
                career_directions=["软件工程师", "算法工程师", "产品经理", "技术总监"]
            ),
            UniversityMajor(
                university_name="北京大学",
                major_name="临床医学",
                major_code="100201K",
                subject_requirements=["物理", "化学", "生物"],
                score_requirement=675,
                rank_requirement=150,
                tuition_fee=6000,
                employment_rate=95.2,
                average_salary=120000,
                major_category="医学",
                core_courses=["人体解剖学", "生理学", "病理学", "内科学"],
                career_directions=["临床医生", "医学研究员", "医院管理", "医疗器械研发"],
                physical_requirements=["无色盲色弱", "无传染性疾病"]
            ),
            UniversityMajor(
                university_name="复旦大学",
                major_name="金融学",
                major_code="020301K",
                subject_requirements=["数学"],
                score_requirement=650,
                rank_requirement=500,
                tuition_fee=5500,
                employment_rate=92.8,
                average_salary=150000,
                major_category="经济学",
                core_courses=["微观经济学", "宏观经济学", "金融市场学", "投资学"],
                career_directions=["投资银行家", "金融分析师", "风险管理师", "财务总监"]
            )
        ]
        
        self.major_database.extend(sample_majors)
        logger.info(f"Loaded {len(self.major_database)} majors into database")
    
    def _initialize_impl(self) -> None:
        """初始化实现"""
        logger.info(f"CollegeAdmissionAgent {self.id} initialized successfully")
    
    def collect_student_profile(self, profile_data: Dict[str, Any]) -> bool:
        """收集考生档案信息
        
        Args:
            profile_data: 考生档案数据
            
        Returns:
            bool: 是否成功收集
        """
        try:
            # 验证必需字段
            required_fields = ["name", "province", "subject_combination", "total_score", "province_rank"]
            for field in required_fields:
                if field not in profile_data:
                    raise ValueError(f"Missing required field: {field}")
            
            # 创建考生档案
            self.current_student = StudentProfile(**profile_data)
            
            # 更新上下文记忆
            if self.context:
                self.context.update_memory("student_profile", self.current_student.to_dict())
            
            logger.info(f"Successfully collected profile for student: {self.current_student.name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to collect student profile: {e}")
            return False
    
    def analyze_major_matching(self) -> List[MajorRecommendation]:
        """分析专业匹配度
        
        Returns:
            List[MajorRecommendation]: 专业推荐列表
        """
        if not self.current_student:
            logger.error("No student profile available for analysis")
            return []
        
        recommendations = []
        
        for major in self.major_database:
            # 计算匹配度分数
            match_score = self._calculate_match_score(self.current_student, major)
            
            # 确定推荐等级
            recommendation_level = self._determine_recommendation_level(
                self.current_student.province_rank, major.rank_requirement
            )
            
            # 生成匹配原因
            match_reasons = self._generate_match_reasons(self.current_student, major)
            
            # 识别风险因素
            risk_factors = self._identify_risk_factors(self.current_student, major)
            
            # 分析优势
            advantages = self._analyze_advantages(self.current_student, major)
            
            recommendation = MajorRecommendation(
                major=major,
                recommendation_level=recommendation_level,
                match_score=match_score,
                match_reasons=match_reasons,
                risk_factors=risk_factors,
                advantages=advantages
            )
            
            recommendations.append(recommendation)
        
        # 按匹配度排序
        recommendations.sort(key=lambda x: x.match_score, reverse=True)
        
        logger.info(f"Generated {len(recommendations)} major recommendations")
        return recommendations
    
    def _calculate_match_score(self, student: StudentProfile, major: UniversityMajor) -> float:
        """计算专业匹配度分数
        
        Args:
            student: 考生档案
            major: 专业信息
            
        Returns:
            float: 匹配度分数（0-100）
        """
        score = 0.0
        
        # 成绩匹配度（40%权重）
        if student.province_rank <= major.rank_requirement:
            score += 40.0
        else:
            # 根据排名差距计算部分分数
            rank_gap = student.province_rank - major.rank_requirement
            if rank_gap <= 1000:
                score += 40.0 * (1 - rank_gap / 1000)
        
        # 选科匹配度（30%权重）
        subject_match = 0
        for req_subject in major.subject_requirements:
            if req_subject in student.subject_combination:
                subject_match += 1
        if major.subject_requirements:
            score += 30.0 * (subject_match / len(major.subject_requirements))
        else:
            score += 30.0  # 无选科要求
        
        # 兴趣匹配度（20%权重）
        interest_match = 0
        for interest in student.interests:
            if any(interest.lower() in direction.lower() for direction in major.career_directions):
                interest_match += 1
        if student.interests:
            score += 20.0 * min(interest_match / len(student.interests), 1.0)
        
        # 经济承受能力（10%权重）
        if student.budget_range[0] <= major.tuition_fee <= student.budget_range[1]:
            score += 10.0
        elif major.tuition_fee < student.budget_range[0]:
            score += 10.0  # 学费低于预算也是好事
        
        return min(score, 100.0)
    
    def _determine_recommendation_level(self, student_rank: int, major_rank_requirement: int) -> RecommendationLevel:
        """确定推荐等级
        
        Args:
            student_rank: 考生排名
            major_rank_requirement: 专业排名要求
            
        Returns:
            RecommendationLevel: 推荐等级
        """
        rank_diff = student_rank - major_rank_requirement
        
        if rank_diff > 2000:  # 排名差距较大，冲刺
            return RecommendationLevel.RUSH
        elif rank_diff > -1000:  # 排名接近，稳妥
            return RecommendationLevel.STABLE
        else:  # 排名优势明显，保底
            return RecommendationLevel.SAFE
    
    def _generate_match_reasons(self, student: StudentProfile, major: UniversityMajor) -> List[str]:
        """生成匹配原因
        
        Args:
            student: 考生档案
            major: 专业信息
            
        Returns:
            List[str]: 匹配原因列表
        """
        reasons = []
        
        # 成绩匹配
        if student.province_rank <= major.rank_requirement:
            reasons.append(f"省排名{student.province_rank}位，符合该专业录取要求")
        
        # 选科匹配
        matched_subjects = [subj for subj in major.subject_requirements if subj in student.subject_combination]
        if matched_subjects:
            reasons.append(f"选科组合匹配：{', '.join(matched_subjects)}")
        
        # 兴趣匹配
        for interest in student.interests:
            if any(interest.lower() in direction.lower() for direction in major.career_directions):
                reasons.append(f"兴趣爱好'{interest}'与专业就业方向匹配")
        
        # 职业规划匹配
        if student.career_plan == "考研" and major.major_category in ["理学", "工学"]:
            reasons.append("该专业适合继续深造，符合考研规划")
        
        return reasons
    
    def _identify_risk_factors(self, student: StudentProfile, major: UniversityMajor) -> List[str]:
        """识别风险因素
        
        Args:
            student: 考生档案
            major: 专业信息
            
        Returns:
            List[str]: 风险因素列表
        """
        risks = []
        
        # 成绩风险
        if student.province_rank > major.rank_requirement:
            rank_gap = student.province_rank - major.rank_requirement
            risks.append(f"排名差距{rank_gap}位，录取风险较高")
        
        # 身体条件风险
        for limitation in student.physical_limitations:
            if any(limitation in req for req in major.physical_requirements):
                risks.append(f"身体条件限制：{limitation}")
        
        # 经济风险
        if major.tuition_fee > student.budget_range[1]:
            risks.append(f"学费{major.tuition_fee}元/年，超出预算范围")
        
        # 就业风险
        if major.employment_rate < 90:
            risks.append(f"就业率{major.employment_rate}%，相对较低")
        
        return risks
    
    def _analyze_advantages(self, student: StudentProfile, major: UniversityMajor) -> List[str]:
        """分析优势
        
        Args:
            student: 考生档案
            major: 专业信息
            
        Returns:
            List[str]: 优势列表
        """
        advantages = []
        
        # 成绩优势
        if student.province_rank < major.rank_requirement * 0.8:
            advantages.append("成绩优势明显，录取概率很高")
        
        # 就业优势
        if major.employment_rate > 95:
            advantages.append(f"就业率高达{major.employment_rate}%")
        
        # 薪资优势
        if major.average_salary > 100000:
            advantages.append(f"平均薪资{major.average_salary//10000}万元，收入前景良好")
        
        # 学校声誉
        if major.university_name in ["清华大学", "北京大学", "复旦大学", "上海交通大学"]:
            advantages.append("顶尖名校，学术声誉和社会认可度极高")
        
        return advantages
    
    def generate_admission_report(self) -> Optional[AdmissionReport]:
        """生成志愿填报报告
        
        Returns:
            Optional[AdmissionReport]: 志愿填报报告
        """
        if not self.current_student:
            logger.error("No student profile available for report generation")
            return None
        
        # 分析专业匹配度
        recommendations = self.analyze_major_matching()
        
        # 生成分析摘要
        analysis_summary = self._generate_analysis_summary(recommendations)
        
        # 生成策略建议
        strategy_advice = self._generate_strategy_advice(recommendations)
        
        # 生成风险提醒
        risk_warnings = self._generate_risk_warnings(recommendations)
        
        # 创建报告
        report = AdmissionReport(
            student_profile=self.current_student,
            recommendations=recommendations[:20],  # 取前20个推荐
            analysis_summary=analysis_summary,
            strategy_advice=strategy_advice,
            risk_warnings=risk_warnings
        )
        
        self.current_report = report
        
        # 更新上下文记忆
        if self.context:
            self.context.update_memory("admission_report", report.to_dict())
        
        logger.info(f"Generated admission report for student: {self.current_student.name}")
        return report
    
    def _generate_analysis_summary(self, recommendations: List[MajorRecommendation]) -> Dict[str, Any]:
        """生成分析摘要
        
        Args:
            recommendations: 专业推荐列表
            
        Returns:
            Dict[str, Any]: 分析摘要
        """
        if not recommendations:
            return {}
        
        # 统计各等级推荐数量
        level_counts = {}
        for rec in recommendations:
            level = rec.recommendation_level.value
            level_counts[level] = level_counts.get(level, 0) + 1
        
        # 计算平均匹配度
        avg_match_score = sum(rec.match_score for rec in recommendations) / len(recommendations)
        
        # 统计专业类别分布
        category_counts = {}
        for rec in recommendations:
            category = rec.major.major_category
            category_counts[category] = category_counts.get(category, 0) + 1
        
        return {
            "total_recommendations": len(recommendations),
            "level_distribution": level_counts,
            "average_match_score": round(avg_match_score, 2),
            "category_distribution": category_counts,
            "top_match_score": recommendations[0].match_score if recommendations else 0
        }
    
    def _generate_strategy_advice(self, recommendations: List[MajorRecommendation]) -> List[str]:
        """生成策略建议
        
        Args:
            recommendations: 专业推荐列表
            
        Returns:
            List[str]: 策略建议列表
        """
        advice = []
        
        if not recommendations:
            return ["建议扩大专业选择范围，或考虑降低目标院校层次"]
        
        # 基于推荐等级分布给出建议
        rush_count = sum(1 for rec in recommendations if rec.recommendation_level == RecommendationLevel.RUSH)
        stable_count = sum(1 for rec in recommendations if rec.recommendation_level == RecommendationLevel.STABLE)
        safe_count = sum(1 for rec in recommendations if rec.recommendation_level == RecommendationLevel.SAFE)
        
        if rush_count > 0:
            advice.append(f"建议填报{min(rush_count, 3)}个冲刺院校，争取更好的录取结果")
        
        if stable_count > 0:
            advice.append(f"重点关注{min(stable_count, 5)}个稳妥院校，确保有学可上")
        
        if safe_count > 0:
            advice.append(f"至少选择{min(safe_count, 2)}个保底院校，降低落榜风险")
        
        # 基于学生特点给出个性化建议
        if self.current_student.career_plan == "考研":
            advice.append("考虑选择学术氛围浓厚、保研率较高的院校")
        
        if self.current_student.risk_tolerance == "低":
            advice.append("建议采用保守策略，多选择稳妥和保底院校")
        elif self.current_student.risk_tolerance == "高":
            advice.append("可以适当冒险，多选择冲刺院校")
        
        return advice
    
    def _generate_risk_warnings(self, recommendations: List[MajorRecommendation]) -> List[str]:
        """生成风险提醒
        
        Args:
            recommendations: 专业推荐列表
            
        Returns:
            List[str]: 风险提醒列表
        """
        warnings = []
        
        # 检查是否有身体条件限制
        if self.current_student.physical_limitations:
            warnings.append(f"注意身体条件限制：{', '.join(self.current_student.physical_limitations)}")
        
        # 检查经济承受能力
        high_fee_majors = [rec for rec in recommendations if rec.major.tuition_fee > self.current_student.budget_range[1]]
        if high_fee_majors:
            warnings.append(f"有{len(high_fee_majors)}个专业学费超出预算，需考虑经济承受能力")
        
        # 检查地域偏好
        if self.current_student.location_preference:
            out_of_preference = [rec for rec in recommendations 
                               if not any(loc in rec.major.university_name for loc in self.current_student.location_preference)]
            if out_of_preference:
                warnings.append("部分推荐院校不在偏好地区，请慎重考虑")
        
        # 检查专业调剂风险
        warnings.append("填报时需考虑是否服从专业调剂，避免因不服从调剂而被退档")
        
        # 检查政策变化风险
        warnings.append("关注招生政策变化，及时调整志愿填报策略")
        
        return warnings
    
    def generate_h5_report(self, report: AdmissionReport) -> str:
        """生成H5页面报告
        
        Args:
            report: 志愿填报报告
            
        Returns:
            str: H5页面HTML内容
        """
        html_template = f"""
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{report.student_profile.name}的高考志愿填报报告</title>
    <style>
        body {{
            font-family: 'Microsoft YaHei', Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            overflow: hidden;
        }}
        .header {{
            background: linear-gradient(45deg, #FF6B6B, #4ECDC4);
            color: white;
            padding: 30px;
            text-align: center;
        }}
        .header h1 {{
            margin: 0;
            font-size: 2.5em;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }}
        .profile-section {{
            padding: 30px;
            background: #f8f9fa;
            border-bottom: 3px solid #e9ecef;
        }}
        .profile-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }}
        .profile-card {{
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            border-left: 4px solid #007bff;
        }}
        .recommendations {{
            padding: 30px;
        }}
        .recommendation-item {{
            background: white;
            margin: 20px 0;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            border-left: 5px solid #28a745;
            transition: transform 0.3s ease;
        }}
        .recommendation-item:hover {{
            transform: translateY(-5px);
        }}
        .level-rush {{ border-left-color: #dc3545; }}
        .level-stable {{ border-left-color: #ffc107; }}
        .level-safe {{ border-left-color: #28a745; }}
        .match-score {{
            display: inline-block;
            background: #007bff;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: bold;
            margin-left: 10px;
        }}
        .tags {{
            margin: 15px 0;
        }}
        .tag {{
            display: inline-block;
            background: #e9ecef;
            color: #495057;
            padding: 5px 12px;
            border-radius: 15px;
            margin: 3px;
            font-size: 0.9em;
        }}
        .advice-section {{
            padding: 30px;
            background: #f8f9fa;
        }}
        .advice-list {{
            list-style: none;
            padding: 0;
        }}
        .advice-list li {{
            background: white;
            margin: 10px 0;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #17a2b8;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .warning-section {{
            padding: 30px;
            background: #fff3cd;
        }}
        .warning-list li {{
            background: #f8d7da;
            color: #721c24;
            margin: 10px 0;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #dc3545;
        }}
        .footer {{
            text-align: center;
            padding: 20px;
            background: #343a40;
            color: white;
        }}
        @media (max-width: 768px) {{
            .container {{ margin: 10px; }}
            .header h1 {{ font-size: 2em; }}
            .profile-grid {{ grid-template-columns: 1fr; }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎓 高考志愿填报报告</h1>
            <p>为 {report.student_profile.name} 量身定制</p>
            <p>生成时间：{report.generated_at.strftime('%Y年%m月%d日 %H:%M')}</p>
        </div>
        
        <div class="profile-section">
            <h2>📋 考生档案</h2>
            <div class="profile-grid">
                <div class="profile-card">
                    <h3>基本信息</h3>
                    <p><strong>姓名：</strong>{report.student_profile.name}</p>
                    <p><strong>省份：</strong>{report.student_profile.province}</p>
                    <p><strong>选科组合：</strong>{report.student_profile.subject_combination}</p>
                </div>
                <div class="profile-card">
                    <h3>成绩信息</h3>
                    <p><strong>高考总分：</strong>{report.student_profile.total_score}分</p>
                    <p><strong>全省排名：</strong>第{report.student_profile.province_rank}位</p>
                </div>
                <div class="profile-card">
                    <h3>个人特质</h3>
                    <p><strong>兴趣爱好：</strong>{', '.join(report.student_profile.interests) if report.student_profile.interests else '未填写'}</p>
                    <p><strong>职业规划：</strong>{report.student_profile.career_plan}</p>
                </div>
                <div class="profile-card">
                    <h3>家庭条件</h3>
                    <p><strong>学费预算：</strong>{report.student_profile.budget_range[0]}-{report.student_profile.budget_range[1]}元/年</p>
                    <p><strong>地域偏好：</strong>{', '.join(report.student_profile.location_preference) if report.student_profile.location_preference else '无特殊要求'}</p>
                </div>
            </div>
        </div>
        
        <div class="recommendations">
            <h2>🎯 专业推荐</h2>
            <p>基于您的成绩、兴趣和条件，为您推荐以下专业：</p>
"""
        
        # 添加推荐专业
        for i, rec in enumerate(report.recommendations[:10], 1):
            level_class = f"level-{rec.recommendation_level.value.lower()}"
            html_template += f"""
            <div class="recommendation-item {level_class}">
                <h3>{i}. {rec.major.university_name} - {rec.major.major_name}
                    <span class="match-score">匹配度: {rec.match_score:.1f}%</span>
                </h3>
                <p><strong>推荐等级：</strong>{rec.recommendation_level.value}</p>
                <p><strong>专业代码：</strong>{rec.major.major_code}</p>
                <p><strong>学费：</strong>{rec.major.tuition_fee}元/年</p>
                <p><strong>就业率：</strong>{rec.major.employment_rate}%</p>
                <p><strong>平均薪资：</strong>{rec.major.average_salary//10000}万元</p>
                
                <div class="tags">
                    <strong>匹配原因：</strong>
                    {' '.join([f'<span class="tag">{reason}</span>' for reason in rec.match_reasons])}
                </div>
                
                {f'<div class="tags"><strong>风险提醒：</strong>{" ".join([f"<span class=\"tag\" style=\"background:#f8d7da;color:#721c24;\">{risk}</span>" for risk in rec.risk_factors])}</div>' if rec.risk_factors else ''}
                
                <div class="tags">
                    <strong>优势分析：</strong>
                    {' '.join([f'<span class="tag" style="background:#d4edda;color:#155724;">{advantage}</span>' for advantage in rec.advantages])}
                </div>
            </div>
"""
        
        # 添加策略建议
        html_template += f"""
        </div>
        
        <div class="advice-section">
            <h2>💡 策略建议</h2>
            <ul class="advice-list">
"""
        
        for advice in report.strategy_advice:
            html_template += f"<li>{advice}</li>"
        
        # 添加风险提醒
        html_template += f"""
            </ul>
        </div>
        
        <div class="warning-section">
            <h2>⚠️ 风险提醒</h2>
            <ul class="advice-list warning-list">
"""
        
        for warning in report.risk_warnings:
            html_template += f"<li>{warning}</li>"
        
        # 添加页脚
        html_template += f"""
            </ul>
        </div>
        
        <div class="footer">
            <p>© 2024 EFIAgent 高考志愿填报系统</p>
            <p>本报告仅供参考，最终志愿填报请结合官方政策和个人实际情况</p>
        </div>
    </div>
    
    <script>
        // 添加一些交互效果
        document.addEventListener('DOMContentLoaded', function() {{
            const items = document.querySelectorAll('.recommendation-item');
            items.forEach(item => {{
                item.addEventListener('click', function() {{
                    this.style.backgroundColor = this.style.backgroundColor === 'rgb(248, 249, 250)' ? 'white' : '#f8f9fa';
                }});
            }});
        }});
    </script>
</body>
</html>
"""
        
        return html_template
    
    def _observe_impl(self, observation: AgentObservation) -> None:
        """观察实现
        
        Args:
            observation: 智能体观察
        """
        # 处理新的考生信息或更新请求
        if observation.source == "student_data_update":
            profile_data = observation.data.get("profile")
            if profile_data:
                self.collect_student_profile(profile_data)
        
        elif observation.source == "report_request":
            # 生成新报告
            report = self.generate_admission_report()
            if report and self.context:
                self.context.update_memory("latest_report", report.to_dict())
    
    def _act_impl(self) -> Optional[AgentAction]:
        """行动实现
        
        Returns:
            Optional[AgentAction]: 智能体动作
        """
        # 检查是否需要生成报告
        if self.current_student and not self.current_report:
            return AgentAction(
                agent_id=self.id,
                action_type="generate_report",
                parameters={"student_id": self.current_student.name}
            )
        
        # 检查是否需要更新推荐
        if self.current_report:
            # 检查报告是否过期（超过24小时）
            time_diff = datetime.now() - self.current_report.generated_at
            if time_diff.total_seconds() > 86400:  # 24小时
                return AgentAction(
                    agent_id=self.id,
                    action_type="update_report",
                    parameters={"report_id": self.current_report.report_id}
                )
        
        return None
    
    def _process_result_impl(self, result: AgentResult) -> None:
        """处理结果实现
        
        Args:
            result: 智能体结果
        """
        if result.success:
            if result.data.get("action_type") == "generate_report":
                logger.info(f"Report generation completed for {result.data.get('student_id')}")
            elif result.data.get("action_type") == "update_report":
                logger.info(f"Report update completed for {result.data.get('report_id')}")
        else:
            logger.error(f"Action failed: {result.error}")
    
    def get_current_report_html(self) -> Optional[str]:
        """获取当前报告的HTML内容
        
        Returns:
            Optional[str]: HTML内容
        """
        if not self.current_report:
            return None
        
        return self.generate_h5_report(self.current_report)


def create_college_admission_agent(name: str = "高考志愿填报助手") -> CollegeAdmissionAgent:
    """创建高考志愿填报智能体
    
    Args:
        name: 智能体名称
        
    Returns:
        CollegeAdmissionAgent: 高考志愿填报智能体实例
    """
    config = AgentConfig(
        name=name,
        type=AgentType.EXECUTION,
        description="专业的高考志愿填报报告生成智能体，提供个性化的专业推荐和策略建议",
        parameters={
            "max_recommendations": 20,
            "report_format": "html",
            "analysis_depth": "comprehensive"
        }
    )
    
    agent = CollegeAdmissionAgent(config)
    agent.initialize()
    
    return agent