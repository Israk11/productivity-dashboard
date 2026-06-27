import { Component, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { combineLatest } from 'rxjs';
import { ProjectService, Project } from '../../services/project.service';
import { TaskService, Task } from '../../services/task.service';

interface ActivityItem {
  icon: string;
  label: string;
  sub: string;
  kind: 'success' | 'warning' | 'danger' | 'info';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgClass],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  totalProjects = 0;
  completedTasks = 0;
  pendingTasks = 0;
  activityItems: ActivityItem[] = [];

  get completionRate(): number {
    const total = this.completedTasks + this.pendingTasks;
    return total === 0 ? 0 : Math.round((this.completedTasks / total) * 100);
  }

  constructor(
    private readonly projectService: ProjectService,
    private readonly taskService: TaskService
  ) {}

  ngOnInit() {
    combineLatest([
      this.projectService.projects$,
      this.taskService.tasks$
    ]).subscribe(([projects, tasks]) => {
      this.totalProjects = projects.length;
      this.completedTasks = tasks.filter(x => x.completed).length;
      this.pendingTasks = tasks.filter(x => !x.completed).length;
      this.activityItems = this.buildFeed(tasks, projects);
    });
  }

  private buildFeed(tasks: Task[], projects: Project[]): ActivityItem[] {
    const today = new Date(new Date().toDateString());
    const items: ActivityItem[] = [];

    // Overdue tasks — highest urgency
    tasks
      .filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < today)
      .forEach(t => items.push({
        icon: '🔴',
        label: t.title,
        sub: `Overdue since ${t.dueDate}`,
        kind: 'danger'
      }));

    // Tasks due today
    tasks
      .filter(t => !t.completed && t.dueDate && new Date(t.dueDate).toDateString() === today.toDateString())
      .forEach(t => items.push({
        icon: '🟡',
        label: t.title,
        sub: `Due today · ${t.assignedTo ?? 'Unassigned'}`,
        kind: 'warning'
      }));

    // Recently added pending tasks (last 3, reverse order)
    [...tasks]
      .reverse()
      .filter(t => !t.completed && !(t.dueDate && new Date(t.dueDate) <= today))
      .slice(0, 3)
      .forEach(t => items.push({
        icon: '🔵',
        label: t.title,
        sub: t.dueDate ? `Due ${t.dueDate} · ${t.priority ?? 'Medium'}` : `${t.priority ?? 'Medium'} priority`,
        kind: 'info'
      }));

    // Recently completed tasks (last 2)
    [...tasks]
      .reverse()
      .filter(t => t.completed)
      .slice(0, 2)
      .forEach(t => items.push({
        icon: '✅',
        label: t.title,
        sub: `Completed · ${t.assignedTo ?? 'Unassigned'}`,
        kind: 'success'
      }));

    // Active/blocked projects
    projects
      .filter(p => p.status === 'In Progress' || p.status === 'Blocked')
      .slice(0, 2)
      .forEach(p => items.push({
        icon: p.status === 'Blocked' ? '🚫' : '📁',
        label: p.name,
        sub: `${p.status} · ${p.developer ?? p.owner}`,
        kind: p.status === 'Blocked' ? 'danger' : 'info'
      }));

    return items.slice(0, 8);
  }
}
