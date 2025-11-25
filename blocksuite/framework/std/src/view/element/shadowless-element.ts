import type { Constructor } from '@blocksuite/global/utils';
import type { CSSResultGroup, CSSResultOrNative } from 'lit';
import { CSSResult, LitElement } from 'lit';

/**
 * 1. 禁用 Lit 的 shadow DOM（真正意义上的“shadowless”）
 * 2. 收集（获取） static styles，但不放到 shadow root，而是放到全局 document.head
 * 3. 如果组件被放到某个 ShadowRoot 内，动态把 styles 注入该 ShadowRoot
 */
export class ShadowlessElement extends LitElement {
  // Map of the number of styles injected into a node
  // A reference count of the number of ShadowlessElements that are still connected
  static connectedCount = new WeakMap<
    Constructor, // class
    WeakMap<Node, number>
  >();

  static onDisconnectedMap = new WeakMap<
    Constructor, // class
    WeakMap<Node, (() => void) | null>
  >();

  // Lit 会在 组件类第一次被定义时 调用：customElements.define('my-element', MyElement);
  // 只执行一次。不是在 render() 时！
  // 不只是收集，而是把组件的 styles 主动变成全局样式，并注入到 document.head 里。
  // 返回每个 class 的 static styles
  // styles registered in ShadowlessElement will be available globally
  // even if the element is not being rendered
  protected static override finalizeStyles(
    styles?: CSSResultGroup
  ): CSSResultOrNative[] {
    const elementStyles = super.finalizeStyles(styles);
    // XXX: This breaks component encapsulation and applies styles to the document.
    // These styles should be manually scoped.
    elementStyles.forEach((s: CSSResultOrNative) => {
      if (s instanceof CSSResult && typeof document !== 'undefined') {
        const styleRoot = document.head;
        const style = document.createElement('style');
        style.textContent = s.cssText;
        styleRoot.append(style);
      }
    });
    return elementStyles;
  }

  private getConnectedCount() {
    const SE = this.constructor as typeof ShadowlessElement;
    return SE.connectedCount.get(SE)?.get(this.getRootNode()) ?? 0;
  }

  private setConnectedCount(count: number) {
    const SE = this.constructor as typeof ShadowlessElement;

    if (!SE.connectedCount.has(SE)) {
      SE.connectedCount.set(SE, new WeakMap());
    }

    SE.connectedCount.get(SE)?.set(this.getRootNode(), count);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    const parentRoot = this.getRootNode();
    const SE = this.constructor as typeof ShadowlessElement;
    const insideShadowRoot = parentRoot instanceof ShadowRoot;
    const styleInjectedCount = this.getConnectedCount();

    if (styleInjectedCount === 0 && insideShadowRoot) {
      const elementStyles = SE.elementStyles;
      const injectedStyles: HTMLStyleElement[] = [];
      elementStyles.forEach((s: CSSResultOrNative) => {
        if (s instanceof CSSResult && typeof document !== 'undefined') {
          const style = document.createElement('style');
          style.textContent = s.cssText;
          parentRoot.prepend(style);
          injectedStyles.push(style);
        }
      });
      if (!SE.onDisconnectedMap.has(SE)) {
        SE.onDisconnectedMap.set(SE, new WeakMap());
      }
      SE.onDisconnectedMap.get(SE)?.set(parentRoot, () => {
        injectedStyles.forEach(style => style.remove());
      });
    }
    this.setConnectedCount(styleInjectedCount + 1);
  }
  // 这行代码就是让 Lit 不创建 ShadowRoot，改为直接把内容渲染在 light DOM，所以叫 ShadowlessElement。
  override createRenderRoot() {
    return this;
  }

  override disconnectedCallback(): void {
    const parentRoot = this.getRootNode();
    super.disconnectedCallback();
    const SE = this.constructor as typeof ShadowlessElement;
    let styleInjectedCount = this.getConnectedCount();
    styleInjectedCount--;
    this.setConnectedCount(styleInjectedCount);

    if (styleInjectedCount === 0) {
      // remove the style element when the last shadowless element is disconnected in the parent root
      SE.onDisconnectedMap.get(SE)?.get(parentRoot)?.();
    }
  }
}
