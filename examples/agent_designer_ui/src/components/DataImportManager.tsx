import React, { useState } from 'react';
import { Button, Card, message, Modal, Space, Typography, Alert, Spin, Progress } from 'antd';
import { UploadOutlined, DeleteOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import DataImporter from '../utils/DataImporter';

const { Title, Text, Paragraph } = Typography;

interface DataImportManagerProps {
  onDataImported?: () => void;
}

const DataImportManager: React.FC<DataImportManagerProps> = ({ onDataImported }) => {
  const [loading, setLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [isDataImported, setIsDataImported] = useState(DataImporter.isDataImported());

  /**
   * 导入数据分析专家模拟数据
   */
  const handleImportData = async () => {
    setLoading(true);
    setImportProgress(0);
    
    try {
      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await DataImporter.importDataAnalysisExpertData();
      
      clearInterval(progressInterval);
      setImportProgress(100);
      
      setTimeout(() => {
        setIsDataImported(true);
        setLoading(false);
        setImportProgress(0);
        message.success('数据分析专家模拟数据导入成功！');
        onDataImported?.();
      }, 500);
      
    } catch (error) {
      setLoading(false);
      setImportProgress(0);
      message.error('数据导入失败，请检查网络连接和数据文件');
      console.error('Import error:', error);
    }
  };

  /**
   * 清除所有数据
   */
  const handleClearData = () => {
    Modal.confirm({
      title: '确认清除数据',
      content: '此操作将清除所有已导入的能力模块、Agent和工作流数据，且无法恢复。确定要继续吗？',
      icon: <ExclamationCircleOutlined />,
      okText: '确认清除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        DataImporter.clearAllData();
        setIsDataImported(false);
        message.success('数据已清除');
        onDataImported?.();
      }
    });
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>数据管理</Title>
      <Paragraph>
        管理系统中的模拟数据，包括能力模块、Agent和工作流配置。
      </Paragraph>

      <Card 
        title="数据分析专家示例" 
        style={{ marginBottom: '24px' }}
        extra={
          <Space>
            {isDataImported && (
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
            )}
            <Text type={isDataImported ? 'success' : 'secondary'}>
              {isDataImported ? '已导入' : '未导入'}
            </Text>
          </Space>
        }
      >
        <div style={{ marginBottom: '16px' }}>
          <Paragraph>
            包含完整的销售数据分析场景，包括：
          </Paragraph>
          <ul>
            <li><strong>7个能力模块</strong>：数据摄取、数据清洗、统计分析、趋势分析、预测建模、数据可视化、报告生成</li>
            <li><strong>4个专家Agent</strong>：数据处理专家、数据分析专家、预测建模专家、报告生成专家</li>
            <li><strong>1个工作流</strong>：销售数据分析工作流，包含完整的数据处理流程</li>
          </ul>
        </div>

        {loading && (
          <div style={{ marginBottom: '16px' }}>
            <Progress 
              percent={importProgress} 
              status="active"
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
            <Text type="secondary" style={{ marginTop: '8px', display: 'block' }}>
              正在导入数据，请稍候...
            </Text>
          </div>
        )}

        <Space>
          <Button 
            type="primary" 
            icon={<UploadOutlined />}
            onClick={handleImportData}
            loading={loading}
            disabled={loading}
          >
            {isDataImported ? '重新导入数据' : '导入示例数据'}
          </Button>
          
          {isDataImported && (
            <Button 
              danger
              icon={<DeleteOutlined />}
              onClick={handleClearData}
              disabled={loading}
            >
              清除所有数据
            </Button>
          )}
        </Space>
      </Card>

      {isDataImported && (
        <Alert
          message="数据导入成功"
          description={
            <div>
              <p>数据分析专家示例已成功导入到系统中。您现在可以在以下页面查看和管理这些数据：</p>
              <ul>
                <li><strong>能力库</strong>：查看和管理7个数据分析相关的能力模块</li>
                <li><strong>Agent管理</strong>：查看和编辑4个专业的数据分析Agent</li>
                <li><strong>工作流管理</strong>：查看和运行销售数据分析工作流</li>
              </ul>
              <p>建议您先浏览这些示例，了解EFIAgent 2.0的架构和功能特性。</p>
            </div>
          }
          type="success"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      {!isDataImported && (
        <Alert
          message="开始使用EFIAgent 2.0"
          description={
            <div>
              <p>欢迎使用EFIAgent 2.0！为了帮助您快速了解系统功能，我们提供了一个完整的数据分析专家示例。</p>
              <p>点击上方的"导入示例数据"按钮，系统将自动导入：</p>
              <ul>
                <li>多个专业的数据分析能力模块</li>
                <li>配置完整的专家Agent</li>
                <li>可运行的数据分析工作流</li>
              </ul>
              <p>导入后，您可以在各个管理页面中查看和体验这些功能。</p>
            </div>
          }
          type="info"
          showIcon
        />
      )}
    </div>
  );
};

export default DataImportManager;