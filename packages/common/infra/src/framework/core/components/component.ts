import { CONSTRUCTOR_CONTEXT } from '../constructor-context';
import type { FrameworkProvider } from '../provider';
/**
 * props 通过 context 注入
 * 
*      return withContext(() => factory(nextResolver), {
          provider: this.provider,
          props,
    });
    function withContext<T>(cb: () => T, context: Context): T {
      const pre = CONSTRUCTOR_CONTEXT.current;
      try {
        CONSTRUCTOR_CONTEXT.current = context;
        return cb();
      } finally {
        CONSTRUCTOR_CONTEXT.current = pre;
      }
    }

 */
export class Component<Props = {}> {
  /**
   ✅ FrameworkEditor = 注册阶段（写入）
  ✅ Framework = 注册结果的数据结构（存储）
  ✅ FrameworkProvider = 运行阶段（读取 + 实例化）
   */
  readonly framework: FrameworkProvider;

  readonly props: Props;

  protected readonly disposables: (() => void)[] = [];

  get eventBus() {
    return this.framework.eventBus;
  }

  constructor() {
    if (!CONSTRUCTOR_CONTEXT.current.provider) {
      throw new Error('Component must be created in the context of a provider');
    }
    this.framework = CONSTRUCTOR_CONTEXT.current.provider;
    this.props = CONSTRUCTOR_CONTEXT.current.props;
    CONSTRUCTOR_CONTEXT.current = {};
  }

  dispose() {
    this.disposables.forEach(dispose => dispose());
  }

  [Symbol.dispose]() {
    this.dispose();
  }
}
