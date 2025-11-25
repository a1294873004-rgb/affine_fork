import type { LitElement } from 'lit';

import { DisposableGroup } from '../disposable/index.js';
import type { Constructor } from '../utils/types.js';

// See https://lit.dev/docs/composition/mixins/#mixins-in-typescript
// This definition should be exported, see https://github.com/microsoft/TypeScript/issues/30355#issuecomment-839834550
export declare class DisposableClass {
  protected _disposables: DisposableGroup;

  readonly disposables: DisposableGroup;
}

/**
 * Mixin that adds a `_disposables: DisposableGroup` property to the class.
 *
 * The `_disposables` property is initialized in `connectedCallback` and disposed in `disconnectedCallback`.
 *
 * see https://lit.dev/docs/composition/mixins/
 *
 * @example
 * ```ts
 * class MyElement extends WithDisposable(ShadowlessElement) {
 *   onClick() {
 *     this._disposables.add(...);
 *   }
 * }
 * ```
 */

/**
 * 
给类增加 _disposables 属性（一个 DisposableGroup），方便存放需要释放的资源。

在组件卸载（disconnectedCallback）时自动调用 _disposables.dispose()，释放里面所有资源，避免内存泄漏或悬空回调。
 */
export function WithDisposable<T extends Constructor<LitElement>>(
  SuperClass: T
) {
  class DerivedClass extends SuperClass {
    protected _disposables = new DisposableGroup();

    get disposables() {
      return this._disposables;
    }

    override connectedCallback() {
      super.connectedCallback();
      if (this._disposables.disposed) {
        this._disposables = new DisposableGroup();
      }
    }

    override disconnectedCallback() {
      super.disconnectedCallback();
      this._disposables.dispose();
    }
  }
  return DerivedClass as unknown as T & Constructor<DisposableClass>;
}
