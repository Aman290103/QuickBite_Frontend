import { inject, Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { PaymentService } from '../../core/services/payment.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="cart-page animate-slide-up">
      <div class="cart-grid" *ngIf="cart().items.length; else emptyCart">
        <!-- Main Cart Section -->
        <div class="cart-main">
          <!-- Items Card -->
          <div class="card cart-items-card">
            <div class="card-header">
              <h2>My Cart</h2>
              <span class="item-count">{{ cart().items.length }} items</span>
            </div>
            
            <div class="items-list">
              @for (item of cart().items; track item.itemId) {
                <div class="cart-item">
                  <div class="item-visual">
                    <img [src]="'https://images.unsplash.com/photo-1567620905732-2d1ec7bb7445?w=100'" alt="item">
                  </div>
                  <div class="item-details">
                    <h3>{{ item.name }}</h3>
                    <p class="customizations" *ngIf="item.customization">{{ item.customization }}</p>
                  </div>
                  <div class="quantity-picker">
                    <button (click)="updateQty(item.itemId, item.quantity - 1)">-</button>
                    <span>{{ item.quantity }}</span>
                    <button (click)="updateQty(item.itemId, item.quantity + 1)">+</button>
                  </div>
                  <div class="item-price">
                    ₹{{ item.price * item.quantity }}
                  </div>
                  <button class="remove-btn" (click)="removeItem(item.itemId)">×</button>
                </div>
              }
            </div>
          </div>

          <!-- Address Card -->
          <div class="card section-card address-section">
            <div class="section-header">
               <span class="icon">📍</span>
               <h3>Delivery Address</h3>
            </div>
            <div class="address-input-wrapper">
               <textarea 
                  [(ngModel)]="deliveryAddress" 
                  placeholder="Enter your complete address (House No, Building, Area, Landmark...)"
                  rows="3"
                  class="address-textarea"
               ></textarea>
               <div class="address-suggestions" *ngIf="!deliveryAddress">
                  <button class="suggestion-tag" (click)="deliveryAddress = 'Home: 123, Luxury Apartments, New Delhi'">🏠 Home</button>
                  <button class="suggestion-tag" (click)="deliveryAddress = 'Office: 45, Tech Park, Gurugram'">🏢 Office</button>
               </div>
            </div>
          </div>

          <!-- Payment Method Card -->
          <div class="card section-card payment-section">
            <div class="section-header">
               <span class="icon">💳</span>
               <h3>Choose Payment Method</h3>
            </div>
            <div class="payment-options">
               <div class="payment-option" [class.active]="paymentMode === 'UPI'" (click)="paymentMode = 'UPI'">
                  <div class="option-content">
                     <span class="icon">📱</span>
                     <div class="option-text">
                        <strong>UPI / QR Scanner</strong>
                        <p>Google Pay, PhonePe, BHIM & more</p>
                     </div>
                  </div>
                  <div class="radio-circle"></div>
               </div>

               <div class="payment-option" [class.active]="paymentMode === 'ONLINE'" (click)="paymentMode = 'ONLINE'">
                  <div class="option-content">
                     <span class="icon">💳</span>
                     <div class="option-text">
                        <strong>Credit / Debit Card</strong>
                        <p>Pay via secure Razorpay gateway</p>
                     </div>
                  </div>
                  <div class="radio-circle"></div>
               </div>

               <div class="payment-option" [class.active]="paymentMode === 'WALLET'" (click)="paymentMode = 'WALLET'">
                  <div class="option-content">
                     <span class="icon">👛</span>
                     <div class="option-text">
                        <strong>QuickBite Wallet</strong>
                        <p>Pay instantly with your wallet balance</p>
                     </div>
                  </div>
                  <div class="radio-circle"></div>
               </div>

               <div class="payment-option" [class.active]="paymentMode === 'COD'" (click)="paymentMode = 'COD'">
                  <div class="option-content">
                     <span class="icon">💵</span>
                     <div class="option-text">
                        <strong>Cash on Delivery</strong>
                        <p>Pay when your food arrives</p>
                     </div>
                  </div>
                  <div class="radio-circle"></div>
               </div>
            </div>
          </div>
        </div>

        <!-- Checkout Sidebar -->
        <aside class="cart-summary">
          <div class="card summary-card sticky-card">
            <h3>Bill Details</h3>
            
            <div class="bill-row">
              <span>Item Total</span>
              <span>₹{{ cart().subTotal }}</span>
            </div>
            <div class="bill-row">
              <span>Delivery Fee</span>
              <span class="free">FREE</span>
            </div>
            <div class="bill-row">
              <span>GST and Restaurant Charges</span>
              <span>₹{{ cart().taxAmount }}</span>
            </div>
            
            <div class="bill-row total">
              <span>To Pay</span>
              <span>₹{{ cart().grandTotal }}</span>
            </div>

            <div class="payment-note">
              <span class="icon">🛡️</span>
              <p>100% Safe and Secure payments</p>
            </div>

            <button class="btn-primary full-width checkout-btn" 
                    (click)="onCheckout()" 
                    [disabled]="loading() || !deliveryAddress || !paymentMode">
              {{ loading() ? 'Processing...' : (paymentMode === 'ONLINE' ? 'Pay & Place Order' : 'Place Order') }}
            </button>
            <p class="error-text" *ngIf="(!deliveryAddress || !paymentMode) && !loading()">
               {{ !deliveryAddress ? 'Please enter delivery address' : 'Please select payment method' }}
            </p>
          </div>
        </aside>
      </div>

      <!-- UPI Payment Modal -->
      <div class="modal-overlay" *ngIf="showUpiModal()" (click)="closeUpiModal()">
        <div class="modal-content upi-modal animate-scale" (click)="$event.stopPropagation()">
           <div class="modal-header">
              <h3>UPI Payment</h3>
              <button class="close-icon" (click)="closeUpiModal()">×</button>
           </div>
           
           <div class="qr-container">
              <div class="qr-wrapper">
                 <img src="assets/upi_qr.png" alt="Scan QR">
                 <div class="scan-line"></div>
              </div>
              <p class="qr-text">Scan the QR code to pay <strong>₹{{ cart().grandTotal }}</strong></p>
           </div>

           <div class="divider"><span>OR</span></div>

           <div class="upi-input-section">
              <label>Enter UPI ID</label>
              <div class="input-with-button">
                 <input type="text" [(ngModel)]="upiId" placeholder="e.g. user@okaxis" [disabled]="upiProcessing()">
                 <button class="btn-primary" (click)="onUpiPay()" [disabled]="!upiId || upiProcessing()">
                    {{ upiProcessing() ? 'Verifying...' : 'Pay Now' }}
                 </button>
              </div>
           </div>

           <div class="secure-footer">
              <span class="icon">🔒</span>
              <span>Secure UPI Payment Powered by Razorpay</span>
           </div>
        </div>
      </div>

      <ng-template #emptyCart>
        <div class="empty-state-card card">
          <img src="https://cdni.iconscout.com/illustration/premium/thumb/empty-cart-2130356-1800917.png" alt="Empty">
          <h2>Your cart is empty</h2>
          <p>You can go to home page to view more restaurants</p>
          <button class="btn-primary" routerLink="/customer">See Restaurants Near You</button>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .cart-page { padding-top: 1rem; }
    .cart-grid { display: grid; grid-template-columns: 1fr 380px; gap: 2rem; align-items: flex-start; }
    
    .section-card { margin-top: 2rem; padding: 2rem; border-radius: 20px; transition: var(--transition); }
    .section-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
    .section-header .icon { font-size: 1.5rem; }
    
    .address-section { border: 1px solid var(--border); background: rgba(255, 82, 49, 0.02); }
    .address-textarea { width: 100%; padding: 1rem; border-radius: 12px; border: 1px solid var(--border); font-family: inherit; resize: none; transition: var(--transition); }
    .address-textarea:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 4px rgba(255, 82, 49, 0.1); }
    .address-suggestions { margin-top: 1rem; display: flex; gap: 1rem; }
    .suggestion-tag { padding: 6px 16px; border-radius: 20px; border: 1px solid var(--border); background: white; font-size: 0.875rem; cursor: pointer; transition: var(--transition); }
    .suggestion-tag:hover { border-color: var(--primary); color: var(--primary); }

    .payment-section { border: 1px solid var(--border); }
    .payment-options { display: flex; flex-direction: column; gap: 1rem; }
    .payment-option { 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      padding: 1.25rem; 
      border: 1px solid var(--border); 
      border-radius: 16px; 
      cursor: pointer; 
      transition: var(--transition); 
    }
    .payment-option:hover { border-color: var(--primary); background: rgba(255, 82, 49, 0.02); }
    .payment-option.active { border-color: var(--primary); background: rgba(255, 82, 49, 0.05); }
    .payment-option.active .radio-circle { border-color: var(--primary); background: var(--primary); box-shadow: inset 0 0 0 4px white; }
    
    .option-content { display: flex; align-items: center; gap: 1.25rem; }
    .option-content .icon { font-size: 1.5rem; }
    .option-text strong { display: block; font-size: 1rem; margin-bottom: 2px; }
    .option-text p { font-size: 0.75rem; color: var(--text-muted); }
    
    .radio-circle { width: 20px; height: 20px; border: 2px solid var(--border); border-radius: 50%; transition: var(--transition); }

    .cart-items-card { padding: 2rem; border-radius: 20px; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border); }
    .item-count { background: var(--bg-light); padding: 4px 12px; border-radius: 8px; font-size: 0.875rem; font-weight: 700; }
    .cart-item { display: flex; align-items: center; padding: 1.5rem 0; border-bottom: 1px dashed var(--border); position: relative; }
    .item-visual img { width: 60px; height: 60px; border-radius: 12px; object-fit: cover; margin-right: 1.5rem; }
    .item-details { flex: 1; }
    .quantity-picker { display: flex; align-items: center; gap: 1.25rem; border: 1px solid var(--border); padding: 6px 12px; border-radius: 8px; margin: 0 2rem; }
    .quantity-picker button { color: var(--primary); font-weight: 800; font-size: 1.25rem; cursor: pointer; background: none; border: none; }
    .item-price { font-weight: 700; min-width: 80px; text-align: right; }
    .remove-btn { position: absolute; right: -10px; top: 1.5rem; font-size: 1.5rem; color: var(--text-muted); opacity: 0.5; cursor: pointer; background: none; border: none; }
    
    .summary-card { padding: 2rem; border-radius: 20px; }
    .bill-row { display: flex; justify-content: space-between; margin-bottom: 1.25rem; font-size: 0.9375rem; color: var(--text-muted); }
    .bill-row.total { margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border); color: var(--text-main); font-size: 1.25rem; font-weight: 800; }
    .free { color: #22c55e; font-weight: 700; }
    .payment-note { display: flex; align-items: center; gap: 0.75rem; background: var(--bg-light); padding: 1rem; border-radius: 12px; margin-top: 2rem; font-size: 0.75rem; color: var(--text-muted); }
    .checkout-btn { padding: 1.25rem; border-radius: 16px; font-size: 1.25rem; box-shadow: 0 10px 20px -10px var(--primary); }
    .checkout-btn:disabled { background: #ccc; cursor: not-allowed; box-shadow: none; }
    .error-text { color: var(--primary); font-size: 0.75rem; text-align: center; margin-top: 1rem; font-weight: 600; }
    
    .empty-state-card { text-align: center; padding: 5rem; max-width: 600px; margin: 4rem auto; }
    .empty-state-card img { width: 250px; margin-bottom: 2rem; }
    .sticky-card { position: sticky; top: 100px; }

    /* Modal Styles */
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
      z-index: 1000; display: flex; align-items: center; justify-content: center;
    }
    .upi-modal { width: 400px; padding: 2rem; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .close-icon { font-size: 2rem; color: var(--text-muted); cursor: pointer; }
    
    .qr-container { text-align: center; margin-bottom: 2rem; }
    .qr-wrapper { 
      position: relative; width: 200px; height: 200px; margin: 0 auto 1.5rem;
      background: white; padding: 1rem; border-radius: 16px; border: 1px solid var(--border);
    }
    .qr-wrapper img { width: 100%; height: 100%; }
    .scan-line {
      position: absolute; left: 0; top: 0; width: 100%; height: 4px;
      background: var(--primary); box-shadow: 0 0 15px var(--primary);
      animation: scan 2s infinite ease-in-out;
    }
    @keyframes scan { 
      0% { top: 10%; } 
      50% { top: 90%; } 
      100% { top: 10%; } 
    }
    
    .divider { display: flex; align-items: center; margin: 1.5rem 0; color: var(--text-muted); font-size: 0.75rem; font-weight: 700; }
    .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: var(--border); margin: 0 1rem; }
    
    .upi-input-section label { display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; }
    .input-with-button { display: flex; gap: 0.5rem; }
    .input-with-button input { flex: 1; padding: 0.75rem 1rem; border-radius: 10px; border: 1px solid var(--border); }
    .input-with-button button { padding: 0 1rem; border-radius: 10px; font-size: 0.875rem; }
    
    .secure-footer { display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-top: 2rem; font-size: 0.7rem; color: var(--text-muted); }

    @media (max-width: 1024px) { .cart-grid { grid-template-columns: 1fr; } .sticky-card { position: static; } }
  `]
})
export class CartComponent implements OnInit {
  private cartService = inject(CartService);
  private orderService = inject(OrderService);
  private paymentService = inject(PaymentService);
  private router = inject(Router);
  
  cart = this.cartService.cart;
  loading = signal(false);
  deliveryAddress = '';
  paymentMode: 'ONLINE' | 'WALLET' | 'COD' | 'UPI' = 'ONLINE';
  
  showUpiModal = signal(false);
  upiProcessing = signal(false);
  upiId = 'quickbite@upi';
  currentOrderId = '';

  ngOnInit() {
    this.cartService.loadCart().subscribe();
    this.paymentService.loadRazorpayScript();
  }

  updateQty(itemId: string, qty: number) {
    if (qty > 0) {
      this.cartService.updateQuantity(itemId, qty).subscribe();
    } else {
      this.removeItem(itemId);
    }
  }

  removeItem(itemId: string) {
    this.cartService.removeFromCart(itemId).subscribe();
  }

  onCheckout() {
    if (!this.deliveryAddress || !this.paymentMode) return;
    this.loading.set(true);
    
    const orderData = {
      modeOfPayment: this.paymentMode,
      deliveryAddress: this.deliveryAddress,
      specialInstructions: ''
    };
        this.orderService.placeOrder(orderData).subscribe({
      next: (order: any) => {
        this.currentOrderId = order.id;
        
        if (this.paymentMode === 'UPI') {
           this.showUpiModal.set(true);
           this.loading.set(false);
         } else if (this.paymentMode === 'ONLINE') {
            // Amount is already inclusive of taxes in grandTotal
            const finalAmount = Math.round(order.totalAmount);
            this.paymentService.initiateRazorpayPayment(finalAmount, order.id).subscribe({
              next: () => this.handleSuccess(),
              error: (err) => this.handleError(err)
            });
        } else if (this.paymentMode === 'WALLET') {
           this.paymentService.verifyPayment({
              orderId: order.id,
              amount: order.totalAmount,
              mode: 'WALLET'
           }).subscribe({
              next: () => this.handleSuccess(),
              error: (err) => this.handleError(err)
           });
        } else {
           this.handleSuccess();
        }
      },
      error: (err) => this.handleError(err)
    });
  }

  onUpiPay() {
     this.upiProcessing.set(true);
     this.paymentService.simulateUpiPayment(this.currentOrderId, this.cart().grandTotal, this.upiId).subscribe({
        next: () => {
           this.upiProcessing.set(false);
           this.showUpiModal.set(false);
           this.handleSuccess();
        },
        error: (err) => {
           this.upiProcessing.set(false);
           this.handleError(err);
        }
     });
  }

  closeUpiModal() {
     if (!this.upiProcessing()) {
        this.showUpiModal.set(false);
     }
  }

  private handleSuccess() {
    alert('Order placed successfully!');
    this.cartService.clearCart().subscribe();
    this.router.navigate(['/customer/history']);
    this.loading.set(false);
  }

  private handleError(err: any) {
    alert(err.error?.message || err.message || 'Action failed');
    this.loading.set(false);
  }
}
