import React, { useState, useEffect } from 'react';
import ApiService from './ApiService';
import { 
  CoreCapabilityModule, 
  CoreCapabilityType, 
  CapabilityCategory, 
  CapabilitySource,
  CapabilityMaturityLevel 
} from './CapabilitySystemTypes';
import './CapabilityManager.css';

const apiService = new ApiService();

interface CapabilityFormData {
  name: string;
  description: string;
  type: CoreCapabilityType;
  category: CapabilityCategory;
  source: CapabilitySource;
  version: string;
  maturityLevel: CapabilityMaturityLevel;
}

const CapabilityManager: React.FC = () => {
  const [capabilities, setCapabilities] = useState<CoreCapabilityModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCapability, setEditingCapability] = useState<CoreCapabilityModule | null>(null);
  const [formData, setFormData] = useState<CapabilityFormData>({
    name: '',
    description: '',
    type: CoreCapabilityType.COGNITIVE,
    category: CapabilityCategory.OTHER,
    source: CapabilitySource.CUSTOM,
    version: '1.0.0',
    maturityLevel: CapabilityMaturityLevel.INITIAL
  });

  useEffect(() => {
    const fetchCapabilities = async () => {
      try {
        const response = await apiService.getCapabilities();
        setCapabilities(response.data.capabilities || []);
        setLoading(false);
      } catch (err) {
        console.error('获取能力列表失败:', err);
        setError('获取能力列表失败');
        setLoading(false);
      }
    };

    fetchCapabilities();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: CoreCapabilityType.COGNITIVE,
      category: CapabilityCategory.OTHER,
      source: CapabilitySource.CUSTOM,
      version: '1.0.0',
      maturityLevel: CapabilityMaturityLevel.INITIAL
    });
    setShowCreateForm(false);
    setEditingCapability(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      if (editingCapability) {
        // 更新现有能力
        const response = await apiService.updateCapability(editingCapability.id, formData);
        setCapabilities(capabilities.map(c => (c.id === editingCapability.id ? response.data : c)));
      } else {
        // 创建新能力
        const capabilityData = {
          ...formData,
          id: `cap_${Date.now()}`,
          author: 'current_user',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          subType: 'perception', // 默认子类型
          config: {
            executionMode: 'sync' as const,
            timeout: 30000,
            retryPolicy: {
              maxRetries: 3,
              backoffStrategy: 'exponential' as const,
              initialDelay: 1000,
              maxDelay: 10000,
              retryableErrors: ['timeout', 'network_error']
            },
            qualityThreshold: 0.8,
            performanceTarget: {
              responseTime: 1000,
              throughput: 100,
              accuracy: 0.9,
              availability: 0.99
            },
            securityLevel: 'medium' as const,
            accessControl: {
              authentication: true,
              authorization: ['read', 'write'],
              encryption: true,
              auditLog: true
            },
            monitoring: {
              enabled: true,
              metricsCollection: true,
              loggingLevel: 'info' as const,
              alerting: {
                enabled: true,
                thresholds: [],
                channels: []
              },
              healthCheck: {
                enabled: true,
                interval: 30,
                timeout: 5,
                failureThreshold: 3,
                successThreshold: 1
              }
            },
            parameters: {}
          },
          inputs: [],
          outputs: [],
          dependencies: [],
          metrics: {
            avgResponseTime: 0,
            throughput: 0,
            successRate: 1,
            errorRate: 0,
            accuracy: 0,
            precision: 0,
            recall: 0,
            f1Score: 0,
            usageCount: 0,
            activeUsers: 0,
            avgCpuUsage: 0,
            avgMemoryUsage: 0,
            avgTokenUsage: 0,
            lastUpdated: new Date()
          },
          resources: [],
          sources: [],
          metadata: {
            author: 'current_user',
            organization: 'EFIAgent',
            license: 'MIT',
            category: formData.category,
            difficulty: 'beginner' as const,
            rating: 0,
            downloads: 0,
            featured: false,
            verified: false,
            documentation: '',
            examples: [],
            changelog: [],
            tags: [],
            implementation: {
              language: 'typescript',
              framework: 'react',
              dependencies: [],
              resources: {
                cpu: '1 core',
                memory: '512MB'
              }
            }
          }
        };
        const response = await apiService.createCapability(capabilityData);
        setCapabilities([...capabilities, response.data]);
      }
      resetForm();
    } catch (err) {
      console.error('操作失败:', err);
      setError(editingCapability ? '更新能力失败' : '创建能力失败');
    }
  };

  const handleEdit = (capability: CoreCapabilityModule) => {
    setFormData({
      name: capability?.name || '未知能力',
      description: capability.description,
      type: capability.type,
      category: capability.category,
      source: capability.source,
      version: capability.version,
      maturityLevel: capability.maturityLevel
    });
    setEditingCapability(capability);
    setShowCreateForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除这个能力吗？')) {
      return;
    }
    
    try {
      await apiService.deleteCapability(id);
      setCapabilities(capabilities.filter(c => c.id !== id));
    } catch (err) {
      console.error('删除失败:', err);
      setError('删除能力失败');
    }
  };

  if (loading) return (
    <div className="loading-container">
      <div>加载中...</div>
    </div>
  );

  return (
    <div className="capability-manager">
      <div className="capability-manager-header">
        <h2>能力管理</h2>
        <button 
          onClick={() => setShowCreateForm(true)}
          className="btn-primary"
        >
          创建新能力
        </button>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
          <button 
            onClick={() => setError(null)}
            className="alert-close"
          >
            ×
          </button>
        </div>
      )}

      {showCreateForm && (
        <div className="form-container">
          <h3>{editingCapability ? '编辑能力' : '创建新能力'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">名称:</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">版本:</label>
                <input
                  type="text"
                  name="version"
                  value={formData.version}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">描述:</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={3}
                className="form-textarea"
              />
            </div>

            <div className="form-grid form-grid-3">
              <div className="form-group">
                <label className="form-label">核心类型:</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  {Object.values(CoreCapabilityType).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">分类:</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  {Object.values(CapabilityCategory).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">来源:</label>
                <select
                  name="source"
                  value={formData.source}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  {Object.values(CapabilitySource).map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label">成熟度等级:</label>
              <select
                name="maturityLevel"
                value={formData.maturityLevel}
                onChange={handleInputChange}
                className="form-select"
                style={{ width: '200px' }}
              >
                {Object.values(CapabilityMaturityLevel).map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn-success"
              >
                {editingCapability ? '更新' : '创建'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>名称</th>
              <th>描述</th>
              <th>类型</th>
              <th>分类</th>
              <th>版本</th>
              <th>成熟度</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {capabilities.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-state">
                  暂无能力数据
                </td>
              </tr>
            ) : (
              capabilities.map((cap, index) => (
                <tr key={cap.id}>
                  <td>{cap?.name || '未知能力'}</td>
                  <td>
                    <div className="text-truncate">
                      {cap.description}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-type">
                      {cap.type}
                    </span>
                  </td>
                  <td>{cap.category}</td>
                  <td>{cap.version}</td>
                  <td>
                    <span className={`badge ${
                      cap.maturityLevel === CapabilityMaturityLevel.OPTIMIZED 
                        ? 'badge-maturity-optimized' 
                        : 'badge-maturity-default'
                    }`}>
                      {cap.maturityLevel}
                    </span>
                  </td>
                  <td className="table-actions">
                    <button
                      onClick={() => handleEdit(cap)}
                      className="btn-warning"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(cap.id)}
                      className="btn-danger"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CapabilityManager;