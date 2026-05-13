import { inject, Component, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RestaurantService } from '../../core/services/restaurant.service';
import { LocationService } from '../../core/services/location.service';
import { SearchService } from '../../core/services/search.service';
import { Restaurant } from '../../core/models';
import { StarRatingComponent } from '../../shared/components/star-rating.component';

@Component({
  selector: 'app-browse-restaurants',
  standalone: true,
  imports: [CommonModule, RouterModule, StarRatingComponent],
  template: `
    <div class="browse-container animate-slide-up">
      <!-- Admin Notification / Offers -->
      <div class="admin-notification" *ngIf="showNotification()">
        <div class="notif-content">
          <span class="icon">🎉</span>
          <div class="text">
            <strong>Exclusive Offer!</strong>
            <p>Use code <b>QUICK20</b> on any Fast Delivery restaurant to get 20% off your next order.</p>
          </div>
        </div>
        <button class="close-btn" (click)="showNotification.set(false)">×</button>
      </div>

      <!-- Hero Carousel / Categories -->
      <section class="categories-section">
        <h2 class="section-title">Inspiration for your first order</h2>
        <div class="category-grid">
          @for (cat of categories; track cat.name) {
            <div class="category-item" (click)="filterByCuisine(cat.name)">
              <div class="cat-image" [style.background-image]="'url(' + cat.img + ')'"></div>
              <span>{{ cat.name }}</span>
            </div>
          }
        </div>
      </section>

      <!-- Filters Row -->
      <section class="filters-row glass">
        <div class="filter-pills">
          <button class="filter-pill" [class.active]="activeFilter() === 'relevance'" (click)="setFilter('relevance')">Relevance</button>
          <button class="filter-pill" [class.active]="activeFilter() === 'rating'" (click)="setFilter('rating')">Ratings 4.0+</button>
          <button class="filter-pill" [class.active]="activeFilter() === 'fast'" (click)="setFilter('fast')">Fast Delivery</button>
          <button class="filter-pill" [class.active]="activeFilter() === 'offers'" (click)="setFilter('offers')">Offers</button>
          <button class="filter-pill" [class.active]="activeFilter() === 'pureVeg'" (click)="setFilter('pureVeg')">Pure Veg</button>
        </div>
      </section>

      <!-- Restaurant Grid -->
      <section class="restaurant-section">
        <h2 class="section-title">Top restaurants around you</h2>
        
        @if (loading()) {
          <div class="shimmer-grid">
            @for (i of [1,2,3,4,5,6,7,8]; track i) {
              <div class="shimmer-card"></div>
            }
          </div>
        } @else {
          <div class="restaurant-grid">
            @for (restaurant of filteredRestaurants(); track restaurant.id) {
              <div class="restaurant-card" [routerLink]="['/customer/restaurant', restaurant.id]">
                <div class="image-wrapper">
                  @if (restaurant.imageUrl) {
                    <img [src]="restaurant.imageUrl"
                         [alt]="restaurant.name"
                         (error)="onImgError($event, restaurant.cuisine)">
                  } @else {
                    <img [src]="getFallbackImage(restaurant.cuisine)"
                         [alt]="restaurant.name">
                  }
                  <div class="offer-tag" *ngIf="restaurant.minOrderAmount < 500">Free Delivery</div>
                  <div class="rating-badge" [class.new]="!restaurant.reviewCount">
                    <app-star-rating [rating]="restaurant.avgRating" [showText]="true"></app-star-rating>
                  </div>
                </div>
                <div class="info">
                  <div class="name-row">
                    <h3>{{ restaurant.name }}</h3>
                  </div>
                  <p class="cuisine">{{ restaurant.cuisine }}</p>
                  <div class="meta">
                    <span class="delivery-time">🕒 {{ restaurant.estimatedDeliveryMin }} mins</span>
                    <span class="dot">•</span>
                    <span class="price">₹{{ restaurant.minOrderAmount }} for one</span>
                  </div>
                </div>
              </div>
            } @empty {
              <div class="empty-state card">
                <img src="https://cdni.iconscout.com/illustration/premium/thumb/empty-cart-2130356-1800917.png" alt="Empty">
                <h3>No restaurants found</h3>
                <p>Try adjusting your filters or location</p>
                <button class="btn-primary" (click)="resetFilters()" style="margin-top: 1rem;">Reset Filters</button>
              </div>
            }
          </div>
        }
      </section>
    </div>
  `,
  styles: [`
    .browse-container {
      padding-bottom: 5rem;
    }
    
    .section-title {
      font-size: 1.75rem;
      font-weight: 700;
      margin-bottom: 2rem;
      color: var(--secondary);
    }
    
    /* Categories */
    .categories-section {
      margin-bottom: 4rem;
    }
    
    .category-grid {
      display: flex;
      gap: 2rem;
      overflow-x: auto;
      padding-bottom: 1rem;
      scrollbar-width: none;
    }
    
    .category-grid::-webkit-scrollbar { display: none; }
    
    .category-item {
      flex: 0 0 150px;
      text-align: center;
      cursor: pointer;
      transition: var(--transition);
    }
    
    .category-item:hover { transform: scale(1.05); }
    
    .cat-image {
      width: 150px;
      height: 150px;
      border-radius: 50%;
      background-size: cover;
      background-position: center;
      margin-bottom: 1rem;
      box-shadow: var(--shadow-sm);
    }
    
    .category-item span {
      font-weight: 600;
      color: var(--text-muted);
    }
    
    /* Filters */
    .filters-row {
      padding: 1rem 0;
      margin-bottom: 3rem;
      position: sticky;
      top: 80px;
      z-index: 10;
      border: none;
    }
    
    .filter-pills {
      display: flex;
      gap: 1rem;
      overflow-x: auto;
      scrollbar-width: none;
    }
    
    .filter-pills::-webkit-scrollbar { display: none; }
    
    .filter-pill {
      padding: 0.6rem 1.25rem;
      border: 1px solid var(--border);
      border-radius: 100px;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-muted);
      background: white;
      transition: var(--transition);
      white-space: nowrap;
    }
    
    .filter-pill:hover { background: var(--bg-light); }
    .filter-pill.active {
      background: var(--primary);
      color: white;
      border-color: var(--primary);
    }
    
    /* Restaurant Grid */
    .restaurant-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 2.5rem;
    }
    
    .restaurant-card {
      cursor: pointer;
      transition: var(--transition);
    }
    
    .restaurant-card:hover { transform: scale(0.96); }
    
    .image-wrapper {
      position: relative;
      height: 200px;
      border-radius: 16px;
      overflow: hidden;
      margin-bottom: 1rem;
      box-shadow: var(--shadow-sm);
    }
    
    .image-wrapper img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .placeholder-icon {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-light);
      font-size: 3rem;
      color: var(--text-muted);
    }
    
    .offer-tag {
      position: absolute;
      bottom: 1rem;
      left: 0;
      background: #2563eb;
      color: white;
      padding: 4px 12px;
      font-size: 0.75rem;
      font-weight: 800;
      border-radius: 0 4px 4px 0;
    }
    
    .rating-badge {
      position: absolute;
      top: 1rem;
      right: 1rem;
      z-index: 2;
    }
    
    .info h3 {
      font-size: 1.125rem;
      margin-bottom: 0.25rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .cuisine {
      color: var(--text-muted);
      font-size: 0.875rem;
      margin-bottom: 0.75rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
    }
    
    .dot { font-size: 1rem; }
    
    /* Shimmer */
    .shimmer-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 2.5rem;
    }
    
    .shimmer-card {
      height: 300px;
      background: #eee;
      border-radius: 16px;
      animation: shimmer 1.5s infinite linear;
      background: linear-gradient(to right, #eff1f3 4%, #e2e2e2 25%, #eff1f3 36%);
      background-size: 1000px 100%;
    }
    
    @keyframes shimmer {
      0% { background-position: -1000px 0; }
      100% { background-position: 1000px 0; }
    }
    
    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 5rem;
    }
    
    .empty-state img { width: 200px; margin-bottom: 2rem; }

    /* Notification Styles */
    .admin-notification {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      margin-bottom: 2rem;
      border-radius: 16px;
      background: linear-gradient(135deg, rgba(255,82,49,0.1), rgba(255,160,49,0.1));
      border: 1px solid rgba(255,82,49,0.2);
    }
    .notif-content { display: flex; align-items: center; gap: 1rem; }
    .notif-content .icon { font-size: 1.8rem; animation: tada 2s infinite; }
    .notif-content strong { color: var(--primary); font-size: 1.1rem; display: block; margin-bottom: 4px; }
    .notif-content p { color: var(--text-main); font-size: 0.95rem; margin: 0; }
    .admin-notification .close-btn { background: none; border: none; font-size: 1.8rem; color: var(--text-muted); cursor: pointer; line-height: 1; padding: 0 0.5rem; }
    .admin-notification .close-btn:hover { color: var(--text-main); }
    
    @keyframes tada {
      0% { transform: scale(1); }
      10%, 20% { transform: scale(0.9) rotate(-3deg); }
      30%, 50%, 70%, 90% { transform: scale(1.1) rotate(3deg); }
      40%, 60%, 80% { transform: scale(1.1) rotate(-3deg); }
      100% { transform: scale(1) rotate(0); }
    }
  `]
})
export class BrowseRestaurantsComponent implements OnInit {
  private restaurantService = inject(RestaurantService);
  private locationService = inject(LocationService);
  private searchService = inject(SearchService);
  
