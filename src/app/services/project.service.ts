import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface Project {
  id: number;
  name: string;
  status: string;
  owner: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  private apiUrl = 'http://localhost:3000/projects';

  private projectsSubject = new BehaviorSubject<Project[]>([]);
  projects$ = this.projectsSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadProjects() {
    this.http.get<Project[]>(this.apiUrl)
      .pipe(
        catchError(err => this.handleError(err))
      )
      .subscribe(data => {
        this.projectsSubject.next(data);
      });
  }

  getProjectById(id: number) {
    return this.projectsSubject.value.find(p => p.id === id);
  }

  private handleError(error: any) {
    console.error('Project API error', error);
    return throwError(() => new Error('Failed to load projects'));
  }
}