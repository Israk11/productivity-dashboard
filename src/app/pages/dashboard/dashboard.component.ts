import { Component } from '@angular/core';
import { ProjectService } from '../../services/project.service';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {

  totalProjects = 0;
  completedTasks = 0;
  pendingTasks = 0;

  constructor(
    private projectService: ProjectService,
    private taskService: TaskService
  ) {}

  ngOnInit() {
    this.projectService.projects$.subscribe(p => {
      this.totalProjects = p.length;
    });

    this.taskService.tasks$.subscribe(t => {
      this.completedTasks = t.filter(x => x.completed).length;
      this.pendingTasks = t.filter(x => !x.completed).length;
    });

    this.projectService.loadProjects();
    this.taskService.loadTasks();
  }
}