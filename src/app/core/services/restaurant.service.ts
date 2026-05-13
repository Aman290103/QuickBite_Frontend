import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Restaurant } from '../models';

@Injectable({
  providedIn: 'root'
})
export class RestaurantService {
  private apiUrl = 'http://localhost:8080/api/v1/restaurants';

  constructor(private http: HttpClient) {}

  getNearbyRestaurants(lat: number, lon: number, radius: number = 15): Observable<Restaurant[]> {
    return this.http.get<Restaurant[]>(`${this.apiUrl}/nearby?lat=${lat}&lon=${lon}&radius=${radius}`);
  }

  getRestaurantById(id: string): Observable<Restaurant> {
    return this.http.get<Restaurant>(`${this.apiUrl}/${id}`);
  }

  searchRestaurants(query: string): Observable<Restaurant[]> {
    return this.http.get<Restaurant[]>(`${this.apiUrl}/search?name=${query}`);
  }

  getReviews(id: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id}/reviews`);
  }

  submitReview(restaurantId: string, review: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${restaurantId}/reviews`, review);
  }

  getAverageRating(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/reviews/avg`);
  }

  getPendingApprovals(): Observable<Restaurant[]> {
    return this.http.get<Restaurant[]>(`${this.apiUrl}/pending`);
  }

  approveRestaurant(id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/approve`, {});
  }

  deleteRestaurant(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getMyRestaurants(): Observable<Restaurant[]> {
    return this.http.get<Restaurant[]>(`${this.apiUrl}/my-restaurants`);
  }

  registerRestaurant(restaurantData: any): Observable<Restaurant> {
    return this.http.post<Restaurant>(this.apiUrl, restaurantData);
  }

  toggleRestaurantStatus(id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/toggle`, {});
  }

  getAllRestaurants(): Observable<Restaurant[]> {
    return this.http.get<Restaurant[]>(`${this.apiUrl}/admin-fetch-all`);
  }
}
