/**
 * 组件集成测试
 * 测试模板库、能力组件库和数据流服务的集成功能
 */

describe('组件集成测试', () => {
  beforeEach(() => {
    // 访问应用首页
    cy.visit('/');
    // 等待应用加载完成
    cy.get('[data-testid="agent-designer"]').should('be.visible');
  });

  /**
   * 测试模板库和Agent设计器的集成
   */
  it('应该能够从模板库选择模板并在设计器中打开', () => {
    // 切换到模板库标签页
    cy.get('[data-testid="tab-templates"]').click();
    cy.get('[data-testid="templates-panel"]').should('be.visible');

    // 选择一个模板
    cy.get('[data-testid="template-card"]').first().within(() => {
      // 保存模板名称以便后续验证
      cy.get('[data-testid="template-name"]').invoke('text').as('templateName');
      // 点击使用按钮
      cy.get('[data-testid="use-template-button"]').click();
    });

    // 验证是否切换到设计器标签页
    cy.get('[data-testid="tab-designer"]').should('have.class', 'ant-tabs-tab-active');
    cy.get('[data-testid="designer-panel"]').should('be.visible');

    // 验证模板是否正确加载到设计器中
    cy.get('@templateName').then((templateName) => {
      cy.get('[data-testid="agent-name-input"]').should('have.value', templateName);
    });

    // 验证组件列表是否显示
    cy.get('[data-testid="component-list"]').should('be.visible');
    cy.get('[data-testid="component-item"]').should('have.length.at.least', 1);
  });

  /**
   * 测试能力组件库和Agent设计器的集成
   */
  it('应该能够从能力组件库添加组件到当前Agent', () => {
    // 先创建一个新的Agent实例
    cy.get('[data-testid="tab-designer"]').click();
    cy.get('[data-testid="create-agent-button"]').click();
    cy.get('[data-testid="agent-name-input"]').type('测试Agent');
    cy.get('[data-testid="agent-type-select"]').click();
    cy.get('.ant-select-item-option').contains('assistant').click();
    cy.get('[data-testid="create-agent-submit"]').click();

    // 切换到能力组件库标签页
    cy.get('[data-testid="tab-capabilities"]').click();
    cy.get('[data-testid="capabilities-panel"]').should('be.visible');

    // 选择一个能力组件
    cy.get('[data-testid="capability-card"]').first().within(() => {
      // 保存组件名称以便后续验证
      cy.get('[data-testid="capability-name"]').invoke('text').as('componentName');
      // 点击添加按钮
      cy.get('[data-testid="add-capability-button"]').click();
    });

    // 验证是否显示成功消息
    cy.get('.ant-message-success').should('be.visible');

    // 验证是否切换到设计器标签页
    cy.get('[data-testid="tab-designer"]').should('have.class', 'ant-tabs-tab-active');

    // 验证组件是否添加到Agent
    cy.get('@componentName').then((componentName) => {
      cy.get('[data-testid="component-item"]').contains(componentName).should('be.visible');
    });
  });

  /**
   * 测试模板收藏功能
   */
  it('应该能够收藏和取消收藏模板', () => {
    // 切换到模板库标签页
    cy.get('[data-testid="tab-templates"]').click();

    // 获取第一个模板卡片
    cy.get('[data-testid="template-card"]').first().within(() => {
      // 点击收藏按钮
      cy.get('button').find('.anticon-star-o, .anticon-star').click();
    });

    // 刷新页面
    cy.reload();

    // 验证收藏的模板是否显示在收藏区域
    cy.get('.template-section').contains('收藏的模板').should('be.visible');
    cy.get('.template-section').contains('收藏的模板').parent().parent().find('[data-testid="template-card"]').should('have.length.at.least', 1);

    // 取消收藏
    cy.get('.template-section').contains('收藏的模板').parent().parent().find('[data-testid="template-card"]').first().within(() => {
      cy.get('button').find('.anticon-star, .anticon-star-filled').click();
    });

    // 验证收藏区域是否消失
    cy.get('.template-section').contains('收藏的模板').should('not.exist');
  });

  /**
   * 测试能力组件详情查看功能
   */
  it('应该能够查看能力组件详情', () => {
    // 切换到能力组件库标签页
    cy.get('[data-testid="tab-capabilities"]').click();

    // 获取第一个能力组件卡片
    cy.get('[data-testid="capability-card"]').first().within(() => {
      // 保存组件名称以便后续验证
      cy.get('[data-testid="capability-name"]').invoke('text').as('componentName');
      // 点击详情按钮
      cy.get('button').find('.anticon-info-circle').click();
    });

    // 验证详情模态框是否显示
    cy.get('.ant-modal-title').should('be.visible');
    cy.get('@componentName').then((componentName) => {
      cy.get('.ant-modal-title').should('contain', componentName);
    });

    // 验证详情内容是否显示
    cy.get('.capability-detail-description').should('be.visible');
    cy.get('.capability-detail-tags').should('be.visible');
    cy.get('.capability-detail-schema').should('be.visible');

    // 关闭模态框
    cy.get('.ant-modal-close').click();
    cy.get('.ant-modal').should('not.exist');
  });

  /**
   * 测试模板和能力组件的搜索和过滤功能
   */
  it('应该能够搜索和过滤模板和能力组件', () => {
    // 测试模板搜索
    cy.get('[data-testid="tab-templates"]').click();
    cy.get('[data-testid="templates-panel"]').should('be.visible');

    // 记录初始模板数量
    cy.get('[data-testid="template-card"]').its('length').as('initialTemplateCount');

    // 搜索特定类型的模板
    cy.get('.template-gallery-filters').find('input').type('assistant');

    // 验证搜索结果
    cy.get('@initialTemplateCount').then((initialCount) => {
      cy.get('[data-testid="template-card"]').its('length').should('be.lte', initialCount);
    });

    // 清除搜索
    cy.get('.template-gallery-filters').find('.ant-input-suffix').click();

    // 测试能力组件搜索
    cy.get('[data-testid="tab-capabilities"]').click();
    cy.get('[data-testid="capabilities-panel"]').should('be.visible');

    // 记录初始能力组件数量
    cy.get('[data-testid="capability-card"]').its('length').as('initialCapabilityCount');

    // 搜索特定类型的能力组件
    cy.get('.capability-library-filters').find('input').type('nlp');

    // 验证搜索结果
    cy.get('@initialCapabilityCount').then((initialCount) => {
      cy.get('[data-testid="capability-card"]').its('length').should('be.lte', initialCount);
    });
  });

  /**
   * 测试创建新模板功能
   */
  it('应该能够创建新模板', () => {
    // 切换到模板库标签页
    cy.get('[data-testid="tab-templates"]').click();

    // 点击创建新模板按钮
    cy.get('.template-gallery-actions').find('button').contains('创建新模板').click();

    // 验证是否切换到设计器标签页
    cy.get('[data-testid="tab-designer"]').should('have.class', 'ant-tabs-tab-active');

    // 创建新模板
    cy.get('[data-testid="agent-name-input"]').type('新测试模板');
    cy.get('[data-testid="agent-type-select"]').click();
    cy.get('.ant-select-item-option').contains('creative').click();
    cy.get('[data-testid="agent-description-input"]').type('这是一个测试创建的新模板');

    // 添加一个组件
    cy.get('[data-testid="add-component-button"]').click();
    cy.get('[data-testid="component-type-select"]').click();
    cy.get('.ant-select-item-option').contains('nlp').click();
    cy.get('[data-testid="component-name-input"]').type('NLP组件');
    cy.get('[data-testid="add-component-submit"]').click();

    // 保存模板
    cy.get('[data-testid="save-agent-button"]').click();

    // 验证保存成功
    cy.get('.ant-message-success').should('be.visible');

    // 切换回模板库查看新模板
    cy.get('[data-testid="tab-templates"]').click();
    cy.get('[data-testid="templates-panel"]').should('be.visible');

    // 搜索新创建的模板
    cy.get('.template-gallery-filters').find('input').type('新测试模板');
    cy.get('[data-testid="template-card"]').should('have.length', 1);
    cy.get('[data-testid="template-name"]').should('contain', '新测试模板');
  });
});