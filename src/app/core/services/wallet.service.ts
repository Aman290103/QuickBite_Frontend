import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WalletBalance, WalletStatement } from '../models';

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private apiUrl = 'http://localhost:5000/api/v1/wallet';

  constructor(private http: HttpClient) {}

  getBalance(): Observable<WalletBalance> {
    return this.http.get<WalletBalance>(`${this.apiUrl}/balance`);
  }

  getStatements(): Observable<WalletStatement[]> {
    return this.http.get<WalletStatement[]>(`${this.apiUrl}/statements`);
  }

  addMoney(amount: number): Observable<any> {
    // Backend requires RazorpayPaymentId. In a real app, this comes from the Razorpay checkout.
    // For demo/development, we pass a dummy ID.
    const payload = { 
      amount, 
      razorpayPaymentId: 'pay_dummy_' + Math.random().toString(36).substring(7) 
    };
    return this.http.post(`${this.apiUrl}/add`, payload);
  }
}
