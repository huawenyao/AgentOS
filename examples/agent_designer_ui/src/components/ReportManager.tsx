import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Space,
  Tag,
  Tooltip,
  Popconfirm,
  Drawer
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  DownloadOutlined,
  DeleteOutlined,
  ReloadOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import ApiService from './ApiService';
import moment from 'moment';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

/**
 * 报告接口定义
 */
interface Report {
  id: string;
  name: string;
  description?: string;
  type: string;
  metrics: string[];
  startDate?: string;
  endDate?: string;
  format: string;
  status: string;
  createdAt: string;
  createdBy?: string;
}

/**
 * 报告管理组件
 */
const ReportManager: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [previewDrawerVisible, setPreviewDrawerVisible] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [form] = Form.useForm();

  // 可用的指标选项
  const metricOptions = [
    { label: '用户统计', value: 'users' },
    { label: 'Agent统计', value: 'agents' },
    { label: '工作流统计', value: 'workflows' },
    { label: '使用情况', value: 'usage' },
    { label: '性能指标', value: 'performance' },
    { label: '错误统计', value: 'errors' }
  ];

  // 报告类型选项
  const reportTypeOptions = [
    { label: '系统概览', value: 'overview' },
    { label: '用户分析', value: 'user_analysis' },
    { label: '性能报告', value: 'performance' },
    { label: '错误分析', value: 'error_analysis' },
    { label: '自定义报告', value: 'custom' }
  ];

  /**
   * 加载报告列表
   */
  const loadReports = async () => {
    setLoading(true);
    try {
      const response = await ApiService.getReports();
      if (response.success) {
        setReports(response.data || []);
      } else {
        message.error('获取报告列表失败');
      }
    } catch (error) {
      console.error('获取报告列表失败:', error);
      message.error('获取报告列表失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 生成新报告
   */
  const handleCreateReport = async (values: any) => {
    try {
      const reportData = {
        name: values.name,
        description: values.description,
        type: values.type,
        metrics: values.metrics,
        startDate: values.dateRange?.[0]?.format('YYYY-MM-DD'),
        endDate: values.dateRange?.[1]?.format('YYYY-MM-DD'),
        format: values.format || 'json'
      };

      const response = await ApiService.generateReport(reportData);
      if (response.success) {
        message.success('报告生成成功');
        setCreateModalVisible(false);
        form.resetFields();
        loadReports();
      } else {
        message.error(response.error?.message || '报告生成失败');
      }
    } catch (error) {
      console.error('生成报告失败:', error);
      message.error('生成报告失败');
    }
  };

  /**
   * 预览报告
   */
  const handlePreviewReport = async (report: Report) => {
    try {
      setSelectedReport(report);
      const htmlContent = await ApiService.previewReport(report.id);
      setPreviewContent(htmlContent);
      setPreviewDrawerVisible(true);
    } catch (error) {
      console.error('预览报告失败:', error);
      message.error('预览报告失败');
    }
  };

  /**
   * 下载报告
   */
  const handleDownloadReport = async (report: Report, format: string) => {
    try {
      const blob = await ApiService.downloadReport(report.id, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.name}_${moment().format('YYYYMMDD_HHmmss')}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success('报告下载成功');
    } catch (error) {
      console.error('下载报告失败:', error);
      message.error('下载报告失败');
    }
  };

  /**
   * 在新窗口中打开预览
   */
  const handleOpenPreviewInNewWindow = (report: Report) => {
    const previewUrl = ApiService.getReportPreviewUrl(report.id);
    window.open(previewUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
  };

  // 表格列定义
  const columns = [
    {
      title: '报告名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Report) => (
        <Space>
          <FileTextOutlined />
          <span>{text}</span>
        </Space>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeOption = reportTypeOptions.find(opt => opt.value === type);
        return <Tag color="blue">{typeOption?.label || type}</Tag>;
      }
    },
    {
      title: '指标',
      dataIndex: 'metrics',
      key: 'metrics',
      render: (metrics: string[]) => (
        <Space wrap>
          {metrics?.map(metric => {
            const metricOption = metricOptions.find(opt => opt.value === metric);
            return (
              <Tag key={metric} color="green">
                {metricOption?.label || metric}
              </Tag>
            );
          })}
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig = {
          completed: { color: 'success', text: '已完成' },
          pending: { color: 'processing', text: '处理中' },
          failed: { color: 'error', text: '失败' }
        };
        const config = statusConfig[status as keyof typeof statusConfig] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => moment(date).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Report) => (
        <Space>
          <Tooltip title="预览报告">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handlePreviewReport(record)}
            />
          </Tooltip>
          <Tooltip title="在新窗口预览">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleOpenPreviewInNewWindow(record)}
            />
          </Tooltip>
          <Tooltip title="下载JSON">
            <Button
              type="text"
              icon={<DownloadOutlined />}
              onClick={() => handleDownloadReport(record, 'json')}
            />
          </Tooltip>
          <Tooltip title="下载PDF">
            <Button
              type="text"
              icon={<DownloadOutlined />}
              onClick={() => handleDownloadReport(record, 'pdf')}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  useEffect(() => {
    loadReports();
  }, []);

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title="报告管理"
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadReports}
              loading={loading}
            >
              刷新
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
            >
              生成报告
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={reports}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>

      {/* 创建报告模态框 */}
      <Modal
        title="生成新报告"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateReport}
        >
          <Form.Item
            name="name"
            label="报告名称"
            rules={[{ required: true, message: '请输入报告名称' }]}
          >
            <Input placeholder="请输入报告名称" />
          </Form.Item>

          <Form.Item
            name="description"
            label="报告描述"
          >
            <TextArea rows={3} placeholder="请输入报告描述" />
          </Form.Item>

          <Form.Item
            name="type"
            label="报告类型"
            rules={[{ required: true, message: '请选择报告类型' }]}
          >
            <Select placeholder="请选择报告类型">
              {reportTypeOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="metrics"
            label="统计指标"
            rules={[{ required: true, message: '请选择至少一个统计指标' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择统计指标"
              options={metricOptions}
            />
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="时间范围"
          >
            <RangePicker
              style={{ width: '100%' }}
              placeholder={['开始日期', '结束日期']}
            />
          </Form.Item>

          <Form.Item
            name="format"
            label="输出格式"
            initialValue="json"
          >
            <Select>
              <Option value="json">JSON</Option>
              <Option value="csv">CSV</Option>
              <Option value="pdf">PDF</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 预览抽屉 */}
      <Drawer
        title={`预览报告: ${selectedReport?.name}`}
        placement="right"
        size="large"
        open={previewDrawerVisible}
        onClose={() => setPreviewDrawerVisible(false)}
        extra={
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => selectedReport && handleOpenPreviewInNewWindow(selectedReport)}
          >
            在新窗口打开
          </Button>
        }
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            border: '1px solid #d9d9d9',
            borderRadius: '6px'
          }}
        >
          <iframe
            srcDoc={previewContent}
            style={{
              width: '100%',
              height: '100%',
              border: 'none'
            }}
            title="报告预览"
          />
        </div>
      </Drawer>
    </div>
  );
};

export default ReportManager;