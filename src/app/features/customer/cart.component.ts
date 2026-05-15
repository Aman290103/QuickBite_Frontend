import { inject, Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { PaymentService } from '../../core/services/payment.service';
import { AuthService } from '../../core/services/auth.service';

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
              <span>₹{{ appliedPromo() ? (cart().grandTotal * 0.8).toFixed(2) : cart().grandTotal }}</span>
            </div>

            <div class="promo-section" style="margin: 1.5rem 0;">
              <p style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.5rem; text-transform: uppercase;">Promo Code</p>
              <div class="promo-input-group" style="display: flex; gap: 0.5rem;">
                <input type="text" [(ngModel)]="promoCode" placeholder="Enter code (e.g. QUICK20)" 
                       style="flex: 1; padding: 0.75rem; border: 1px solid var(--border); border-radius: 12px; text-transform: uppercase;">
                <button class="btn-primary" (click)="applyPromo()" [disabled]="!promoCode" 
                        style="padding: 0.75rem 1.25rem; border-radius: 12px; font-weight: 700;">
                  Apply
                </button>
              </div>
              <p *ngIf="appliedPromo()" style="color: #22c55e; font-size: 0.8rem; font-weight: 600; margin-top: 0.5rem;">✅ 20% discount applied!</p>
              <p *ngIf="promoError()" style="color: #ef4444; font-size: 0.8rem; font-weight: 600; margin-top: 0.5rem;">❌ {{ promoError() }}</p>
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

      <div class="success-overlay-container" *ngIf="showSuccessOverlay()">
    <div class="success-card glass animate-scale">
      <div class="success-icon-wrapper">
        <div class="check-circle">
          <svg viewBox="0 0 52 52" class="checkmark">
            <circle cx="26" cy="26" r="25" fill="none" class="checkmark-circle"/>
            <path fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" class="checkmark-check"/>
          </svg>
        </div>
      </div>
      
      <h2>Order Placed Successfully!</h2>
      <p class="order-id-display">Transaction Reference: #{{ currentOrderId.substring(0,10) }}</p>
      
      <div class="notification-status">
        <div class="status-item animate-item" style="--delay: 0.5s">
          <div class="status-dot pulse"></div>
          <span class="status-icon">📧</span>
          <div class="status-text">
            <strong>Email Sent</strong>
            <span>Receipt delivered to {{ user()?.email }}</span>
          </div>
        </div>
        <div class="status-item animate-item" style="--delay: 1.2s">
          <div class="status-dot pulse"></div>
          <span class="status-icon">📱</span>
          <div class="status-text">
            <strong>SMS Confirmed</strong>
            <span>Tracking link sent to {{ user()?.phone }}</span>
          </div>
        </div>
      </div>

      <button class="btn-primary full-width" (click)="goToHistory()">View Order Tracking</button>
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

    /* Success Overlay Styles */
    .success-overlay-container { position: fixed; inset: 0; background: rgba(61, 43, 31, 0.4); backdrop-filter: blur(12px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 2rem; }
    .success-card { background: white; width: 100%; max-width: 500px; padding: 3rem; border-radius: 40px; text-align: center; box-shadow: var(--shadow-lg); }
    .success-icon-wrapper { margin-bottom: 2rem; display: flex; justify-content: center; }
    .check-circle { width: 100px; height: 100px; }
    .checkmark { width: 100px; height: 100px; border-radius: 50%; display: block; stroke-width: 2; stroke: #ffffff; stroke-miterlimit: 10; box-shadow: inset 0px 0px 0px #22c55e; animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s both; }
    .checkmark-circle { stroke-dasharray: 166; stroke-dashoffset: 166; stroke-width: 2; stroke-miterlimit: 10; stroke: #22c55e; fill: none; animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards; }
    .checkmark-check { transform-origin: 50% 50%; stroke-dasharray: 48; stroke-dashoffset: 48; stroke: #ffffff; stroke-width: 4; animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards; }

    @keyframes stroke { 100% { stroke-dashoffset: 0; } }
    @keyframes fill { 100% { box-shadow: inset 0px 0px 0px 50px #22c55e; } }

    .order-id-display { font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; color: var(--text-muted); margin-top: 0.5rem; margin-bottom: 2.5rem; }
    .notification-status { background: var(--bg-light); border-radius: 24px; padding: 1.5rem; margin-bottom: 2.5rem; text-align: left; }
    .status-item { display: flex; align-items: center; gap: 1rem; padding: 1rem 0; animation: fadeIn 0.5s both; animation-delay: var(--delay); }
    .status-item:not(:last-child) { border-bottom: 1px solid var(--border); }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; }
    .status-dot.pulse { animation: pulse 2s infinite; }
    .status-text strong { display: block; font-size: 0.9rem; color: var(--text-main); }
    .status-text span { font-size: 0.75rem; color: var(--text-muted); }

    @media (max-width: 1024px) { .cart-grid { grid-template-columns: 1fr; } .sticky-card { position: static; } }
  `]
})
export class CartComponent implements OnInit {
  private cartService = inject(CartService);
  private orderService = inject(OrderService);
  private paymentService = inject(PaymentService);
  private authService = inject(AuthService);
  private router = inject(Router);
  
  user = this.authService.currentUser;
  cart = this.cartService.cart;
  loading = signal(false);
  showSuccessOverlay = signal(false);
  deliveryAddress = '';
  paymentMode: 'ONLINE' | 'WALLET' | 'COD' | 'UPI' = 'ONLINE';
  
  showUpiModal = signal(false);
  upiProcessing = signal(false);
  upiId = 'quickbite@upi';
  currentOrderId = '';
  
  promoCode = '';
  appliedPromo = signal(false);
  promoError = signal('');

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

  applyPromo() {
    this.promoError.set('');
    this.appliedPromo.set(false);
    
    if (this.promoCode.trim().toUpperCase() === 'QUICK20') {
      this.appliedPromo.set(true);
    } else {
      this.promoError.set('Invalid or expired promo code.');
    }
  }

  onCheckout() {
    if (!this.deliveryAddress || !this.paymentMode) return;
    this.loading.set(true);
    
    const orderData = {
      modeOfPayment: this.paymentMode,
      deliveryAddress: this.deliveryAddress,
      specialInstructions: '',
      // [FEATURE: NOTIFICATIONS] - Capture customer contact info
      // This sends the user's current email and phone to the backend Order Service
      // so that they can be used for the digital confirmation system.
      customerEmail: this.user()?.email,
      customerPhone: this.user()?.phone
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
    this.showSuccessOverlay.set(true);
    this.cartService.clearCart().subscribe();
    this.loading.set(false);
  }

  goToHistory() {
    this.showSuccessOverlay.set(false);
    this.router.navigate(['/customer/history']);
  }

  private handleError(err: any) {
    alert(err.error?.message || err.message || 'Action failed');
    this.loading.set(false);
  }
}
