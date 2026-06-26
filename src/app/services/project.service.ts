import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, tap, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface Project {
  id?: number;
  name: string;
  status: string;
  owner: string;
  developer?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable({ providedIn: 'root' })
export class ProjectService {

  private readonly apiUrl = 'http://localhost:3000/projects';
  private readonly projectsSubject = new BehaviorSubject<Project[]>([]);
  projects$ = this.projectsSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  loadProjects() {
    const tempUrl = this.apiUrl;
    this.http.get<Project[]>(this.apiUrl)
      .pipe(catchError(err => this.handleError(err)))
      .subscribe((data) => {
        this.projectsSubject.next(data);
        console.log('Projects loaded:', data);
      });

  }

  addProject(project: Omit<Project, 'id'>) {
    return this.http.post<Project>(this.apiUrl, project).pipe(
      tap(created => this.projectsSubject.next([...this.projectsSubject.value, created])),
      catchError(err => this.handleError(err))
    );
  }

  getProjectById(id: number) {
    return this.projectsSubject.value.find(p => p.id === id);
  }

  private handleError(error: any) {
    console.error('Project API error', error);
    return throwError(() => new Error('Failed to load projects'));
  }
}