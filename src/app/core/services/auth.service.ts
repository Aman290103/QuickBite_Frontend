import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, switchMap } from 'rxjs';
import { AuthResponse, User } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/v1/auth';
  
  currentUser = signal<User | null>(this.getUserFromStorage());
  isAuthenticated = signal<boolean>(!!this.getToken());

  constructor(private http: HttpClient, private router: Router) {
    if (this.isAuthenticated() && !this.currentUser()?.id) {
      this.getProfile().subscribe();
    }
  }

  login(credentials: any): Observable<User> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        this.setToken(response.accessToken);
        this.setRefreshToken(response.refreshToken);
      }),
      switchMap(() => this.getProfile())
    );
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profile`).pipe(
      tap(user => {
        this.currentUser.set(user);
        this.setUserToStorage(user);
        this.isAuthenticated.set(true);
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }

  private setToken(token: string) {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  private setRefreshToken(token: string) {
    localStorage.setItem('refreshToken', token);
  }

  private setUserToStorage(user: User) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  private getUserFromStorage(): User | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  hasRole(role: string): boolean {
    return this.currentUser()?.role === role;
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }
}
