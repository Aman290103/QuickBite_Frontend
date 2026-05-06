import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';

declare var Razorpay: any;

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private http = inject(HttpClient);
  private apiUrl = 'https://gateway-service-a8bo.onrender.com/api/v1/payments';
  private razorpayKey = 'rzp_test_SfiZQYAPtU4oMA';

  initiateRazorpayPayment(amount: number, orderId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/create-order?amount=${amount}`, {}).pipe(
      switchMap(res => {
        return new Observable(observer => {
          const options = {
            key: this.razorpayKey,
            amount: amount * 100,
            currency: 'INR',
            name: 'QuickBite',
            description: 'Food Order Payment',
            order_id: res.orderId,
            handler: (response: any) => {
              // On success, verify payment
              this.verifyPayment({
                orderId: orderId,
                amount: amount,
                mode: 'CARD', // or UPI
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature
              }).subscribe({
                next: (v) => {
                  observer.next(v);
                  observer.complete();
                },
                error: (e) => observer.error(e)
              });
            },
            prefill: {
              name: 'QuickBite User',
              email: 'user@example.com'
            },
            theme: {
              color: '#ff5231'
            },
            modal: {
              ondismiss: () => {
                observer.error({ message: 'Payment cancelled by user' });
              }
            }
          };

          const rzp = new Razorpay(options);
          rzp.open();
        });
      })
    );
  }

  verifyPayment(data: any): Observable<any> {
    console.log('Verifying payment with data:', data);
    return this.http.post(`${this.apiUrl}/process`, data);
  }

  simulateUpiPayment(orderId: string, amount: number, upiId: string): Observable<any> {
    // Simulate a delay for "payment verification"
    return new Observable(observer => {
      setTimeout(() => {
        this.verifyPayment({
          orderId: orderId,
          amount: amount,
          mode: 'UPI',
          razorpayPaymentId: 'pay_mock_' + Math.random().toString(36).substring(7),
          razorpayOrderId: 'order_mock_' + Math.random().toString(36).substring(7),
          razorpaySignature: 'sig_mock_verified'
        }).subscribe({
          next: (v) => {
            observer.next(v);
            observer.complete();
          },
          error: (e) => observer.error(e)
        });
      }, 2000); // 2 second mock verification
    });
  }

  loadRazorpayScript(): Promise<void> {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      document.body.appendChild(script);
    });
  }
}
