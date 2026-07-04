import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AppUser {
  name: string;
  role: 'Manager' | 'Member';
}

export const TEAM_MEMBERS: AppUser[] = [
  { name: 'Alice', role: 'Manager' },
  { name: 'Bob',   role: 'Member'  },
  { name: 'Carol', role: 'Member'  },
  { name: 'David', role: 'Member'  },
  { name: 'Eve',   role: 'Member'  },
];

@Injectable({ providedIn: 'root' })
export class UserService {
  private userSubject = new BehaviorSubject<AppUser>(TEAM_MEMBERS[0]);
  readonly currentUser$ = this.userSubject.asObservable();

  get currentUser(): AppUser { return this.userSubject.value; }
  get isManager(): boolean   { return this.userSubject.value.role === 'Manager'; }

  setUser(name: string): void {
    const user = TEAM_MEMBERS.find(u => u.name === name);
    if (user) this.userSubject.next(user);
  }
}
