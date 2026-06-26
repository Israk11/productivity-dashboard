import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, tap, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface Task {
  id?: number;
  title: string;
  completed: boolean;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  assignedTo?: string;
  startDate?: string;
  dueDate?: string;
}

@Injectable({ providedIn: 'root' })
export class TaskService {

  private readonly apiUrl = 'http://localhost:3000/tasks';
  private readonly tasksSubject = new BehaviorSubject<Task[]>([]);
  tasks$ = this.tasksSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  loadTasks() {
    const tempUrl = this.apiUrl;
    this.http.get<Task[]>(this.apiUrl)
      .pipe(catchError(err => this.handleError(err)))
      .subscribe((data) => {
        this.tasksSubject.next(data);
        console.log('Tasks loaded:', data);
      });
  }

  addTask(task: Omit<Task, 'id'>) {
    return this.http.post<Task>(this.apiUrl, task).pipe(
      tap(created => this.tasksSubject.next([...this.tasksSubject.value, created])),
      catchError(err => this.handleError(err))
    );
  }

  toggleTask(id: number) {
    const tasks = this.tasksSubject.value.map(t =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    this.tasksSubject.next(tasks);
  }

  private handleError(error: any) {
    console.error('Task API error', error);
    return throwError(() => new Error('Failed to load tasks'));
  }
}