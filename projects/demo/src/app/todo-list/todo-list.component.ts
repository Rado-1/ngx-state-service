import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { Observable } from 'rxjs';
import {
  StateService,
  compose,
} from '../../../../ngx-state-service/src/public-api';
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
  providers: [StateService],
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
    localState.config({
      enableStorage: true,
      enableDevTools: true,
      stateName: 'TodoList',
    });

    // initial state
    this.localState.set(
      !!this.localState.value
        ? { disableNewTodo: true }
        : {
            todos: [
              { text: 'Just do it', done: false, timestamp: new Date() },
              { text: 'Go to the office', done: false, timestamp: new Date() },
              { text: 'Go shopping', done: true, timestamp: new Date() },
            ],
            disableNewTodo: true,
          },
      { actionName: 'init' }
    );

    // update todo list count
    const localFullState$ = this.localState.select((st) => ({
      ...st,
      count: st.todos.length,
    }));

    // define unified state
    this.state$ = compose(globalState.value$, localFullState$);
  }

  enableNewTodo() {
    const disabled = this.localState.value.disableNewTodo;
    const val = this.newTodoTextInput.nativeElement.value;

    if (disabled && val) {
      this.localState.set(
        { disableNewTodo: false },
        { actionName: 'enableNewTodo' }
      );
    } else if (!disabled && !val) {
      this.localState.set(
        { disableNewTodo: true },
        { actionName: 'disableNewTodo' }
      );
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
      this.localState.set(
        {
          todos: newTodos,
          disableNewTodo: true,
        },
        { actionName: 'newTodo' }
      );
    }
  }

  todoDoneToggle(todo: Todo) {
    todo.done = !todo.done;
    // just propagate mutation of state
    this.localState.set({}, { actionName: 'toggleDone' });
  }

  deleteTodo(todoIndex: number) {
    // can also be done in a mutable way:
    // this.state.value.todoList.todos.splice(todoIndex);
    // this.state.set({});

    this.localState.setDeep(
      (state) => ({
        todos: [
          ...state.todos.slice(0, todoIndex),
          ...state.todos.slice(todoIndex + 1),
        ],
      }),
      { actionName: 'delete' }
    );
  }
}
