#!/bin/bash

# EFIAgent MVP 开发环境启动脚本

echo "🚀 EFIAgent MVP 开发环境启动脚本"
echo "=================================="

# 检查Docker是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker未运行，请先启动Docker"
    exit 1
fi

# 检查Docker Compose是否可用
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose未安装"
    exit 1
fi

# 进入项目目录
cd "$(dirname "$0")/.."

# 创建必要的目录
mkdir -p logs data/postgres data/redis data/vector

# 设置环境变量
export COMPOSE_PROJECT_NAME=efiagent-mvp

echo "📦 检查依赖..."

# 检查Python环境
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3未安装"
    exit 1
fi

# 检查Node.js环境
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装"
    exit 1
fi

echo "🔧 初始化开发环境..."

# 创建Python虚拟环境（如果不存在）
if [ ! -d "venv" ]; then
    echo "创建Python虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境并安装依赖
echo "安装Python依赖..."
source venv/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt

# 安装Node.js依赖
echo "安装Node.js依赖..."
cd frontend
npm install
cd ..

echo "🐳 启动Docker服务..."

# 启动基础服务
cd docker
docker-compose up -d db redis vector_db

# 等待服务启动
echo "等待数据库服务启动..."
sleep 10

# 检查服务状态
echo "检查服务状态..."
docker-compose ps

echo ""
echo "✅ 开发环境启动完成!"
echo ""
echo "🌐 服务地址:"
echo "   前端: http://localhost:3000"
echo "   后端API: http://localhost:8000"
echo "   API文档: http://localhost:8000/docs"
echo "   数据库: localhost:5432"
echo "   Redis: localhost:6379"
echo "   向量数据库: http://localhost:8080"
echo ""
echo "📝 有用的命令:"
echo "   make dev-logs     - 查看服务日志"
echo "   make dev-down     - 停止所有服务"
echo "   make test         - 运行测试"
echo "   make clean        - 清理环境"
echo ""
echo "🎯 现在可以开始开发了!"