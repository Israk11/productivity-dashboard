import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {

  handleError(error: any): string {
    console.error('Global Error:', error);

    if (error.status === 0) {
      return 'Network error. Check backend connection.';
    }

    if (error.status >= 500) {
      return 'Server is down. Try again later.';
    }

    if (error.status === 404) {
      return 'Requested resource not found.';
    }

    return 'Unexpected error occurred.';
  }
}