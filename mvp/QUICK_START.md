# EFIAgent Phase 2 快速启动指南

**🚀 5分钟体验企业级多智能体协作系统**

---

## 1. 环境准备

### 1.1 系统要求
- **操作系统**: Linux/macOS/Windows 10+
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Python**: 3.9+ (用于开发环境)
- **内存**: 最少8GB，推荐16GB+
- **存储**: 最少20GB可用空间

### 1.2 快速检查环境
```bash
# 检查Docker
docker --version
docker-compose --version

# 检查内存
free -h  # Linux
sysctl hw.memsize  # macOS
```

---

## 2. 一键启动

### 2.1 使用Docker Compose启动（推荐）

```bash
# 1. 克隆项目
git clone https://github.com/efiagent/efiagent-phase2.git
cd efiagent-phase2/mvp

# 2. 一键启动所有服务
make start

# 或者使用docker-compose
docker-compose -f docker/docker-compose.yml up -d
```

### 2.2 验证启动状态
```bash
# 检查所有服务状态
docker-compose -f docker/docker-compose.yml ps

# 查看服务日志
docker-compose -f docker/docker-compose.yml logs -f
```

### 2.3 访问系统
- **前端界面**: http://localhost:3000
- **API文档**: http://localhost:8000/docs
- **监控面板**: http://localhost:3001 (Grafana)
- **数据库管理**: http://localhost:8080 (pgAdmin)

---

## 3. 核心功能演示

### 3.1 智能体协作演示

```python
# examples/quick_start_demo.py
import asyncio
import requests
import json

async def demonstrate_agent_collaboration():
    """演示智能体协作功能"""

    base_url = "http://localhost:8000"

    print("🤖 EFIAgent Phase 2 智能体协作演示")
    print("=" * 50)

    # 1. 创建协作任务
    print("\n1. 创建复杂分析任务...")
    task_data = {
        "task_id": "demo_001",
        "description": "金融市场风险分析",
        "required_skills": ["data_analysis", "machine_learning", "optimization"],
        "domain": "finance",
        "complexity": 0.8,
        "deadline": "2024-01-17T18:00:00Z"
    }

    response = requests.post(f"{base_url}/api/tasks", json=task_data)
    if response.status_code == 200:
        print("✅ 任务创建成功")
        task = response.json()
        print(f"   任务ID: {task['task_id']}")
    else:
        print("❌ 任务创建失败")
        return

    # 2. 技能匹配和团队组建
    print("\n2. 智能技能匹配...")
    match_response = requests.post(
        f"{base_url}/api/skill-matching",
        json={
            "required_skills": task_data["required_skills"],
            "context": {
                "domain": task_data["domain"],
                "complexity": task_data["complexity"]
            },
            "top_k": 3
        }
    )

    if match_response.status_code == 200:
        matches = match_response.json()
        print("✅ 技能匹配成功")
        for i, match in enumerate(matches, 1):
            print(f"   匹配 {i}: {match['agent_id']} (相似度: {match['similarity']:.3f})")
    else:
        print("❌ 技能匹配失败")
        return

    # 3. 发起协作请求
    print("\n3. 发起智能协作...")
    collaboration_response = requests.post(
        f"{base_url}/api/collaboration",
        json={
            "task_id": task_data["task_id"],
            "initiator": "demo_user",
            "selected_agents": [match["agent_id"] for match in matches[:2]],
            "task_data": task_data
        }
    )

    if collaboration_response.status_code == 200:
        print("✅ 协作请求发送成功")
        collaboration = collaboration_response.json()
        print(f"   协作ID: {collaboration['collaboration_id']}")
    else:
        print("❌ 协作请求失败")
        return

    # 4. 监控协作进度
    print("\n4. 监控协作进度...")
    for i in range(5):
        await asyncio.sleep(2)

        status_response = requests.get(
            f"{base_url}/api/collaboration/{collaboration['collaboration_id']}/status"
        )

        if status_response.status_code == 200:
            status = status_response.json()
            print(f"   进度 {i+1}: {status['status']} (完成度: {status['progress']:.1%})")

            if status['status'] == 'completed':
                print("✅ 协作任务完成!")
                break
        else:
            print(f"   状态查询失败: {status_response.status_code}")

    # 5. 获取结果
    print("\n5. 获取协作结果...")
    result_response = requests.get(
        f"{base_url}/api/collaboration/{collaboration['collaboration_id']}/result"
    )

    if result_response.status_code == 200:
        result = result_response.json()
        print("✅ 结果获取成功")
        print(f"   分析结果: {result['summary']}")
        print(f"   置信度: {result['confidence']:.2%}")
        print(f"   参与智能体: {len(result['participants'])} 个")
    else:
        print("❌ 结果获取失败")

if __name__ == "__main__":
    asyncio.run(demonstrate_agent_collaboration())
```

### 3.2 运行演示
```bash
# 安装依赖
pip install requests asyncio

# 运行演示
python examples/quick_start_demo.py
```

---

## 4. 核心API使用

### 4.1 技能向量匹配API

