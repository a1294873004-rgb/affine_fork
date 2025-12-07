import { LiveData, Service } from '@toeverything/infra';
import { combineLatest, map } from 'rxjs';

import type { WorkspaceFlavoursProvider } from '../providers/flavour';

export class WorkspaceFlavoursService extends Service {
  /**
   * fuck init 数据:
   *  
   *   framework
       .impl(WorkspaceFlavoursProvider('LOCAL'), LocalWorkspaceFlavoursProvider)
       .impl(WorkspaceFlavoursProvider('CLOUD'), CloudWorkspaceFlavoursProvider, [
         GlobalState,
         ServersService,
       ]);
   */
  constructor(private readonly providers: WorkspaceFlavoursProvider[]) {
    super();
  }

  flavours$ = LiveData.from(
    combineLatest(this.providers.map(p => p.workspaceFlavours$)).pipe(
      map(flavours => flavours.flat())
    ),
    []
  );
}
