import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StateService } from '../../../ngx-state-service/src/public-api';

interface LocalState {
  a?: string;
  b: { c: number , d: string};
  counter: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  providers: [StateService],
})
export class AppComponent {
  constructor(public state: StateService<LocalState>) {
    this.updateCounter();

    this.state.set({ a:'aaa', b:{d:'d'} });
  }

  updateCounter() {
    setTimeout(() => {
      this.state.set({ counter: (this.state.value?.counter ?? -1) + 1 });
      this.updateCounter();
    }, 1000);
  }
}
