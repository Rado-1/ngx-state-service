import { Injectable } from '@angular/core';
import { StateService } from '../../../../ngx-state-service/src/public-api';

export interface GlobalState {
  opacity: string;
}

@Injectable({
  providedIn: 'root',
})
export class GlobalStateService extends StateService<GlobalState> {}
