import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgClass } from '@angular/common';
import { combineLatest, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
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
export class DashboardComponent implements OnInit, OnDestroy {

  totalProjects = 0;
  completedTasks = 0;
  pendingTasks = 0;
  tasks: Task[] = [];
  activityItems: ActivityItem[] = [];
  projectProgressList: ProjectProgress[] = [];
  private destroy$ = new Subject<void>();

  get completionRate(): number {
    const total = this.completedTasks + this.pendingTasks;
    return total === 0 ? 0 : Math.round((this.completedTasks / total) * 100);
  }

  get taskStatusCounts(): { todo: number; inProgress: number; inReview: number; done: number } {
    return {
      todo:       this.tasks.filter(t => t.status === 'Todo').length,
      inProgress: this.tasks.filter(t => t.status === 'In Progress').length,
      inReview:   this.tasks.filter(t => t.status === 'In Review').length,
      done:       this.tasks.filter(t => t.status === 'Done').length,
    };
  }

  get donutGradient(): string {
    const { todo, inProgress, inReview, done } = this.taskStatusCounts;
    const total = todo + inProgress + inReview + done;
    if (total === 0) return 'conic-gradient(#e2e8f0 0% 100%)';
    const toDeg = (n: number) => (n / total) * 360;
    const d1 = toDeg(done);
    const d2 = d1 + toDeg(inReview);
    const d3 = d2 + toDeg(inProgress);
    return `conic-gradient(#22c55e 0deg ${d1}deg, #6366f1 ${d1}deg ${d2}deg, #f59e0b ${d2}deg ${d3}deg, #94a3b8 ${d3}deg 360deg)`;
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  constructor(
    private readonly projectService: ProjectService,
    private readonly taskService: TaskService
  ) {}

  ngOnInit() {
    combineLatest([
      this.projectService.projects$,
      this.taskService.tasks$
    ]).pipe(takeUntil(this.destroy$)).subscribe(([projects, tasks]) => {
      this.tasks = tasks;
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
