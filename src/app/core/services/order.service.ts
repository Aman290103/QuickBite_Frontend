import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order, OrderItem } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) {}

  placeOrder(orderData: any): Observable<Order> {
    return this.http.post<Order>(this.apiUrl, orderData);
  }

  getCustomerHistory(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/customer`);
  }

  getOrderById(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${id}`);
  }

  getAllOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/all`);
  }

  getAvailableOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/available`);
  }

  getAgentOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/agent`);
  }

  assignAgent(orderId: string, agentId: string): Observable<Order> {
    return this.http.put<Order>(`${this.apiUrl}/${orderId}/assign-agent?agentId=${agentId}`, {});
  }

  updateOrderStatus(orderId: string, newStatus: string): Observable<Order> {
    return this.http.put<Order>(`${this.apiUrl}/${orderId}/status`, { newStatus });
  }

  getRestaurantOrders(restaurantId: string): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/restaurant/${restaurantId}`);
  }

  getRestaurantStats(restaurantId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/restaurant/${restaurantId}/stats`);
  }
}
