/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import { effect } from '@preact/signals-core';
import type { ReactiveElement } from 'lit';

type ReactiveElementConstructor = abstract new (
  ...args: any[]
) => ReactiveElement;

/**
 * Adds the ability for a LitElement or other ReactiveElement class to
 * watch for access to Preact signals during the update lifecycle and
 * trigger a new update when signals values change.
 */
/*
import { signal } from '@preact/signals-core';
import { html, css, LitElement } from 'lit';
import { SignalWatcher } from './SignalWatcher';

const counter = signal(0); // 这是一个 Preact 信号

class MyCounter extends SignalWatcher(LitElement) {
  static styles = css`div { font-size: 24px; }`;

  render() {
    // 这里访问了 signal
    return html`<div>Counter: ${counter.value}</div>`;
  }

  increment() {
    counter.value += 1; // 修改 signal，会触发组件自动更新
  }
}

customElements.define('my-counter', MyCounter);

const el = document.createElement('my-counter');
document.body.appendChild(el);

// 信号变化时组件会自动重渲染
counter.value = 5; // 页面显示 "Counter: 5"
el.increment();    // 页面显示 "Counter: 6"

我们没有调用 requestUpdate()，但因为 SignalWatcher 包装了 performUpdate + effect，signal 改变时会自动触发 Lit 的更新。

这样 Lit 组件就能和 Preact 的响应式信号系统联动。

| 方法                                | 是否 Lit 自带 | 作用                                                     |
| --------------------------------- | --------- | ------------------------------------------------------ |
| `requestUpdate(name?, oldValue?)` | ✅         | 标记组件需要更新，异步调度更新队列，会在下一个 microtask 调用 `performUpdate()` |
| `performUpdate()`                 | ✅         | Lit 真正执行更新的逻辑：                                         |

| 功能   | React.forceUpdate() | Lit.requestUpdate()                        |
| ---- | ------------------- | ------------------------------------------ |
| 更新触发 | 强制调用 render()       | 标记组件需要更新，并异步调度 performUpdate()             |
| 属性检查 | 不做                  | 会检查 `@property` / `@state` 的新旧值差异（可选择强制更新） |
| 生命周期 | componentDidUpdate  | willUpdate → render → updated              |

*/
export function SignalWatcher<T extends ReactiveElementConstructor>(
  Base: T
): T {
  abstract class SignalWatcher extends Base {
    private __dispose?: () => void;

    override connectedCallback(): void {
      super.connectedCallback();
      // In order to listen for signals again after re-connection, we must
      // re-render to capture all the current signal accesses.
      this.requestUpdate();
    }

    override disconnectedCallback(): void {
      super.disconnectedCallback();
      this.__dispose?.();
    }

    override performUpdate() {
      // ReactiveElement.performUpdate() also does this check, so we want to
      // also bail early so we don't erroneously appear to not depend on any
      // signals.
      if (this.isUpdatePending === false || this.isConnected === false) {
        return;
      }
      // If we have a previous effect, dispose it
      this.__dispose?.();

      // Tracks whether the effect callback is triggered by this performUpdate
      // call directly, or by a signal change.
      let updateFromLit = true;

      // We create a new effect to capture all signal access within the
      // performUpdate phase (update, render, updated, etc) of the element.
      // Q: Do we need to create a new effect each render?
      // TODO: test various combinations of render triggers:
      //  - from requestUpdate()
      //  - from signals
      //  - from both (do we get one or two re-renders)
      // and see if we really need a new effect here.
      this.__dispose = effect(() => {
        if (updateFromLit) {
          updateFromLit = false;
          super.performUpdate();
        } else {
          // This branch is an effect run from Preact signals.
          // This will cause another call into performUpdate, which will
          // then create a new effect watching that update pass.
          this.requestUpdate();
        }
      });
    }
  }
  return SignalWatcher;
}
