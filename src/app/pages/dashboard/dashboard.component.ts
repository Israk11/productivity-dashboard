import { Component, OnInit } from '@angular/core';
import { ProjectService } from '../../services/project.service';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  totalProjects = 0;
  completedTasks = 0;
  pendingTasks = 0;

  get completionRate(): number {
    const total = this.completedTasks + this.pendingTasks;
    return total === 0 ? 0 : Math.round((this.completedTasks / total) * 100);
  }

  constructor(
    private readonly projectService: ProjectService,
    private readonly taskService: TaskService
  ) {}

  ngOnInit() {
    this.projectService.projects$.subscribe(p => this.totalProjects = p.length);
    this.taskService.tasks$.subscribe(t => {
      this.completedTasks = t.filter(x => x.completed).length;
      this.pendingTasks = t.filter(x => !x.completed).length;
    });
    this.projectService.loadProjects();
    this.taskService.loadTasks();
  }
}