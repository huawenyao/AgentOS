/// <reference types="cypress" />

describe('Agent Designer集成测试', () => {
  beforeEach(() => {
    // 访问应用程序
    cy.visit('http://localhost:3000');
    
    // 等待页面加载完成
    cy.get('[data-testid="agent-designer"]').should('be.visible');
  });

  it('应该正确加载Agent设计器界面', () => {
    // 验证标签页是否存在
    cy.get('[data-testid="tab-designer"]').should('be.visible');
    cy.get('[data-testid="tab-templates"]').should('be.visible');
    cy.get('[data-testid="tab-capabilities"]').should('be.visible');
    cy.get('[data-testid="tab-workflow"]').should('be.visible');
    
    // 验证默认选中的是设计器标签页
    cy.get('[data-testid="tab-designer"]').should('have.class', 'ant-tabs-tab-active');
    
    // 验证设计器面板是否显示
    cy.get('[data-testid="designer-panel"]').should('be.visible');
  });

  it('应该能够切换标签页', () => {
    // 点击模板库标签页
    cy.get('[data-testid="tab-templates"]').click();
    
    // 验证模板库面板是否显示
    cy.get('[data-testid="templates-panel"]').should('be.visible');
    
    // 点击能力市场标签页
    cy.get('[data-testid="tab-capabilities"]').click();
    
    // 验证能力市场面板是否显示
    cy.get('[data-testid="capabilities-panel"]').should('be.visible');
    
    // 点击工作流标签页
    cy.get('[data-testid="tab-workflow"]').click();
    
    // 验证工作流面板是否显示
    cy.get('[data-testid="workflow-panel"]').should('be.visible');
    
    // 点击设计器标签页
    cy.get('[data-testid="tab-designer"]').click();
    
    // 验证设计器面板是否显示
    cy.get('[data-testid="designer-panel"]').should('be.visible');
  });

  it('应该显示模板列表', () => {
    // 点击模板库标签页
    cy.get('[data-testid="tab-templates"]').click();
    
    // 验证模板列表是否加载
    cy.get('[data-testid="template-card"]').should('have.length.at.least', 1);
    
    // 验证模板卡片内容
    cy.get('[data-testid="template-card"]').first().within(() => {
      cy.get('[data-testid="template-name"]').should('not.be.empty');
      cy.get('[data-testid="template-type"]').should('not.be.empty');
      cy.get('[data-testid="template-description"]').should('not.be.empty');
    });
  });

  it('应该显示能力组件列表', () => {
    // 点击能力市场标签页
    cy.get('[data-testid="tab-capabilities"]').click();
    
    // 验证能力组件列表是否加载
    cy.get('[data-testid="capability-card"]').should('have.length.at.least', 1);
    
    // 验证能力组件卡片内容
    cy.get('[data-testid="capability-card"]').first().within(() => {
      cy.get('[data-testid="capability-name"]').should('not.be.empty');
      cy.get('[data-testid="capability-type"]').should('not.be.empty');
      cy.get('[data-testid="capability-description"]').should('not.be.empty');
    });
  });

  it('应该能够创建新的Agent实例', () => {
    // 点击创建Agent按钮
    cy.get('[data-testid="create-agent-button"]').click();
    
    // 验证创建Agent模态框是否显示
    cy.get('[data-testid="create-agent-modal"]').should('be.visible');
    
    // 填写表单
    const agentName = `测试Agent ${Date.now()}`;
    cy.get('[data-testid="agent-name-input"]').type(agentName);
    cy.get('[data-testid="agent-description-input"]').type('这是一个测试Agent');
    cy.get('[data-testid="agent-template-select"]').click();
    cy.get('.ant-select-item-option').first().click();
    
    // 提交表单
    cy.get('[data-testid="create-agent-submit"]').click();
    
    // 验证是否创建成功
    cy.get('[data-testid="agent-name"]').should('contain', agentName);
  });

  it('应该能够从模板创建Agent实例', () => {
    // 点击模板库标签页
    cy.get('[data-testid="tab-templates"]').click();
    
    // 点击第一个模板的使用按钮
    cy.get('[data-testid="template-card"]').first().within(() => {
      cy.get('[data-testid="use-template-button"]').click();
    });
    
    // 验证创建Agent模态框是否显示
    cy.get('[data-testid="create-agent-modal"]').should('be.visible');
    
    // 填写表单
    const agentName = `模板Agent ${Date.now()}`;
    cy.get('[data-testid="agent-name-input"]').clear().type(agentName);
    cy.get('[data-testid="agent-description-input"]').type('这是从模板创建的Agent');
    
    // 提交表单
    cy.get('[data-testid="create-agent-submit"]').click();
    
    // 验证是否创建成功并切换到设计器标签页
    cy.get('[data-testid="tab-designer"]').should('have.class', 'ant-tabs-tab-active');
    cy.get('[data-testid="agent-name"]').should('contain', agentName);
  });

  it('应该能够添加能力组件到Agent', () => {
    // 确保有一个Agent实例被选中
    cy.get('[data-testid="create-agent-button"]').click();
    const agentName = `组件测试Agent ${Date.now()}`;
    cy.get('[data-testid="agent-name-input"]').type(agentName);
    cy.get('[data-testid="agent-description-input"]').type('用于测试添加组件');
    cy.get('[data-testid="agent-template-select"]').click();
    cy.get('.ant-select-item-option').first().click();
    cy.get('[data-testid="create-agent-submit"]').click();
    
    // 点击能力市场标签页
    cy.get('[data-testid="tab-capabilities"]').click();
    
    // 拖拽第一个能力组件到设计器
    cy.get('[data-testid="capability-card"]').first().trigger('dragstart');
    cy.get('[data-testid="designer-panel"]').trigger('dragover').trigger('drop');
    
    // 点击设计器标签页
    cy.get('[data-testid="tab-designer"]').click();
    
    // 验证组件是否添加成功
    cy.get('[data-testid="component-node"]').should('have.length.at.least', 1);
  });

  it('应该能够保存Agent实例', () => {
    // 确保有一个Agent实例被选中
    cy.get('[data-testid="create-agent-button"]').click();
    const agentName = `保存测试Agent ${Date.now()}`;
    cy.get('[data-testid="agent-name-input"]').type(agentName);
    cy.get('[data-testid="agent-description-input"]').type('用于测试保存功能');
    cy.get('[data-testid="agent-template-select"]').click();
    cy.get('.ant-select-item-option').first().click();
    cy.get('[data-testid="create-agent-submit"]').click();
    
    // 点击保存按钮
    cy.get('[data-testid="save-agent-button"]').click();
    
    // 验证是否显示保存成功消息
    cy.get('.ant-message-success').should('contain', '保存成功');
  });

  it('应该能够启动和停止Agent实例', () => {
    // 确保有一个Agent实例被选中
    cy.get('[data-testid="create-agent-button"]').click();
    const agentName = `运行测试Agent ${Date.now()}`;
    cy.get('[data-testid="agent-name-input"]').type(agentName);
    cy.get('[data-testid="agent-description-input"]').type('用于测试启动和停止功能');
    cy.get('[data-testid="agent-template-select"]').click();
    cy.get('.ant-select-item-option').first().click();
    cy.get('[data-testid="create-agent-submit"]').click();
    
    // 点击启动按钮
    cy.get('[data-testid="start-agent-button"]').click();
    
    // 验证Agent状态是否变为运行中
    cy.get('[data-testid="agent-status"]').should('contain', '运行中');
    
    // 等待一段时间
    cy.wait(2000);
    
    // 点击停止按钮
    cy.get('[data-testid="stop-agent-button"]').click();
    
    // 验证Agent状态是否变为已停止
    cy.get('[data-testid="agent-status"]').should('contain', '已停止');
  });

  it('应该能够创建和保存工作流', () => {
    // 点击工作流标签页
    cy.get('[data-testid="tab-workflow"]').click();
    
    // 点击添加节点按钮
    cy.get('[data-testid="add-node-button"]').click();
    
    // 验证添加节点模态框是否显示
    cy.get('[data-testid="add-node-modal"]').should('be.visible');
    
    // 填写节点表单
    const nodeName = `测试节点 ${Date.now()}`;
    cy.get('[data-testid="node-name-input"]').type(nodeName);
    cy.get('[data-testid="node-type-select"]').click();
    cy.get('.ant-select-item-option').contains('处理器').click();
    
    // 提交表单
    cy.get('[data-testid="add-node-submit"]').click();
    
    // 验证节点是否添加成功
    cy.get('.react-flow__node').should('have.length.at.least', 1);
    
    // 点击保存按钮
    cy.get('[data-testid="save-workflow-button"]').click();
    
    // 验证是否显示保存成功消息
    cy.get('.ant-message-success').should('contain', '保存成功');
  });

  it('应该能够添加Agent节点到工作流', () => {
    // 确保有一个Agent实例
    cy.get('[data-testid="tab-designer"]').click();
    cy.get('[data-testid="create-agent-button"]').click();
    const agentName = `工作流Agent ${Date.now()}`;
    cy.get('[data-testid="agent-name-input"]').type(agentName);
    cy.get('[data-testid="agent-description-input"]').type('用于工作流测试');
    cy.get('[data-testid="agent-template-select"]').click();
    cy.get('.ant-select-item-option').first().click();
    cy.get('[data-testid="create-agent-submit"]').click();
    
    // 点击工作流标签页
    cy.get('[data-testid="tab-workflow"]').click();
    
    // 点击添加节点按钮
    cy.get('[data-testid="add-node-button"]').click();
    
    // 填写节点表单
    const nodeName = `Agent节点 ${Date.now()}`;
    cy.get('[data-testid="node-name-input"]').type(nodeName);
    cy.get('[data-testid="node-type-select"]').click();
    cy.get('.ant-select-item-option').contains('Agent').click();
    
    // 选择Agent实例
    cy.get('[data-testid="agent-instance-select"]').click();
    cy.get('.ant-select-item-option').contains(agentName).click();
    
    // 提交表单
    cy.get('[data-testid="add-node-submit"]').click();
    
    // 验证节点是否添加成功
    cy.get('.react-flow__node').should('have.length.at.least', 1);
  });

  it('应该能够添加连接到工作流', () => {
    // 点击工作流标签页
    cy.get('[data-testid="tab-workflow"]').click();
    
    // 添加两个节点
    cy.get('[data-testid="add-node-button"]').click();
    cy.get('[data-testid="node-name-input"]').type('源节点');
    cy.get('[data-testid="node-type-select"]').click();
    cy.get('.ant-select-item-option').contains('处理器').click();
    cy.get('[data-testid="add-node-submit"]').click();
    
    cy.get('[data-testid="add-node-button"]').click();
    cy.get('[data-testid="node-name-input"]').type('目标节点');
    cy.get('[data-testid="node-type-select"]').click();
    cy.get('.ant-select-item-option').contains('处理器').click();
    cy.get('[data-testid="add-node-submit"]').click();
    
    // 点击添加连接按钮
    cy.get('[data-testid="add-edge-button"]').click();
    
    // 验证添加连接模态框是否显示
    cy.get('[data-testid="add-edge-modal"]').should('be.visible');
    
    // 填写连接表单
    cy.get('[data-testid="source-node-select"]').click();
    cy.get('.ant-select-item-option').contains('源节点').click();
    cy.get('[data-testid="target-node-select"]').click();
    cy.get('.ant-select-item-option').contains('目标节点').click();
    cy.get('[data-testid="edge-label-input"]').type('测试连接');
    cy.get('[data-testid="edge-condition-input"]').type('true');
    
    // 提交表单
    cy.get('[data-testid="add-edge-submit"]').click();
    
    // 验证连接是否添加成功
    cy.get('.react-flow__edge').should('have.length.at.least', 1);
  });

  it('应该能够运行工作流', () => {
    // 点击工作流标签页
    cy.get('[data-testid="tab-workflow"]').click();
    
    // 添加一个节点
    cy.get('[data-testid="add-node-button"]').click();
    cy.get('[data-testid="node-name-input"]').type('测试节点');
    cy.get('[data-testid="node-type-select"]').click();
    cy.get('.ant-select-item-option').contains('处理器').click();
    cy.get('[data-testid="add-node-submit"]').click();
    
    // 保存工作流
    cy.get('[data-testid="save-workflow-button"]').click();
    
    // 点击运行按钮
    cy.get('[data-testid="run-workflow-button"]').click();
    
    // 验证是否显示运行成功消息
    cy.get('.ant-message-success').should('contain', '工作流已启动');
  });
});