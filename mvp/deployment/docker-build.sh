#!/bin/bash
# Docker镜像构建脚本
# 用于构建EFIAgent Phase 2所有组件的Docker镜像

set -e

# 配置变量
REGISTRY="registry.efiagent.com"
VERSION="v2.0.0"
BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
VCS_REF=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐳 EFIAgent Phase 2 Docker镜像构建${NC}"
echo "Registry: ${REGISTRY}"
echo "Version: ${VERSION}"
echo "Build Date: ${BUILD_DATE}"
echo "VCS Ref: ${VCS_REF}"
echo ""

# 构建函数
build_image() {
    local component=$1
    local dockerfile=$2
    local context=$3

    echo -e "${YELLOW}构建 ${component} 镜像...${NC}"

    docker build \
        --build-arg VERSION=${VERSION} \
        --build-arg BUILD_DATE=${BUILD_DATE} \
        --build-arg VCS_REF=${VCS_REF} \
        -t ${REGISTRY}/${component}:${VERSION} \
        -t ${REGISTRY}/${component}:latest \
        -f ${dockerfile} \
        ${context}

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ ${component} 镜像构建成功${NC}"
    else
        echo -e "${RED}❌ ${component} 镜像构建失败${NC}"
        exit 1
    fi
}

# 推送函数
push_image() {
    local component=$1

    echo -e "${YELLOW}推送 ${component} 镜像...${NC}"

    docker push ${REGISTRY}/${component}:${VERSION}
    docker push ${REGISTRY}/${component}:latest

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ ${component} 镜像推送成功${NC}"
    else
        echo -e "${RED}❌ ${component} 镜像推送失败${NC}"
        exit 1
    fi
}

# 创建构建目录
mkdir -p build

# 1. 构建技能向量匹配器镜像
echo -e "${BLUE}=== 技能向量匹配器 ===${NC}"
build_image "skill-vector-matcher" \
    "docker/skill-vector-matcher/Dockerfile" \
    "."

# 2. 构建零信任安全管理器镜像
echo -e "${BLUE}=== 零信任安全管理器 ===${NC}"
build_image "zero-trust-manager" \
    "docker/zero-trust-manager/Dockerfile" \
    "."

# 3. 构建协作通信框架镜像
echo -e "${BLUE}=== 协作通信框架 ===${NC}"
build_image "collaborative-framework" \
    "docker/collaborative-framework/Dockerfile" \
    "."

# 4. 构建智能体镜像
echo -e "${BLUE}=== 智能体 ===${NC}"
build_image "efiagent" \
    "docker/efiagent/Dockerfile" \
    "."

# 5. 构建API网关镜像
echo -e "${BLUE}=== API网关 ===${NC}"
build_image "api-gateway" \
    "docker/api-gateway/Dockerfile" \
    "."

# 6. 构建前端镜像
echo -e "${BLUE}=== 前端界面 ===${NC}"
build_image "efiagent-frontend" \
    "docker/frontend/Dockerfile" \
    "examples/agent_designer_ui"

# 7. 构建测试镜像
echo -e "${BLUE}=== 测试镜像 ===${NC}"
build_image "efiagent-tests" \
    "docker/tests/Dockerfile" \
    "."

echo -e "${BLUE}=== 镜像构建完成 ===${NC}"
echo ""

# 显示构建的镜像
echo -e "${YELLOW}构建的镜像列表：${NC}"
docker images | grep ${REGISTRY}

# 询问是否推送镜像
read -p "是否推送镜像到仓库? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}开始推送镜像...${NC}"

    # 推送所有镜像
    push_image "skill-vector-matcher"
    push_image "zero-trust-manager"
    push_image "collaborative-framework"
    push_image "efiagent"
    push_image "api-gateway"
    push_image "efiagent-frontend"
    push_image "efiagent-tests"

    echo -e "${GREEN}✅ 所有镜像推送完成${NC}"
else
    echo -e "${YELLOW}镜像已构建完成，但未推送到仓库${NC}"
fi

# 生成镜像清单
echo -e "${BLUE}生成镜像清单...${NC}"
cat > build/image-manifest-${VERSION}.yaml << EOF
# EFIAgent Phase 2 镜像清单
# Version: ${VERSION}
# Build Date: ${BUILD_DATE}
# VCS Ref: ${VCS_REF}

images:
  skill-vector-matcher:
    repository: ${REGISTRY}/skill-vector-matcher
    tag: ${VERSION}
    digest: $(docker inspect --format='{{index .RepoDigests 0}}' ${REGISTRY}/skill-vector-matcher:${VERSION} 2>/dev/null || echo "unknown")

  zero-trust-manager:
    repository: ${REGISTRY}/zero-trust-manager
    tag: ${VERSION}
    digest: $(docker inspect --format='{{index .RepoDigests 0}}' ${REGISTRY}/zero-trust-manager:${VERSION} 2>/dev/null || echo "unknown")

  collaborative-framework:
    repository: ${REGISTRY}/collaborative-framework
    tag: ${VERSION}
    digest: $(docker inspect --format='{{index .RepoDigests 0}}' ${REGISTRY}/collaborative-framework:${VERSION} 2>/dev/null || echo "unknown")

  efiagent:
    repository: ${REGISTRY}/efiagent
    tag: ${VERSION}
    digest: $(docker inspect --format='{{index .RepoDigests 0}}' ${REGISTRY}/efiagent:${VERSION} 2>/dev/null || echo "unknown")

  api-gateway:
    repository: ${REGISTRY}/api-gateway
    tag: ${VERSION}
    digest: $(docker inspect --format='{{index .RepoDigests 0}}' ${REGISTRY}/api-gateway:${VERSION} 2>/dev/null || echo "unknown")

  efiagent-frontend:
    repository: ${REGISTRY}/efiagent-frontend
    tag: ${VERSION}
    digest: $(docker inspect --format='{{index .RepoDigests 0}}' ${REGISTRY}/efiagent-frontend:${VERSION} 2>/dev/null || echo "unknown")

  efiagent-tests:
    repository: ${REGISTRY}/efiagent-tests
    tag: ${VERSION}
    digest: $(docker inspect --format='{{index .RepoDigests 0}}' ${REGISTRY}/efiagent-tests:${VERSION} 2>/dev/null || echo "unknown")
EOF

echo -e "${GREEN}✅ Docker镜像构建流程完成!${NC}"
echo -e "${BLUE}镜像清单已保存到: build/image-manifest-${VERSION}.yaml${NC}"