/**
 * 游戏设置
 * 管理游戏的各种配置参数
 */
export interface GameSettings {
  // 渲染设置
  render: {
    targetFPS: number;
    enableVSync: boolean;
    enableDebugDraw: boolean;
  };

  // 音频设置
  audio: {
    masterVolume: number;
    musicVolume: number;
    sfxVolume: number;
    mute: boolean;
  };

  // 输入设置
  input: {
    keyBindings: Record<string, string>;
    mouseSensitivity: number;
  };

  // 游戏设置
  game: {
    difficulty: 'easy' | 'normal' | 'hard';
    language: string;
    autoSave: boolean;
  };

  // UI设置
  ui: {
    scale: number;
    showFPS: boolean;
    showDebugInfo: boolean;
  };

  // 调试设置
  debug: {
    logEnabled: boolean;
    logLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'NONE';
    showTimestamp: boolean;
    showModule: boolean;
    logModules: {
      [module: string]: {
        enabled: boolean;
        level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'NONE';
      };
    };
  };
}

/**
 * 默认游戏设置
 */
export const defaultGameSettings: GameSettings = {
  render: {
    targetFPS: 60,
    enableVSync: true,
    enableDebugDraw: false
  },
  audio: {
    masterVolume: 1.0,
    musicVolume: 0.7,
    sfxVolume: 0.8,
    mute: false
  },
  input: {
    keyBindings: {
      moveUp: 'KeyW',
      moveDown: 'KeyS',
      moveLeft: 'KeyA',
      moveRight: 'KeyD',
      interact: 'KeyE',
      inventory: 'KeyI',
      cancel: 'Escape',
      debug: 'F1'
    },
    mouseSensitivity: 1.0
  },
  game: {
    difficulty: 'normal',
    language: 'zh-CN',
    autoSave: true
  },
  ui: {
    scale: 1.0,
    showFPS: false,
    showDebugInfo: false
  },
  debug: {
    logEnabled: true,
    logLevel: 'INFO',
    showTimestamp: false,
    showModule: true,
    logModules: {
      // 可以在这里配置特定模块的日志级别
      // 例如：
      // 'Game': { enabled: true, level: 'DEBUG' },
      // 'Renderer': { enabled: true, level: 'WARN' },
    }
  }
};