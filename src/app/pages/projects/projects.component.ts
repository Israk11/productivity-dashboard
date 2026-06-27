import { Component, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ProjectService, Project } from '../../services/project.service';
import { TaskService, Task } from '../../services/task.service';

type SortField = 'name' | 'status' | 'endDate' | '';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [NgClass, ReactiveFormsModule],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css']
})
export class ProjectsComponent implements OnInit {
  projects: Project[] = [];
  tasks: Task[] = [];
  searchQuery = '';
  sortField: SortField = '';
  showModal = false;
  editMode = false;
  editingId: string | null = null;
  toast: { message: string; type: 'success' | 'error' } | null = null;
  projectForm!: FormGroup;

  constructor(
    private readonly projectService: ProjectService,
    private readonly taskService: TaskService,
    private readonly fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.projectService.projects$.subscribe(projects => (this.projects = projects));
    this.taskService.tasks$.subscribe(tasks => (this.tasks = tasks));
    this.projectService.loadProjects(); // ← add this
    this.taskService.loadTasks();       // ← add this
    this.projectForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      status: ['In Progress'],
      developer: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required]
    });
  }

  openModal(project?: Project): void {
    this.showModal = true;
    this.editMode = !!project;
    this.editingId = project?.id ?? null;
    if (project) {
      this.projectForm.patchValue({
        name: project.name,
        status: project.status,
        developer: project.developer ?? project.owner,
        startDate: project.startDate ?? '',
        endDate: project.endDate ?? ''
      });
    } else {
      this.projectForm.reset({ status: 'In Progress' });
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.editMode = false;
    this.editingId = null;
    this.projectForm.reset({ status: 'In Progress' });
  }

  submitProject(): void {
    if (this.projectForm.invalid) { this.projectForm.markAllAsTouched(); return; }
    const v = this.projectForm.value;
    const payload: Omit<Project, 'id'> = {
      name: v.name, status: v.status, owner: v.developer,
      developer: v.developer, startDate: v.startDate, endDate: v.endDate
    };

    if (this.editMode && this.editingId !== null) {
      this.projectService.updateProject(this.editingId, payload).subscribe({
        next: () => { this.closeModal(); this.showToast('Project updated!'); },
        error: () => this.showToast('Update failed', 'error')
      });
    } else {
      this.projectService.addProject(payload).subscribe({
        next: () => { this.closeModal(); this.showToast('Project added!'); },
        error: () => this.showToast('Could not save project', 'error')
      });
    }
  }

  deleteProject(id: string): void {
    this.projectService.deleteProject(id).subscribe({
      next: () => this.showToast('Project deleted'),
      error: () => this.showToast('Delete failed', 'error')
    });
  }

  setSortField(e: Event): void {
    this.sortField = (e.target as HTMLSelectElement).value as SortField;
  }

  setSearchQuery(e: Event): void {
    this.searchQuery = (e.target as HTMLInputElement).value;
  }

  get filteredProjects(): Project[] {
    let result = [...this.projects];

    const q = this.searchQuery.trim().toLowerCase();
    if (q) result = result.filter(p =>
      p.name.toLowerCase().includes(q) || (p.developer ?? p.owner).toLowerCase().includes(q)
    );

    if (this.sortField === 'name') result.sort((a, b) => a.name.localeCompare(b.name));
    else if (this.sortField === 'status') result.sort((a, b) => a.status.localeCompare(b.status));
    else if (this.sortField === 'endDate')
      result.sort((a, b) => (a.endDate ?? '').localeCompare(b.endDate ?? ''));

    return result;
  }

  statusClass(status: string): Record<string, boolean> {
    return {
      'badge-blue': status === 'In Progress',
      'badge-green': status === 'Completed',
      'badge-red': status === 'Blocked',
      'badge-gray': status === 'Not Started' || status === 'On Hold'
    };
  }

  isOverdue(endDate?: string): boolean {
    if (!endDate) return false;
    return new Date(endDate) < new Date(new Date().toDateString());
  }

  projectTaskCount(projectId?: string): number {
    if (!projectId) return 0;
    return this.tasks.filter(t => String(t.projectId) === String(projectId)).length;
  }

  projectProgress(projectId?: string): number {
    if (!projectId) return 0;
    const linked = this.tasks.filter(t => String(t.projectId) === String(projectId));
    if (!linked.length) return 0;
    return Math.round((linked.filter(t => t.completed).length / linked.length) * 100);
  }

  exportCSV(): void {
    const headers = ['Name', 'Status', 'Developer', 'Start Date', 'End Date'];
    const rows = this.projects.map(p => [
      `"${p.name}"`, p.status, p.developer ?? p.owner, p.startDate ?? '', p.endDate ?? ''
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = 'projects.csv';
    a.click();
  }

  private showToast(message: string, type: 'success' | 'error' = 'success'): void {
    this.toast = { message, type };
    setTimeout(() => (this.toast = null), 3000);
  }
}