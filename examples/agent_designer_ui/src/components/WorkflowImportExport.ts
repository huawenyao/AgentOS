import { WorkflowDefinition, WorkflowNode, WorkflowEdge } from '../types/CapabilitySystemTypes';

/**
 * 导出格式枚举
 */
export enum ExportFormat {
  JSON = 'json',
  YAML = 'yaml',
  XML = 'xml',
  BPMN = 'bpmn',
  DRAWIO = 'drawio'
}

/**
 * 导入源类型枚举
 */
export enum ImportSource {
  FILE = 'file',
  URL = 'url',
  TEXT = 'text',
  TEMPLATE = 'template'
}

/**
 * 模板类别枚举
 */
export enum TemplateCategory {
  BUSINESS = 'business',
  DATA_PROCESSING = 'data_processing',
  API_INTEGRATION = 'api_integration',
  AUTOMATION = 'automation',
  AI_ML = 'ai_ml',
  CUSTOM = 'custom'
}

/**
 * 工作流模板接口
 */
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  tags: string[];
  author: string;
  version: string;
  createdAt: number;
  updatedAt: number;
  downloads: number;
  rating: number;
  thumbnail?: string;
  workflow: WorkflowDefinition;
  metadata: {
    complexity: 'simple' | 'medium' | 'complex';
    estimatedTime: number; // 预估配置时间（分钟）
    requiredCapabilities: string[];
    supportedVersions: string[];
    documentation?: string;
    examples?: any[];
  };
}

/**
 * 导出选项接口
 */
export interface ExportOptions {
  format: ExportFormat;
  includeMetadata: boolean;
  includeComments: boolean;
  minify: boolean;
  encryption?: {
    enabled: boolean;
    password?: string;
    algorithm?: string;
  };
  customFields?: Record<string, any>;
}

/**
 * 导入选项接口
 */
export interface ImportOptions {
  source: ImportSource;
  validateSchema: boolean;
  mergeStrategy: 'replace' | 'merge' | 'append';
  conflictResolution: 'skip' | 'overwrite' | 'rename';
  preserveIds: boolean;
  mapping?: {
    nodeTypeMapping?: Record<string, string>;
    propertyMapping?: Record<string, string>;
  };
}

/**
 * 导入结果接口
 */
export interface ImportResult {
  success: boolean;
  workflow?: WorkflowDefinition;
  errors: string[];
  warnings: string[];
  statistics: {
    nodesImported: number;
    edgesImported: number;
    conflictsResolved: number;
    skippedItems: number;
  };
}

/**
 * 验证结果接口
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

/**
 * 工作流导入导出管理器
 */
export class WorkflowImportExport {
  private templates: Map<string, WorkflowTemplate> = new Map();
  private supportedFormats: Set<ExportFormat> = new Set(Object.values(ExportFormat));
  private validationRules: ((workflow: WorkflowDefinition) => ValidationResult)[] = [];

  constructor() {
    this.initializeDefaultTemplates();
    this.initializeValidationRules();
  }

