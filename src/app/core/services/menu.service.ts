import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { MenuCategory, MenuItem } from '../models';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private apiUrl = 'http://localhost:5000/api/v1/menu';

  constructor(private http: HttpClient) {}

  getMenu(restaurantId: string): Observable<MenuCategory[]> {
    return this.http.get<any>(`${this.apiUrl}/${restaurantId}`).pipe(
      map(res => res.categories || [])
    );
  }

  searchMenu(restaurantId: string, query: string): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(`${this.apiUrl}/${restaurantId}/search?name=${query}`);
  }

  getVegItems(restaurantId: string): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(`${this.apiUrl}/${restaurantId}/veg`);
  }

  seedMenu(restaurantId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/seed?restaurantId=${restaurantId}`, {});
  }

  addCategory(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/categories`, data);
  }

  updateCategory(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/categories/${id}`, data);
  }

  deleteCategory(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/categories/${id}`);
  }

  addMenuItem(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/items`, data);
  }

  updateMenuItem(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/items/${id}`, data);
  }

  deleteMenuItem(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/items/${id}`);
  }

  toggleItemAvailability(id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/items/${id}/toggle`, {});
  }
}
