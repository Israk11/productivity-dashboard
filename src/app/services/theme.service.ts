import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _dark = false;

  toggle(): void {
    this._dark = !this._dark;
    document.body.classList.toggle('dark', this._dark);
  }

  get isDark(): boolean {
    return this._dark;
  }
}
