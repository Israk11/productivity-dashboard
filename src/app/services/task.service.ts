import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface Task {
  id: number;
  title: string;
  completed: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  private apiUrl = 'http://localhost:3000/tasks';

  private tasksSubject = new BehaviorSubject<Task[]>([]);
  tasks$ = this.tasksSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadTasks() {
    this.http.get<Task[]>(this.apiUrl)
      .pipe(
        catchError(err => this.handleError(err))
      )
      .subscribe(data => this.tasksSubject.next(data));
  }

  toggleTask(id: number) {
    const tasks = this.tasksSubject.value.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );

    this.tasksSubject.next(tasks);
  }

  private handleError(error: any) {
    console.error('Task API error', error);
    return throwError(() => new Error('Failed to load tasks'));
  }
}