  /**
   * 导出工作流
   */
  async exportWorkflow(
    workflow: WorkflowDefinition,
    options: ExportOptions
  ): Promise<{ content: string; filename: string; mimeType: string }> {
    try {
      let content: string;
      let filename: string;
      let mimeType: string;

      // 准备导出数据
      const exportData = this.prepareExportData(workflow, options);

      switch (options.format) {
        case ExportFormat.JSON:
          content = options.minify 
            ? JSON.stringify(exportData)
            : JSON.stringify(exportData, null, 2);
          filename = `${workflow.name || 'workflow'}.json`;
          mimeType = 'application/json';
          break;

        case ExportFormat.YAML:
          content = this.convertToYAML(exportData);
          filename = `${workflow.name || 'workflow'}.yaml`;
          mimeType = 'application/x-yaml';
          break;

        case ExportFormat.XML:
          content = this.convertToXML(exportData);
          filename = `${workflow.name || 'workflow'}.xml`;
          mimeType = 'application/xml';
          break;

        case ExportFormat.BPMN:
          content = this.convertToBPMN(exportData);
          filename = `${workflow.name || 'workflow'}.bpmn`;
          mimeType = 'application/xml';
          break;

        case ExportFormat.DRAWIO:
          content = this.convertToDrawIO(exportData);
          filename = `${workflow.name || 'workflow'}.drawio`;
          mimeType = 'application/xml';
          break;

        default:
          throw new Error(`不支持的导出格式: ${options.format}`);
      }

      // 加密处理
      if (options.encryption?.enabled && options.encryption.password) {
        content = await this.encryptContent(content, options.encryption.password);
        filename = filename.replace(/\.[^.]+$/, '.encrypted');
      }

      return { content, filename, mimeType };
    } catch (error) {
      throw new Error(`导出失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 导入工作流
   */
  async importWorkflow(
    input: string | File,
    options: ImportOptions
  ): Promise<ImportResult> {
    try {
      let content: string;

      // 获取内容
      if (typeof input === 'string') {
        if (options.source === ImportSource.URL) {
          content = await this.fetchFromURL(input);
        } else {
          content = input;
        }
      } else {
        content = await this.readFile(input);
      }

      // 解析内容
      const parsedData = await this.parseContent(content, input);
      
      // 验证模式
      if (options.validateSchema) {
        const validation = this.validateWorkflowSchema(parsedData);
        if (!validation.valid) {
          return {
            success: false,
            errors: validation.errors,
            warnings: validation.warnings,
            statistics: {
              nodesImported: 0,
              edgesImported: 0,
              conflictsResolved: 0,
              skippedItems: 0
            }
          };
        }
      }

      // 转换为标准格式
      const workflow = this.convertToStandardFormat(parsedData, options);
      
      // 处理ID冲突
      const processedWorkflow = this.processIdConflicts(workflow, options);
      
      // 应用映射
      const mappedWorkflow = this.applyMapping(processedWorkflow, options.mapping);
      
      // 统计信息
      const statistics = {
        nodesImported: mappedWorkflow.nodes?.length || 0,
        edgesImported: mappedWorkflow.edges?.length || 0,
        conflictsResolved: 0, // 实际实现中需要跟踪
        skippedItems: 0 // 实际实现中需要跟踪
      };

      return {
        success: true,
        workflow: mappedWorkflow,
        errors: [],
        warnings: [],
        statistics
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : '导入失败'],
        warnings: [],
        statistics: {
          nodesImported: 0,
          edgesImported: 0,
          conflictsResolved: 0,
          skippedItems: 0
        }
      };
    }
  }

  /**
   * 创建模板
   */
  createTemplate(
    workflow: WorkflowDefinition,
    templateInfo: Omit<WorkflowTemplate, 'id' | 'createdAt' | 'updatedAt' | 'downloads' | 'rating' | 'workflow'>
  ): WorkflowTemplate {
    const templateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const template: WorkflowTemplate = {
      ...templateInfo,
      id: templateId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      downloads: 0,
      rating: 0,
      workflow: JSON.parse(JSON.stringify(workflow)) // 深拷贝
    };
    
    this.templates.set(templateId, template);
    
    return template;
  }

  /**
   * 获取模板
   */
  getTemplate(templateId: string): WorkflowTemplate | null {
    return this.templates.get(templateId) || null;
  }

  /**
   * 获取所有模板
   */
  getAllTemplates(): WorkflowTemplate[] {
    return Array.from(this.templates.values())
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  /**
   * 按类别获取模板
   */
  getTemplatesByCategory(category: TemplateCategory): WorkflowTemplate[] {
    return this.getAllTemplates()
      .filter(template => template.category === category);
  }

  /**
   * 搜索模板
   */
  searchTemplates(query: string, filters?: {
    category?: TemplateCategory;
    tags?: string[];
    complexity?: string;
    author?: string;
  }): WorkflowTemplate[] {
    let results = this.getAllTemplates();
    
    // 文本搜索
    if (query) {
      const lowerQuery = query.toLowerCase();
      results = results.filter(template => 
        (template.name || '').toLowerCase().includes(lowerQuery) ||
        template.description.toLowerCase().includes(lowerQuery) ||
        template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    }
    
    // 应用过滤器
    if (filters) {
      if (filters.category) {
        results = results.filter(template => template.category === filters.category);
      }
      
      if (filters.tags && filters.tags.length > 0) {
        results = results.filter(template => 
          filters.tags!.some(tag => template.tags.includes(tag))
        );
      }
      
      if (filters.complexity) {
        results = results.filter(template => template.metadata.complexity === filters.complexity);
      }
      
      if (filters.author) {
        results = results.filter(template => template.author === filters.author);
      }
    }
    
    return results;
  }

  /**
   * 从模板创建工作流
   */
  createWorkflowFromTemplate(templateId: string, customizations?: {
    name?: string;
    description?: string;
    nodeCustomizations?: Record<string, any>;
  }): WorkflowDefinition | null {
    const template = this.getTemplate(templateId);
    if (!template) {
      return null;
    }
    
    // 增加下载计数
    template.downloads++;
    template.updatedAt = Date.now();
    
    // 深拷贝工作流
    const workflow: WorkflowDefinition = JSON.parse(JSON.stringify(template.workflow));
    
    // 应用自定义设置
    if (customizations) {
      if (customizations.name) {
        workflow.name = customizations.name;
      }
      
      if (customizations.description) {
        workflow.description = customizations.description;
      }
      
      if (customizations.nodeCustomizations && workflow.nodes) {
        workflow.nodes.forEach(node => {
          const customization = customizations.nodeCustomizations![node.id];
          if (customization) {
            Object.assign(node, customization);
          }
        });
      }
    }
    
    // 重新生成ID以避免冲突
    this.regenerateIds(workflow);
    
    return workflow;
  }

  /**
   * 更新模板评分
   */
  rateTemplate(templateId: string, rating: number): boolean {
    const template = this.getTemplate(templateId);
    if (!template || rating < 1 || rating > 5) {
      return false;
    }
    
    // 简单的评分更新（实际应用中可能需要更复杂的算法）
    template.rating = (template.rating + rating) / 2;
    template.updatedAt = Date.now();
    
    return true;
  }

  /**
   * 删除模板
   */
  deleteTemplate(templateId: string): boolean {
    return this.templates.delete(templateId);
  }

  /**
   * 验证工作流
   */
  validateWorkflow(workflow: WorkflowDefinition): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    
    // 运行所有验证规则
    this.validationRules.forEach(rule => {
      try {
        const result = rule(workflow);
        errors.push(...result.errors);
        warnings.push(...result.warnings);
        suggestions.push(...result.suggestions);
      } catch (error) {
        errors.push(`验证规则执行失败: ${error}`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * 添加验证规则
   */
  addValidationRule(rule: (workflow: WorkflowDefinition) => ValidationResult): void {
    this.validationRules.push(rule);
  }

  /**
   * 准备导出数据
   */
  private prepareExportData(workflow: WorkflowDefinition, options: ExportOptions): any {
    const exportData: any = {
      workflow: JSON.parse(JSON.stringify(workflow))
    };
    
    if (options.includeMetadata) {
      exportData.metadata = {
        exportedAt: new Date().toISOString(),
        exportedBy: 'WorkflowDesigner',
        version: '1.0.0',
        format: options.format
      };
    }
    
    if (options.includeComments) {
      exportData.comments = {
        description: '此文件由工作流设计器导出',
        usage: '可以通过工作流设计器重新导入此文件'
      };
    }
    
    if (options.customFields) {
      Object.assign(exportData, options.customFields);
    }
    
    return exportData;
  }

  /**
   * 转换为YAML格式
   */
  private convertToYAML(data: any): string {
    // 简单的YAML转换实现
    // 实际应用中应该使用专门的YAML库
    const yamlLines: string[] = [];
    
    const convertValue = (value: any, indent: number = 0): string[] => {
      const spaces = '  '.repeat(indent);
      const lines: string[] = [];
      
      if (value === null || value === undefined) {
        return ['null'];
      }
      
      if (typeof value === 'string') {
        return [`"${value.replace(/"/g, '\\"')}"`];
      }
      