  restaurants = signal<Restaurant[]>([]);
  filteredRestaurants = signal<Restaurant[]>([]);
  loading = signal(false);
  activeFilter = signal<string>('relevance');
  showNotification = signal(true);

  categories = [
    { name: 'Pizza', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&q=80' },
    { name: 'Burger', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&q=80' },
    { name: 'Biryani', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&q=80' },
    { name: 'Indian', img: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=300&q=80' },
    { name: 'Chinese', img: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300&q=80' },
    { name: 'Desserts', img: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=300&q=80' },
    { name: 'Healthy', img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&q=80' },
    { name: 'Beverages', img: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=300&q=80' }
  ];

  constructor() {
    // Re-fetch restaurants when location changes
    effect(() => {
      const loc = this.locationService.currentLocation();
      this.loadRestaurants(loc.lat, loc.lon);
    }, { allowSignalWrites: true });

    // Listen to search query changes
    effect(() => {
      const query = this.searchService.searchQuery();
      if (query) {
        this.filterByCuisine(query);
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit() {}

  loadRestaurants(lat: number, lon: number) {
    this.loading.set(true);
    this.restaurantService.getNearbyRestaurants(lat, lon, 500).subscribe({
      next: (data) => {
        this.restaurants.set(data);
        this.applyFilters();
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  setFilter(filter: string) {
    this.activeFilter.set(filter);
    this.applyFilters();
  }

  applyFilters() {
    // CRITICAL: Only show approved restaurants to customers
    let list = this.restaurants().filter(r => r.isApproved);
    const filter = this.activeFilter();

    switch (filter) {
      case 'rating':
        list = list.filter(r => r.avgRating >= 4.0);
        break;
      case 'fast':
        list = list.filter(r => r.estimatedDeliveryMin <= 15).sort((a, b) => a.estimatedDeliveryMin - b.estimatedDeliveryMin);
        break;
      case 'offers':
        list = list.filter(r => r.minOrderAmount < 300); // Mocking offers logic
        break;
      case 'pureVeg':
        list = list.filter(r => r.cuisine.toLowerCase().includes('veg'));
        break;
      default:
        // relevance - original order
        break;
    }
    this.filteredRestaurants.set(list);
  }

  filterByCuisine(cuisine: string) {
    this.loading.set(true);
    this.restaurantService.searchRestaurants(cuisine).subscribe({
      next: (data) => {
        this.restaurants.set(data);
        this.applyFilters();
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  resetFilters() {
    this.activeFilter.set('relevance');
    const loc = this.locationService.currentLocation();
    this.loadRestaurants(loc.lat, loc.lon);
  }

  // Cuisine-aware fallback images from Unsplash (reliable CDN)
  getFallbackImage(cuisine: string): string {
    const c = (cuisine || '').toLowerCase();
    if (c.includes('pizza')) return 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80';
    if (c.includes('chinese')) return 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&q=80';
    if (c.includes('biryani') || c.includes('indian')) return 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&q=80';
    if (c.includes('burger')) return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80';
    if (c.includes('beverage') || c.includes('cafe')) return 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80';
    if (c.includes('sweet') || c.includes('dessert')) return 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&q=80';
    if (c.includes('veg')) return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80';
    if (c.includes('italian')) return 'https://images.unsplash.com/photo-1498579150354-977475b7ea0b?w=800&q=80';
    // Default: vibrant Indian restaurant photo
    return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80';
  }

  onImgError(event: Event, cuisine: string) {
    const img = event.target as HTMLImageElement;
    img.src = this.getFallbackImage(cuisine);
  }
}
