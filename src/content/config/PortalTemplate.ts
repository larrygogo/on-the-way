/**
 * 传送门模板配置
 */
export interface PortalTemplate {
  templateId: string;
  activationTime: number; // 读条秒数
  costSpirit?: number; // 可选消耗灵气
  oneWay?: boolean; // 是否单向（默认 false）
  hint?: string; // 危险提示（可选）
  radius: number; // 触发范围
  cancelOnLeave: boolean; // 离开是否取消（默认 true）
}

/**
 * 验证传送门模板配置
 */
export function validatePortalTemplate(data: any, templateId: string): void {
  if (!data) {
    throw new Error(`[PortalTemplate] 配置数据为空: ${templateId}`);
  }

  if (typeof data.templateId !== 'string' || data.templateId !== templateId) {
    throw new Error(`[PortalTemplate] templateId 不匹配: ${templateId}`);
  }

  if (typeof data.activationTime !== 'number' || data.activationTime <= 0) {
    throw new Error(`[PortalTemplate] activationTime 必须是正数: ${templateId}`);
  }

  if (data.costSpirit !== undefined && (typeof data.costSpirit !== 'number' || data.costSpirit < 0)) {
    throw new Error(`[PortalTemplate] costSpirit 必须是非负数: ${templateId}`);
  }

  if (typeof data.radius !== 'number' || data.radius <= 0) {
    throw new Error(`[PortalTemplate] radius 必须是正数: ${templateId}`);
  }

  if (typeof data.cancelOnLeave !== 'boolean') {
    throw new Error(`[PortalTemplate] cancelOnLeave 必须是布尔值: ${templateId}`);
  }
}

