# EFIAgent Phase 2 生产环境部署方案

**文档版本**: 1.0
**创建日期**: 2024-01-16
**更新日期**: 2024-01-16
**状态**: 生产就绪

## 1. 概述

本文档提供EFIAgent Phase 2企业级多智能体协作系统的完整生产环境部署方案。Phase 2在MVP基础上增强了技能向量匹配、零信任安全架构和多模态协作通信框架，支持100+并发智能体、100ms响应时间、99.9%可用性的企业级要求。

### 1.1 部署架构特点

- **分层联邦架构**: 协调层、认知层、数据层分层部署
- **混合通信拓扑**: 自适应星型+网状拓扑，支持动态路由
- **零信任安全**: 端到端加密、动态权限控制、实时审计
- **高可用设计**: 多副本、自动故障转移、负载均衡
- **弹性扩展**: 支持水平扩展，自动资源调度
- **监控运维**: 全链路监控、自动化运维、智能告警

### 1.2 技术栈概览

| 组件类别 | 技术选型 | 版本 | 用途 |
|---------|---------|------|------|
| 容器化 | Docker | 24.0+ | 应用容器化 |
| 编排平台 | Kubernetes | 1.28+ | 容器编排管理 |
| 服务网格 | Istio | 1.19+ | 微服务通信管理 |
| 负载均衡 | NGINX Ingress | 1.9+ | 流量入口管理 |
| 数据存储 | PostgreSQL | 15+ | 关系型数据 |
| 缓存系统 | Redis Cluster | 7.2+ | 分布式缓存 |
| 向量数据库 | Weaviate | 1.22+ | 技能向量存储 |
| 图数据库 | Neo4j | 5.13+ | 知识图谱存储 |
| 消息队列 | RabbitMQ | 3.12+ | 异步消息处理 |
| 监控系统 | Prometheus | 2.45+ | 指标收集 |
| 日志系统 | ELK Stack | 8.10+ | 日志聚合分析 |
| 链路追踪 | Jaeger | 1.50+ | 分布式追踪 |

## 2. 系统架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    Internet/CDN                             │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                Load Balancer (NGINX)                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                API Gateway (Kong/Istio)                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
┌───────▼──────┐ ┌────▼────┐ ┌─────▼─────┐
│ Coordination │ │ Cognitive│ │   Data    │
│   Layer      │ │  Layer  │ │   Layer   │
└───────┬──────┘ └────┬────┘ └─────┬─────┘
        │            │            │
        └────────────┼────────────┘
                     │
        ┌────────────▼────────────┐
        │    Infrastructure      │
        │ (Kubernetes Cluster)   │
        └─────────────────────────┘
```

### 2.2 分层架构设计

#### 2.2.1 协调层 (Coordination Layer)
- **元调度中心**: 任务调度和资源分配
- **动态角色引擎**: 智能体角色动态分配
- **进化控制器**: 系统优化和学习

#### 2.2.2 认知层 (Cognitive Layer)
- **规划Agent**: 任务分解和规划
- **执行Agent组**: 具体任务执行
- **审核Agent组**: 结果验证和质量控制

#### 2.2.3 数据层 (Data Layer)
- **分布式记忆体**: 工作记忆、长期记忆、元记忆
- **知识图谱**: 领域知识和关系存储
- **规则库**: 业务规则和约束条件

### 2.3 核心组件部署

#### 2.3.1 技能向量匹配系统
```yaml
# skill-vector-matcher-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: skill-vector-matcher
  namespace: efiagent
spec:
  replicas: 3
  selector:
    matchLabels:
      app: skill-vector-matcher
  template:
    metadata:
      labels:
        app: skill-vector-matcher
    spec:
      containers:
      - name: skill-vector-matcher
        image: efiagent/skill-vector-matcher:v2.0.0
        ports:
        - containerPort: 8080
        env:
        - name: REDIS_URL
          value: "redis://redis-cluster:6379"
        - name: WEAVIATE_URL
          value: "http://weaviate:8080"
        - name: MODEL_DIMENSION
          value: "128"
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
```

#### 2.3.2 零信任安全架构
```yaml
# zero-trust-security-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: zero-trust-manager
  namespace: efiagent
