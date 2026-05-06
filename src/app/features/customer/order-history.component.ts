import { inject, Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../core/services/order.service';
import { RestaurantService } from '../../core/services/restaurant.service';
import { Order } from '../../core/models';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="history-container animate-fade-in">
      <header class="section-header">
        <h1>Order History</h1>
        <p class="text-muted">Track your past and current orders</p>
      </header>

      <div class="orders-list">
        @for (order of orders(); track order.id) {
          <div class="order-card glass">
            <div class="order-header">
              <div>
                <h3>{{ order.restaurantName }}</h3>
                <p class="order-num">#{{ order.orderNumber }}</p>
              </div>
              <div class="status-badge" [class]="order.status.toLowerCase()">
                {{ order.status }}
              </div>
            </div>
            
            <div class="order-items">
              @for (item of order.items; track item.name) {
                <div class="item">
                  <span>{{ item.quantity }}x {{ item.name }}</span>
                  <span>₹{{ item.price * item.quantity }}</span>
                </div>
              }
            </div>
            
            <div class="order-footer">
              <span class="date">{{ order.createdAt | date:'medium' }}</span>
              <div class="actions">
                @if (order.status === 'DELIVERED' || order.status === 'PLACED') {
                  <button class="btn-outline-sm" (click)="openReviewModal(order)">
                    ⭐ Rate & Review
                  </button>
                }
                <span class="total">Total: ₹{{ order.totalAmount }}</span>
              </div>
            </div>
          </div>
        } @empty {
          <div class="empty-orders glass">
            <p>You haven't placed any orders yet.</p>
            <button class="btn-primary" routerLink="/customer">Order Now</button>
          </div>
        }
      </div>
    </div>

    <!-- Review Modal -->
    <div class="modal-overlay" *ngIf="showReviewModal()">
      <div class="review-modal glass animate-scale-up">
        <header>
          <h2>Rate your experience</h2>
          <p>{{ selectedOrder()?.restaurantName }}</p>
          <button class="close-btn" (click)="showReviewModal.set(false)">×</button>
        </header>
        
        <div class="star-rating">
          @for (star of [1,2,3,4,5]; track star) {
            <span class="star" 
                  [class.filled]="star <= rating()" 
                  (click)="rating.set(star)">
              ★
            </span>
          }
        </div>

        <div class="comment-box">
          <label>Tell us more (optional)</label>
          <textarea [(ngModel)]="comment" placeholder="The food was great..."></textarea>
        </div>

        <div class="modal-actions">
          <button class="btn-outline" (click)="showReviewModal.set(false)">Cancel</button>
          <button class="btn-primary" (click)="submitReview()" [disabled]="rating() === 0 || submitting()">
            {{ submitting() ? 'Submitting...' : 'Submit Review' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .history-container {
      padding: 1rem;
    }
    
    .orders-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      margin-top: 2rem;
      max-width: 800px;
    }
    
    .order-card {
      padding: 1.5rem;
      border-radius: 1.25rem;
      transition: var(--transition);
    }
    
    .order-card:hover {
      border-color: var(--primary);
    }
    
    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border);
    }
    
    .order-num {
      color: var(--text-muted);
      font-size: 0.875rem;
    }
    
    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 2rem;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
    }
    
    .status-badge.placed { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
    .status-badge.preparing { background: rgba(249, 115, 22, 0.1); color: #f97316; }
    .status-badge.delivered { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
    .status-badge.cancelled { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
    
    .order-items {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }
    
    .item {
      display: flex;
      justify-content: space-between;
      color: var(--text-muted);
      font-size: 0.9375rem;
    }
    
    .order-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
    }
    
    .date {
      color: var(--text-muted);
      font-size: 0.875rem;
      font-weight: 400;
    }
    
    .actions {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }
    
    .total {
      font-size: 1.125rem;
      color: var(--text-main);
    }
    
    .btn-outline-sm {
      background: transparent;
      border: 1px solid var(--primary);
      color: var(--primary);
      padding: 0.4rem 0.8rem;
      border-radius: 0.5rem;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .btn-outline-sm:hover {
      background: var(--primary);
      color: white;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .review-modal {
      width: 90%;
      max-width: 450px;
      padding: 2rem;
      border-radius: 1.5rem;
      position: relative;
    }

    .review-modal header { margin-bottom: 1.5rem; }
    .review-modal header h2 { font-size: 1.5rem; margin-bottom: 0.25rem; }
    .review-modal header p { color: var(--text-muted); }

    .close-btn {
      position: absolute;
      top: 1rem;
      right: 1.5rem;
      font-size: 2rem;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--text-muted);
    }

    .star-rating {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      font-size: 2.5rem;
      margin-bottom: 2rem;
    }

    .star {
      cursor: pointer;
      color: #e2e8f0;
      transition: transform 0.1s;
    }

    .star:hover { transform: scale(1.2); }
    .star.filled { color: #fbbf24; }

    .comment-box label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }

    .comment-box textarea {
      width: 100%;
      height: 100px;
      padding: 1rem;
      border-radius: 0.75rem;
      border: 1px solid var(--border);
      background: rgba(255,255,255,0.05);
      color: var(--text-main);
      resize: none;
      margin-bottom: 1.5rem;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
    }

    .empty-orders {
      padding: 4rem;
      text-align: center;
      border-radius: 1.5rem;
    }
  `]
})
export class OrderHistoryComponent implements OnInit {
  private orderService = inject(OrderService);
  private restaurantService = inject(RestaurantService);

  orders = signal<Order[]>([]);
  showReviewModal = signal(false);
  selectedOrder = signal<Order | null>(null);
  rating = signal(0);
  comment = '';
  submitting = signal(false);

  ngOnInit() {
    this.orderService.getCustomerHistory().subscribe(data => this.orders.set(data));
  }

  openReviewModal(order: Order) {
    this.selectedOrder.set(order);
    this.rating.set(0);
    this.comment = '';
    this.showReviewModal.set(true);
  }

  submitReview() {
    const order = this.selectedOrder();
    if (!order) return;

    this.submitting.set(true);
    const reviewData = {
      orderId: order.id,
      foodRating: this.rating(),
      comment: this.comment
    };

    this.restaurantService.submitReview(order.restaurantId, reviewData).subscribe({
      next: () => {
        this.submitting.set(false);
        this.showReviewModal.set(false);
        alert('Thank you for your review!');
      },
      error: (err) => {
        this.submitting.set(false);
        console.error('Review failed:', err);
        alert(err.error?.message || 'Failed to submit review. You may have already reviewed this order.');
      }
    });
  }
}
