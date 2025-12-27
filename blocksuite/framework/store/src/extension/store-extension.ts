import { type Container, createIdentifier } from '@blocksuite/global/di';
import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';

import type { Store } from '../model/store';
import { StoreIdentifier } from '../model/store/identifier';
import { Extension } from './extension';

export const StoreExtensionIdentifier =
  createIdentifier<StoreExtension>('StoreExtension');

export const storeExtensionSymbol = Symbol('StoreExtension');

/**
 * Store extensions are used to extend the store.
 * They should be registered to the store. And they should be able to run in a none-dom environment.
 *
 * @category Extension
 */
export class StoreExtension extends Extension {
  /**
   * The key of the store extension.
   * **You must override this property with a unique string.**
   */
  static readonly key: string;

  constructor(readonly store: Store) {
    super();
  }

  /**
   * Lifecycle hook when the yjs document is loaded.
   */
  loaded() {}

  /**
   * Lifecycle hook when the yjs document is disposed.
   */
  disposed() {}

  static readonly [storeExtensionSymbol] = true;
  /**
   * add 依赖 this 对应的构造函数 依赖 StoreIdentifier
   * add this 的实现，返回new this() : static 方法 this === 构造函数
   */
  static override setup(di: Container) {
    if (!this.key) {
      throw new BlockSuiteError(
        ErrorCode.ValueNotExists,
        'Key is not defined in the StoreExtension'
      );
    }
    // static 方法 this === 构造函数
    di.add(this, [StoreIdentifier]);
    di.addImpl(StoreExtensionIdentifier(this.key), provider =>
      provider.get(this)
    );
  }
}

export function isStoreExtensionConstructor(
  extension: object
): extension is typeof StoreExtension {
  return storeExtensionSymbol in extension;
}
