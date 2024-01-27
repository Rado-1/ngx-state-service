import { CommonModule, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { StateService } from '../../../../ngx-state-service/src/public-api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, combineLatest, distinctUntilChanged, map } from 'rxjs';
import {
  GlobalState,
  GlobalStateService,
} from '../services/global-state.service';

interface LocalState {
  counter: number;
  counterMax?: number;
  counterPercent: number; // derived property
  countingStopped: boolean;
}

interface UnifiedState extends LocalState, GlobalState {}

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
    // define unified state
    this.state$ = combineLatest([localState.value$, globalState.value$]).pipe(
      takeUntilDestroyed(),
      map(([localState, globalState]) => {
        return { ...localState, ...globalState };
      })
    );

    // initial state
    this.localState.set({
      counter: 0,
      counterMax: 10,
      countingStopped: false,
    });

    // update counterPercent automatically by changes of counter or counterMax
    this.localState.value$
      .pipe(
        takeUntilDestroyed(),
        distinctUntilChanged(
          (prev, curr) =>
            prev.counter === curr.counter && prev.counterMax === curr.counterMax
        )
      )
      .subscribe((st) => {
        this.localState.value.counterPercent = st.counterMax
          ? (100 * st.counter) / st.counterMax
          : 0;
      });

    this.updateCounter();
  }

  updateCounter() {
    this.timeoutId = window.setTimeout(() => {
      const max = this.localState.value.counterMax;
      const oldValue = this.localState.value?.counter;
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
    this.localState.set({
      counter: 0,
      countingStopped: !this.localState.value.countingStopped,
    });

    if (this.localState.value.countingStopped) {
      clearTimeout(this.timeoutId);
    } else {
      this.updateCounter();
    }
  }
}
