import { CommonModule } from '@angular/common';
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

interface Todo {
  text: string;
  done: boolean;
  timestamp: Date;
}

interface LocalState {
  todos: Todo[];
  count: number; // derived property
  disableNewTodo: boolean;
}

interface UnifiedState extends LocalState, GlobalState {}

@Component({
  selector: 'app-todo-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './todo-list.component.html',
  styleUrl: './todo-list.component.scss',
})
export class TodoListComponent {
  @ViewChild('newTodoText') newTodoTextInput!: ElementRef<HTMLInputElement>;
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
      todos: [
        { text: 'Just do it', done: false, timestamp: new Date() },
        { text: 'Go to the office', done: false, timestamp: new Date() },
        { text: 'Go shopping', done: true, timestamp: new Date() },
      ],
      disableNewTodo: true,
    });

    // update todo list count
    this.localState.value$
      .pipe(
        takeUntilDestroyed(),
        distinctUntilChanged((prev, curr) => prev.todos === curr.todos)
      )
      .subscribe((st) => {
        this.localState.value.count = st.todos.length;
      });
  }

  enableNewTodo() {
    const disabled = this.localState.value.disableNewTodo;
    const val = this.newTodoTextInput.nativeElement.value;

    if (disabled && val) {
      this.localState.setDeep({ disableNewTodo: false });
    } else if (!disabled && !val) {
      this.localState.setDeep({ disableNewTodo: true });
    }
  }

  newTodo() {
    if (!this.localState.value.disableNewTodo) {
      const text = this.newTodoTextInput.nativeElement.value;
      const newTodos = [
        ...this.localState.value.todos,
        {
          text,
          done: false,
          timestamp: new Date(),
        },
      ];

      this.newTodoTextInput.nativeElement.value = '';
      this.localState.set({
        todos: newTodos,
        disableNewTodo: true,
      });
    }
  }

  todoDoneToggle(todo: Todo) {
    todo.done = !todo.done;
    // just propagate mutation of state
    this.localState.set({});
  }

  deleteTodo(todoIndex: number) {
    // can also be done in a mutable way:
    // this.state.value.todoList.todos.splice(todoIndex);
    // this.state.set({});

    const tds = this.localState.value.todos;
    const newTodos = [...tds.slice(0, todoIndex), ...tds.slice(todoIndex + 1)];

    this.localState.setDeep({ todos: newTodos });
  }
}
