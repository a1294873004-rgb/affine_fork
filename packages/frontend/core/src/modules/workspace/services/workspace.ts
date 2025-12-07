import { Service } from '@toeverything/infra';

import { Workspace } from '../entities/workspace';

export class WorkspaceService extends Service {
  _workspace: Workspace | null = null;

  get workspace() {
    // fuck doc 依赖的 Workspace 每次都会create if not create
    if (!this._workspace) {
      this._workspace = this.framework.createEntity(Workspace);
    }
    return this._workspace;
  }

  override dispose(): void {
    this._workspace?.dispose();
  }
}
