import { Entity, LiveData } from '@toeverything/infra';
import { combineLatest, map, of, switchMap } from 'rxjs';

import type { WorkspaceMetadata } from '../metadata';
import type { WorkspaceFlavoursService } from '../services/flavours';

export class WorkspaceList extends Entity {
  // fuck react open workspace init 数据01
  workspaces$ = LiveData.from<WorkspaceMetadata[]>(
    this.flavoursService.flavours$.pipe(
      switchMap(flavours =>
        combineLatest(flavours.map(flavour => {


          console.log("flavour.workspaces$",flavour.workspaces$)
          return flavour.workspaces$
        })).pipe(
          map(workspaces => {


            console.log("fuck workspaces",workspaces)
            return workspaces.flat();
          })
        )
      )
    ),
    []
  );

  isRevalidating$ = LiveData.from<boolean>(
    this.flavoursService.flavours$.pipe(
      switchMap(flavours =>
        combineLatest(
          flavours.map(flavour => {


            console.log("fuck flavour.isRevalidating$",flavour.isRevalidating$?.value , flavour)
            return flavour.isRevalidating$ ?? of(false)
          })
        ).pipe(map(isLoadings => isLoadings.some(isLoading => isLoading)))
      )
    ),
    false
  );

  workspace$(id: string) {
    return this.workspaces$.map(workspaces =>
      workspaces.find(workspace => workspace.id === id)
    );
  }

  constructor(private readonly flavoursService: WorkspaceFlavoursService) {
    super();
  }

  revalidate() {
    this.flavoursService.flavours$.value.forEach(provider => {
      provider.revalidate?.();
    });
  }

  waitForRevalidation(signal?: AbortSignal) {
    this.revalidate();
    return this.isRevalidating$.waitFor(isLoading => !isLoading, signal);
  }
}
