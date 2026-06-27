import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, forkJoin, tap } from 'rxjs';

export interface Task {
  id?: string;
  title: string;
  completed: boolean;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  assignedTo?: string;
  startDate?: string;
  dueDate?: string;
  projectId?: string;
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly apiUrl = 'http://localhost:3000/tasks';
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  readonly tasks$ = this.tasksSubject.asObservable();

  constructor(private readonly http: HttpClient) {
    this.loadTasks();
  }

  loadTasks(): void {
    this.http.get<Task[]>(this.apiUrl).subscribe(tasks => this.tasksSubject.next(tasks));
  }

  addTask(task: Omit<Task, 'id'>) {
    return this.http.post<Task>(this.apiUrl, task).pipe(
      tap(newTask => this.tasksSubject.next([...this.tasksSubject.value, newTask]))
    );
  }

  updateTask(id: string, changes: Partial<Task>) {
    return this.http.patch<Task>(`${this.apiUrl}/${id}`, changes).pipe(
      tap(updated =>
        this.tasksSubject.next(
          this.tasksSubject.value.map(t => (t.id === id ? { ...t, ...updated } : t))
        )
      )
    );
  }

  // BUG FIX: was only updating in-memory — now persists to server
  toggleTask(id: string): void {
    const task = this.tasksSubject.value.find(t => t.id === id);
    if (task) {
      this.updateTask(id, { completed: !task.completed }).subscribe();
    }
  }

  deleteTask(id: string) {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.tasksSubject.next(this.tasksSubject.value.filter(t => t.id !== id)))
    );
  }

  markAllComplete(): void {
    const tasks = this.tasksSubject.value;
    if (!tasks.length) return;
    const targetState = !tasks.every(t => t.completed);
    forkJoin(tasks.map(t =>
      this.http.patch<Task>(`${this.apiUrl}/${t.id}`, { completed: targetState })
    )).subscribe(updated => this.tasksSubject.next(updated));
  }
}