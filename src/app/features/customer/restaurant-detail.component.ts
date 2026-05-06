import { inject, Component, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { RestaurantService } from '../../core/services/restaurant.service';
import { CartService } from '../../core/services/cart.service';
import { MenuService } from '../../core/services/menu.service';
import { Restaurant, MenuCategory, MenuItem } from '../../core/models';
import { StarRatingComponent } from '../../shared/components/star-rating.component';

@Component({
  selector: 'app-restaurant-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, StarRatingComponent],
  template: `
    <div class="restaurant-detail-page animate-slide-up" *ngIf="restaurant()">
      <!-- Breadcrumbs -->
      <nav class="breadcrumbs">
        <a routerLink="/customer">Home</a> / <span>{{ restaurant()?.name }}</span>
      </nav>

      <!-- Restaurant Hero -->
      <section class="restaurant-header">
        <div class="main-info">
          <div class="text-content">
            <h1>{{ restaurant()?.name }}</h1>
            <p class="cuisine">{{ restaurant()?.cuisine }}</p>
            <p class="address">{{ restaurant()?.address }}, {{ restaurant()?.city }}</p>
            <div class="status-tags">
              <span class="tag open">Open now</span>
              <span class="tag delivery">Delivery in {{ restaurant()?.estimatedDeliveryMin }} mins</span>
            </div>
          </div>
          <div class="rating-box card">
            <app-star-rating [rating]="restaurant()?.avgRating || 0"></app-star-rating>
            <span class="count">{{ restaurant()?.reviewCount || 0 }} ratings</span>
          </div>
        </div>

        <!-- Seed Menu Button (Visible for demo/empty restaurants) -->
        <div class="seed-action" *ngIf="categories().length === 0">
           <div class="seed-card card animate-pulse">
              <div class="seed-text">
                 <h4>Demo Mode Active</h4>
                 <p>This restaurant's menu is empty in the database. Initialize it to enable real ordering.</p>
              </div>
              <button class="btn-primary" (click)="onSeedMenu()" [disabled]="seeding()">
                 {{ seeding() ? 'Initializing...' : 'Initialize Menu' }}
              </button>
           </div>
        </div>
        
        <div class="image-gallery">
          <div class="main-img" [style.background-image]="'url(' + (restaurant()?.imageUrl || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1000') + ')'"></div>
          <div class="side-imgs">
            <div style="background-image: url('https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400')"></div>
            <div style="background-image: url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400')"></div>
          </div>
        </div>
      </section>

      <!-- Menu Tabs -->
      <div class="menu-tabs">
        <button class="tab-btn" [class.active]="activeTab() === 'order'" (click)="activeTab.set('order')">Order Online</button>
        <button class="tab-btn" [class.active]="activeTab() === 'reviews'" (click)="activeTab.set('reviews')">Reviews</button>
        <button class="tab-btn">Photos</button>
        <button class="tab-btn">Menu</button>
      </div>

      <div class="tab-content">
        <!-- Order Online Tab -->
        <div class="menu-layout-wrapper" *ngIf="activeTab() === 'order'" [class.no-sidebar]="displayCategories().length === 0">
          <!-- Sidebar Filters -->
          <aside class="menu-sidebar" *ngIf="displayCategories().length > 0">
            <h3>Menu</h3>
            <ul>
              @for (cat of displayCategories(); track cat.categoryId) {
                <li [class.active]="activeCategory() === cat.categoryId" (click)="scrollToCategory(cat.categoryId)">
                  {{ cat.name }} ({{ cat.items.length }})
                </li>
              }
            </ul>
          </aside>

          <!-- Menu Items -->
          <div class="menu-items-list">
            @for (cat of displayCategories(); track cat.categoryId) {
              <div [id]="'cat-' + cat.categoryId">
                <h2 class="category-title">{{ cat.name }}</h2>
                @for (item of cat.items; track item.id) {
                  <div class="menu-item-card">
                    <div class="item-info">
                      <div class="veg-icon" [class.non-veg]="!item.isVeg">
                        <div class="dot"></div>
                      </div>
                      <h3>{{ item.name }}</h3>
                      <p class="item-price">₹{{ item.price }}</p>
                      <p class="item-desc">{{ item.description }}</p>
                    </div>
                    <div class="item-action">
                      <div class="item-img" [style.background-image]="'url(' + (item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400') + ')'"></div>
                      <button class="add-btn" (click)="addToCart(item)" [disabled]="!item.isAvailable">
                        {{ item.isAvailable ? 'ADD' : 'SOLD OUT' }} <span class="plus" *ngIf="item.isAvailable">+</span>
                      </button>
                    </div>
                  </div>
                }
              </div>
            } @empty {
              <div class="empty-menu-centered">
                 <img src="https://cdni.iconscout.com/illustration/premium/thumb/no-data-found-8867280-7218654.png" alt="Empty" style="width: 250px; margin-bottom: 2rem;">
                 <h2>No menu items available</h2>
                 <p class="text-muted" style="max-width: 400px; margin: 0 auto 2rem;">This restaurant hasn't uploaded its menu yet. You can generate a demo menu to test the system.</p>
                 <button class="btn-primary" (click)="onSeedMenu()" [disabled]="seeding()" style="padding: 1rem 2.5rem; font-size: 1.1rem;">
                   {{ seeding() ? 'Generating Menu...' : 'Generate Demo Menu' }}
                 </button>
              </div>
            }
          </div>

          <!-- Sticky Cart Mini -->
          <aside class="cart-sidebar" *ngIf="cart().items.length">
            <div class="cart-card card">
              <h3>Your Cart</h3>
              <div class="cart-items-mini">
                 @for (ci of cart().items; track ci.itemId) {
                   <div class="mini-item">
                      <span>{{ ci.name }}</span>
                      <span>x{{ ci.quantity }}</span>
                   </div>
                 }
              </div>
              <div class="cart-total-mini">
                <span>Subtotal: ₹{{ cart().subTotal }}</span>
              </div>
              <button class="btn-primary full-width" routerLink="/customer/cart">View Full Cart</button>
            </div>
          </aside>
        </div>

        <!-- Reviews Tab -->
        <div class="reviews-section animate-fade-in" *ngIf="activeTab() === 'reviews'">
          <div class="review-stats card">
            <div class="stat">
              <app-star-rating [rating]="restaurant()?.avgRating || 0" [showText]="false"></app-star-rating>
              <span class="big-rating">{{ (restaurant()?.avgRating || 0) | number:'1.1-1' }}</span>
              <p>Average Rating</p>
            </div>
            <div class="stat">
              <span class="big-count">{{ restaurant()?.reviewCount || 0 }}</span>
              <p>Total Reviews</p>
            </div>
          </div>

          <div class="reviews-list">
            @for (rev of reviews(); track rev.reviewId) {
              <div class="review-card glass">
                <div class="rev-header">
                  <div class="user-info">
                    <div class="avatar">{{ rev.customerName[0] }}</div>
                    <div>
                      <h4>{{ rev.customerName }}</h4>
                      <span class="rev-date">{{ rev.reviewDate | date }}</span>
                    </div>
                  </div>
                  <div class="rev-rating">
                    <app-star-rating [rating]="rev.foodRating" [showText]="false"></app-star-rating>
                  </div>
                </div>
                <p class="rev-comment">{{ rev.comment }}</p>
              </div>
            } @empty {
              <div class="empty-reviews card">
                <p>No reviews yet. Be the first to review!</p>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .restaurant-detail-page {
      padding-top: 1rem;
    }
    
    .breadcrumbs {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-bottom: 1.5rem;
    }
    
    .restaurant-header {
      margin-bottom: 3rem;
    }
    
    .main-info {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
    }
    
    .text-content h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }
    
    .cuisine {
      font-size: 1.125rem;
      color: var(--text-muted);
    }
    
    .address {
      color: #9c9c9c;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }
    
    .status-tags {
      margin-top: 1rem;
      display: flex;
      gap: 1rem;
    }
    
    .tag {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 6px;
    }
    
    .tag.open { background: #fff4e5; color: #ff5231; }
    .tag.delivery { background: #f3f3f3; color: #686b78; }
    
    .rating-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    
    .rating-box .count {
      font-size: 0.65rem;
      color: var(--text-muted);
      font-weight: 700;
      text-transform: uppercase;
    }
    
    .image-gallery {
      display: grid;
      grid-template-columns: 2.5fr 1fr;
      gap: 0.5rem;
      height: 400px;
      border-radius: 12px;
      overflow: hidden;
    }
    
    .main-img {
      background-size: cover;
      background-position: center;
    }
    
    .side-imgs {
      display: grid;
      grid-template-rows: 1fr 1fr;
      gap: 0.5rem;
    }
    
    .side-imgs div {
      background-size: cover;
      background-position: center;
    }
    
    .menu-tabs {
      border-bottom: 1px solid var(--border);
      margin-bottom: 2rem;
      display: flex;
      gap: 2.5rem;
      position: sticky;
      top: 80px;
      background: var(--bg-light);
      z-index: 10;
      padding-top: 1rem;
    }
    
    .tab-btn {
      padding: 1rem 0;
      font-size: 1.125rem;
      font-weight: 500;
      color: var(--text-muted);
      position: relative;
    }
    
    .tab-btn.active {
      color: var(--primary);
      font-weight: 700;
    }
    
    .tab-btn.active::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 3px;
      background: var(--primary);
    }
    
    .menu-layout-wrapper {
      display: grid;
      grid-template-columns: 200px 1fr 300px;
      gap: 3rem;
    }
    
    .menu-layout-wrapper.no-sidebar {
      grid-template-columns: 1fr;
    }
    
    .menu-sidebar h3 {
      font-size: 1.25rem;
      margin-bottom: 1.5rem;
    }
    
    .menu-sidebar ul {
      list-style: none;
    }
    
    .menu-sidebar li {
      padding: 0.75rem 0;
      cursor: pointer;
      color: var(--text-muted);
      font-weight: 500;
      transition: var(--transition);
    }
    
    .menu-sidebar li.active {
      color: var(--primary);
      font-weight: 700;
    }
    
    .category-title {
      font-size: 1.5rem;
      margin-bottom: 2rem;
    }
    
    .menu-item-card {
      display: flex;
      justify-content: space-between;
      padding: 2rem 0;
      border-bottom: 1px solid var(--border);
    }
    
    .item-info { flex: 1; }
    
    .veg-icon {
      width: 16px;
      height: 16px;
      border: 2px solid #22c55e;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.5rem;
    }
    
    .veg-icon .dot {
      width: 8px;
      height: 8px;
      background: #22c55e;
      border-radius: 50%;
    }
    
    .veg-icon.non-veg { border-color: #e23744; }
    .veg-icon.non-veg .dot { background: #e23744; }
    
    .menu-item-card h3 {
      font-size: 1.125rem;
      margin-bottom: 0.25rem;
    }
    
    .item-price {
      font-weight: 600;
      margin-bottom: 0.75rem;
    }
    
    .item-desc {
      color: var(--text-muted);
      font-size: 0.875rem;
      max-width: 450px;
    }
    
    .item-action {
      position: relative;
      width: 150px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    .item-img {
      width: 140px;
      height: 140px;
      background-size: cover;
      background-position: center;
      border-radius: 12px;
      box-shadow: var(--shadow-sm);
    }
    
    .add-btn {
      position: absolute;
      bottom: -15px;
      background: white;
      color: var(--primary);
      border: 1px solid var(--border);
      padding: 8px 24px;
      border-radius: 8px;
      font-weight: 800;
      box-shadow: var(--shadow-md);
      transition: var(--transition);
    }
    
    .add-btn:hover { background: var(--bg-light); transform: translateY(-2px); }
    
    .add-btn .plus { font-size: 1.25rem; margin-left: 4px; }
    
    .cart-sidebar {
      position: sticky;
      top: 150px;
      height: fit-content;
    }
    
    .cart-card h3 { margin-bottom: 1.5rem; }
    
    .mini-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.75rem;
      font-size: 0.875rem;
      font-weight: 500;
    }
    
    .cart-total-mini {
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border);
      font-weight: 700;
      margin-bottom: 1.5rem;
    }
    
    .empty-menu-centered {
      padding: 5rem 0;
      text-align: center;
      width: 100%;
    }

    /* Reviews Styles */
    .tab-content { margin-top: 2rem; }
    
    .review-stats {
      display: flex;
      gap: 3rem;
      padding: 2rem;
      margin-bottom: 2rem;
      justify-content: center;
      text-align: center;
    }
    
    .big-rating { font-size: 2.5rem; font-weight: 800; color: #22c55e; }
    .big-count { font-size: 2.5rem; font-weight: 800; color: var(--primary); }
    .stat p { font-weight: 600; color: var(--text-muted); margin-top: 0.5rem; }

    .reviews-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      max-width: 800px;
      margin: 0 auto;
    }

    .review-card {
      padding: 1.5rem;
      border-radius: 1rem;
    }

    .rev-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .avatar {
      width: 40px;
      height: 40px;
      background: var(--primary);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 1.25rem;
    }

    .user-info h4 { margin: 0; font-size: 1rem; }
    .rev-date { font-size: 0.75rem; color: var(--text-muted); }
    .rev-rating { font-weight: 700; color: #fbbf24; }
    .rev-comment { color: var(--text-main); line-height: 1.6; }

    .empty-reviews {
      text-align: center;
      padding: 3rem;
      color: var(--text-muted);
    }
    
    @media (max-width: 1200px) {
      .menu-layout-wrapper { grid-template-columns: 1fr 300px; }
      .menu-sidebar { display: none; }
    }
    
    @media (max-width: 900px) {
      .menu-layout-wrapper { grid-template-columns: 1fr; }
      .cart-sidebar { display: none; }
      .image-gallery { height: 250px; }
      .side-imgs { display: none; }
      .restaurant-header h1 { font-size: 1.75rem; }
    }
  `]
})
export class RestaurantDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private restaurantService = inject(RestaurantService);
  private cartService = inject(CartService);
  private menuService = inject(MenuService);

  restaurant = signal<Restaurant | null>(null);
  categories = signal<MenuCategory[]>([]);
  displayCategories = signal<MenuCategory[]>([]);
  activeCategory = signal<string>('');
  cart = this.cartService.cart;
  seeding = signal(false);
  
  activeTab = signal<'order' | 'reviews'>('order');
  reviews = signal<any[]>([]);

  private fallbackMenu: MenuCategory[] = [];

  constructor() {
    effect(() => {
      if (this.activeTab() === 'reviews' && this.restaurant()) {
        this.loadReviews();
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.restaurantService.getRestaurantById(id).subscribe(data => this.restaurant.set(data));
      this.loadMenu(id);
    }
  }

  loadMenu(restaurantId: string) {
    this.menuService.getMenu(restaurantId).subscribe(data => {
      this.categories.set(data);
      if (data.length > 0) {
        this.displayCategories.set(data);
        this.activeCategory.set(data[0].categoryId);
      } else {
        this.displayCategories.set([]);
        this.activeCategory.set('');
      }
    });
  }

  private http = inject(HttpClient);

  loadReviews() {
    const id = this.restaurant()?.id;
    if (id) {
      this.restaurantService.getReviews(id).subscribe(data => {
        this.reviews.set(data);
        // Direct UI update: calculate stats from the reviews list that is proven to be visible
        const current = this.restaurant();
        if (current && data.length > 0) {
          const totalRating = data.reduce((acc, r) => acc + (r.foodRating || 0), 0);
          const avg = totalRating / data.length;
          this.restaurant.set({
            ...current,
            reviewCount: data.length,
            avgRating: avg
          });
        }
      });
      // Force refresh from backend
      this.restaurantService.getRestaurantById(id).subscribe(data => {
        if (data) this.restaurant.set(data);
      });
    }
  }

  onSeedMenu() {
    const id = this.restaurant()?.id;
    if (id) {
      this.seeding.set(true);
      this.menuService.seedMenu(id).subscribe({
        next: () => {
          this.loadMenu(id);
          this.seeding.set(false);
        },
        error: () => this.seeding.set(false)
      });
    }
  }

  scrollToCategory(catId: string) {
    this.activeCategory.set(catId);
    const element = document.getElementById('cat-' + catId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  addToCart(item: MenuItem) {
    if (this.restaurant()) {
      const rest = this.restaurant()!;
      this.cartService.addToCart(item.id, 1, rest.id, rest.name, item.name, item.price).subscribe({
        next: () => {},
        error: (err) => {
          console.error('Cart error:', err);
          alert(err.error?.message || 'Failed to add item to cart');
        }
      });
    }
  }
}