      if (typeof value === 'number' || typeof value === 'boolean') {
        return [String(value)];
      }
      
      if (Array.isArray(value)) {
        if (value.length === 0) {
          return ['[]'];
        }
        value.forEach((item, index) => {
          const itemLines = convertValue(item, indent + 1);
          lines.push(`${spaces}- ${itemLines[0]}`);
          itemLines.slice(1).forEach(line => {
            lines.push(`${spaces}  ${line}`);
          });
        });
        return lines;
      }
      
      if (typeof value === 'object') {
        Object.entries(value).forEach(([key, val]) => {
          const valueLines = convertValue(val, indent + 1);
          lines.push(`${spaces}${key}: ${valueLines[0]}`);
          valueLines.slice(1).forEach(line => {
            lines.push(`${spaces}${line}`);
          });
        });
        return lines;
      }
      
      return [String(value)];
    };
    
    return convertValue(data).join('\n');
  }

  /**
   * 转换为XML格式
   */
  private convertToXML(data: any): string {
    const xmlLines: string[] = ['<?xml version="1.0" encoding="UTF-8"?>'];
    
    const convertValue = (value: any, tagName: string, indent: number = 0): string[] => {
      const spaces = '  '.repeat(indent);
      const lines: string[] = [];
      
      if (value === null || value === undefined) {
        return [`${spaces}<${tagName} />`];
      }
      
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return [`${spaces}<${tagName}>${String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</${tagName}>`];
      }
      
      if (Array.isArray(value)) {
        lines.push(`${spaces}<${tagName}>`);
        value.forEach((item, index) => {
          const itemLines = convertValue(item, 'item', indent + 1);
          lines.push(...itemLines);
        });
        lines.push(`${spaces}</${tagName}>`);
        return lines;
      }
      
      if (typeof value === 'object') {
        lines.push(`${spaces}<${tagName}>`);
        Object.entries(value).forEach(([key, val]) => {
          const valueLines = convertValue(val, key, indent + 1);
          lines.push(...valueLines);
        });
        lines.push(`${spaces}</${tagName}>`);
        return lines;
      }
      
      return [`${spaces}<${tagName}>${String(value)}</${tagName}>`];
    };
    
    xmlLines.push(...convertValue(data, 'workflow'));
    return xmlLines.join('\n');
  }

  /**
   * 转换为BPMN格式
   */
  private convertToBPMN(data: any): string {
    const workflow = data.workflow;
    const processId = workflow.id || 'process_1';
    
    let bpmn = `<?xml version="1.0" encoding="UTF-8"?>
`;
    bpmn += `<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
`;
    bpmn += `  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
`;
    bpmn += `  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
`;
    bpmn += `  xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
`;
    bpmn += `  id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
`;
    bpmn += `  <bpmn:process id="${processId}" isExecutable="true">
`;
    
    // 添加节点
    if (workflow.nodes) {
      workflow.nodes.forEach((node: WorkflowNode) => {
        const nodeType = this.mapNodeTypeToBPMN(node.type);
        bpmn += `    <bpmn:${nodeType} id="${node.id}" name="${node.name || node.type}" />
`;
      });
    }
    
    // 添加连接
    if (workflow.edges) {
      workflow.edges.forEach((edge: WorkflowEdge) => {
        bpmn += `    <bpmn:sequenceFlow id="${edge.id}" sourceRef="${edge.source}" targetRef="${edge.target}" />
`;
      });
    }
    
    bpmn += `  </bpmn:process>
`;
    bpmn += `</bpmn:definitions>`;
    
    return bpmn;
  }

  /**
   * 转换为Draw.io格式
   */
  private convertToDrawIO(data: any): string {
    const workflow = data.workflow;
    
    let drawio = `<?xml version="1.0" encoding="UTF-8"?>
`;
    drawio += `<mxfile host="app.diagrams.net" modified="${new Date().toISOString()}" agent="WorkflowDesigner" version="1.0.0">
`;
    drawio += `  <diagram id="workflow" name="Workflow">
`;
    drawio += `    <mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169" math="0" shadow="0">
`;
    drawio += `      <root>
`;
    drawio += `        <mxCell id="0" />
`;
    drawio += `        <mxCell id="1" parent="0" />
`;
    
    // 添加节点
    if (workflow.nodes) {
      workflow.nodes.forEach((node: WorkflowNode, index: number) => {
        const x = (index % 5) * 150 + 50;
        const y = Math.floor(index / 5) * 100 + 50;
        const style = this.getDrawIONodeStyle(node.type);
        
        drawio += `        <mxCell id="${node.id}" value="${node.name || node.type}" style="${style}" vertex="1" parent="1">
`;
        drawio += `          <mxGeometry x="${x}" y="${y}" width="120" height="60" as="geometry" />
`;
        drawio += `        </mxCell>
`;
      });
    }
    
    // 添加连接
    if (workflow.edges) {
      workflow.edges.forEach((edge: WorkflowEdge) => {
        drawio += `        <mxCell id="${edge.id}" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" edge="1" parent="1" source="${edge.source}" target="${edge.target}">
`;
        drawio += `          <mxGeometry relative="1" as="geometry" />
`;
        drawio += `        </mxCell>
`;
      });
    }
    
    drawio += `      </root>
`;
    drawio += `    </mxGraphModel>
`;
    drawio += `  </diagram>
`;
    drawio += `</mxfile>`;
    
    return drawio;
  }

  /**
   * 映射节点类型到BPMN
   */
  private mapNodeTypeToBPMN(nodeType: string): string {
    const mapping: Record<string, string> = {
      'START': 'startEvent',
      'END': 'endEvent',
      'CAPABILITY': 'task',
      'CONDITION': 'exclusiveGateway',
      'CONTROL': 'parallelGateway'
    };
    
    return mapping[nodeType] || 'task';
  }

  /**
   * 获取Draw.io节点样式
   */
  private getDrawIONodeStyle(nodeType: string): string {
    const styles: Record<string, string> = {
      'START': 'ellipse;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;',
      'END': 'ellipse;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;',
      'CAPABILITY': 'rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;',
      'CONDITION': 'rhombus;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;',
      'CONTROL': 'rhombus;whiteSpace=wrap;html=1;fillColor=#e1d5e7;strokeColor=#9673a6;'
    };
    
    return styles[nodeType] || 'rounded=1;whiteSpace=wrap;html=1;fillColor=#f5f5f5;strokeColor=#666666;';
  }

  /**
   * 加密内容
   */
  private async encryptContent(content: string, password: string): Promise<string> {
    // 简单的Base64编码（实际应用中应该使用真正的加密算法）
    const encoded = btoa(unescape(encodeURIComponent(content)));
    return `ENCRYPTED:${encoded}`;
  }

  /**
   * 从URL获取内容
   */
  private async fetchFromURL(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`无法从URL获取内容: ${response.statusText}`);
    }
    return await response.text();
  }

  /**
   * 读取文件内容
   */
  private async readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(new Error('文件读取失败'));
      reader.readAsText(file);
    });
  }

  /**
   * 解析内容
   */
  private async parseContent(content: string, source: string | File): Promise<any> {
    // 检查是否加密
    if (content.startsWith('ENCRYPTED:')) {
      throw new Error('内容已加密，需要密码解密');
    }
    
    // 尝试解析JSON
    try {
      return JSON.parse(content);
    } catch (jsonError) {
      // 尝试解析其他格式
      if (typeof source !== 'string' && source.name) {
        const extension = (source.name || '').split('.').pop()?.toLowerCase();
        
        switch (extension) {
          case 'yaml':
          case 'yml':
            return this.parseYAML(content);
          case 'xml':
            return this.parseXML(content);
          case 'bpmn':
            return this.parseBPMN(content);
          default:
            throw new Error('不支持的文件格式');
        }
      }
      
      throw new Error('无法解析文件内容');
    }
  }

  /**
   * 解析YAML
   */
  private parseYAML(content: string): any {
    // 简单的YAML解析实现
    // 实际应用中应该使用专门的YAML库
    throw new Error('YAML解析功能需要额外的库支持');
  }

  /**
   * 解析XML
   */
  private parseXML(content: string): any {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'application/xml');
    
    if (doc.documentElement.nodeName === 'parsererror') {
      throw new Error('XML解析失败');
    }
    
    return this.xmlToObject(doc.documentElement);
  }

  /**
   * 解析BPMN
   */
  private parseBPMN(content: string): any {
    const xmlData = this.parseXML(content);
    return this.convertBPMNToWorkflow(xmlData);
  }

  /**
   * XML转对象
   */
  private xmlToObject(element: Element): any {
    const obj: any = {};
    
    // 处理属性
    if (element.attributes.length > 0) {
      obj['@attributes'] = {};
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        obj['@attributes'][attr.name] = attr.value;
      }
    }
    
    // 处理子元素
    if (element.children.length > 0) {
      for (let i = 0; i < element.children.length; i++) {
        const child = element.children[i];
        const childObj = this.xmlToObject(child);
        
        if (obj[child.nodeName]) {
          if (!Array.isArray(obj[child.nodeName])) {
            obj[child.nodeName] = [obj[child.nodeName]];
          }
          obj[child.nodeName].push(childObj);
        } else {
          obj[child.nodeName] = childObj;
        }
      }
    } else if (element.textContent) {
      obj['#text'] = element.textContent;
    }
    
    return obj;
  }

  /**
   * 转换BPMN到工作流
   */
  private convertBPMNToWorkflow(bpmnData: any): WorkflowDefinition {
    // 简化的BPMN转换实现
    const workflow: WorkflowDefinition = {
      id: 'imported_workflow',
      name: 'Imported Workflow',
      description: 'From BPMN import',
      nodes: [],
      edges: []
    };
    
    // 实际实现需要解析BPMN结构并转换为工作流格式
    
    return workflow;
  }

  /**
   * 验证工作流模式
   */
  private validateWorkflowSchema(data: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // 基本结构验证
    if (!data.workflow) {
      errors.push('缺少workflow字段');
      return { valid: false, errors, warnings, suggestions: [] };
    }
    
    const workflow = data.workflow;
    
    if (!workflow.id) {
      warnings.push('工作流缺少ID');
    }
    
    if (!(workflow.name || '').trim()) {
      warnings.push('工作流缺少名称');
    }
    
    if (!Array.isArray(workflow.nodes)) {
      errors.push('nodes字段必须是数组');
    }
    
    if (!Array.isArray(workflow.edges)) {
      errors.push('edges字段必须是数组');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions: []
    };
  }

  /**
   * 转换为标准格式
   */
  private convertToStandardFormat(data: any, options: ImportOptions): WorkflowDefinition {
    // 如果已经是标准格式，直接返回
    if (data.workflow) {
      return data.workflow;
    }
    
    // 否则尝试转换
    return data as WorkflowDefinition;
  }

  /**
   * 处理ID冲突
   */
  private processIdConflicts(workflow: WorkflowDefinition, options: ImportOptions): WorkflowDefinition {
    if (options.preserveIds) {
      return workflow;
    }
    
    // 重新生成ID
    return this.regenerateIds(workflow);
  }

  /**
   * 应用映射
   */
  private applyMapping(workflow: WorkflowDefinition, mapping?: ImportOptions['mapping']): WorkflowDefinition {
    if (!mapping) {
      return workflow;
    }
    
    const mappedWorkflow = JSON.parse(JSON.stringify(workflow));
    
    // 应用节点类型映射
    if (mapping.nodeTypeMapping && mappedWorkflow.nodes) {
      mappedWorkflow.nodes.forEach((node: WorkflowNode) => {
        if (mapping.nodeTypeMapping![node.type]) {
          node.type = mapping.nodeTypeMapping![node.type];
        }
      });
    }
    
    // 应用属性映射
    if (mapping.propertyMapping && mappedWorkflow.nodes) {
      mappedWorkflow.nodes.forEach((node: WorkflowNode) => {
        if (node.config) {
          Object.entries(mapping.propertyMapping!).forEach(([oldKey, newKey]) => {
            if (node.config![oldKey] !== undefined) {
              node.config![newKey] = node.config![oldKey];
              delete node.config![oldKey];
            }
          });
        }
      });
    }
    
    return mappedWorkflow;
  }

  /**
   * 重新生成ID
   */
  private regenerateIds(workflow: WorkflowDefinition): WorkflowDefinition {
    const idMapping = new Map<string, string>();
    
    // 生成新的工作流ID
    const newWorkflowId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const oldWorkflowId = workflow.id;
    workflow.id = newWorkflowId;
    
    // 重新生成节点ID
    if (workflow.nodes) {
      workflow.nodes.forEach(node => {
        const newId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        idMapping.set(node.id, newId);
        node.id = newId;
      });
    }
    
    // 重新生成连接ID并更新引用
    if (workflow.edges) {
      workflow.edges.forEach(edge => {
        edge.id = `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // 更新节点引用
        if (idMapping.has(edge.source)) {
          edge.source = idMapping.get(edge.source)!;
        }
        if (idMapping.has(edge.target)) {
          edge.target = idMapping.get(edge.target)!;
        }
      });
    }
    
    return workflow;
  }

  /**
   * 初始化默认模板
   */
  private initializeDefaultTemplates(): void {
    // 简单的数据处理模板
    const dataProcessingTemplate: WorkflowTemplate = {
      id: 'template_data_processing',
      name: '数据处理流程',
      description: '用于数据清洗、转换和分析的基础模板',
      category: TemplateCategory.DATA_PROCESSING,
      tags: ['数据处理', '清洗', '转换'],
      author: 'System',
      version: '1.0.0',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      downloads: 0,
      rating: 4.5,
      workflow: {
        id: 'data_processing_workflow',
        name: '数据处理流程',
        description: '数据处理模板工作流',
        nodes: [
          {
            id: 'start',
            type: 'START',
            name: '开始',
            position: { x: 100, y: 100 },
            config: {}
          },
          {
            id: 'data_input',
            type: 'CAPABILITY',
            name: '数据输入',
            position: { x: 300, y: 100 },
            config: {
              capability: 'data_input'
            }
          },
          {
            id: 'data_clean',
            type: 'CAPABILITY',
            name: '数据清洗',
            position: { x: 500, y: 100 },
            config: {
              capability: 'data_cleaning'
            }
          },
          {
            id: 'data_transform',
            type: 'CAPABILITY',
            name: '数据转换',
            position: { x: 700, y: 100 },
            config: {
              capability: 'data_transformation'
            }
          },
          {
            id: 'end',
            type: 'END',
            name: '结束',
            position: { x: 900, y: 100 },
            config: {}
          }
        ],
        edges: [
          {
            id: 'edge1',
            source: 'start',
            target: 'data_input',
            type: 'default'
          },
          {
            id: 'edge2',
            source: 'data_input',
            target: 'data_clean',
            type: 'default'
          },
          {
            id: 'edge3',
            source: 'data_clean',
            target: 'data_transform',
            type: 'default'
          },
          {
            id: 'edge4',
            source: 'data_transform',
            target: 'end',
            type: 'default'
          }
        ]
      },
      metadata: {
        complexity: 'simple',
        estimatedTime: 15,
        requiredCapabilities: ['data_input', 'data_cleaning', 'data_transformation'],
        supportedVersions: ['1.0.0'],
        documentation: '这是一个基础的数据处理流程模板，包含数据输入、清洗、转换等步骤。'
      }
    };
    
    this.templates.set(dataProcessingTemplate.id, dataProcessingTemplate);
  }

  /**
   * 初始化验证规则
   */
  private initializeValidationRules(): void {
    // 基本结构验证
    this.addValidationRule((workflow: WorkflowDefinition) => {
      const errors: string[] = [];
      const warnings: string[] = [];
      const suggestions: string[] = [];
      
      if (!workflow.id) {
        errors.push('工作流必须有ID');
      }
      
      if (!workflow.name) {
        warnings.push('建议为工作流设置名称');
      }
      
      if (!workflow.nodes || workflow.nodes.length === 0) {
        errors.push('工作流必须包含至少一个节点');
      }
      
      return { valid: errors.length === 0, errors, warnings, suggestions };
    });
    
    // 节点连接验证
    this.addValidationRule((workflow: WorkflowDefinition) => {
      const errors: string[] = [];
      const warnings: string[] = [];
      const suggestions: string[] = [];
      
      if (workflow.nodes && workflow.edges) {
        const nodeIds = new Set(workflow.nodes.map(n => n.id));
        
        workflow.edges.forEach(edge => {
          if (!nodeIds.has(edge.source)) {
            errors.push(`连接引用了不存在的源节点: ${edge.source}`);
          }
          if (!nodeIds.has(edge.target)) {
            errors.push(`连接引用了不存在的目标节点: ${edge.target}`);
          }
        });
      }
      
      return { valid: errors.length === 0, errors, warnings, suggestions };
    });
  }

  /**
   * 清空所有数据
   */
  clear(): void {
    this.templates.clear();
    this.initializeDefaultTemplates();
  }

  /**
   * 导出模板数据
   */
  exportTemplates(): any {
    return {
      templates: Array.from(this.templates.entries()),
      exportedAt: Date.now()
    };
  }

  /**
   * 导入模板数据
   */
  importTemplates(data: any): void {
    if (data.templates) {
      data.templates.forEach(([id, template]: [string, WorkflowTemplate]) => {
        this.templates.set(id, template);
      });
    }
  }
}

export default WorkflowImportExport;