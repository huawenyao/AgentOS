"""
超级上下文采集管道 (Super Context Collection Pipeline)

该模块负责从企业内部的各种异构数据源中发现、抽取、处理和索引信息，
构建成 Agent 可理解和利用的“超级上下文”。

主要功能包括：
1.  **API 资产采集 (API Introspection)**: 自动发现和解析 OpenAPI/Swagger 规范，
    将其转换为 Agent 可用的工具 (Tools)。
2.  **文档知识抽取 (Document Ingestion)**: 处理非结构化和半结构化文档（如 Markdown, PDF, Word），
    提取关键信息，并进行向量化索引。
3.  **数据模式采集 (Schema Extraction)**: 连接数据库或数据仓库，抽取表结构、
    字段信息和关系，形成数据本体的一部分。
4.  **业务流程挖掘 (Process Mining)**: (未来扩展) 从日志或事件流中挖掘业务流程模型。
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import os
import json
from pydantic import BaseModel, Field

# ==============================================================================
# 数据源和采集结果的数据模型
# ==============================================================================

class CollectedAsset(BaseModel):
    """定义一个被采集的资产的基本结构"""
    asset_id: str = Field(..., description="资产的唯一标识符")
    source: str = Field(..., description="资产来源的标识 (例如, 文件路径, API 端点)")
    asset_type: str = Field(..., description="资产类型 (例如, 'api_spec', 'document', 'db_schema')")
    content: Any = Field(..., description="资产的原始或处理过的内容")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="与资产相关的元数据")

# ==============================================================================
# 采集器基类
# ==============================================================================

class BaseCollector(ABC):
    """
    所有采集器的抽象基类。
    每个采集器负责处理一种特定类型的数据源。
    """
    def __init__(self, source: Any):
        self.source = source

    @abstractmethod
    def collect(self) -> List[CollectedAsset]:
        """
        执行采集过程并返回一个或多个采集到的资产。
        """
        pass

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(source='{self.source}')"

# ==============================================================================
# 具体采集器实现
# ==============================================================================

class ApiSpecCollector(BaseCollector):
    """
    从 OpenAPI/Swagger (JSON 或 YAML) 文件中采集 API 规范。
    """
    def collect(self) -> List[CollectedAsset]:
        """解析 OpenAPI 文件并提取关键信息。"""
        try:
            with open(self.source, 'r', encoding='utf-8') as f:
                spec = json.load(f)
        except Exception as e:
            print(f"Error reading or parsing API spec from {self.source}: {e}")
            return []

        asset_id = f"api-spec:{spec.get('info', {}).get('title', os.path.basename(self.source))}"
        asset = CollectedAsset(
            asset_id=asset_id,
            source=self.source,
            asset_type='api_spec',
            content=spec, # 在实际场景中，这里会进行更复杂的解析和转换
            metadata={
                'title': spec.get('info', {}).get('title'),
                'version': spec.get('info', {}).get('version'),
                'servers': [s['url'] for s in spec.get('servers', [])]
            }
        )
        return [asset]

class MarkdownDocCollector(BaseCollector):
    """
    从 Markdown 文件中采集文档知识。
    """
    def collect(self) -> List[CollectedAsset]:
        """读取 Markdown 文件内容。"""
        try:
            with open(self.source, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            print(f"Error reading markdown file {self.source}: {e}")
            return []
        
        # 在实际应用中，这里会进行分块、元数据提取等操作
        asset = CollectedAsset(
            asset_id=f"doc:{os.path.basename(self.source)}",
            source=self.source,
            asset_type='document_md',
            content=content,
            metadata={'file_type': 'markdown'}
        )
        return [asset]

# ==============================================================================
# 上下文采集管道
# ==============================================================================

class ContextPipeline:
    """
    一个用于编排和执行不同采集器的管道。
    """
    def __init__(self):
        self.collectors: List[BaseCollector] = []
        self.collected_assets: Dict[str, CollectedAsset] = {}

    def add_collector(self, collector: BaseCollector):
        """向管道中添加一个采集器实例。"""
        self.collectors.append(collector)
        print(f"Added collector: {collector}")

    def run(self) -> None:
        """
        运行所有已注册的采集器，并收集资产。
        """
        print("\n--- Starting Context Collection Pipeline ---")
        for collector in self.collectors:
            try:
                assets = collector.collect()
                for asset in assets:
                    if asset.asset_id in self.collected_assets:
                        print(f"Warning: Asset with id '{asset.asset_id}' is being overwritten.")
                    self.collected_assets[asset.asset_id] = asset
                    print(f"  Successfully collected asset: {asset.asset_id} from {collector.__class__.__name__}")
            except Exception as e:
                print(f"Error running collector {collector}: {e}")
        print("--- Context Collection Pipeline Finished ---")

    def get_asset(self, asset_id: str) -> Optional[CollectedAsset]:
        """按 ID 获取已采集的资产。"""
        return self.collected_assets.get(asset_id)

    def __repr__(self) -> str:
        return f"ContextPipeline(collectors={len(self.collectors)}, collected_assets={len(self.collected_assets)})"


if __name__ == '__main__':
    # --- 演示如何使用 ---

    # 假设我们有一些资产文件在项目目录中
    # 为了演示，我们先创建一些假的资产文件
    if not os.path.exists('temp_assets'):
        os.makedirs('temp_assets')

    # 1. 创建一个假的 OpenAPI 规范文件
    fake_api_spec = {
        "openapi": "3.0.0",
        "info": {
            "title": "Order Service API",
            "version": "1.0.0"
        },
        "servers": [{"url": "http://localhost:8080/api"}],
        "paths": {
            "/orders": {
                "get": {
                    "summary": "List all orders"
                }
            }
        }
    }
    with open('temp_assets/order_api.json', 'w', encoding='utf-8') as f:
        json.dump(fake_api_spec, f)

    # 2. 创建一个假的 Markdown 文档
    fake_sop_md = """
    # Standard Operating Procedure: Order Fulfillment

    1.  Receive new order.
    2.  Check inventory levels.
    3.  Dispatch shipment.
    """
    with open('temp_assets/sop_order_fulfillment.md', 'w', encoding='utf-8') as f:
        f.write(fake_sop_md)

    # 3. 初始化并配置采集管道
    pipeline = ContextPipeline()
    pipeline.add_collector(ApiSpecCollector(source='temp_assets/order_api.json'))
    pipeline.add_collector(MarkdownDocCollector(source='temp_assets/sop_order_fulfillment.md'))

    # 4. 运行管道
    pipeline.run()

    # 5. 检查采集到的资产
    print("\n--- Verifying Collected Assets ---")
    print(pipeline)
    api_asset = pipeline.get_asset('api-spec:Order Service API')
    if api_asset:
        print("\nFound API Spec Asset:")
        print(f"  Source: {api_asset.source}")
        print(f"  Title: {api_asset.metadata.get('title')}")

    doc_asset = pipeline.get_asset('doc:sop_order_fulfillment.md')
    if doc_asset:
        print("\nFound Document Asset:")
        print(f"  Source: {doc_asset.source}")
        print(f"  Content snippet: {doc_asset.content[:50].strip()}...")

    # 清理临时文件
    import shutil
    shutil.rmtree('temp_assets')