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

interface ProjectProgress {
  name: string;
  progress: number;
  total: number;
  done: number;
  status: string;
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
  projectProgressList: ProjectProgress[] = [];

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
      this.completedTasks = tasks.filter(x => x.status === 'Done').length;
      this.pendingTasks   = tasks.filter(x => x.status !== 'Done').length;
      this.activityItems  = this.buildFeed(tasks, projects);
      this.projectProgressList = projects.map(p => {
        const linked = tasks.filter(t => String(t.projectId) === String(p.id));
        const done   = linked.filter(t => t.status === 'Done').length;
        return {
          name: p.name,
          status: p.status,
          total: linked.length,
          done,
          progress: linked.length ? Math.round((done / linked.length) * 100) : 0
        };
      });
    });
  }

  private buildFeed(tasks: Task[], projects: Project[]): ActivityItem[] {
    const today = new Date(new Date().toDateString());
    const items: ActivityItem[] = [];

    tasks
      .filter(t => t.status !== 'Done' && t.dueDate && new Date(t.dueDate) < today)
      .forEach(t => items.push({ icon: '🔴', label: t.title, sub: `Overdue since ${t.dueDate}`, kind: 'danger' }));

    tasks
      .filter(t => t.status !== 'Done' && t.dueDate && new Date(t.dueDate).toDateString() === today.toDateString())
      .forEach(t => items.push({ icon: '🟡', label: t.title, sub: `Due today · ${t.assignedTo ?? 'Unassigned'}`, kind: 'warning' }));

    [...tasks].reverse()
      .filter(t => t.status !== 'Done' && !(t.dueDate && new Date(t.dueDate) <= today))
      .slice(0, 3)
      .forEach(t => items.push({ icon: '🔵', label: t.title,
        sub: t.dueDate ? `Due ${t.dueDate} · ${t.priority ?? 'Medium'}` : `${t.priority ?? 'Medium'} priority`,
        kind: 'info' }));

    [...tasks].reverse()
      .filter(t => t.status === 'Done')
      .slice(0, 2)
      .forEach(t => items.push({ icon: '✅', label: t.title, sub: `Done · ${t.assignedTo ?? 'Unassigned'}`, kind: 'success' }));

    projects
      .filter(p => p.status === 'In Progress' || p.status === 'Blocked')
      .slice(0, 2)
      .forEach(p => items.push({
        icon: p.status === 'Blocked' ? '🚫' : '🔄',
        label: p.name,
        sub: `Project ${p.status.toLowerCase()} · ${p.developer ?? p.owner}`,
        kind: p.status === 'Blocked' ? 'danger' : 'info'
      }));

    return items;
  }
}
