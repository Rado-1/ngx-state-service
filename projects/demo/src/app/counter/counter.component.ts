import { CommonModule, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { StateService } from '../../../../ngx-state-service/src/public-api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, combineLatest, map } from 'rxjs';
import {
  GlobalState,
  GlobalStateService,
} from '../services/global-state.service';

interface LocalState {
  counter: number;
  counterMax?: number;
  countingStopped: boolean;
  // derived properties
  square: number;
  fraction: number;
  percent: number;
}

interface UnifiedState extends GlobalState, LocalState {}

@Component({
  selector: 'app-counter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './counter.component.html',
  styleUrl: './counter.component.scss',
  providers: [DecimalPipe],
})
export class CounterComponent {
  @ViewChild('counterMaxInput') counterMaxInput!: ElementRef<HTMLInputElement>;
  timeoutId?: number;
  state$: Observable<UnifiedState>;

  constructor(
    private localState: StateService<LocalState>,
    private globalState: GlobalStateService
  ) {
    // compute derived properties
    const localFullState$ = this.localState.select((st) => {
      const fraction = st.counterMax ? st.counter / st.counterMax : 0;
      return {
        ...st,
        square: st.counter * st.counter,
        fraction,
        percent: 100 * fraction,
      };
    });

    // define unified state
    this.state$ = combineLatest([globalState.value$, localFullState$]).pipe(
      takeUntilDestroyed(),
      map(([globalState, localFullState]) => {
        return { ...globalState, ...localFullState };
      })
    );

    // initial state
    this.localState.set({
      counter: 0,
      counterMax: 10,
      countingStopped: false,
    });

    this.updateCounter();
  }

  updateCounter() {
    this.timeoutId = window.setTimeout(() => {
      const max = this.localState.value.counterMax;
      const oldValue = this.localState.value.counter;
      const newValue = (max ? oldValue < max : true) ? oldValue + 1 : 0;

      this.localState.set({
        counter: newValue,
      });
      this.updateCounter();
    }, 1000);
  }

  resetCounter() {
    if (!this.localState.value.countingStopped) {
      clearTimeout(this.timeoutId);
      this.localState.set({ counter: 0 });
      this.updateCounter();
    }
  }

  changeCounterMax() {
    this.localState.set({
      counterMax: this.counterMaxInput.nativeElement.valueAsNumber,
    });
  }

  infinityCounterMax() {
    this.localState.set({ counterMax: undefined });
  }

  startStopCounter() {
    this.localState.set((state) => ({
      counter: 0,
      countingStopped: !state.countingStopped,
    }));

    if (this.localState.value.countingStopped) {
      clearTimeout(this.timeoutId);
    } else {
      this.updateCounter();
    }
  }
}
