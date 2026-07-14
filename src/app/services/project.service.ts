import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';

export interface Project {
  id?: string;
  name: string;
  status: string;
  owner: string;
  developer?: string;
  lead?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly apiUrl = 'http://localhost:3000/projects';
  private projectsSubject = new BehaviorSubject<Project[]>([]);
  readonly projects$ = this.projectsSubject.asObservable();

  constructor(private readonly http: HttpClient) {
    this.loadProjects();
  }

  loadProjects(): void {
    this.http.get<Project[]>(this.apiUrl).subscribe(p => this.projectsSubject.next(p));
  }

  addProject(project: Omit<Project, 'id'>) {
    return this.http.post<Project>(this.apiUrl, project).pipe(
      tap(p => this.projectsSubject.next([...this.projectsSubject.value, p]))
    );
  }

  updateProject(id: string, changes: Partial<Project>) {
    return this.http.patch<Project>(`${this.apiUrl}/${id}`, changes).pipe(
      tap(updated =>
        this.projectsSubject.next(
          this.projectsSubject.value.map(p => (p.id === id ? { ...p, ...updated } : p))
        )
      )
    );
  }

  deleteProject(id: string) {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.projectsSubject.next(this.projectsSubject.value.filter(p => p.id !== id)))
    );
  }

  getProjectById(id: string): Project | undefined {
    return this.projectsSubject.value.find(p => p.id === id);
  }

  get projects(): Project[] { return this.projectsSubject.value; }
}