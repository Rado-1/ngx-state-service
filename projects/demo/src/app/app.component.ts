import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CounterComponent } from './counter/counter.component';
import { TodoListComponent } from './todo-list/todo-list.component';
import { GlobalStateService } from './services/global-state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CounterComponent, TodoListComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  @ViewChild('opacitySelect') opacitySelect!: ElementRef<HTMLInputElement>;

  constructor(public globalState: GlobalStateService) {
    globalState.config({
      enableDevTools: true,
      stateName: 'Global',
    });

    globalState.set({ opacity: '50' });
  }

  setOpacity() {
    this.globalState.set({
      opacity: this.opacitySelect.nativeElement.value,
    });
  }
}