spec:
  replicas: 2
  selector:
    matchLabels:
      app: zero-trust-manager
  template:
    metadata:
      labels:
        app: zero-trust-manager
    spec:
      containers:
      - name: zero-trust-manager
        image: efiagent/zero-trust-manager:v2.0.0
        ports:
        - containerPort: 9090
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: efiagent-secrets
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: efiagent-secrets
              key: jwt-secret
        - name: BLOCKCHAIN_ENDPOINT
          value: "https://blockchain.efiagent.com"
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        volumeMounts:
        - name: certs
          mountPath: /app/certs
          readOnly: true
      volumes:
      - name: certs
        secret:
          secretName: efiagent-certs
```

#### 2.3.3 多模态协作通信框架
```yaml
# collaborative-framework-deployment.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: collaborative-framework
  namespace: efiagent
spec:
  serviceName: collaborative-framework
  replicas: 5
  selector:
    matchLabels:
      app: collaborative-framework
  template:
    metadata:
      labels:
        app: collaborative-framework
    spec:
      containers:
      - name: collaborative-framework
        image: efiagent/collaborative-framework:v2.0.0
        ports:
        - containerPort: 8000
        env:
        - name: AGENT_ID
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: CLUSTER_SIZE
          value: "5"
        - name: REDIS_CLUSTER_URL
          value: "redis://redis-cluster:6379"
        - name: TOPOLOGY_ADAPTATION_INTERVAL
          value: "300"
        resources:
          requests:
            memory: "1.5Gi"
            cpu: "800m"
          limits:
            memory: "3Gi"
            cpu: "1600m"
        livenessProbe:
          exec:
            command:
            - /bin/sh
            - -c
            - "curl -f http://localhost:8000/health || exit 1"
          initialDelaySeconds: 60
          periodSeconds: 30
        readinessProbe:
          exec:
            command:
            - /bin/sh
            - -c
            - "curl -f http://localhost:8000/ready || exit 1"
          initialDelaySeconds: 30
          periodSeconds: 10
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 10Gi
```

## 3. 基础设施部署

### 3.1 Kubernetes集群配置

#### 3.1.1 集群规格要求

**生产环境集群配置**:
- **Master节点**: 3节点，每节点8核CPU，32GB内存，200GB SSD
- **Worker节点**: 6-10节点，每节点16核CPU，64GB内存，500GB SSD
- **网络**: 10Gbps内部网络，BGP路由
- **存储**: 分布式存储Ceph，支持动态卷供应
- **负载均衡**: 硬件负载均衡器F5/A10

**高可用配置**:
- **etcd集群**: 3节点，每节点4核CPU，8GB内存，100GB SSD
- **控制平面**: 多主节点部署，API Server负载均衡
- **数据平面**: Pod反亲和性，跨节点部署
- **网络策略**: Calico网络策略，零信任网络

#### 3.1.2 集群初始化脚本

```bash
#!/bin/bash
# k8s-cluster-setup.sh

set -e

# 配置参数
KUBERNETES_VERSION="1.28.2"
POD_CIDR="10.244.0.0/16"
SERVICE_CIDR="10.96.0.0/12"

echo "初始化Kubernetes集群..."

# 1. 安装容器运行时
echo "安装containerd..."
cat <<EOF | sudo tee /etc/modules-load.d/containerd.conf
overlay
br_netfilter
EOF

sudo modprobe overlay
sudo modprobe br_netfilter

cat <<EOF | sudo tee /etc/sysctl.d/99-kubernetes-cri.conf
net.bridge.bridge-nf-call-iptables  = 1
net.ipv4.ip_forward                 = 1
net.bridge.bridge-nf-call-ip6tables = 1
EOF

sudo sysctl --system

# 安装containerd
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
sudo apt-get update
sudo apt-get install -y containerd.io

sudo mkdir -p /etc/containerd
sudo containerd config default | sudo tee /etc/containerd/config.toml
sudo systemctl restart containerd

# 2. 安装kubeadm, kubelet, kubectl
echo "安装Kubernetes组件..."
curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -
sudo apt-add-repository "deb http://apt.kubernetes.io/ kubernetes-xenial main"
sudo apt-get update
sudo apt-get install -y kubelet=${KUBERNETES_VERSION}-00 kubeadm=${KUBERNETES_VERSION}-00 kubectl=${KUBERNETES_VERSION}-00
sudo apt-mark hold kubelet kubeadm kubectl

# 3. 初始化集群（仅在master节点执行）
if [ "$1" == "master" ]; then
    echo "初始化Master节点..."
    sudo kubeadm init --pod-network-cidr=${POD_CIDR} --service-cidr=${SERVICE_CIDR} --kubernetes-version=${KUBERNETES_VERSION}

    # 配置kubectl
    mkdir -p $HOME/.kube
    sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
    sudo chown $(id -u):$(id -g) $HOME/.kube/config

    # 安装网络插件
    kubectl apply -f https://docs.projectcalico.org/manifests/calico.yaml

    # 安装ingress-nginx
    kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.9.0/deploy/static/provider/cloud/deploy.yaml

    echo "集群初始化完成"
    echo "Join command:"
    sudo kubeadm token create --print-join-command
