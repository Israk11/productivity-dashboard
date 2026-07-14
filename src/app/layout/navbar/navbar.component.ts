import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ThemeService } from '../../services/theme.service';
import { UserService, TEAM_MEMBERS } from '../../services/user.service';
import { TaskService, Task } from '../../services/task.service';
import { ProjectService, Project } from '../../services/project.service';

interface SearchResult {
  type: 'task' | 'project';
  label: string;
  route: string[];
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  readonly theme = inject(ThemeService);
  readonly userService = inject(UserService);
  private readonly taskService = inject(TaskService);
  private readonly projectService = inject(ProjectService);
  private readonly router = inject(Router);
  readonly teamMembers = TEAM_MEMBERS;

  alertCount = 0;
  searchQuery = '';
  searchResults: SearchResult[] = [];
  showSearch = false;

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.taskService.tasks$.pipe(takeUntil(this.destroy$)).subscribe(tasks => {
      const today = new Date(new Date().toDateString());
      this.alertCount = tasks.filter(
        t => t.status !== 'Done' && t.dueDate && new Date(t.dueDate) < today
      ).length;
    });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  onUserChange(e: Event): void {
    this.userService.setUser((e.target as HTMLSelectElement).value);
  }

  onSearchInput(e: Event): void {
    this.searchQuery = (e.target as HTMLInputElement).value;
    if (this.searchQuery.length < 2) { this.searchResults = []; return; }
    const q = this.searchQuery.toLowerCase();
    const taskResults: SearchResult[] = this.taskService.tasks
      .filter(t => t.title.toLowerCase().includes(q))
      .slice(0, 5)
      .map(t => ({ type: 'task', label: t.title, route: ['/tasks'] }));
    const projectResults: SearchResult[] = this.projectService.projects
      .filter(p => p.name.toLowerCase().includes(q))
      .slice(0, 3)
      .map(p => ({ type: 'project', label: p.name, route: ['/projects', p.id!] }));
    this.searchResults = [...taskResults, ...projectResults];
  }

  navigateToResult(result: SearchResult): void {
    this.router.navigate(result.route);
    this.searchQuery = '';
    this.searchResults = [];
    this.showSearch = false;
  }

  onSearchBlur(): void {
    setTimeout(() => { this.showSearch = false; this.searchQuery = ''; this.searchResults = []; }, 200);
  }
}