# 丰富的能力库模拟数据说明

## 概述

本文件 `enrichedCapabilityData.ts` 为 EFIAgent 2.0 的 Agent 设计器提供了丰富的能力库模拟数据。该数据集涵盖了所有 14 个能力分类，每个分类都包含详细的能力模块示例。

## 数据结构

### 能力分类覆盖

1. **PERCEPTION_PROCESSING (感知处理)**
   - 多模态感知融合
   - 实时环境感知

2. **NATURAL_LANGUAGE_PROCESSING (自然语言处理)**
   - 高级文本生成
   - 智能对话管理

3. **KNOWLEDGE_GRAPH (知识图谱)**
   - 知识图谱构建
   - 智能知识推理

4. **REASONING (推理)**
   - 因果推理分析
   - 逻辑推理引擎

5. **PLANNING (规划)**
   - 智能任务规划
   - 动态路径规划

6. **DECISION_MAKING (决策制定)**
   - 风险评估决策
   - 多标准决策分析

7. **LEARNING (学习)**
   - 在线学习优化

8. **CODE_GENERATION (代码生成)**
   - 智能代码生成

9. **DATA_ANALYSIS (数据分析)**
   - 高级数据分析

10. **SIMULATION (仿真)**
    - 业务流程仿真

11. **AGENT_CONTROL (Agent控制)**
    - 多Agent协调控制

12. **SECURITY (安全)**
    - 智能威胁检测

13. **MONITORING (监控)**
    - 智能系统监控

14. **OTHER (其他)**
    - 通用工具集成

### 每个能力模块包含的信息

- **基本信息**: ID、名称、描述、版本、成熟度等级
- **分类信息**: 类型、子类型、分类、来源
- **输入输出**: 详细的输入输出定义和示例
- **配置参数**: 执行模式、超时、重试策略、性能目标等
- **依赖关系**: 模块间的依赖关系
- **性能指标**: 响应时间、吞吐量、成功率、准确率等
- **资源需求**: CPU、内存、GPU等资源配置
- **元数据**: 作者、组织、许可证、评分、下载量等

## 使用方法

### 1. 导入数据

```typescript
import { generateEnrichedCapabilityData } from './enrichedCapabilityData';

const capabilityData = generateEnrichedCapabilityData();
```

### 2. 按分类筛选

```typescript
import { CapabilityCategory } from '../types/CapabilitySystemTypes';

// 获取特定分类的能力
const nlpCapabilities = capabilityData.filter(
  cap => cap.category === CapabilityCategory.NATURAL_LANGUAGE_PROCESSING
);
```

### 3. 按成熟度筛选

```typescript
import { CapabilityMaturityLevel } from '../types/CapabilitySystemTypes';

// 获取优化级别的能力
const optimizedCapabilities = capabilityData.filter(
  cap => cap.maturityLevel === CapabilityMaturityLevel.OPTIMIZED
);
```

### 4. 按来源筛选

```typescript
import { CapabilitySource } from '../types/CapabilitySystemTypes';

// 获取内置能力
const builtinCapabilities = capabilityData.filter(
  cap => cap.source === CapabilitySource.BUILTIN
);
```

## 数据特点

### 1. 真实性
- 所有数据都基于实际的AI能力和技术栈
- 性能指标和资源需求符合实际情况
- 配置参数具有实用性

### 2. 多样性
- 涵盖不同复杂度的能力（简单到专家级）
- 包含不同来源的能力（内置、市场、自定义）
- 支持不同的执行模式（同步、异步、流式）

### 3. 完整性
- 每个能力模块都包含完整的配置信息
- 提供详细的输入输出示例
- 包含丰富的元数据信息

### 4. 可扩展性
- 数据结构支持轻松添加新的能力
- 配置参数可以根据需要扩展
- 支持自定义能力类型和分类

## 应用场景

1. **Agent设计器UI开发**: 为能力库界面提供丰富的展示数据
2. **功能测试**: 测试能力搜索、筛选、排序等功能
3. **性能基准**: 提供性能指标的参考基准
4. **用户体验设计**: 帮助设计更好的用户交互体验
5. **文档和培训**: 作为能力系统的示例和教学材料

## 注意事项

1. 这是模拟数据，仅用于开发和测试目的
2. 实际部署时需要替换为真实的能力数据
3. 性能指标和资源需求可能需要根据实际环境调整
4. 建议定期更新数据以保持与系统发展的同步

## 维护和更新

- 定期检查数据的准确性和完整性
- 根据新的能力类型和技术发展更新数据
- 保持与 `CapabilitySystemTypes.ts` 中类型定义的一致性
- 收集用户反馈并优化数据质量