fi

echo "节点配置完成"
```

### 3.2 存储系统部署

#### 3.2.1 PostgreSQL高可用集群

```yaml
# postgresql-cluster.yaml
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: postgres-cluster
  namespace: efiagent
spec:
  instances: 3
  primaryUpdateStrategy: unsupervised

  postgresql:
    parameters:
      max_connections: "200"
      shared_buffers: "256MB"
      effective_cache_size: "1GB"
      work_mem: "4MB"
      maintenance_work_mem: "64MB"
      checkpoint_completion_target: "0.9"
      wal_buffers: "16MB"
      default_statistics_target: "100"
      random_page_cost: "1.1"
      effective_io_concurrency: "200"

  bootstrap:
    initdb:
      database: efiagent
      owner: efiagent
      secret:
        name: postgres-credentials

  storage:
    size: 100Gi
    storageClass: fast-ssd

  monitoring:
    enabled: true

  backup:
    retentionPolicy: "30d"
    barmanObjectStore:
      destinationPath: "s3://efiagent-backups/postgres"
      s3Credentials:
        accessKeyId:
          name: backup-credentials
          key: ACCESS_KEY_ID
        secretAccessKey:
          name: backup-credentials
          key: SECRET_ACCESS_KEY
      wal:
        compression: gzip
        encryption: AES256
```

#### 3.2.2 Redis Cluster配置

```yaml
# redis-cluster.yaml
apiVersion: redis.redis.opstreelabs.in/v1beta1
kind: RedisCluster
metadata:
  name: redis-cluster
  namespace: efiagent
spec:
  clusterSize: 6
  clusterVersion: v7.2.3
  persistenceEnabled: true

  redisExporter:
    enabled: true
    image: oliver006/redis_exporter:latest

  storage:
    volumeClaimTemplate:
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 20Gi
        storageClassName: fast-ssd

  resources:
    requests:
      memory: "2Gi"
      cpu: "1000m"
    limits:
      memory: "4Gi"
      cpu: "2000m"

  redisConfig: |
    maxmemory 2gb
    maxmemory-policy allkeys-lru
    save 900 1
    save 300 10
    save 60 10000
    tcp-keepalive 300
    timeout 0
```

#### 3.2.3 Weaviate向量数据库

```yaml
# weaviate.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: weaviate
  namespace: efiagent
spec:
  replicas: 3
  selector:
    matchLabels:
      app: weaviate
  template:
    metadata:
      labels:
        app: weaviate
    spec:
      containers:
      - name: weaviate
        image: semitechnologies/weaviate:1.22.4
        ports:
        - containerPort: 8080
        env:
        - name: QUERY_DEFAULTS_LIMIT
          value: "100"
        - name: AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED
          value: "true"
        - name: PERSISTENCE_DATA_PATH
          value: "/var/lib/weaviate"
        - name: DEFAULT_VECTORIZER_MODULE
          value: "none"
        - name: ENABLE_MODULES
          value: "text2vec-openai,generative-openai"
        - name: CLUSTER_HOSTNAME
          value: "node-1"
        - name: CLUSTER_GOSSIP_BIND_PORT
          value: "7100"
        - name: CLUSTER_DATA_BIND_PORT
          value: "7101"
        resources:
          requests:
            memory: "4Gi"
            cpu: "2000m"
          limits:
            memory: "8Gi"
            cpu: "4000m"
        volumeMounts:
        - name: data
          mountPath: /var/lib/weaviate
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: weaviate-data
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: weaviate-data
  namespace: efiagent
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 100Gi
  storageClassName: fast-ssd
```

### 3.3 网络配置

#### 3.3.1 Istio服务网格配置

```yaml
# istio-config.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: efiagent
  labels:
    istio-injection: enabled
---
apiVersion: networking.istio.io/v1alpha3
kind: Gateway
metadata:
  name: efiagent-gateway
  namespace: efiagent
spec:
  selector:
    istio: ingressgateway
  servers:
  - port:
      number: 80
      name: http
      protocol: HTTP
    hosts:
    - "efiagent.com"
    tls:
      httpsRedirect: true
  - port:
      number: 443
      name: https
      protocol: HTTPS
    tls:
      mode: SIMPLE
      credentialName: efiagent-tls
    hosts:
    - "efiagent.com"
