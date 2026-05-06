import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rating-badge-premium" [class.no-reviews]="rating === 0">
      <div class="stars-row">
        @for (star of [1,2,3,4,5]; track star) {
          <span class="star-icon" [class.filled]="star <= rating" [class.half]="star - 0.5 <= rating && star > rating">
            ★
          </span>
        }
      </div>
      <span class="rating-val" *ngIf="showText">{{ (rating > 0 ? rating : 0) | number:'1.1-1' }}</span>
    </div>
  `,
  styles: [`
    .rating-badge-premium {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #2563eb; /* Primary Royal Blue */
      color: white;
      padding: 4px 8px;
      border-radius: 6px;
      font-weight: 800;
      font-size: 0.8rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    
    .rating-badge-premium.no-reviews {
      background: #64748b; /* Slate for no reviews */
    }

    .stars-row {
      display: flex;
      gap: 1px;
      margin-right: 2px;
    }

    .star-icon {
      color: rgba(255, 255, 255, 0.2); /* Very subtle unfilled star */
      font-size: 0.85rem;
      text-shadow: 0 0 1px rgba(0,0,0,0.1);
    }

    .star-icon.filled {
      color: #ffca28; /* Vibrant Golden Yellow */
    }

    .star-icon.half {
      position: relative;
      color: rgba(255, 255, 255, 0.2);
    }

    .star-icon.half::after {
      content: '★';
      position: absolute;
      left: 0;
      top: 0;
      width: 50%;
      overflow: hidden;
      color: #ffca28;
    }

    .rating-val {
      font-family: 'Inter', sans-serif;
      font-size: 0.85rem;
      letter-spacing: -0.01em;
    }
  `]
})
export class StarRatingComponent {
  @Input() rating: number = 0;
  @Input() showText: boolean = true;
}
