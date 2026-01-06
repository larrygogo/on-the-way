import { PortalTemplate, validatePortalTemplate } from '../PortalTemplate';

/**
 * 传送门模板加载器
 */
export class PortalTemplateLoader {
  private static templates: Map<string, PortalTemplate> = new Map();
  private static loaded: boolean = false;

  /**
   * 加载所有传送门模板配置
   */
  static async loadPortalTemplates(): Promise<void> {
    if (this.loaded) {
      return; // 已经加载过
    }

    try {
      const response = await fetch('./data/portal_templates.json');
      
      if (!response.ok) {
        throw new Error(`无法加载传送门模板文件: portal_templates.json (HTTP ${response.status})`);
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('[PortalTemplateLoader] 配置必须是数组');
      }

      // 清空现有模板
      this.templates.clear();

      // 验证并加载每个模板
      data.forEach((template: any) => {
        validatePortalTemplate(template, template.templateId);
        this.templates.set(template.templateId, template as PortalTemplate);
      });

      this.loaded = true;
      console.log(`[PortalTemplateLoader] 已加载 ${this.templates.size} 个传送门模板`);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`[PortalTemplateLoader] 加载失败: ${error.message}`);
        throw error;
      }
      throw new Error(`[PortalTemplateLoader] 未知错误: ${String(error)}`);
    }
  }

  /**
   * 获取指定模板
   * @param templateId 模板ID
   * @returns 传送门模板
   */
  static getPortalTemplate(templateId: string): PortalTemplate | null {
    if (!this.loaded) {
      console.warn('[PortalTemplateLoader] 模板尚未加载，请先调用 loadPortalTemplates()');
      return null;
    }

    const template = this.templates.get(templateId);
    if (!template) {
      console.warn(`[PortalTemplateLoader] 未找到模板: ${templateId}`);
      return null;
    }

    return template;
  }

  /**
   * 检查是否已加载
   */
  static isLoaded(): boolean {
    return this.loaded;
  }
}