---
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: efiagent
spec:
  mtls:
    mode: STRICT
---
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: allow-specific-paths
  namespace: efiagent
spec:
  selector:
    matchLabels:
      app: collaborative-framework
  rules:
  - to:
    - operation:
        methods: ["GET", "POST"]
        paths: ["/api/*"]
```

#### 3.3.2 网络策略配置

```yaml
# network-policies.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: efiagent-network-policy
  namespace: efiagent
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: istio-system
    - namespaceSelector:
        matchLabels:
          name: efiagent
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: efiagent
  - to: []
    ports:
    - protocol: TCP
      port: 53
    - protocol: UDP
      port: 53
  - to: []
    ports:
    - protocol: TCP
      port: 443
    - protocol: TCP
      port: 80
```

## 4. 监控和运维

### 4.1 Prometheus监控配置

```yaml
# prometheus-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s

    rule_files:
      - "/etc/prometheus/rules/*.yml"

    alerting:
      alertmanagers:
        - static_configs:
            - targets:
              - alertmanager:9093

    scrape_configs:
      # Kubernetes API Server
      - job_name: 'kubernetes-apiservers'
        kubernetes_sd_configs:
        - role: endpoints
        scheme: https
        tls_config:
          ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
        relabel_configs:
        - source_labels: [__meta_kubernetes_namespace, __meta_kubernetes_service_name, __meta_kubernetes_endpoint_port_name]
          action: keep
          regex: default;kubernetes;https

      # EFIAgent Services
      - job_name: 'efiagent-services'
        kubernetes_sd_configs:
        - role: endpoints
          namespaces:
            names:
            - efiagent
        relabel_configs:
        - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_scrape]
          action: keep
          regex: true
        - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_path]
          action: replace
          target_label: __metrics_path__
          regex: (.+)
        - source_labels: [__address__, __meta_kubernetes_service_annotation_prometheus_io_port]
          action: replace
          regex: ([^:]+)(?::\d+)?;(\d+)
          replacement: $1:$2
          target_label: __address__

      # Node Exporter
      - job_name: 'kubernetes-nodes'
        kubernetes_sd_configs:
        - role: node
        relabel_configs:
        - action: labelmap
          regex: __meta_kubernetes_node_label_(.+)
        - target_label: __address__
          replacement: kubernetes.default.svc:443
        - source_labels: [__meta_kubernetes_node_name]
          regex: (.+)
          target_label: __metrics_path__
          replacement: /api/v1/nodes/${1}/proxy/metrics
```

### 4.2 告警规则配置

```yaml
# alerting-rules.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-rules
  namespace: monitoring
data:
  efiagent.yml: |
    groups:
    - name: efiagent.rules
      rules:
      # 可用性告警
      - alert: ServiceDown
        expr: up{job=~"efiagent-.*"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "EFIAgent service {{ $labels.instance }} is down"
          description: "EFIAgent service {{ $labels.instance }} has been down for more than 1 minute."

      # 响应时间告警
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job=~"efiagent-.*"}[5m])) > 0.1
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High response time on {{ $labels.instance }}"
          description: "95th percentile response time is {{ $value }}s on {{ $labels.instance }}."

      # 错误率告警
      - alert: HighErrorRate
        expr: rate(http_requests_total{job=~"efiagent-.*",status=~"5.."}[5m]) / rate(http_requests_total{job=~"efiagent-.*"}[5m]) > 0.05
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "High error rate on {{ $labels.instance }}"
          description: "Error rate is {{ $value | humanizePercentage }} on {{ $labels.instance }}."

      # 资源使用告警
      - alert: HighMemoryUsage
        expr: container_memory_usage_bytes{pod=~"efiagent-.*"} / container_spec_memory_limit_bytes > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage on {{ $labels.pod }}"
          description: "Memory usage is {{ $value | humanizePercentage }} on {{ $labels.pod }}."

      - alert: HighCPUUsage
        expr: rate(container_cpu_usage_seconds_total{pod=~"efiagent-.*"}[5m]) > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage on {{ $labels.pod }}"
          description: "CPU usage is {{ $value | humanizePercentage }} on {{ $labels.pod }}."

      # 技能向量匹配告警
      - alert: SkillMatchingLatency
        expr: histogram_quantile(0.95, rate(skill_matching_duration_seconds_bucket[5m])) > 0.01
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High skill matching latency"
          description: "95th percentile skill matching latency is {{ $value }}s."

      # 通信框架告警
      - alert: MessageQueueBacklog
        expr: message_queue_size > 1000
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Message queue backlog"
          description: "Message queue size is {{ $value }} messages."

      # 安全告警
      - alert: SecurityViolation
        expr: increase(security_violations_total[5m]) > 0
        for: 0m
        labels:
          severity: critical
        annotations:
          summary: "Security violation detected"
          description: "{{ $value }} security violations detected in the last 5 minutes."