```python
import requests

# 技能匹配
response = requests.post("http://localhost:8000/api/skill-matching", json={
    "required_skills": ["data_analysis", "nlp"],
    "context": {"domain": "healthcare", "complexity": 0.7},
    "top_k": 5
})

matches = response.json()
for match in matches:
    print(f"Agent: {match['agent_id']}, 相似度: {match['similarity']:.3f}")
```

### 4.2 安全验证API

```python
# 权限验证
response = requests.post("http://localhost:8000/api/security/authorize", json={
    "agent_id": "agent_001",
    "operation": "access_sensitive_data",
    "resource_id": "financial_records_2024",
    "context": {"department": "finance", "clearance_level": "high"}
})

if response.json()["authorized"]:
    print("✅ 权限验证通过")
else:
    print("❌ 权限验证失败")
```

### 4.3 协作通信API

```python
# 发送协作消息
response = requests.post("http://localhost:8000/api/communication/send", json={
    "sender_id": "agent_001",
    "receiver_id": "agent_002",
    "message_type": "collaboration_request",
    "content": {
        "task_id": "task_001",
        "required_skills": ["optimization"],
        "urgency": "high"
    },
    "priority": "high"
})

if response.json()["success"]:
    print("✅ 消息发送成功")
```

---

## 5. 前端界面操作

### 5.1 访问前端
打开浏览器访问: http://localhost:3000

### 5.2 主要功能界面

#### 智能体管理页面
- 查看所有智能体状态
- 管理智能体能力配置
- 监控智能体性能指标

#### 任务协作页面
- 创建新协作任务
- 查看任务执行状态
- 分析协作结果

#### 技能匹配页面
- 配置技能匹配参数
- 查看匹配结果和相似度
- 优化团队组成

#### 安全管理页面
- 配置权限策略
- 查看安全审计日志
- 监控安全事件

#### 系统监控页面
- 实时系统状态监控
- 性能指标可视化
- 告警信息管理

---

## 6. 监控和调试

### 6.1 查看系统状态
```bash
# 查看所有服务状态
make status

# 查看服务日志
make dev-logs

# 查看特定服务日志
docker-compose logs -f skill-vector-matcher
docker-compose logs -f collaborative-framework
```

### 6.2 性能监控
访问Grafana监控面板: http://localhost:3001
- 用户名: admin
- 密码: admin

### 6.3 数据库管理
访问pgAdmin: http://localhost:8080
- 用户名: admin@efiagent.com
- 密码: admin

---

## 7. 开发环境设置

### 7.1 本地开发环境
```bash
# 1. 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/macOS
# 或 venv\Scripts\activate  # Windows

# 2. 安装依赖
pip install -r requirements.txt

# 3. 启动开发服务器
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 4. 启动前端开发服务器
cd ../examples/agent_designer_ui
npm start
```

### 7.2 代码质量检查
```bash
# 代码格式化
make format

# 代码检查
make lint

# 运行测试
make test
```

---

## 8. 常见问题解决

### 8.1 服务启动失败
```bash
# 检查端口占用
netstat -tulpn | grep :8000
netstat -tulpn | grep :3000

# 清理Docker资源
docker system prune -f
docker volume prune -f
```

### 8.2 内存不足
```bash
# 增加Docker内存限制
# 在Docker Desktop中调整内存设置到8GB+

# 或者减少服务副本
# 编辑 docker-compose.yml 中的 replicas 配置
```

### 8.3 网络连接问题
```bash
# 重置Docker网络
docker network prune
docker-compose down
docker-compose up -d
```

### 8.4 数据库连接失败
```bash
# 检查数据库状态
docker-compose exec postgres pg_isready

# 重启数据库服务
docker-compose restart postgres
```

---

## 9. 性能优化建议

### 9.1 开发环境优化
- 使用SSD硬盘
- 增加内存到16GB+
- 使用本地Redis替代容器Redis

### 9.2 生产环境优化
- 使用Kubernetes部署
- 配置负载均衡
- 启用Redis集群
- 使用高性能存储

---

## 10. 下一步

### 10.1 学习资源
- 📚 [完整文档](docs/)
- 🎥 [视频教程](https://youtube.com/efiagent)
- 💬 [社区论坛](https://forum.efiagent.com)
- 📧 [技术支持](support@efiagent.com)

### 10.2 进阶功能
- 尝试自定义智能体能力
- 配置复杂的协作工作流
- 集成外部API和数据源
- 开发自定义技能匹配算法

### 10.3 贡献代码
- Fork项目仓库
- 创建功能分支
- 提交Pull Request
- 参与社区讨论

---

## 🎉 开始您的智能体协作之旅！

现在您已经成功启动了EFIAgent Phase 2系统，可以开始体验企业级多智能体协作的强大功能了！

**推荐开始步骤**:
1. 浏览前端界面了解功能
2. 运行演示脚本体验核心功能
3. 尝试创建自己的协作任务
4. 探索监控和调试功能
5. 根据需求进行自定义配置

如有任何问题，请查看[故障排除指南](docs/TROUBLESHOOTING.md)或联系技术支持。

**祝您使用愉快！** 🚀