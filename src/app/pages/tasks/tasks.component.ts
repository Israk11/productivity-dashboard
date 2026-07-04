import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TaskService, Task, TaskStatus, StatusHistoryEntry } from '../../services/task.service';
import { ProjectService, Project } from '../../services/project.service';
import { UserService } from '../../services/user.service';

type TaskFilter = 'all' | TaskStatus;
type SortField = 'dueDate' | 'priority' | 'title' | '';

export const TASK_STATUSES: TaskStatus[] = ['Todo', 'In Progress', 'In Review', 'Done'];

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [NgClass, ReactiveFormsModule],
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css']
})
export class TasksComponent implements OnInit, OnDestroy {
  tasks: Task[] = [];
  projects: Project[] = [];
  filter: TaskFilter = 'all';
  searchQuery = '';
  sortField: SortField = '';

  // Add/edit modal (manager only)
  showModal = false;
  editMode = false;
  editingId: string | null = null;
  taskForm!: FormGroup;

  // Status-change modal (manager or assigned member)
  showStatusModal = false;
  statusTask: Task | null = null;
  statusForm!: FormGroup;

  // History panel
  expandedHistoryId: string | null = null;

  toast: { message: string; type: 'success' | 'error' } | null = null;
  currentUserName = '';
  isManager = false;

  readonly taskStatuses = TASK_STATUSES;

  private readonly priorityOrder: Record<string, number> = {
    Critical: 4, High: 3, Medium: 2, Low: 1
  };

  private destroy$ = new Subject<void>();

