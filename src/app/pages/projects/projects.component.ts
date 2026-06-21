import { Component, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Project, ProjectService } from '../../services/project.service';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [NgClass, ReactiveFormsModule],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.css'
})
export class ProjectsComponent implements OnInit {

  projects: Project[] = [];
  showForm = false;
  projectForm: FormGroup;
  submitting = false;

  readonly statusOptions = ['In Progress', 'In Review', 'Completed', 'On Hold', 'Cancelled'];

  constructor(
    private readonly projectService: ProjectService,
    private readonly fb: FormBuilder
  ) {
    this.projectForm = this.fb.group({
      name:      ['', [Validators.required, Validators.minLength(3)]],
      status:    ['In Progress', Validators.required],
      developer: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate:   ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.projectService.projects$.subscribe(p => this.projects = p);
    this.projectService.loadProjects();
  }

  submitProject() {
    if (this.projectForm.invalid) { this.projectForm.markAllAsTouched(); return; }
    this.submitting = true;
    const val = this.projectForm.value;
    this.projectService.addProject({
      name: val.name,
      status: val.status,
      owner: val.developer,
      developer: val.developer,
      startDate: val.startDate,
      endDate: val.endDate
    }).subscribe({
      next: () => { this.projectForm.reset({ status: 'In Progress' }); this.showForm = false; this.submitting = false; },
      error: () => this.submitting = false
    });
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'Completed':  'status-completed',
      'In Progress':'status-progress',
      'In Review':  'status-review',
      'On Hold':    'status-hold',
      'Cancelled':  'status-cancelled',
    };
    return map[status] ?? 'status-default';
  }

  isInvalid(field: string) {
    const c = this.projectForm.get(field);
    return c?.invalid && c?.touched;
  }
}