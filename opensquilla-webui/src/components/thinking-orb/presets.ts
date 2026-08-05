/**
 * 状态配置表 —— 将语义状态名映射到动画模式 + 参数
 *
 * 原版 thinking-orbs 用 STATE_TO_MODE + PRESETS 双层映射，
 * 每个 (state, size) 有独立的 count/size 倍率。
 *
 * 本设计：
 * - 支持任意尺寸（不限于 64/20）
 * - 密度根据尺寸自动计算（线性插值）
 * - 额外参数通过 extra 字段合并
 * - 支持自定义模式扩展
 */

import type { AnimationMode } from './engine/types'
import { modeRegistry } from './registry'
import { OrbitsMode } from './modes/OrbitsMode'
import { GlobeMode } from './modes/GlobeMode'
import { RubikMode } from './modes/RubikMode'
import { WaveMode } from './modes/WaveMode'
import { WebMode } from './modes/WebMode'
import { BraidMode } from './modes/BraidMode'
import { RibbonMode } from './modes/RibbonMode'
import { RingMode } from './modes/RingMode'
import { MorphMode } from './modes/MorphMode'

// ============ 注册所有内置模式 ============

export function registerBuiltinModes(): void {
  modeRegistry.register('orbits', OrbitsMode)
  modeRegistry.register('globe', GlobeMode)
  modeRegistry.register('rubik', RubikMode)
  modeRegistry.register('wave', WaveMode)
  modeRegistry.register('web', WebMode)
  modeRegistry.register('braid', BraidMode)
  modeRegistry.register('ribbon', RibbonMode)
  modeRegistry.register('ring', RingMode)
  modeRegistry.register('morph', MorphMode)

  // 语义别名
  modeRegistry.alias('working', 'orbits')
  modeRegistry.alias('searching', 'globe')
  modeRegistry.alias('solving', 'rubik')
  modeRegistry.alias('listening', 'wave')
  modeRegistry.alias('connecting', 'web')
  modeRegistry.alias('weaving', 'braid')
  modeRegistry.alias('composing', 'ribbon')
  modeRegistry.alias('breathing', 'ring')
  modeRegistry.alias('shaping', 'morph')
}

/** 可用的动画状态 */
export type OrbState =
  | 'working'
  | 'searching'
  | 'solving'
  | 'listening'
  | 'connecting'
  | 'weaving'
  | 'composing'
  | 'breathing'
  | 'shaping'

/** 所有状态列表 */
export const ALL_STATES: OrbState[] = [
  'working', 'searching', 'solving', 'listening',
  'connecting', 'weaving', 'composing', 'breathing', 'shaping',
]

/** 每个状态的默认 aria-label */
export const STATE_LABELS: Record<OrbState, string> = {
  working: '工作中…',
  searching: '搜索中…',
  solving: '计算中…',
  listening: '监听中…',
  connecting: '连接中…',
  weaving: '编织中…',
  composing: '创作中…',
  breathing: '思考中…',
  shaping: '塑形中…',
}

/**
 * 状态配置：每个状态在不同尺寸下的参数
 * 密度参数会根据实际尺寸自动插值
 */
export interface StatePreset {
  /** 速度倍率 */
  speed: number
  /** 密度系数 (0~1)，控制粒子数量 */
  density: number
  /** 额外参数 */
  extra?: Record<string, number>
}

/** 密度参考点：小尺寸 (20px) 和 大尺寸 (64px) 的配置 */
interface DensityPoint {
  small: StatePreset
  large: StatePreset
}

/**
 * 根据尺寸插值状态配置
 */
export function resolvePreset(state: OrbState, size: number): {
  mode: AnimationMode | undefined
  speed: number
  density: number
  opts: Record<string, number>
} {
  const mode = modeRegistry.get(state)
  const modeName = state
  const point = DENSITY_PRESETS[state] ?? DENSITY_PRESETS.working
  const f = Math.min(1, Math.max(0, (size - 20) / (64 - 20)))

  const small = point.small
  const large = point.large
  const speed = small.speed + (large.speed - small.speed) * f
  const density = small.density + (large.density - small.density) * f
  const extra = { ...small.extra, ...large.extra }

  return { mode, speed, density, opts: extra }
}

/** 密度配置表 */
const DENSITY_PRESETS: Record<string, DensityPoint> = {
  working: {
    small: { speed: 3.9, density: 0.24 },
    large: { speed: 1.89, density: 1.0 },
  },
  searching: {
    small: { speed: 2.67, density: 0.11, extra: { scanMul: 4.34, dimBase: 0.45 } },
    large: { speed: 2.02, density: 0.42, extra: { scanMul: 4.08, dimBase: 0.45 } },
  },
  solving: {
    small: { speed: 1.95, density: 0.09 },
    large: { speed: 1.82, density: 0.35 },
  },
  listening: {
    small: { speed: 4.0, density: 0.11 },
    large: { speed: 4.39, density: 0.34 },
  },
  connecting: {
    small: { speed: 6.63, density: 0.25 },
    large: { speed: 3.32, density: 1.35 },
  },
  weaving: {
    small: { speed: 2.75, density: 0.11 },
    large: { speed: 1.63, density: 0.50 },
  },
  composing: {
    small: { speed: 3.12, density: 0.05, extra: { spin: 0, bandMul: 4.94, wobMul: 1 } },
    large: { speed: 2.34, density: 0.25, extra: { spin: 0, bandMul: 3.9, wobMul: 1 } },
  },
  breathing: {
    small: { speed: 3.78, density: 0.03, extra: { spin: 0, bandMul: 3.97, wobMul: 0.57 } },
    large: { speed: 3.24, density: 0.25, extra: { spin: 0, bandMul: 3.63, wobMul: 0.37 } },
  },
  shaping: {
    small: { speed: 2.08, density: 0.53, extra: { spread: 1.45 } },
    large: { speed: 2.41, density: 0.70, extra: { spread: 1.45 } },
  },
}