import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ProgressBar } from 'primeng/progressbar';
import { Tag } from 'primeng/tag';
import { ProjectService, Project } from '../../services/project.service';
import { TaskService, Task } from '../../services/task.service';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [NgClass, RouterLink, ProgressBar, Tag],
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.css']
})
export class ProjectDetailComponent implements OnInit, OnDestroy {
  project: Project | null = null;
  tasks: Task[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly projectService: ProjectService,
    private readonly taskService: TaskService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.projectService.projects$.pipe(takeUntil(this.destroy$))
      .subscribe(projects => {
        this.project = projects.find(p => String(p.id) === id) ?? null;
      });
    this.taskService.tasks$.pipe(takeUntil(this.destroy$))
      .subscribe(tasks => {
        this.tasks = tasks.filter(t => String(t.projectId) === id);
      });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  get completedCount(): number { return this.tasks.filter(t => t.status === 'Done').length; }

  get progress(): number {
    return this.tasks.length ? Math.round((this.completedCount / this.tasks.length) * 100) : 0;
  }

  get isOverdue(): boolean {
    if (!this.project?.endDate || this.project.status === 'Completed') return false;
    return new Date(this.project.endDate) < new Date(new Date().toDateString());
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      'Completed': 'success', 'In Progress': 'info', 'On Hold': 'warn', 'Blocked': 'danger', 'Not Started': 'secondary'
    };
    return map[status] ?? 'secondary';
  }

  statusClass(status: string): Record<string, boolean> {
    return {
      'badge-blue':  status === 'In Progress',
      'badge-green': status === 'Completed',
      'badge-red':   status === 'Blocked',
      'badge-gray':  status === 'Not Started' || status === 'On Hold'
    };
  }

  taskStatusClass(status: string): Record<string, boolean> {
    return {
      'status-todo':       status === 'Todo',
      'status-inprogress': status === 'In Progress',
      'status-inreview':   status === 'In Review',
      'status-done':       status === 'Done'
    };
  }

  priorityClass(p?: string): Record<string, boolean> {
    return {
      'priority-low':      p === 'Low',
      'priority-medium':   p === 'Medium',
      'priority-high':     p === 'High',
      'priority-critical': p === 'Critical'
    };
  }
}
