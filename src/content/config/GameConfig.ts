/**
 * 游戏配置
 * 所有关键数值可配置
 */
export const GameConfig = {
  // 玩家配置
  player: {
    hp: 100,
    maxHp: 100,
    speed: 2.5,
    attackDamage: 15,
    attackRange: 40,        // 攻击范围（x方向距离）
    attackYThreshold: 24,  // 攻击y方向阈值（±24）
    attackCooldown: 0.5,    // 攻击冷却时间（秒）
    footprintWidth: 16,
    footprintHeight: 16,
  },

  // 敌人配置
  enemy: {
    normal: {
      hp: 35,
      damage: 8,
      speed: 1.2,
      attackRange: 28,      // 攻击范围
      attackCooldown: 1.0,  // 攻击冷却时间（秒）
      auraReward: 5,        // 击杀奖励灵气
      footprintWidth: 14,
      footprintHeight: 14,
      // 掉落概率
      dropPotionChance: 0.22,
      dropEquipmentChance: 0.08,
    },
    elite: {
      hp: 160,
      damage: 18,
      speed: 1.5,
      attackRange: 28,
      attackCooldown: 1.0,
      auraReward: 30,       // 击杀奖励灵气
      footprintWidth: 18,
      footprintHeight: 18,
      // 掉落概率
      dropPotionChance: 0.35,
      dropEquipmentChance: 0.35,
    },
    // AI配置
    ai: {
      visionRadius: 220,           // 视野半径
      loseRadius: 280,            // 丢失半径
      loseTimeSec: 1.2,           // 丢失时间（秒）
    },
    // 刷新配置
    spawn: {
      initialNormalCount: 8,      // 初始普通怪数量
      initialEliteCount: 1,       // 初始精英怪数量
      maxAlive: 14,               // 最大存活数量
      spawnIntervalSec: 6.0,      // 刷新间隔（秒）
      minSpawnDistanceToPlayer: 160, // 刷新点最小距离玩家距离
      // 固定刷新点坐标
      spawnPoints: [
        { x: 200, y: 300 },
        { x: 350, y: 320 },
        { x: 500, y: 350 },
        { x: 550, y: 380 },
        { x: 700, y: 280 },
        { x: 750, y: 300 },
        { x: 800, y: 420 },
        { x: 950, y: 420 },
        { x: 1000, y: 360 },
        { x: 1150, y: 350 },
        { x: 1200, y: 400 },
        { x: 1300, y: 380 },
        { x: 1400, y: 320 },
        { x: 1500, y: 400 },
        { x: 1600, y: 360 },
      ],
    },
  },
};

