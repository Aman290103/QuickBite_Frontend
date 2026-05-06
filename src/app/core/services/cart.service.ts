import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, of, catchError } from 'rxjs';
import { Cart, CartItem } from '../models';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = 'http://localhost:5000/api/v1/cart';
  
  cart = signal<Cart>({ cartId: '', restaurantId: '', items: [], subTotal: 0, discountAmount: 0, taxAmount: 0, grandTotal: 0 });

  constructor(private http: HttpClient) {
    this.loadCart().subscribe();
  }

  private isMockId(id: string): boolean {
    return id?.startsWith('m') || id?.startsWith('550e8400');
  }

  loadCart(): Observable<Cart> {
    return this.http.get<Cart>(this.apiUrl).pipe(
      tap((data) => this.cart.set(data)),
      catchError(err => {
        return of(this.cart());
      })
    );
  }

  addToCart(menuItemId: string, quantity: number, restaurantId: string, restaurantName: string, name: string, price: number): Observable<any> {
    // Backend expects POST /api/v1/cart/items
    return this.http.post(`${this.apiUrl}/items`, { 
      menuItemId, 
      quantity, 
      restaurantId,
      restaurantName,
      name,
      price 
    }).pipe(
      tap(() => this.loadCart().subscribe()),
      catchError(err => {
        this.handleLocalAddToCart(menuItemId, quantity, restaurantId, name, price);
        return of({ message: 'Added to local cart (Offline Mode)' });
      })
    );
  }

  updateQuantity(itemId: string, quantity: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/items/${itemId}/qty`, { quantity }).pipe(
      tap((updatedCart: any) => this.cart.set(updatedCart))
    );
  }

  private handleLocalAddToCart(menuItemId: string, quantity: number, restaurantId: string, name: string, price: number) {
    const current = this.cart();
    let items = [...current.items];
    
    const existing = items.find(i => i.menuItemId === menuItemId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({
        itemId: Math.random().toString(36).substring(7),
        menuItemId,
        name: name,
        price: price,
        quantity,
        total: price * quantity
      });
    }

    const subTotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const taxAmount = Math.round(subTotal * 0.18 * 100) / 100;
    const grandTotal = subTotal + taxAmount;
    this.cart.set({ ...current, items, subTotal, taxAmount, grandTotal });
  }

  removeFromCart(itemId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/items/${itemId}`).pipe(
      tap((updatedCart: any) => this.cart.set(updatedCart))
    );
  }

  clearCart(): Observable<any> {
    this.cart.set({ cartId: '', restaurantId: '', items: [], subTotal: 0, discountAmount: 0, taxAmount: 0, grandTotal: 0 });
    return this.http.delete(this.apiUrl).pipe(
      tap(() => this.loadCart().subscribe()),
      catchError(() => of({}))
    );
  }
}
