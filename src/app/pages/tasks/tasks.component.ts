import { Component } from '@angular/core';
import { TaskService } from '../../services/task.service';
import { Task } from '../../services/task.service';

@Component({
  selector: 'app-tasks',
  standalone: true,
  templateUrl: './tasks.component.html'
})
export class TasksComponent {

  tasks: Task[] = [];

  constructor(private taskService: TaskService) {}

  ngOnInit() {
    this.taskService.tasks$.subscribe(t => this.tasks = t);
    this.taskService.loadTasks();
  }

  toggleTask(id: number) {
    this.taskService.toggleTask(id);
  }
}