```

### 4.3 Grafana仪表板

```json
{
  "dashboard": {
    "id": null,
    "title": "EFIAgent Phase 2 Dashboard",
    "tags": ["efiagent", "phase2"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "System Overview",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=~\"efiagent-.*\"}",
            "legendFormat": "{{instance}}"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "thresholds"
            },
            "thresholds": {
              "steps": [
                {"color": "red", "value": 0},
                {"color": "green", "value": 1}
              ]
            }
          }
        }
      },
      {
        "id": 2,
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job=~\"efiagent-.*\"}[5m]))",
            "legendFormat": "95th percentile"
          },
          {
            "expr": "histogram_quantile(0.50, rate(http_request_duration_seconds_bucket{job=~\"efiagent-.*\"}[5m]))",
            "legendFormat": "50th percentile"
          }
        ]
      },
      {
        "id": 3,
        "title": "Skill Matching Performance",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(skill_matching_requests_total[5m])",
            "legendFormat": "Requests/sec"
          },
          {
            "expr": "histogram_quantile(0.95, rate(skill_matching_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile latency"
          }
        ]
      },
      {
        "id": 4,
        "title": "Communication Metrics",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(messages_sent_total[5m])",
            "legendFormat": "Messages sent/sec"
          },
          {
            "expr": "rate(messages_received_total[5m])",
            "legendFormat": "Messages received/sec"
          },
          {
            "expr": "message_delivery_success_rate",
            "legendFormat": "Delivery success rate"
          }
        ]
      },
      {
        "id": 5,
        "title": "Security Metrics",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(authorization_requests_total[5m])",
            "legendFormat": "Auth requests/sec"
          },
          {
            "expr": "rate(security_violations_total[5m])",
            "legendFormat": "Security violations/sec"
          }
        ]
      },
      {
        "id": 6,
        "title": "Resource Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(container_cpu_usage_seconds_total{pod=~\"efiagent-.*\"}[5m])",
            "legendFormat": "{{pod}} CPU"
          },
          {
            "expr": "container_memory_usage_bytes{pod=~\"efiagent-.*\"} / 1024 / 1024",
            "legendFormat": "{{pod}} Memory (MB)"
          }
        ]
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "30s"
  }
}
```

## 5. 安全配置

### 5.1 零信任网络安全

#### 5.1.1 Pod安全策略

```yaml
# pod-security-policy.yaml
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: efiagent-psp
spec:
  privileged: false
  allowPrivilegeEscalation: false
  requiredDropCapabilities:
    - ALL
  volumes:
    - 'configMap'
    - 'emptyDir'
    - 'projected'
    - 'secret'
    - 'downwardAPI'
    - 'persistentVolumeClaim'
  runAsUser:
    rule: 'MustRunAsNonRoot'
  seLinux:
    rule: 'RunAsAny'
  fsGroup:
    rule: 'RunAsAny'
  readOnlyRootFilesystem: true
```

#### 5.1.2 RBAC权限配置

```yaml
# rbac.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: efiagent-service-account
  namespace: efiagent
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: efiagent
  name: efiagent-role
