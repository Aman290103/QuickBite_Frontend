import { inject, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { LocationService } from '../../core/services/location.service';
import { SearchService } from '../../core/services/search.service';
import { NotificationService } from '../../core/services/notification.service';
import { AppNotification } from '../../core/models';

@Component({
  selector: 'app-customer-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="app-container">
      <!-- Sticky Header -->
      <header class="main-header glass">
        <div class="header-inner container">
          <div class="left-section">
            <h1 class="logo" routerLink="/customer">QuickBite</h1>
            <div class="location-picker" (click)="onDetectLocation()">
              <span class="icon">📍</span>
              <span class="location-text">{{ locationAddress() }}</span>
              <span class="arrow">▼</span>
            </div>
          </div>
          
          <div class="center-section">
            <div class="search-bar">
              <span class="search-icon">🔍</span>
              <input type="text" placeholder="Search for restaurant, cuisine or a dish" #searchInput (keyup.enter)="onSearch(searchInput.value)">
            </div>
          </div>
          
          <div class="right-section">
            <nav class="header-nav">
              <a routerLink="/customer/history" class="nav-link">Orders</a>
              <a routerLink="/customer/wallet" class="nav-link">Wallet</a>
              
              <div class="notification-bell" (click)="showNotifications = !showNotifications; showUserMenu = false">
                <span class="bell-icon">🔔</span>
                @if (notifications().length > 0) {
                  <span class="notif-badge">{{ notifications().length }}</span>
                }
                
                <div class="dropdown-menu card notif-menu" *ngIf="showNotifications" (click)="$event.stopPropagation()">
                  <div class="notif-header">
                    <h4>Notifications</h4>
                  </div>
                  <div class="notif-list">
                    @for (note of notifications(); track note.id) {
                      <div class="notif-item unread">
                        <div class="notif-icon">{{ note.restaurantId === 'system' ? '🎉' : '📢' }}</div>
                        <div class="notif-text">
                          <strong>{{ note.restaurantName }} {{ note.restaurantId !== 'system' ? '-' : '' }} {{ note.title }}</strong>
                          <p>{{ note.message }}</p>
                        </div>
                      </div>
                    } @empty {
                      <div class="notif-empty" style="padding: 2rem; text-align: center; color: var(--text-muted);">
                        <p>No new updates for now.</p>
                      </div>
                    }
                  </div>
                </div>
              </div>
              
              <div class="user-profile" (click)="showUserMenu = !showUserMenu; showNotifications = false">
                <div class="avatar">{{ userInitial() }}</div>
                <span class="user-name">{{ userFirstName() }}</span>
                
                <div class="dropdown-menu card" *ngIf="showUserMenu">
                  <a routerLink="/customer/profile">Profile</a>
                  <button (click)="onLogout()">Logout</button>
                </div>
              </div>
              
              <div class="cart-pill" routerLink="/customer/cart">
                <span class="cart-icon">🛒</span>
                <span class="cart-label">Cart</span>
                <span class="cart-count" *ngIf="cart().items.length">{{ cart().items.length }}</span>
              </div>
            </nav>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="main-content container">
        <router-outlet></router-outlet>
      </main>

      <!-- Footer -->
      <footer class="main-footer">
        <div class="container">
          <div class="footer-grid">
            <div class="footer-col">
              <h2 class="logo">QuickBite</h2>
              <p>Making everyday meals extraordinary.</p>
            </div>
            <div class="footer-col">
              <h4>Company</h4>
              <a>About Us</a>
              <a>Team</a>
              <a>Careers</a>
            </div>
            <div class="footer-col">
              <h4>Contact</h4>
              <a>Help & Support</a>
              <a>Partner with us</a>
              <a>Ride with us</a>
            </div>
            <div class="footer-col">
              <h4>Social</h4>
              <div class="social-links">
                <span>FB</span> <span>TW</span> <span>IG</span>
              </div>
            </div>
          </div>
          <div class="footer-bottom">
            <p>&copy; 2026 QuickBite Technologies. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }
    
    .main-header {
      position: sticky;
      top: 0;
      z-index: 1000;
      height: 80px;
      display: flex;
      align-items: center;
      box-shadow: 0 1px 12px rgba(0,0,0,0.05);
    }
    
    .header-inner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }
    
    .left-section {
      display: flex;
      align-items: center;
      gap: 2rem;
    }
    
    .logo {
      font-size: 2rem;
      font-weight: 900;
      color: var(--primary);
      cursor: pointer;
      letter-spacing: -1.5px;
    }
    
    .location-picker {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      border-radius: 8px;
      cursor: pointer;
      transition: var(--transition);
    }
    
    .location-picker:hover {
      background: var(--bg-light);
    }
    
    .location-text {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-muted);
      max-width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .arrow {
      font-size: 0.6rem;
      opacity: 0.5;
    }
    
    .center-section {
      flex: 1;
      max-width: 500px;
      margin: 0 2rem;
    }
    
    .search-bar {
      display: flex;
      align-items: center;
      background: var(--bg-light);
      padding: 0.75rem 1rem;
      border-radius: 12px;
      border: 1px solid var(--border);
    }
    
    .search-icon {
      margin-right: 0.75rem;
      opacity: 0.5;
    }
    
    .search-bar input {
      border: none;
      background: transparent;
      width: 100%;
      font-size: 0.875rem;
      outline: none;
    }
    
    .right-section {
      display: flex;
      align-items: center;
    }
    
    .header-nav {
      display: flex;
      align-items: center;
      gap: 2rem;
    }
    
    .nav-link {
      font-weight: 500;
      color: var(--text-muted);
      transition: var(--transition);
    }
    
    .nav-link:hover {
      color: var(--primary);
    }
    
    .user-profile {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
      position: relative;
    }
    
    .avatar {
      width: 36px;
      height: 36px;
      background: var(--primary);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
    }
    
    .user-name {
      font-weight: 600;
      font-size: 0.9375rem;
    }
    
    .dropdown-menu {
      position: absolute;
      top: 120%;
      right: 0;
      width: 200px;
      padding: 0.5rem;
      z-index: 10;
    }
    
    /* Notification Bell Styles */
    .notification-bell {
      position: relative;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--bg-light);
      transition: var(--transition);
      margin-right: 0.5rem;
    }
    .notification-bell:hover { background: rgba(255,82,49,0.1); }
    .bell-icon { font-size: 1.25rem; }
    .notif-badge {
      position: absolute; top: -2px; right: -2px; background: var(--primary); color: white;
      font-size: 0.65rem; font-weight: 800; width: 18px; height: 18px;
      display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 2px solid white;
    }
    .notif-menu {
      width: 320px; right: -10px; top: 130%; padding: 0; overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 1px solid var(--border);
    }
    .notif-header { padding: 1rem; border-bottom: 1px solid var(--border); background: var(--bg-light); }
    .notif-header h4 { margin: 0; font-size: 0.95rem; font-weight: 800; }
    .notif-list { max-height: 300px; overflow-y: auto; }
    .notif-item { display: flex; gap: 1rem; padding: 1rem; border-bottom: 1px solid var(--border); transition: var(--transition); }
    .notif-item:hover { background: rgba(255,82,49,0.02); }
    .notif-item.unread { background: rgba(255,82,49,0.05); }
    .notif-icon { font-size: 1.5rem; }
    .notif-text strong { display: block; font-size: 0.9rem; color: var(--text-main); margin-bottom: 0.25rem; }
    .notif-text p { margin: 0; font-size: 0.8rem; color: var(--text-muted); line-height: 1.4; }

    
    .dropdown-menu a, .dropdown-menu button {
      display: block;
      width: 100%;
      padding: 0.75rem 1rem;
      text-align: left;
      border-radius: 8px;
      transition: var(--transition);
    }
    
    .dropdown-menu a:hover, .dropdown-menu button:hover {
      background: var(--bg-light);
      color: var(--primary);
    }
    
    .cart-pill {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--secondary);
      color: white;
      padding: 0.6rem 1rem;
      border-radius: 12px;
      cursor: pointer;
      position: relative;
    }
    
    .cart-count {
      background: var(--primary);
      color: white;
      font-size: 0.75rem;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 6px;
      margin-left: 0.25rem;
    }
    
    .main-content {
      padding-top: 2rem;
      padding-bottom: 5rem;
      flex: 1;
    }
    
    .main-footer {
      background: #101012;
      color: white;
      padding: 4rem 0 2rem;
      margin-top: auto;
    }
    
    .footer-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 3rem;
      margin-bottom: 3rem;
    }
    
    .footer-col h4 {
      color: white;
      margin-bottom: 1.5rem;
      font-size: 1.125rem;
    }
    
    .footer-col a {
      display: block;
      color: #9ca3af;
      margin-bottom: 0.75rem;
      font-size: 0.875rem;
    }
    
    .footer-col a:hover {
      color: white;
    }
    
    .footer-bottom {
      padding-top: 2rem;
      border-top: 1px solid #27272a;
      text-align: center;
      color: #71717a;
      font-size: 0.875rem;
    }
    
    @media (max-width: 1024px) {
      .center-section { display: none; }
      .footer-grid { grid-template-columns: 1fr 1fr; }
    }
    
    @media (max-width: 640px) {
      .location-picker, .nav-link { display: none; }
      .footer-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class CustomerLayoutComponent {
  private authService = inject(AuthService);
  private cartService = inject(CartService);
  private locationService = inject(LocationService);
  private searchService = inject(SearchService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  user = this.authService.currentUser;
  cart = this.cartService.cart;
  showUserMenu = false;
  showNotifications = false;
  notifications = signal<AppNotification[]>([]);

  private systemOffer: AppNotification = {
    id: 'system-1',
    restaurantId: 'system',
    restaurantName: 'QuickBite',
    title: 'Exclusive Offer!',
    message: 'Use code QUICK20 on Fast Delivery to get 20% off.',
    status: 'APPROVED',
    createdAt: new Date().toISOString()
  };

  userFirstName = computed(() => this.user()?.fullName?.split(' ')[0] || 'User');
  userInitial = computed(() => this.user()?.fullName?.charAt(0) || 'U');
  locationAddress = this.locationService.address;

  constructor() {
    this.fetchNotifications();
    // Refresh every minute
    setInterval(() => this.fetchNotifications(), 60000);
  }

  fetchNotifications() {
    this.notificationService.getApprovedNotifications().subscribe({
      next: (notes) => {
        // Merge system offer with live notes, prioritizing live ones
        this.notifications.set([...notes, this.systemOffer]);
      },
      error: (err) => {
        console.error('Error fetching customer notifications', err);
        this.notifications.set([this.systemOffer]);
      }
    });
  }

  onLogout() {
    this.authService.logout();
  }

  onDetectLocation() {
    this.locationService.detectLocation();
  }

  onSearch(query: string) {
    this.searchService.setQuery(query);
    this.router.navigate(['/customer']);
  }
}
