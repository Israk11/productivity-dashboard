import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Task, TaskService } from '../../services/task.service';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.css'
})
export class TasksComponent implements OnInit {

  tasks: Task[] = [];
  filter: 'all' | 'pending' | 'completed' = 'all';
  showForm = false;
  submitting = false;
  taskForm: FormGroup;

  readonly priorityOptions = ['Low', 'Medium', 'High', 'Critical'];

  constructor(
    private readonly taskService: TaskService,
    private readonly fb: FormBuilder
  ) {
    this.taskForm = this.fb.group({
      title:      ['', [Validators.required, Validators.minLength(3)]],
      priority:   ['Medium', Validators.required],
      assignedTo: ['', Validators.required],
      startDate:  ['', Validators.required],
      dueDate:    ['', Validators.required]
    });
  }

  ngOnInit() {
    this.taskService.tasks$.subscribe(t => this.tasks = t);
    this.taskService.loadTasks();
  }

  get filteredTasks(): Task[] {
    if (this.filter === 'pending')   return this.tasks.filter(t => !t.completed);
    if (this.filter === 'completed') return this.tasks.filter(t => t.completed);
    return this.tasks;
  }

  get pendingCount()   { return this.tasks.filter(t => !t.completed).length; }
  get completedCount() { return this.tasks.filter(t => t.completed).length; }

  submitTask() {
    if (this.taskForm.invalid) { this.taskForm.markAllAsTouched(); return; }
    this.submitting = true;
    const val = this.taskForm.value;
    this.taskService.addTask({
      title:      val.title,
      completed:  false,
      priority:   val.priority,
      assignedTo: val.assignedTo,
      startDate:  val.startDate,
      dueDate:    val.dueDate
    }).subscribe({
      next: () => { this.taskForm.reset({ priority: 'Medium' }); this.showForm = false; this.submitting = false; },
      error: () => this.submitting = false
    });
  }

  toggleTask(id: number) { this.taskService.toggleTask(id); }

  isInvalid(field: string) {
    const c = this.taskForm.get(field);
    return c?.invalid && c?.touched;
  }

  priorityClass(priority?: string) {
    const map: Record<string, string> = {
      'Low': 'pri-low', 'Medium': 'pri-medium', 'High': 'pri-high', 'Critical': 'pri-critical'
    };
    return priority ? (map[priority] ?? '') : '';
  }
}