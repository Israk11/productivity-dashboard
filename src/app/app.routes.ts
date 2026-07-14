import { Routes } from '@angular/router';

import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ProjectsComponent } from './pages/projects/projects.component';
import { TasksComponent } from './pages/tasks/tasks.component';
import { ProjectDetailComponent } from './pages/project-detail/project-detail.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: DashboardComponent
  },
  {
    path: 'projects',
    component: ProjectsComponent
  },
  {
    path: 'projects/:id',
    component: ProjectDetailComponent
  },
  {
    path: 'tasks',
    component: TasksComponent
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];