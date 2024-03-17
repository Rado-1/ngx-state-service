import {
  ChangeDetectionStrategy,
  Component,
  Signal,
  computed,
} from '@angular/core';
import { StateService } from '../../../../ngx-state-service/src/public-api';
import {
  GlobalState,
  GlobalStateService,
} from '../services/global-state.service';
import { CommonModule } from '@angular/common';

type OperatorType = '+' | '-' | '*' | '/';

interface LocalState {
  first: number;
  second?: number;
  current: number;
  operator?: OperatorType;
}

interface UnifiedState extends GlobalState, LocalState {}

@Component({
  selector: 'app-calculator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  providers: [StateService],
  templateUrl: './calculator.component.html',
  styleUrl: './calculator.component.scss',
})
export class CalculatorComponent {
  state: Signal<UnifiedState>;
  label: Record<OperatorType, string> = {
    '+': '+',
    '-': '-',
    '*': '×',
    '/': '÷',
  };

  constructor(
    private localState: StateService<LocalState>,
    private globalState: GlobalStateService
  ) {
    localState.config({
      useSignal: true,
      enableDevTools: true,
      stateName: 'Calculator',
    });

    // define unified state
    this.state = computed(() => ({
      ...globalState.valueSignal(),
      ...localState.valueSignal(),
    }));

    this.reset();
  }

  digit(val: number) {
    if (!!this.localState.value.second) {
      this.localState.set(
        (st) => ({
          first: 0,
          second: undefined,
          current: val,
          operator: undefined,
        }),
        { actionName: 'digit&reset' }
      );
    } else {
      this.localState.set(
        (st) => ({
          current: st.current * 10 + val,
        }),
        { actionName: 'digit' }
      );
    }
  }

  toggleSign() {
    this.localState.set(
      (st) => ({
        current: st.current * -1,
      }),
      { actionName: 'toggleSign' }
    );
  }

  operator(op: OperatorType) {
    this.localState.set(
      (st) => ({
        first:
          st.operator && st.second === undefined ? this.compute() : st.current,
        current: 0,
        operator: op,
        ...(this.localState.value.second !== undefined
          ? { second: undefined }
          : {}),
      }),
      { actionName: 'operator' }
    );
  }

  equals() {
    const st = this.localState.value;
    if (st.first !== undefined && !!st.operator) {
      this.localState.set(
        (st) => ({
          first: st.second !== undefined ? st.current : st.first,
          second: st.second !== undefined ? st.second : st.current,
          current: this.compute(),
        }),
        { actionName: 'equals' }
      );
    }
  }

  compute() {
    const st = this.localState.value;
    const a = st.second !== undefined ? st.current : st.first;
    const b = st.second !== undefined ? st.second : st.current;
    let result;

    switch (st.operator) {
      case '+':
        result = a + b;
        break;
      case '-':
        result = a - b;
        break;
      case '*':
        result = a * b;
        break;
      case '/':
        result = Math.trunc(a / b);
        break;
    }
    return result;
  }

  reset() {
    this.localState.set(
      {
        first: 0,
        second: undefined,
        current: 0,
        operator: undefined,
      },
      { actionName: 'reset' }
    );
  }
}
