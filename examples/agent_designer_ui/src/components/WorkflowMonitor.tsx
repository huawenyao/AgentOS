import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Descriptions,
  Timeline,
  Progress,
  Tooltip,
  Input,
  Select,
  DatePicker,
  message
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  ReloadOutlined,
  EyeOutlined,
  DeleteOutlined,
  SearchOutlined,
  FilterOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useGlobalState } from './StateManager';
import './WorkflowMonitor.css';

const { RangePicker } = DatePicker;
const { Option } = Select;

// 执行状态枚举
enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// 执行记录接口
interface ExecutionRecord {
  id: string;
  workflowId: string;
  workflowName: string;
  status: ExecutionStatus;
  startTime: string;
  endTime?: string;
  duration?: number;
  progress: number;
  executor: string;
  logs: ExecutionLog[];
  error?: string;
}

// 执行日志接口
interface ExecutionLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  nodeId?: string;
  nodeName?: string;
}

const WorkflowMonitor: React.FC = () => {
  const globalState = useGlobalState();
  const [executions, setExecutions] = useState<ExecutionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState<ExecutionRecord | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<ExecutionStatus | 'all'>('all');
  const [dateRange, setDateRange] = useState<[any, any] | null>(null);

  // 模拟执行记录数据
  const mockExecutions: ExecutionRecord[] = [
    {
      id: 'exec_001',
      workflowId: 'wf_001',
      workflowName: '客户数据处理流程',
      status: ExecutionStatus.COMPLETED,
      startTime: '2024-01-15 10:30:00',
      endTime: '2024-01-15 10:35:30',
      duration: 330,
      progress: 100,
      executor: '张三',
      logs: [
        {
          id: 'log_001',
          timestamp: '2024-01-15 10:30:00',
          level: 'info',
          message: '工作流开始执行',
          nodeId: 'start_001',
          nodeName: '开始'
        },
        {
          id: 'log_002',
          timestamp: '2024-01-15 10:32:15',
          level: 'info',
          message: '数据验证完成',
          nodeId: 'validation_001',
          nodeName: '数据验证'
        },
        {
          id: 'log_003',
          timestamp: '2024-01-15 10:35:30',
          level: 'info',
          message: '工作流执行完成',
          nodeId: 'end_001',
          nodeName: '结束'
        }
      ]
    },
    {
      id: 'exec_002',
      workflowId: 'wf_002',
      workflowName: '订单审批流程',
      status: ExecutionStatus.RUNNING,
      startTime: '2024-01-15 11:00:00',
      duration: 1800,
      progress: 65,
      executor: '李四',
      logs: [
        {
          id: 'log_004',
          timestamp: '2024-01-15 11:00:00',
          level: 'info',
          message: '工作流开始执行',
          nodeId: 'start_002',
          nodeName: '开始'
        },
        {
          id: 'log_005',
          timestamp: '2024-01-15 11:15:00',
          level: 'info',
          message: '订单信息收集完成',
          nodeId: 'collect_001',
          nodeName: '信息收集'
        },
        {
          id: 'log_006',
          timestamp: '2024-01-15 11:25:00',
          level: 'warning',
          message: '等待审批人响应',
          nodeId: 'approval_001',
          nodeName: '审批节点'
        }
      ]
    },
    {
      id: 'exec_003',
      workflowId: 'wf_003',
      workflowName: '报告生成流程',
      status: ExecutionStatus.FAILED,
      startTime: '2024-01-15 09:15:00',
      endTime: '2024-01-15 09:18:45',
      duration: 225,
      progress: 45,
      executor: '王五',
      error: '数据源连接失败',
      logs: [
        {
          id: 'log_007',
          timestamp: '2024-01-15 09:15:00',
          level: 'info',
          message: '工作流开始执行',
          nodeId: 'start_003',
          nodeName: '开始'
        },
        {
          id: 'log_008',
          timestamp: '2024-01-15 09:17:30',
          level: 'error',
          message: '无法连接到数据库服务器',
          nodeId: 'data_001',
          nodeName: '数据获取'
        },
        {
          id: 'log_009',
          timestamp: '2024-01-15 09:18:45',
          level: 'error',
          message: '工作流执行失败',
          nodeId: 'error_001',
          nodeName: '错误处理'
        }
      ]
    }
  ];

  // 初始化数据
  useEffect(() => {
    loadExecutions();
  }, []);

  // 加载执行记录
  const loadExecutions = async () => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      setExecutions(mockExecutions);
    } catch (error) {
      message.error('加载执行记录失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取状态标签
  const getStatusTag = (status: ExecutionStatus) => {
    const statusConfig = {
      [ExecutionStatus.PENDING]: { color: 'default', text: '等待中' },
      [ExecutionStatus.RUNNING]: { color: 'processing', text: '运行中' },
      [ExecutionStatus.PAUSED]: { color: 'warning', text: '已暂停' },
      [ExecutionStatus.COMPLETED]: { color: 'success', text: '已完成' },
      [ExecutionStatus.FAILED]: { color: 'error', text: '失败' },
      [ExecutionStatus.CANCELLED]: { color: 'default', text: '已取消' }
    };
    
    const config = statusConfig[status];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 获取日志级别标签
  const getLogLevelTag = (level: string) => {
    const levelConfig = {
      info: { color: 'blue', text: '信息' },
      warning: { color: 'orange', text: '警告' },
      error: { color: 'red', text: '错误' },
      debug: { color: 'gray', text: '调试' }
    };
    
    const config = levelConfig[level as keyof typeof levelConfig] || levelConfig.info;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 格式化持续时间
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  // 控制执行
  const controlExecution = async (executionId: string, action: 'pause' | 'resume' | 'stop') => {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setExecutions(prev => prev.map(exec => {
        if (exec.id === executionId) {
          switch (action) {
            case 'pause':
              return { ...exec, status: ExecutionStatus.PAUSED };
            case 'resume':
              return { ...exec, status: ExecutionStatus.RUNNING };
            case 'stop':
              return { ...exec, status: ExecutionStatus.CANCELLED, endTime: new Date().toLocaleString() };
            default:
              return exec;
          }
        }
        return exec;
      }));
      
      message.success(`执行${action === 'pause' ? '暂停' : action === 'resume' ? '恢复' : '停止'}成功`);
    } catch (error) {
      message.error('操作失败');
    }
  };

  // 删除执行记录
  const deleteExecution = async (executionId: string) => {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      setExecutions(prev => prev.filter(exec => exec.id !== executionId));
      message.success('删除成功');
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 查看详情
  const viewDetail = (execution: ExecutionRecord) => {
    setSelectedExecution(execution);
    setDetailModalVisible(true);
  };

  // 过滤执行记录
  const filteredExecutions = executions.filter(execution => {
    // 搜索过滤
    if (searchText && !execution.workflowName.toLowerCase().includes(searchText.toLowerCase()) &&
        !execution.executor.toLowerCase().includes(searchText.toLowerCase())) {
      return false;
    }
    
    // 状态过滤
    if (statusFilter !== 'all' && execution.status !== statusFilter) {
      return false;
    }
    
    // 日期范围过滤
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startTime = new Date(execution.startTime);
      if (startTime < dateRange[0].toDate() || startTime > dateRange[1].toDate()) {
        return false;
      }
    }
    
    return true;
  });

  // 表格列定义
  const columns: ColumnsType<ExecutionRecord> = [
    {
      title: '工作流名称',
      dataIndex: 'workflowName',
      key: 'workflowName',
      width: 200,
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: ExecutionStatus) => getStatusTag(status)
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 120,
      render: (progress: number, record: ExecutionRecord) => (
        <Progress 
          percent={progress} 
          size="small" 
          status={record.status === ExecutionStatus.FAILED ? 'exception' : 
                 record.status === ExecutionStatus.COMPLETED ? 'success' : 'active'}
        />
      )
    },
    {
      title: '执行人',
      dataIndex: 'executor',
      key: 'executor',
      width: 100
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 150
    },
    {
      title: '持续时间',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      render: (duration: number) => duration ? formatDuration(duration) : '-'
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record: ExecutionRecord) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => viewDetail(record)}
            />
          </Tooltip>
          
          {record.status === ExecutionStatus.RUNNING && (
            <Tooltip title="暂停">
              <Button 
                type="text" 
                icon={<PauseCircleOutlined />} 
                onClick={() => controlExecution(record.id, 'pause')}
              />
            </Tooltip>
          )}
          
          {record.status === ExecutionStatus.PAUSED && (
            <Tooltip title="恢复">
              <Button 
                type="text" 
                icon={<PlayCircleOutlined />} 
                onClick={() => controlExecution(record.id, 'resume')}
              />
            </Tooltip>
          )}
          
          {(record.status === ExecutionStatus.RUNNING || record.status === ExecutionStatus.PAUSED) && (
            <Tooltip title="停止">
              <Button 
                type="text" 
                danger 
                icon={<StopOutlined />} 
                onClick={() => controlExecution(record.id, 'stop')}
              />
            </Tooltip>
          )}
          
          <Tooltip title="删除">
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />} 
              onClick={() => {
                Modal.confirm({
                  title: '确认删除',
                  content: '确定要删除这条执行记录吗？',
                  onOk: () => deleteExecution(record.id)
                });
              }}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div className="workflow-monitor">
      <Card 
        title="工作流执行监控" 
        extra={
          <Button 
            icon={<ReloadOutlined />} 
            onClick={loadExecutions}
            loading={loading}
          >
            刷新
          </Button>
        }
      >
        {/* 过滤器 */}
        <div className="monitor-filters">
          <Space wrap>
            <Input
              placeholder="搜索工作流名称或执行人"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
            />
            
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 120 }}
              placeholder="状态筛选"
            >
              <Option value="all">全部状态</Option>
              <Option value={ExecutionStatus.PENDING}>等待中</Option>
              <Option value={ExecutionStatus.RUNNING}>运行中</Option>
              <Option value={ExecutionStatus.PAUSED}>已暂停</Option>
              <Option value={ExecutionStatus.COMPLETED}>已完成</Option>
              <Option value={ExecutionStatus.FAILED}>失败</Option>
              <Option value={ExecutionStatus.CANCELLED}>已取消</Option>
            </Select>
            
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              placeholder={['开始日期', '结束日期']}
            />
          </Space>
        </div>
        
        {/* 执行记录表格 */}
        <Table
          columns={columns}
          dataSource={filteredExecutions}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
          scroll={{ x: 1000 }}
        />
      </Card>
      
      {/* 详情模态框 */}
      <Modal
        title="执行详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
        className="execution-detail-modal"
      >
        {selectedExecution && (
          <div className="execution-detail">
            {/* 基本信息 */}
            <Descriptions title="基本信息" bordered column={2}>
              <Descriptions.Item label="工作流名称">{selectedExecution.workflowName}</Descriptions.Item>
              <Descriptions.Item label="执行状态">{getStatusTag(selectedExecution.status)}</Descriptions.Item>
              <Descriptions.Item label="执行人">{selectedExecution.executor}</Descriptions.Item>
              <Descriptions.Item label="进度">
                <Progress percent={selectedExecution.progress} size="small" />
              </Descriptions.Item>
              <Descriptions.Item label="开始时间">{selectedExecution.startTime}</Descriptions.Item>
              <Descriptions.Item label="结束时间">{selectedExecution.endTime || '-'}</Descriptions.Item>
              <Descriptions.Item label="持续时间" span={2}>
                {selectedExecution.duration ? formatDuration(selectedExecution.duration) : '-'}
              </Descriptions.Item>
              {selectedExecution.error && (
                <Descriptions.Item label="错误信息" span={2}>
                  <span style={{ color: '#ff4d4f' }}>{selectedExecution.error}</span>
                </Descriptions.Item>
              )}
            </Descriptions>
            
            {/* 执行日志 */}
            <div className="execution-logs">
              <h4>执行日志</h4>
              <Timeline>
                {selectedExecution.logs.map(log => (
                  <Timeline.Item key={log.id}>
                    <div className="log-item">
                      <div className="log-header">
                        <Space>
                          {getLogLevelTag(log.level)}
                          <span className="log-time">{log.timestamp}</span>
                          {log.nodeName && (
                            <Tag color="blue">{log.nodeName}</Tag>
                          )}
                        </Space>
                      </div>
                      <div className="log-message">{log.message}</div>
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default WorkflowMonitor;