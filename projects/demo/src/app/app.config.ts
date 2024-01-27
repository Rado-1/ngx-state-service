import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { StateService } from '../../../ngx-state-service/src/public-api';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    { provide: StateService, useClass: StateService },
  ],
};
