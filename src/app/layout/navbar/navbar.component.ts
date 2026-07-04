import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { UserService, TEAM_MEMBERS } from '../../services/user.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  readonly theme = inject(ThemeService);
  readonly userService = inject(UserService);
  readonly teamMembers = TEAM_MEMBERS;

  onUserChange(e: Event): void {
    this.userService.setUser((e.target as HTMLSelectElement).value);
  }
}