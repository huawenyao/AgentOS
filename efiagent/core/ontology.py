from __future__ import annotations
from typing import List, Dict, Any, Type, Optional, Union
from pydantic import BaseModel, Field, create_model, validator
import datetime

# ==============================================================================
# Enterprise Ontology Core Framework
# ==============================================================================

class OntologyEntity(BaseModel):
    """
    本体中所有实体的基类。
    每个实体都有一个唯一的标识符、一个名称和一个描述。
    """
    id: str = Field(..., description="实体的唯一标识符")
    name: str = Field(..., description="实体的名称")
    description: Optional[str] = Field(None, description="实体的详细描述")

    class Config:
        extra = 'allow'  # 允许额外的属性，以实现可扩展性

class Relationship(BaseModel):
    """
    定义实体之间关系的模型。
    关系具有方向性，从一个源实体到一个或多个目标实体。
    """
    source_id: str = Field(..., description="源实体的ID")
    target_id: Union[str, List[str]] = Field(..., description="一个或多个目标实体的ID")
    type: str = Field(..., description="关系的类型 (例如, 'has_a', 'composed_of', 'manages')")
    properties: Optional[Dict[str, Any]] = Field(None, description="关系本身的属性")

# ==============================================================================
# Metric DSL (Domain-Specific Language)
# ==============================================================================

class MetricDimension(BaseModel):
    """
    指标的维度，用于对指标进行切片和切块。
    例如, 'region', 'product_category', 'time_granularity'
    """
    name: str = Field(..., description="维度的名称")
    allowed_values: Optional[List[str]] = Field(None, description="如果维度是枚举类型，则为允许的值列表")

class Metric(OntologyEntity):
    """
    业务指标的定义。
    一个指标是业务绩效的可量化度量。
    """
    calculation_logic: str = Field(..., description="用于计算指标的公式或逻辑的文本描述")
    dimensions: List[MetricDimension] = Field(..., description="可用于分析此指标的维度列表")
    data_source: str = Field(..., description="用于计算此指标的数据源 (例如, 'sales_db.orders_table')")
    update_frequency: str = Field(..., description="指标更新的频率 (例如, 'daily', 'hourly', 'real-time')")

    @validator('calculation_logic')
    def validate_calculation_logic(cls, v):
        # 在更高级的实现中，这里可以解析和验证DSL
        if not isinstance(v, str) or not v.strip():
            raise ValueError('Calculation logic must be a non-empty string.')
        return v

# ==============================================================================
# Example Ontology & Metric Definitions
# ==============================================================================

# 这是一个如何使用这些类的最小示例。
# 在实际应用中，这些将从配置文件、数据库或API动态加载。

def get_example_ontology_registry() -> Dict[str, Type[OntologyEntity]]:
    """
    返回一个包含示例本体实体定义的注册表。
    """
    # --- 核心业务实体 ---
    Product = create_model(
        'Product',
        __base__=OntologyEntity,
        category=(str, Field(..., description="产品类别")),
        unit_price=(float, Field(..., description="单位价格"))
    )

    Supplier = create_model(
        'Supplier',
        __base__=OntologyEntity,
        location=(str, Field(..., description="供应商所在地")),
        rating=(float, Field(..., description="供应商评级 (1-5)"))
    )

    Order = create_model(
        'Order',
        __base__=OntologyEntity,
        order_date=(datetime.date, Field(..., description="下单日期")),
        total_amount=(float, Field(..., description="订单总金额"))
    )
    
    return {
        "Product": Product,
        "Supplier": Supplier,
        "Order": Order
    }

def get_example_metric_definitions() -> List[Metric]:
    """
    返回一个示例业务指标的列表。
    """
    # --- 核心业务指标 ---
    daily_sales = Metric(
        id="metric-001",
        name="Daily Sales",
        description="The total revenue from sales on a given day.",
        calculation_logic="SUM(Order.total_amount) WHERE Order.order_date = TODAY",
        dimensions=[
            MetricDimension(name="region"),
            MetricDimension(name="product_category", allowed_values=["Electronics", "Clothing", "Groceries"])
        ],
        data_source="sales_db.orders_table",
        update_frequency="daily"
    )

    inventory_turnover = Metric(
        id="metric-002",
        name="Inventory Turnover",
        description="A measure of how many times inventory is sold or used in a time period.",
        calculation_logic="COGS / AVERAGE_INVENTORY",
        dimensions=[
            MetricDimension(name="warehouse_location"),
            MetricDimension(name="product_category")
        ],
        data_source="inventory_db.stock_levels, finance_db.cogs",
        update_frequency="quarterly"
    )

    return [daily_sales, inventory_turnover]

# ==============================================================================
# Ontology & Metric Management
# ==============================================================================

class OntologyManager:
    """
    一个用于管理本体实体、关系和指标的中央管理器。
    它提供了一种加载、查询和验证业务语义层的方法。
    """
    def __init__(self):
        self.entities: Dict[str, OntologyEntity] = {}
        self.entity_types: Dict[str, Type[OntologyEntity]] = {}
        self.relationships: List[Relationship] = []
        self.metrics: Dict[str, Metric] = {}

    def load_entity_types(self, entity_types: Dict[str, Type[OntologyEntity]]):
        """从字典加载实体类型定义。"""
        self.entity_types.update(entity_types)

    def add_entity(self, entity_instance: OntologyEntity):
        """添加一个实体实例。"""
        if entity_instance.id in self.entities:
            raise ValueError(f"Entity with id '{entity_instance.id}' already exists.")
        self.entities[entity_instance.id] = entity_instance

    def load_metrics(self, metrics: List[Metric]):
        """从列表加载指标定义。"""
        for metric in metrics:
            if metric.id in self.metrics:
                print(f"Warning: Metric with id '{metric.id}' is being redefined.")
            self.metrics[metric.id] = metric

    def get_metric_by_name(self, name: str) -> Optional[Metric]:
        """按名称查找指标。"""
        for metric in self.metrics.values():
            if metric.name.lower() == name.lower():
                return metric
        return None

    def __repr__(self) -> str:
        return (
            f"OntologyManager(\n"
            f"  Entity Types: {list(self.entity_types.keys())}\n"
            f"  Metrics: {list(m.name for m in self.metrics.values())}\n"
            f")"
        )

if __name__ == '__main__':
    # --- 演示如何使用 ---
    
    # 1. 初始化管理器
    manager = OntologyManager()
    
    # 2. 加载本体和指标定义 (在实际应用中，这将是动态的)
    manager.load_entity_types(get_example_ontology_registry())
    manager.load_metrics(get_example_metric_definitions())
    
    print("--- Ontology Manager Initialized ---")
    print(manager)
    
    # 3. 创建和添加实体实例
    ProductEntity = manager.entity_types['Product']
    laptop = ProductEntity(
        id="prod-123", 
        name="SuperLaptop Pro", 
        description="A high-end laptop for professionals.",
        category="Electronics",
        unit_price=1999.99
    )
    manager.add_entity(laptop)
    
    print("\n--- Added Entity Instance ---")
    print(manager.entities['prod-123'])
    
    # 4. 查询指标
    sales_metric = manager.get_metric_by_name("Daily Sales")
    
    print("\n--- Queried Metric ---")
    if sales_metric:
        print(f"Metric: {sales_metric.name}")
        print(f"  Description: {sales_metric.description}")
        print(f"  Calculation: {sales_metric.calculation_logic}")
        print(f"  Dimensions: {[d.name for d in sales_metric.dimensions]}")