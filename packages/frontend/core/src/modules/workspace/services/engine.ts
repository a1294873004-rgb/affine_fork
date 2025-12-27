import { Service } from '@toeverything/infra';

import { WorkspaceEngine } from '../entities/engine';
import type { WorkspaceScope } from '../scopes/workspace';

export class WorkspaceEngineService extends Service {
  private _engine: WorkspaceEngine | null = null;
  get engine() {
    if (!this._engine) {
      this._engine = this.framework.createEntity(WorkspaceEngine, {
        isSharedMode: this.workspaceScope.props.openOptions.isSharedMode,
        engineWorkerInitOptions:
        /**
         * 
         * class LocalWorkspaceFlavourProvider
         * 
         * 
  getEngineWorkerInitOptions(workspaceId: string): WorkerInitOptions {
    return {
      local: {
        doc: {
          name: this.DocStorageType.identifier,
          opts: {
            flavour: this.flavour,
            type: 'workspace',
            id: workspaceId,
          },
        },
         */
          this.workspaceScope.props.engineWorkerInitOptions,
      });
    }
    return this._engine;
  }

  constructor(private readonly workspaceScope: WorkspaceScope) {
    super();
  }

  override dispose(): void {
    this._engine?.dispose();
    this._engine = null;
    super.dispose();
  }
}
