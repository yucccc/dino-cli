export interface Props {
  /**
   * @description 描述这个参数干啥的
   */
  p1: string
  /**
   * @default zh
   */
  language: 'zh' | 'en'
}


export interface Emits {
  /**
   * 触发组件事件
   */
  change: (value: string) => void
}
