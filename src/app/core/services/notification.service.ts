import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { AppNotification } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/notifications`;

  // For Owners
  postNotification(notification: Partial<AppNotification>): Observable<AppNotification> {
    const newNote: AppNotification = {
      id: Math.random().toString(36).substring(7),
      restaurantId: notification.restaurantId || '',
      restaurantName: notification.restaurantName || '',
      title: notification.title || '',
      message: notification.message || '',
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    return this.http.post<AppNotification>(this.apiUrl, notification).pipe(
      catchError(() => {
        console.warn('Backend not reached, using local storage fallback');
        this.saveToLocal(newNote);
        return of(newNote);
      })
    );
  }

  getRestaurantNotifications(restaurantId: string): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(`${this.apiUrl}/restaurant/${restaurantId}`).pipe(
      catchError(() => {
        const local = this.getFromLocal().filter(n => n.restaurantId === restaurantId);
        return of(local);
      })
    );
  }

  // For Admins
  getPendingNotifications(): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(`${this.apiUrl}/pending`).pipe(
      catchError(() => {
        const local = this.getFromLocal().filter(n => n.status === 'PENDING');
        return of(local);
      })
    );
  }

  approveNotification(id: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/approve`, {}).pipe(
      catchError(() => {
        this.updateLocalStatus(id, 'APPROVED');
        return of(void 0);
      })
    );
  }

  rejectNotification(id: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/reject`, {}).pipe(
      catchError(() => {
        this.updateLocalStatus(id, 'REJECTED');
        return of(void 0);
      })
    );
  }

  // For Customers
  getApprovedNotifications(): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(`${this.apiUrl}/active`).pipe(
      catchError(() => {
        const local = this.getFromLocal().filter(n => n.status === 'APPROVED');
        return of(local);
      })
    );
  }

  // Helper methods for Local Simulation
  private saveToLocal(note: AppNotification) {
    const notes = this.getFromLocal();
    notes.unshift(note);
    localStorage.setItem('qb_notifications', JSON.stringify(notes));
  }

  private getFromLocal(): AppNotification[] {
    const data = localStorage.getItem('qb_notifications');
    return data ? JSON.parse(data) : [];
  }

  private updateLocalStatus(id: string, status: 'APPROVED' | 'REJECTED') {
    const notes = this.getFromLocal();
    const note = notes.find(n => n.id === id);
    if (note) {
      note.status = status;
      localStorage.setItem('qb_notifications', JSON.stringify(notes));
    }
  }
}
