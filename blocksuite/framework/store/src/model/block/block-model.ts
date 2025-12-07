import type { Disposable } from '@blocksuite/global/disposable';
import { computed, type Signal, signal } from '@preact/signals-core';
import { Subject } from 'rxjs';
import { take } from 'rxjs/operators';

import type { Text } from '../../reactive/index.js';
import type { Store } from '../store/store.js';
import type { YBlock } from './types.js';
import type { BlockSchemaType } from './zod.js';

type SignaledProps<Props> = Props & {
  [P in keyof Props & string as `${P}$`]: Signal<Props[P]>;
};

const modelLabel = Symbol('model_label');
/**
 * 
 * @preact/signals-core 和 Mobx 
 * 
 * 
 * 总结：

    observable ≈ signal

    computed ≈ computed

    autorun / reaction ≈ effect

    runInAction ≈ batch

    untracked / peek ≈ untracked / peek


 | 功能 / 概念        | MobX API                                           | @preact/signals-core API                         | 说明                           |
  | -------------- | -------------------------------------------------- | ------------------------------------------------ | ---------------------------- |
  | **可观察状态**      | `observable({count:0})` 或 `observable.box(0)`      | `signal(0)`                                      | 创建响应式状态，可读写，`.value` 获取/设置   |
  | **派生值 / 计算属性** | `computed(() => count*2)`                          | `computed(() => count.value*2)`                  | 自动追踪依赖，懒惰计算，只读               |
  | **响应副作用**      | `autorun(() => console.log(count))`                | `effect(() => console.log(count.value))`         | 当依赖的状态变化时自动执行                |
  | **响应计算/派生变化**  | `reaction(() => count*2, val => console.log(val))` | `effect(() => console.log(double.value))`        | 对 computed / 派生值的变化响应        |
  | **批量更新**       | `runInAction(() => { count++; other++; })`         | `batch(() => { count.value++; other.value++; })` | 合并多次状态更新，减少中间副作用触发           |
  | **非响应式读取**     | `observable.get()` 或直接访问                           | `signal.peek()` 或 `untracked(() => ...)`         | 读取值但不建立依赖追踪                  |
  | **禁用追踪**       | `untracked(() => ...)`                             | `untracked(() => ...)`                           | 在回调中读信号不触发 effect / computed |
  | **停止副作用 / 清理** | autorun / reaction 返回 disposer 函数                  | `const dispose = effect(...); dispose();`        | 停止 effect 执行，防止内存泄漏          |

 */
export class BlockModel<Props extends object = object> {
  private readonly _children = signal<string[]>([]);

  private _store!: Store;

  private readonly _childModels = computed(() => {
    const value: BlockModel[] = [];
    this._children.value.forEach(id => {
      const block = this._store.getBlock$(id);
      if (block) {
        value.push(block.model);
      }
    });
    return value;
  });

  private readonly _onCreated: Disposable;

  private readonly _onDeleted: Disposable;

  childMap = computed(() =>
    this._children.value.reduce((map, id, index) => {
      map.set(id, index);
      return map;
    }, new Map<string, number>())
  );

  created = new Subject<void>();

  deleted = new Subject<void>();

  id!: string;

  schema!: BlockSchemaType;

  isEmpty() {
    return this.children.length === 0;
  }

  keys!: string[];

  // This is used to avoid https://stackoverflow.com/questions/55886792/infer-typescript-generic-class-type
  [modelLabel]: Props = 'type_info_label' as never;

  pop!: (prop: keyof Props & string) => void;

  propsUpdated = new Subject<{ key: string }>();

  stash!: (prop: keyof Props & string) => void;

  get text(): Text | undefined {
    return (this.props as { text?: Text }).text;
  }

  set text(text: Text) {
    if (this.keys.includes('text')) {
      (this.props as { text?: Text }).text = text;
    }
  }

  yBlock!: YBlock;

  _props!: SignaledProps<Props>;

  get props() {
    if (!this._props) {
      throw new Error('props is only supported in flat data model');
    }
    return this._props;
  }

  get flavour(): string {
    return this.schema.model.flavour;
  }

  get version() {
    return this.schema.version;
  }

  get children() {
    return this._childModels.value;
  }

  get store() {
    return this._store;
  }

  set store(doc: Store) {
    this._store = doc;
  }

  get parent() {
    return this.store.getParent(this);
  }

  get role() {
    return this.schema.model.role;
  }

  constructor() {
    this._onCreated = {
      dispose: this.created.pipe(take(1)).subscribe(() => {
        this._children.value = this.yBlock.get('sys:children').toArray();
        this.yBlock.get('sys:children').observe(event => {
          this._children.value = event.target.toArray();
        });
        this.yBlock.observe(event => {
          if (event.keysChanged.has('sys:children')) {
            this._children.value = this.yBlock.get('sys:children').toArray();
          }
        });
      }).unsubscribe,
    };
    this._onDeleted = {
      dispose: this.deleted.pipe(take(1)).subscribe(() => {
        this._onCreated.dispose();
      }).unsubscribe,
    };
  }

  dispose() {
    this.created.complete();
    this.deleted.complete();
    this.propsUpdated.complete();
  }

  firstChild(): BlockModel | null {
    return this.children[0] || null;
  }

  lastChild(): BlockModel | null {
    if (!this.children.length) {
      return this;
    }
    return this.children[this.children.length - 1].lastChild();
  }

  [Symbol.dispose]() {
    this._onCreated.dispose();
    this._onDeleted.dispose();
  }
}
