import { Component, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TaskService, Task } from '../../services/task.service';
import { ProjectService, Project } from '../../services/project.service';

type TaskFilter = 'all' | 'pending' | 'completed';
type SortField = 'dueDate' | 'priority' | 'title' | '';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [NgClass, ReactiveFormsModule],
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css']
})
export class TasksComponent implements OnInit {
  tasks: Task[] = [];
  projects: Project[] = [];
  filter: TaskFilter = 'all';
  searchQuery = '';
  sortField: SortField = '';
  showModal = false;
  editMode = false;
  editingId: string | null = null;
  toast: { message: string; type: 'success' | 'error' } | null = null;
  taskForm!: FormGroup;

  private readonly priorityOrder: Record<string, number> = {
    Critical: 4, High: 3, Medium: 2, Low: 1
  };

  constructor(
    private readonly taskService: TaskService,
    private readonly projectService: ProjectService,
    private readonly fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.taskService.tasks$.subscribe(tasks => (this.tasks = tasks));
    this.projectService.projects$.subscribe(projects => (this.projects = projects));
    this.taskService.loadTasks();       // ← add this
    this.projectService.loadProjects(); // ← add this
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      priority: ['Medium'],
      assignedTo: ['', Validators.required],
      startDate: ['', Validators.required],
      dueDate: ['', Validators.required],
      projectId: ['']
    });
  }

  openModal(task?: Task): void {
    this.showModal = true;
    this.editMode = !!task;
    this.editingId = task?.id ?? null;
    if (task) {
      this.taskForm.patchValue({
        title: task.title,
        priority: task.priority ?? 'Medium',
        assignedTo: task.assignedTo ?? '',
        startDate: task.startDate ?? '',
        dueDate: task.dueDate ?? '',
        projectId: task.projectId ?? ''
      });
    } else {
      this.taskForm.reset({ priority: 'Medium' });
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.editMode = false;
    this.editingId = null;
    this.taskForm.reset({ priority: 'Medium' });
  }

  submitTask(): void {
    if (this.taskForm.invalid) { this.taskForm.markAllAsTouched(); return; }
    const value = this.taskForm.value;
    const projectId: string | undefined = value.projectId || undefined;

    if (this.editMode && this.editingId !== null) {
      this.taskService.updateTask(this.editingId, { ...value, projectId }).subscribe({
        next: () => { this.closeModal(); this.showToast('Task updated!'); },
        error: () => this.showToast('Update failed', 'error')
      });
    } else {
      this.taskService.addTask({ ...value, projectId, completed: false }).subscribe({
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

  toggleTask(id: string): void { this.taskService.toggleTask(id); }

  markAllComplete(): void { this.taskService.markAllComplete(); }

  setFilter(f: TaskFilter): void { this.filter = f; }

  setSortField(e: Event): void {
    this.sortField = (e.target as HTMLSelectElement).value as SortField;
  }

  setSearchQuery(e: Event): void {
    this.searchQuery = (e.target as HTMLInputElement).value;
  }

  get filteredTasks(): Task[] {
    let result = [...this.tasks];

    if (this.filter === 'pending') result = result.filter(t => !t.completed);
    else if (this.filter === 'completed') result = result.filter(t => t.completed);

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

  get pendingCount(): number { return this.tasks.filter(t => !t.completed).length; }
  get completedCount(): number { return this.tasks.filter(t => t.completed).length; }

  getProjectName(projectId?: string): string {
    if (!projectId) return '';
    return this.projects.find(p => String(p.id) === String(projectId))?.name ?? '';
  }

  priorityClass(p?: string): Record<string, boolean> {
    return {
      'pri-low': p === 'Low',
      'pri-medium': p === 'Medium',
      'pri-high': p === 'High',
      'pri-critical': p === 'Critical'
    };
  }

  isOverdue(dueDate?: string): boolean {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date(new Date().toDateString());
  }

  isDueToday(dueDate?: string): boolean {
    if (!dueDate) return false;
    return new Date(dueDate).toDateString() === new Date().toDateString();
  }

  exportCSV(): void {
    const headers = ['Title', 'Priority', 'Assigned To', 'Start Date', 'Due Date', 'Completed'];
    const rows = this.tasks.map(t => [
      `"${t.title}"`, t.priority ?? '', t.assignedTo ?? '',
      t.startDate ?? '', t.dueDate ?? '', t.completed ? 'Yes' : 'No'
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = 'tasks.csv';
    a.click();
  }

  private showToast(message: string, type: 'success' | 'error' = 'success'): void {
    this.toast = { message, type };
    setTimeout(() => (this.toast = null), 3000);
  }
}