rules:
- apiGroups: [""]
  resources: ["pods", "services", "configmaps", "secrets"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets"]
  verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: efiagent-role-binding
  namespace: efiagent
subjects:
- kind: ServiceAccount
  name: efiagent-service-account
  namespace: efiagent
roleRef:
  kind: Role
  name: efiagent-role
  apiGroup: rbac.authorization.k8s.io
```

### 5.2 密钥管理

#### 5.2.1 外部密钥管理

```yaml
# external-secrets.yaml
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: vault-backend
  namespace: efiagent
spec:
  provider:
    vault:
      server: "https://vault.efiagent.com:8200"
      path: "secret"
      version: "v2"
      auth:
        kubernetes:
          mountPath: "kubernetes"
          role: "efiagent-role"
---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: efiagent-database-credentials
  namespace: efiagent
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: vault-backend
    kind: SecretStore
  target:
    name: database-credentials
    creationPolicy: Owner
  data:
  - secretKey: username
    remoteRef:
      key: efiagent/database
      property: username
  - secretKey: password
    remoteRef:
      key: efiagent/database
      property: password
```

## 6. 部署脚本

### 6.1 自动化部署脚本

```bash
#!/bin/bash
# deploy-phase2.sh

set -e

# 配置变量
NAMESPACE="efiagent"
ENVIRONMENT="production"
VERSION="v2.0.0"
REGISTRY="registry.efiagent.com"

echo "🚀 开始部署 EFIAgent Phase 2 到 ${ENVIRONMENT} 环境"

# 1. 创建命名空间
echo "创建命名空间..."
kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -

# 2. 创建密钥
echo "创建密钥..."
kubectl create secret generic efiagent-secrets \
  --from-literal=database-url="${DATABASE_URL}" \
  --from-literal=jwt-secret="${JWT_SECRET}" \
  --from-literal=redis-password="${REDIS_PASSWORD}" \
  --namespace ${NAMESPACE} \
  --dry-run=client -o yaml | kubectl apply -f -

# 3. 部署存储系统
echo "部署存储系统..."
kubectl apply -f manifests/postgresql-cluster.yaml
kubectl apply -f manifests/redis-cluster.yaml
kubectl apply -f manifests/weaviate.yaml

# 等待存储系统就绪
echo "等待存储系统就绪..."
kubectl wait --for=condition=ready pod -l app=postgres-cluster -n ${NAMESPACE} --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis-cluster -n ${NAMESPACE} --timeout=300s
kubectl wait --for=condition=ready pod -l app=weaviate -n ${NAMESPACE} --timeout=300s

# 4. 部署核心组件
echo "部署核心组件..."
kubectl apply -f manifests/skill-vector-matcher-deployment.yaml
kubectl apply -f manifests/zero-trust-security-deployment.yaml
kubectl apply -f manifests/collaborative-framework-deployment.yaml

# 5. 部署监控系统
echo "部署监控系统..."
kubectl apply -f manifests/monitoring/
kubectl wait --for=condition=ready pod -l app=prometheus -n monitoring --timeout=300s
kubectl wait --for=condition=ready pod -l app=grafana -n monitoring --timeout=300s

# 6. 配置网络和安全
echo "配置网络和安全..."
kubectl apply -f manifests/networking/
kubectl apply -f manifests/security/

# 7. 验证部署
echo "验证部署状态..."
kubectl get pods -n ${NAMESPACE}
kubectl get services -n ${NAMESPACE}

# 8. 运行健康检查
echo "运行健康检查..."
./scripts/health-check.sh ${NAMESPACE}

# 9. 运行集成测试
echo "运行集成测试..."
./scripts/integration-test.sh ${NAMESPACE}

echo "✅ EFIAgent Phase 2 部署完成!"
echo "🌐 访问地址: https://efiagent.com"
echo "📊 监控面板: https://grafana.efiagent.com"
echo "📚 API文档: https://api.efiagent.com/docs"
```

### 6.2 健康检查脚本

```bash
#!/bin/bash
# health-check.sh

NAMESPACE=${1:-efiagent}
MAX_RETRIES=30
RETRY_INTERVAL=10

echo "🔍 开始健康检查 (命名空间: ${NAMESPACE})"

# 检查Pod状态
check_pods() {
    echo "检查Pod状态..."

    local failed_pods=$(kubectl get pods -n ${NAMESPACE} --field-selector=status.phase!=Running --no-headers | wc -l)

    if [ ${failed_pods} -gt 0 ]; then
        echo "❌ 发现 ${failed_pods} 个异常Pod"
        kubectl get pods -n ${NAMESPACE} --field-selector=status.phase!=Running
        return 1
    fi

    echo "✅ 所有Pod运行正常"
    return 0
}

# 检查服务状态
check_services() {
    echo "检查服务状态..."

    local services=("skill-vector-matcher" "zero-trust-manager" "collaborative-framework")

    for service in "${services[@]}"; do
        local endpoint="http://${service}.${NAMESPACE}.svc.cluster.local:8080/health"

        if ! curl -f -s ${endpoint} > /dev/null; then
            echo "❌ 服务 ${service} 健康检查失败"
            return 1
        fi
    done

    echo "✅ 所有服务健康检查通过"
    return 0
}

# 检查数据库连接
check_databases() {
    echo "检查数据库连接..."

    # 检查PostgreSQL
    if ! kubectl exec -n ${NAMESPACE} deployment/postgres-cluster -- psql -U efiagent -d efiagent -c "SELECT 1;" > /dev/null 2>&1; then
        echo "❌ PostgreSQL连接失败"
        return 1
    fi

    # 检查Redis
    if ! kubectl exec -n ${NAMESPACE} deployment/redis-cluster -- redis-cli ping > /dev/null 2>&1; then
        echo "❌ Redis连接失败"
        return 1
    fi

    echo "✅ 数据库连接正常"
    return 0
}

# 检查网络连接
check_networking() {
    echo "检查网络连接..."

    # 检查Ingress
    local ingress_url="https://efiagent.com/health"

    if ! curl -f -s -k ${ingress_url} > /dev/null; then
        echo "❌ Ingress健康检查失败"
        return 1
    fi

    echo "✅ 网络连接正常"
    return 0
}

# 主检查循环
main() {
    local retry_count=0

    while [ ${retry_count} -lt ${MAX_RETRIES} ]; do
        echo "健康检查尝试 $((retry_count + 1))/${MAX_RETRIES}"

        if check_pods && check_services && check_databases && check_networking; then
            echo "🎉 所有健康检查通过!"
            return 0
        fi

        echo "⏳ 等待 ${RETRY_INTERVAL} 秒后重试..."
        sleep ${RETRY_INTERVAL}
        retry_count=$((retry_count + 1))
    done

    echo "❌ 健康检查失败，已达到最大重试次数"
    return 1
}

main
```

### 6.3 回滚脚本

```bash
#!/bin/bash
# rollback.sh

set -e

NAMESPACE=${1:-efiagent}
VERSION=${2:-v1.0.0}

echo "🔄 开始回滚到版本 ${VERSION}"

# 1. 备份当前配置
echo "备份当前配置..."
kubectl get all -n ${NAMESPACE} -o yaml > backup-${NAMESPACE}-$(date +%Y%m%d-%H%M%S).yaml

# 2. 停止新版本服务
echo "停止新版本服务..."
kubectl scale deployment --replicas=0 -n ${NAMESPACE} --all

# 3. 部署旧版本
echo "部署旧版本 ${VERSION}..."
kubectl apply -f manifests/${VERSION}/

# 4. 验证回滚
echo "验证回滚状态..."
kubectl rollout status deployment -n ${NAMESPACE}

# 5. 运行健康检查
echo "运行健康检查..."
./scripts/health-check.sh ${NAMESPACE}

echo "✅ 回滚完成!"
```

## 7. 运维手册

### 7.1 日常运维检查清单

#### 7.1.1 每日检查项目

- [ ] 检查所有Pod状态：`kubectl get pods -n efiagent`
- [ ] 检查服务可用性：`curl -f https://efiagent.com/health`
- [ ] 检查资源使用率：`kubectl top pods -n efiagent`
- [ ] 检查错误日志：`kubectl logs -n efiagent --tail=100`
- [ ] 检查备份状态：验证自动备份是否正常
- [ ] 检查安全告警：查看是否有安全违规事件

#### 7.1.2 每周检查项目

- [ ] 性能指标分析：CPU、内存、网络、响应时间
- [ ] 存储容量检查：确保有足够的存储空间
- [ ] 证书过期检查：SSL证书是否即将过期
- [ ] 安全补丁检查：检查是否有安全更新
- [ ] 监控告警规则验证：确保告警规则正常工作

#### 7.1.3 每月检查项目

- [ ] 容量规划评估：评估资源使用趋势
- [ ] 灾难恢复演练：验证备份和恢复流程
- [ ] 性能基准测试：运行性能基准测试
- [ ] 安全审计：进行全面的安全审计
- [ ] 文档更新：更新运维文档和架构图

### 7.2 故障排查指南

#### 7.2.1 常见问题及解决方案

**问题1：Pod无法启动**
```bash
# 检查Pod状态
kubectl describe pod <pod-name> -n efiagent

# 常见原因检查
kubectl get events -n efiagent --sort-by='.lastTimestamp'
kubectl logs <pod-name> -n efiagent

# 解决方案
# 1. 检查资源限制
# 2. 检查镜像拉取权限
# 3. 检查配置文件
# 4. 检查存储挂载
```

**问题2：服务响应缓慢**
```bash
# 检查资源使用
kubectl top pods -n efiagent
kubectl top nodes

# 检查网络延迟
kubectl exec -it <pod-name> -n efiagent -- ping <target-service>

# 检查应用日志
kubectl logs <pod-name> -n efiagent --tail=100

# 解决方案
# 1. 增加Pod副本数
# 2. 调整资源限制
# 3. 优化应用配置
# 4. 检查网络策略
```

**问题3：数据库连接失败**
```bash
# 检查数据库状态
kubectl get pods -n efiagent -l app=postgres-cluster
kubectl logs -n efiagent deployment/postgres-cluster

# 测试连接
kubectl exec -it <pod-name> -n efiagent -- psql -h postgres-cluster -U efiagent -d efiagent

# 解决方案
# 1. 检查数据库服务状态
# 2. 验证连接字符串
# 3. 检查网络策略
# 4. 重启数据库服务
```

#### 7.2.2 性能调优建议

**技能向量匹配优化**：
- 增加向量维度以提高匹配精度
- 使用FAISS索引加速向量搜索
- 实现向量缓存机制
- 优化批处理大小

**通信框架优化**：
- 调整消息队列大小
- 优化网络拓扑适配算法
- 实现消息批处理
- 使用连接池管理

**安全系统优化**：
- 缓存权限验证结果
- 优化加密算法选择
- 实现异步审计日志
- 使用硬件加速

### 7.3 扩容指南

#### 7.3.1 水平扩容

```bash
# 扩容协作框架实例
kubectl scale statefulset collaborative-framework --replicas=10 -n efiagent

# 扩容技能向量匹配器
kubectl scale deployment skill-vector-matcher --replicas=5 -n efiagent

# 扩容Redis集群
kubectl patch rediscluster redis-cluster -n efiagent -p '{"spec":{"clusterSize":9}}'
```

#### 7.3.2 垂直扩容

```bash
# 更新资源限制
kubectl patch deployment skill-vector-matcher -n efiagent -p '{
  "spec": {
    "template": {
      "spec": {
        "containers": [{
          "name": "skill-vector-matcher",
          "resources": {
            "limits": {
              "memory": "8Gi",
              "cpu": "4000m"
            }
          }
        }]
      }
    }
  }
}'
```

### 7.4 备份和恢复

#### 7.4.1 数据备份策略

**数据库备份**：
```bash
# PostgreSQL全量备份
kubectl exec -n efiagent deployment/postgres-cluster -- pg_dump -U efiagent efiagent > backup-$(date +%Y%m%d).sql

# 增量备份（WAL归档）
kubectl exec -n efiagent deployment/postgres-cluster -- pg_basebackup -U efiagent -D /backup/incremental-$(date +%Y%m%d)
```

**向量数据备份**：
```bash
# Weaviate数据备份
kubectl exec -n efiagent deployment/weaviate -- wget http://localhost:8080/v1/.well-known/ready -O backup-$(date +%Y%m%d).json
```

#### 7.4.2 恢复流程

```bash
# 1. 停止应用服务
kubectl scale deployment --replicas=0 -n efiagent --all

# 2. 恢复数据库
kubectl exec -i -n efiagent deployment/postgres-cluster -- psql -U efiagent efiagent < backup-20240116.sql

# 3. 恢复向量数据
kubectl cp backup-20240116.json efiagent/weaviate-0:/tmp/
kubectl exec -n efiagent deployment/weaviate -- weaviate import --input /tmp/backup-20240116.json

# 4. 重启应用服务
kubectl scale deployment --replicas=1 -n efiagent --all
```

## 8. 总结

本部署方案提供了EFIAgent Phase 2的完整生产环境部署指南，包括：

### 8.1 核心特性
- **企业级架构**: 分层联邦架构，支持100+并发智能体
- **高可用设计**: 99.9%可用性，自动故障转移
- **安全第一**: 零信任架构，端到端加密
- **性能优化**: 100ms响应时间，高吞吐量
- **可扩展性**: 支持水平和垂直扩展
- **监控运维**: 全链路监控，自动化运维

### 8.2 技术亮点
- **技能向量匹配**: 多模态嵌入，动态团队组成
- **零信任安全**: 动态权限控制，实时威胁检测
- **混合通信拓扑**: 自适应网络，智能路由
- **分布式状态**: Raft共识，强一致性

### 8.3 部署优势
- **容器化部署**: Docker + Kubernetes标准化部署
- **自动化运维**: CI/CD流水线，自动扩缩容
- **监控告警**: Prometheus + Grafana全方位监控
- **安全合规**: 符合企业安全标准和合规要求

通过遵循本部署方案，可以确保EFIAgent Phase 2系统在生产环境中稳定、安全、高效地运行，为企业提供强大的多智能体协作能力。