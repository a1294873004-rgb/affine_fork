import { Service } from '@toeverything/infra';

import { Doc } from '../entities/doc';

export class DocService extends Service {
  // DocService 每次都会创建 Doc
  public readonly doc = this.framework.createEntity(Doc);

  override dispose() {
    this.doc.dispose();
    super.dispose();
  }
}