  constructor(
    private readonly taskService: TaskService,
    private readonly projectService: ProjectService,
    private readonly userService: UserService,
    private readonly fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.taskService.tasks$.pipe(takeUntil(this.destroy$))
      .subscribe(tasks => (this.tasks = tasks));
    this.projectService.projects$.pipe(takeUntil(this.destroy$))
      .subscribe(projects => (this.projects = projects));
    this.userService.currentUser$.pipe(takeUntil(this.destroy$))
      .subscribe(user => { this.currentUserName = user.name; this.isManager = user.role === 'Manager'; });

    this.taskService.loadTasks();
    this.projectService.loadProjects();

    this.taskForm = this.fb.group({
      title:      ['', [Validators.required, Validators.minLength(3)]],
      status:     ['Todo'],
      priority:   ['Medium'],
      assignedTo: ['', Validators.required],
      startDate:  ['', Validators.required],
      dueDate:    ['', Validators.required],
      projectId:  ['']
    });

    this.statusForm = this.fb.group({
      newStatus: ['', Validators.required],
      comment:   ['']
    });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  // ── Add/Edit Modal ────────────────────────────────────────────────────────
  openModal(task?: Task): void {
    this.showModal = true;
    this.editMode = !!task;
    this.editingId = task?.id ?? null;
    if (task) {
      this.taskForm.patchValue({
        title: task.title, status: task.status ?? 'Todo',
        priority: task.priority ?? 'Medium', assignedTo: task.assignedTo ?? '',
        startDate: task.startDate ?? '', dueDate: task.dueDate ?? '',
        projectId: task.projectId ?? ''
      });
    } else {
      this.taskForm.reset({ priority: 'Medium', status: 'Todo' });
    }
  }

  closeModal(): void {
    this.showModal = false; this.editMode = false; this.editingId = null;
    this.taskForm.reset({ priority: 'Medium', status: 'Todo' });
  }

  submitTask(): void {
    if (this.taskForm.invalid) { this.taskForm.markAllAsTouched(); return; }
    const v = this.taskForm.value;
    const projectId: string | undefined = v.projectId || undefined;
    const status: TaskStatus = v.status;
    const completed = status === 'Done';

    if (this.editMode && this.editingId) {
      this.taskService.updateTask(this.editingId, { ...v, projectId, completed }).subscribe({
        next: () => { this.closeModal(); this.showToast('Task updated!'); },
        error: () => this.showToast('Update failed', 'error')
      });
    } else {
      this.taskService.addTask({
        ...v, projectId, completed,
        statusHistory: [{ status, changedBy: this.currentUserName,
          changedAt: new Date().toISOString(), comment: 'Task created' }]
      }).subscribe({
        next: () => { this.closeModal(); this.showToast('Task added!'); },
        error: () => this.showToast('Could not save task', 'error')
      });
    }
  }

  deleteTask(id: string): void {
    this.taskService.deleteTask(id).subscribe({
      next: () => this.showToast('Task deleted'),
      error: () => this.showToast('Delete failed', 'error')
    });
  }

  // ── Status Change Modal ───────────────────────────────────────────────────
  openStatusModal(task: Task): void {
    this.statusTask = task;
    this.showStatusModal = true;
    this.statusForm.reset({ newStatus: task.status ?? 'Todo', comment: '' });
  }

  closeStatusModal(): void {
    this.showStatusModal = false; this.statusTask = null; this.statusForm.reset();
  }

  submitStatusChange(): void {
    if (!this.statusTask || this.statusForm.invalid) return;
    const { newStatus, comment } = this.statusForm.value;
    this.taskService.changeStatus(this.statusTask.id!, newStatus, this.currentUserName, comment ?? '')
      ?.subscribe({
        next: () => { this.closeStatusModal(); this.showToast('Status updated!'); },
        error: () => this.showToast('Status update failed', 'error')
      });
  }

  canChangeStatus(task: Task): boolean {
    return this.isManager || task.assignedTo === this.currentUserName;
  }

  // ── History Panel ─────────────────────────────────────────────────────────
  toggleHistory(taskId: string): void {
    this.expandedHistoryId = this.expandedHistoryId === taskId ? null : taskId;
  }

  // ── Filters / Sort ────────────────────────────────────────────────────────
  setFilter(f: TaskFilter): void { this.filter = f; }
  setSortField(e: Event): void {
    this.sortField = (e.target as HTMLSelectElement).value as SortField;
  }
  setSearchQuery(e: Event): void {
    this.searchQuery = (e.target as HTMLInputElement).value;
  }

  get filteredTasks(): Task[] {
    let result = [...this.tasks];
    if (this.filter !== 'all') result = result.filter(t => t.status === this.filter);
    const q = this.searchQuery.trim().toLowerCase();
    if (q) result = result.filter(t =>
      t.title.toLowerCase().includes(q) || (t.assignedTo ?? '').toLowerCase().includes(q)
    );
    if (this.sortField === 'dueDate')
      result.sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''));
    else if (this.sortField === 'priority')
      result.sort((a, b) =>
        (this.priorityOrder[b.priority ?? 'Medium'] ?? 2) - (this.priorityOrder[a.priority ?? 'Medium'] ?? 2)
      );
    else if (this.sortField === 'title')
      result.sort((a, b) => a.title.localeCompare(b.title));
    return result;
  }

  get pendingCount(): number  { return this.tasks.filter(t => !t.completed).length; }
  get completedCount(): number { return this.tasks.filter(t => t.completed).length; }
  taskCountByStatus(s: TaskStatus): number { return this.tasks.filter(t => t.status === s).length; }

  getProjectName(projectId?: string): string {
    if (!projectId) return '';
    return this.projects.find(p => String(p.id) === String(projectId))?.name ?? '';
  }

  isOverdue(dueDate?: string): boolean {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date(new Date().toDateString());
  }

  isDueToday(dueDate?: string): boolean {
    if (!dueDate) return false;
    return new Date(dueDate).toDateString() === new Date().toDateString();
  }

  priorityClass(p?: string): Record<string, boolean> {
    return {
      'priority-low': p === 'Low', 'priority-medium': p === 'Medium',
      'priority-high': p === 'High', 'priority-critical': p === 'Critical'
    };
  }

  statusClass(s?: TaskStatus | string): Record<string, boolean> {
    return {
      'status-todo':       s === 'Todo',
      'status-inprogress': s === 'In Progress',
      'status-inreview':   s === 'In Review',
      'status-done':       s === 'Done'
    };
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  exportCSV(): void {
    const headers = ['Title', 'Status', 'Priority', 'Assigned To', 'Start Date', 'Due Date', 'Project'];
    const rows = this.tasks.map(t => [
      t.title, t.status, t.priority ?? '', t.assignedTo ?? '',
      t.startDate ?? '', t.dueDate ?? '', this.getProjectName(t.projectId)
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = 'tasks.csv';
    a.click();
  }

  markAllComplete(): void { this.taskService.markAllComplete(); }

  private showToast(message: string, type: 'success' | 'error' = 'success'): void {
    this.toast = { message, type };
    setTimeout(() => (this.toast = null), 3000);
  }
}