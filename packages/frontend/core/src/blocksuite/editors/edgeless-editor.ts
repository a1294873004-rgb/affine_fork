import { SignalWatcher, WithDisposable } from '@blocksuite/affine/global/lit';
import { ThemeProvider } from '@blocksuite/affine/shared/services';
import { BlockStdScope, ShadowlessElement } from '@blocksuite/affine/std';
import type { ExtensionType, Store } from '@blocksuite/affine/store';
import { css, html, nothing, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { guard } from 'lit/directives/guard.js';
/**
 * requestUpdate() 
   └─> 标记 isUpdatePending = true
   └─> 异步调度更新队列 (Promise.resolve / microtask)
        └─> 调用 performUpdate()
             ├─> 调用 willUpdate(changedProperties)
             ├─> 调用 render() -> html`...` 模板
             ├─> 更新 DOM（diff/patch）
             └─> 调用 updated(changedProperties)

 */
console.log("fuck 图形编辑器")
export class EdgelessEditor extends SignalWatcher(
  WithDisposable(ShadowlessElement)
) {
  static override styles = css`
    edgeless-editor {
      font-family: var(--affine-font-family);
      background: var(--affine-background-primary-color);
    }

    edgeless-editor * {
      box-sizing: border-box;
    }

    @media print {
      edgeless-editor {
        height: auto;
      }
    }

    .affine-edgeless-viewport {
      display: block;
      height: 100%;
      position: relative;
      overflow: clip;
      container-name: viewport;
      container-type: inline-size;
    }
  `;

  get host() {
    try {
      return this.std.host;
    } catch {
      return null;
    }
  }
  // 对应 react ： componentDidMount
  override connectedCallback() {
    super.connectedCallback();
    this._disposables.add(
      this.doc.slots.rootAdded.subscribe(() => this.requestUpdate())
    );
    this.std = new BlockStdScope({
      store: this.doc,
      extensions: this.specs,
    });
  }

  override async getUpdateComplete(): Promise<boolean> {
    const result = await super.getUpdateComplete();
    await this.host?.updateComplete;
    return result;
  }

  override render() {
    if (!this.doc.root) return nothing;

    const std = this.std;
    const theme = std.get(ThemeProvider).edgeless$.value;
    // std 依赖修改之后 重新render
    // guard(dependencies: unknown[], fn: () => TemplateResult): TemplateResult
    return html`
      <div class="affine-edgeless-viewport" data-theme=${theme}>
        ${guard([std], () => std.render())}
      </div>
    `;
  }
  // 对应 react componentWillUpdate
  override willUpdate(
    changedProperties: Map<string | number | symbol, unknown>
  ) {
    super.willUpdate(changedProperties);
    if (
      this.hasUpdated && // skip the first update
      changedProperties.has('doc')
    ) {
      this.std = new BlockStdScope({
        store: this.doc,
        extensions: this.specs,
      });
    }
  }
  // this.doc 修改属性 会导致lit 组件更新:update() -> render() -> updated()
  // attribute: false 不映射成 dom 属性
  // accessor doc!: Store; ts写法生成 ： private _doc: Store; get doc() { return this._doc; } set doc(v) { this._doc = v; }
  @property({ attribute: false })
  accessor doc!: Store;

  @property({ attribute: false })
  accessor editor!: TemplateResult;

  @property({ attribute: false })
  accessor specs: ExtensionType[] = [];
  // 内部属性，不能从外部传递，但是修改也会导致更新
  @state()
  accessor std!: BlockStdScope;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-editor': EdgelessEditor;
  }
}
