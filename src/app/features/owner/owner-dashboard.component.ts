import { Component, inject, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { RestaurantService } from '../../core/services/restaurant.service';
import { OrderService } from '../../core/services/order.service';
import { MenuService } from '../../core/services/menu.service';
import { Order, Restaurant } from '../../core/models';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="owner-container">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="brand">
          <div class="logo-shield">🍕</div>
          <h1>Owner Central</h1>
        </div>

        <div class="outlet-selector card">
          <label class="label-tiny">ACTIVE OUTLET</label>
          <div class="selector-row">
            <select [ngModel]="selectedRestaurantId()" (ngModelChange)="selectedRestaurantId.set($event); onRestaurantChange()">
              @for (res of myRestaurants(); track res.id) {
                <option [value]="res.id">{{ res.name }} ({{ res.isApproved ? 'Approved' : 'Pending' }})</option>
              }
            </select>
            <button class="btn-add" (click)="showAddModal.set(true)" title="Add Restaurant">+</button>
          </div>
        </div>

        <nav class="nav-menu">
          <button 
            class="nav-item" 
            [class.active]="activeTab() === 'overview'"
            (click)="activeTab.set('overview')"
          >
            <span class="icon">📊</span> Overview
          </button>
          <button 
            class="nav-item" 
            [class.active]="activeTab() === 'live'"
            (click)="activeTab.set('live')"
          >
            <span class="icon">🛍️</span> Live Orders
          </button>
          <button 
            class="nav-item" 
            [class.active]="activeTab() === 'menu'"
            (click)="activeTab.set('menu')"
          >
            <span class="icon">🍴</span> Menu Editor
          </button>
          <button 
            class="nav-item" 
            [class.active]="activeTab() === 'restaurant'"
            (click)="activeTab.set('restaurant')"
          >
            <span class="icon">🏠</span> My Restaurant
          </button>
        </nav>

        <div class="sidebar-footer">
          <button class="logout-btn" (click)="logout()">
            <span class="icon">🚪</span> Exit Dashboard
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <header class="hub-header">
          <h1>Welcome back, {{ (authService.currentUser()?.fullName || 'Partner').split(' ')[0] }}</h1>
          <p>Here's what's happening today</p>
        </header>

        <div class="content-body">
          @if (myRestaurants().length === 0 && !loading()) {
            <div class="placeholder-msg card animate-fade-in">
              <div class="icon-big">🏠</div>
              <h2>No Restaurants Found</h2>
              <p>You haven't registered any outlets yet. Click the <b>+</b> button to add one, or use the button below to seed test data!</p>
              <button class="btn-primary" style="margin-top: 1.5rem; background: #22c55e;" (click)="seedMyOutlets()">🌱 Seed My Outlets</button>
            </div>
          }

          @if (loading()) {
            <div class="loading-overlay">
              <div class="spinner"></div>
            </div>
          }

          @if (myRestaurants().length > 0) {
            <!-- Stats Cards -->
            <div class="stats-grid">
              <div class="stat-card animate-fade-in">
                <div class="stat-val">₹{{ todayRevenue().toLocaleString() }}</div>
                <div class="stat-label">TODAY'S REVENUE</div>
              </div>
              <div class="stat-card animate-fade-in" style="animation-delay: 0.1s">
                <div class="stat-val">{{ activeOrdersCount() }}</div>
                <div class="stat-label">ACTIVE ORDERS</div>
              </div>
              <div class="stat-card animate-fade-in" style="animation-delay: 0.2s">
                <div class="stat-val">{{ avgRating() }}</div>
                <div class="stat-label">AVG RATING ({{ reviewCount() }})</div>
              </div>
            </div>

            @if (activeTab() === 'overview') {
              <section class="overview-section card animate-fade-in">
                <div class="section-header">
                  <h2 class="section-title">Upcoming Orders</h2>
                  <button class="btn-ghost" (click)="activeTab.set('live')">View All</button>
                </div>

                <div class="table-container">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>ORDER ID</th>
                        <th>ITEMS</th>
                        <th>TOTAL</th>
                        <th>STATUS</th>
                        <th>ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      @if (currentOrders().length === 0) {
                        <tr>
                          <td colspan="5" style="text-align:center; padding: 2rem; color: #8c7a6e;">No upcoming orders yet</td>
                        </tr>
                      }
                      @for (order of currentOrders(); track order.id) {
                        <tr>
                          <td class="id-cell">#{{ order.id.substring(0,8) }}</td>
                          <td>{{ order.items.length }} Items</td>
                          <td>₹{{ order.totalAmount }}</td>
                          <td><span class="status-badge">{{ order.status }}</span></td>
                          <td>
                            <div class="action-cell">
                              <select class="status-select" #statusSelect [value]="order.status">
                                <option value="PLACED">Placed</option>
                                <option value="CONFIRMED">Confirmed</option>
                                <option value="PREPARING">Preparing</option>
                                <option value="READY">Ready</option>
                                <option value="PICKED_UP">Picked Up</option>
                                <option value="DELIVERED">Delivered</option>
                              </select>
                              <button class="btn-update" (click)="updateStatus(order.id, statusSelect.value)">Update</button>
                            </div>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </section>
            }

            @if (activeTab() === 'live') {
              <section class="live-orders-section animate-fade-in">
                <h2 class="section-title" style="margin-bottom: 2rem;">Active Orders</h2>
                <div class="card" style="padding: 0;">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>ORDER ID</th>
                        <th>TIME</th>
                        <th>ITEMS</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (order of activeOrders(); track order.id) {
                        <tr>
                          <td class="id-cell">#{{ order.id.substring(0,8) }}</td>
                          <td>{{ order.createdAt | date:'shortTime' }}</td>
                          <td>{{ order.items.length }} Items</td>
                          <td><span class="status-badge">{{ order.status }}</span></td>
                        </tr>
                      } @empty {
                        <tr>
                          <td colspan="4" style="text-align:center; padding: 3rem; color: #8c7a6e;">No active orders at the moment</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </section>
            }

            @if (activeTab() === 'menu') {
              <section class="menu-editor-section animate-fade-in">
                <h2 class="section-title" style="margin-bottom: 2rem;">Menu Management</h2>
                <div class="menu-management-header">
                  <button class="btn-menu-action" (click)="showCategoryModal.set(true)">Add Category</button>
                  <button class="btn-menu-action dark" (click)="showItemModal.set(true)">Add Item</button>
                </div>

                <div class="categories-grid">
                  @for (cat of menuCategories(); track cat.categoryId) {
                    <div class="category-card">
                      <h3 class="cat-title">{{ cat.name }}</h3>
                      <p class="cat-subtitle">{{ cat.description }}</p>

                      <div class="items-list">
                        @for (item of cat.items; track item.id) {
                          <div class="item-row">
                            <img [src]="item.imageUrl || 'assets/dish-placeholder.png'" class="item-img" alt="dish">
                            <div class="item-details">
                              <h4>{{ item.name }}</h4>
                              <p>{{ item.description }}</p>
                              <div class="item-price">₹{{ item.price }}</div>
                            </div>
                            <input type="checkbox" class="item-checkbox" [checked]="item.isAvailable" (change)="toggleItem(item.id)">
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              </section>
            }

            @if (activeTab() === 'restaurant') {
              <section class="profile-section card animate-fade-in">
                <div class="section-header">
                  <h2 class="section-title">Restaurant Profile</h2>
                  <button class="btn-menu-action dark" (click)="toggleRestaurantStatus()">
                    {{ currentRestaurant()?.isOpen ? 'Close Restaurant' : 'Open Restaurant' }}
                  </button>
                </div>
                <div class="profile-main" style="display:flex; gap:3rem; margin-top:2rem;">
                  <div class="profile-img-big" style="width:300px; height:200px; border-radius:24px; overflow:hidden;">
                    <img [src]="currentRestaurant()?.imageUrl" alt="res" style="width:100%; height:100%; object-fit:cover;">
                  </div>
                  <div class="profile-details-grid" style="flex:1; display:grid; grid-template-columns:1fr 1fr; gap:2rem;">
                    <div class="info-row">
                      <label>NAME</label>
                      <span>{{ currentRestaurant()?.name }}</span>
                    </div>
                    <div class="info-row">
                      <label>CUISINE</label>
                      <span>{{ currentRestaurant()?.cuisine }}</span>
                    </div>
                    <div class="info-row" style="grid-column: span 2;">
                      <label>ADDRESS</label>
                      <span>{{ currentRestaurant()?.address }}, {{ currentRestaurant()?.city }}</span>
                    </div>
                  </div>
                </div>
              </section>
            }
          }
        </div>
      </main>

      <!-- MODALS -->

      <!-- Add Restaurant Modal -->
      @if (showAddModal()) {
        <div class="modal-overlay animate-fade-in">
          <div class="modal-card">
            <div class="modal-header">
              <h2>Register New Outlet</h2>
              <button class="close-btn" (click)="showAddModal.set(false)">×</button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>Restaurant Name</label>
                <input type="text" [(ngModel)]="newRestaurant.name" name="name" placeholder="e.g. Pizza Paradise">
              </div>
              <div class="form-group">
                <label>Cuisine</label>
                <input type="text" [(ngModel)]="newRestaurant.cuisine" name="cuisine" placeholder="e.g. Italian, Bakery">
              </div>
              <div class="form-group">
                <label>Description</label>
                <textarea [(ngModel)]="newRestaurant.description" name="description" placeholder="Short description of your outlet"></textarea>
              </div>
              <div class="form-group">
                <label>City</label>
                <input type="text" [(ngModel)]="newRestaurant.city" name="city" placeholder="e.g. Bangalore">
              </div>
              <div class="form-group">
                <label>Full Address</label>
                <textarea [(ngModel)]="newRestaurant.address" name="address" placeholder="Store location details..."></textarea>
              </div>
              <div class="form-group">
                <label>Contact Phone</label>
                <input type="text" [(ngModel)]="newRestaurant.phone" name="phone" placeholder="+91 ...">
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" (click)="showAddModal.set(false)">Cancel</button>
              <button class="btn-submit" (click)="submitNewRestaurant()">Submit for Approval</button>
            </div>
          </div>
        </div>
      }

      <!-- Category Modal -->
      @if (showCategoryModal()) {
        <div class="modal-overlay animate-fade-in">
          <div class="modal-card small">
            <div class="modal-header">
              <h2>{{ editingCategory() ? 'Edit Category' : 'New Category' }}</h2>
              <button class="close-btn" (click)="showCategoryModal.set(false)">×</button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>Category Name</label>
                <input #catName [value]="editingCategory()?.name || ''" placeholder="e.g. Desserts">
              </div>
              <div class="form-group">
                <label>Description</label>
                <input #catDesc [value]="editingCategory()?.description || ''" placeholder="Optional tag line">
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-submit" (click)="saveCategory(catName.value, catDesc.value)">Save Category</button>
            </div>
          </div>
        </div>
      }

      <!-- Item Modal -->
      @if (showItemModal()) {
        <div class="modal-overlay animate-fade-in">
          <div class="modal-card">
            <div class="modal-header">
              <h2>{{ editingItem()?.id ? 'Edit Item' : 'New Menu Item' }}</h2>
              <button class="close-btn" (click)="showItemModal.set(false)">×</button>
            </div>
            <div class="modal-body">
               <!-- Simple Form for Item -->
               <div class="form-grid">
                  <div class="form-group">
                    <label>Item Name</label>
                    <input #iName [value]="editingItem()?.name || ''" placeholder="Dish name">
                  </div>
                  <div class="form-group">
                    <label>Price (₹)</label>
                    <input #iPrice type="number" [value]="editingItem()?.price || 0">
                  </div>
                  <div class="form-group full">
                    <label>Description</label>
                    <textarea #iDesc [value]="editingItem()?.description || ''"></textarea>
                  </div>
                  <div class="form-group">
                    <label>Image URL</label>
                    <input #iImg [value]="editingItem()?.imageUrl || ''" placeholder="https://...">
                  </div>
                  <div class="form-group row">
                    <label>Vegetarian?</label>
                    <input #iVeg type="checkbox" [checked]="editingItem()?.isVeg">
                  </div>
               </div>
            </div>
            <div class="modal-footer">
              <button class="btn-submit" (click)="saveMenuItem({
                categoryId: editingItem()?.categoryId,
                name: iName.value,
                price: iPrice.value,
                description: iDesc.value,
                imageUrl: iImg.value,
                isVeg: iVeg.checked
              })">Save Item</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .owner-container {
      display: flex;
      height: 100vh;
      background: #fdfaf7;
      color: #3d2b1f;
      font-family: 'Outfit', 'Inter', sans-serif;
    }

    /* Sidebar */
    .sidebar {
      width: 280px;
      background: #fff4e5;
      display: flex; flex-direction: column;
      padding: 2.5rem 1.5rem;
      border-right: 1px solid #f0e0d0;
    }

    .brand { display: flex; align-items: center; gap: 1rem; margin-bottom: 3.5rem; }
    .logo-shield { font-size: 1.8rem; background: white; padding: 10px; border-radius: 16px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
    .brand h1 { font-size: 1.6rem; font-weight: 900; color: #3d2b1f; letter-spacing: -1px; }

    .outlet-selector {
      background: white;
      padding: 1.25rem;
      border-radius: 20px;
      margin-bottom: 2.5rem;
      box-shadow: 0 4px 15px rgba(61, 43, 31, 0.04);
    }
    .label-tiny { font-size: 0.65rem; font-weight: 800; color: #8c7a6e; text-transform: uppercase; letter-spacing: 1.2px; display: block; margin-bottom: 0.75rem; }
    .selector-row { display: flex; gap: 0.5rem; }
    .selector-row select { flex: 1; padding: 8px 12px; border-radius: 10px; border: 1px solid #f0e0d0; font-weight: 600; background: white; color: #3d2b1f; }
    
    .btn-add {
      background: #3d2b1f; color: white; border: none; width: 40px; height: 40px; min-width: 40px;
      border-radius: 12px; font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: all 0.2s;
    }
    .btn-add:hover { transform: translateY(-2px); opacity: 0.9; }

    .nav-menu { display: flex; flex-direction: column; gap: 0.5rem; flex: 1; }
    .nav-item {
      display: flex; align-items: center; gap: 1rem; width: 100%; padding: 14px 18px;
      border: none; background: transparent; color: #8c7a6e; border-radius: 14px;
      font-weight: 700; cursor: pointer; transition: all 0.2s; text-align: left;
    }
    .nav-item:hover { background: rgba(255,255,255,0.5); }
    .nav-item.active {
      background: #ff5231; color: white;
      box-shadow: 0 8px 20px rgba(255, 82, 49, 0.2);
    }

    .sidebar-footer { margin-top: auto; }
    .logout-btn {
      width: 100%; padding: 14px; background: #3d2b1f; border: none; color: white;
      border-radius: 14px; display: flex; align-items: center; justify-content: center;
      gap: 0.75rem; cursor: pointer; font-weight: 800;
    }

    /* Main Content */
    .main-content { flex: 1; padding: 3.5rem 4.5rem; overflow-y: auto; }
    .hub-header { margin-bottom: 3rem; }
    .hub-header h1 { font-size: 2.2rem; font-weight: 900; color: #3d2b1f; margin-bottom: 0.25rem; }
    .hub-header p { color: #8c7a6e; font-size: 1.1rem; font-weight: 500; }

    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; margin-bottom: 3.5rem; }
    .stat-card {
      background: white; padding: 2rem; border-radius: 24px; text-align: center;
      border: 1px solid #f8e8d8; box-shadow: 0 10px 30px rgba(61, 43, 31, 0.03);
    }
    .stat-val { font-size: 1.8rem; font-weight: 900; color: #3d2b1f; margin-bottom: 0.4rem; }
    .stat-label { font-size: 0.65rem; font-weight: 800; color: #8c7a6e; letter-spacing: 1px; text-transform: uppercase; }

    .card { background: white; border: 1px solid #f8e8d8; border-radius: 24px; padding: 2rem; box-shadow: 0 10px 30px rgba(61, 43, 31, 0.03); }

    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .section-title { font-size: 1.4rem; font-weight: 900; color: #3d2b1f; margin: 0; }
    .btn-ghost { background: #fff4e5; color: #8c7a6e; border: none; padding: 8px 16px; border-radius: 10px; font-weight: 800; cursor: pointer; }

    .data-table { width: 100%; border-collapse: collapse; text-align: left; }
    .data-table th { padding: 1rem; color: #8c7a6e; font-size: 0.75rem; font-weight: 800; border-bottom: 2px solid #fdfaf7; text-transform: uppercase; }
    .data-table td { padding: 1.25rem 1rem; font-weight: 700; color: #3d2b1f; border-bottom: 1px solid #fdfaf7; }
    .id-cell { color: #8c7a6e; font-weight: 600; font-family: 'JetBrains Mono', monospace; font-size: 0.9rem; }

    .status-badge { font-size: 0.65rem; font-weight: 900; text-transform: uppercase; color: #3d2b1f; }

    .action-cell { display: flex; gap: 0.5rem; align-items: center; }
    .status-select { padding: 6px 10px; border-radius: 8px; border: 1px solid #f0e0d0; background: #fff4e5; font-weight: 700; color: #3d2b1f; cursor: pointer; font-size: 0.8rem; }
    .btn-update { background: #6b4f3b; color: white; border: none; padding: 8px 16px; border-radius: 10px; font-weight: 800; cursor: pointer; font-size: 0.8rem; }

    /* Menu Editor */
    .menu-management-header { display: flex; gap: 1rem; margin-bottom: 2.5rem; }
    .btn-menu-action { background: #fff4e5; color: #3d2b1f; border: none; padding: 10px 20px; border-radius: 12px; font-weight: 800; cursor: pointer; transition: 0.2s; }
    .btn-menu-action.dark { background: #6b4f3b; color: white; }

    .category-card { background: white; border-radius: 24px; padding: 2rem; border: 1px solid #f8e8d8; margin-bottom: 2rem; max-width: 450px; }
    .cat-title { font-size: 1.5rem; font-weight: 900; color: #3d2b1f; margin: 0 0 0.25rem 0; }
    .cat-subtitle { color: #8c7a6e; font-weight: 500; font-size: 0.9rem; margin-bottom: 2rem; }

    .item-row { display: flex; align-items: center; gap: 1.25rem; margin-bottom: 1.5rem; }
    .item-img { width: 60px; height: 60px; border-radius: 12px; object-fit: cover; }
    .item-details { flex: 1; }
    .item-details h4 { margin: 0; font-size: 1rem; font-weight: 800; }
    .item-details p { margin: 2px 0; color: #8c7a6e; font-size: 0.8rem; font-weight: 600; }
    .item-price { font-weight: 900; color: #3d2b1f; font-size: 0.9rem; }
    
    .item-checkbox { width: 18px; height: 18px; border: 2px solid #f0e0d0; border-radius: 4px; accent-color: #6b4f3b; cursor: pointer; }

    /* Modals */
    .modal-overlay { position: fixed; inset: 0; background: rgba(61, 43, 31, 0.4); backdrop-filter: blur(8px); z-index: 1000; display: flex; align-items: center; justify-content: center; }
    .modal-card { background: white; width: 500px; border-radius: 32px; padding: 2.5rem; box-shadow: 0 25px 80px rgba(0,0,0,0.15); }
    .modal-card h2 { font-size: 1.5rem; font-weight: 900; margin-top: 0; margin-bottom: 1.5rem; }
    .form-group { margin-bottom: 1.25rem; }
    .form-group label { display: block; font-size: 0.75rem; font-weight: 800; color: #8c7a6e; text-transform: uppercase; margin-bottom: 0.5rem; }
    .form-group input, .form-group textarea { width: 100%; padding: 12px; border-radius: 12px; border: 1px solid #f0e0d0; font-family: inherit; font-weight: 600; }
    .modal-footer { 
      display: flex; 
      justify-content: flex-end; 
      gap: 1rem; 
      margin-top: 2rem; 
      padding-top: 1.5rem;
      border-top: 1px solid #f0e0d0;
    }
    .btn-submit { 
      background: #3d2b1f; 
      color: white; 
      border: none; 
      padding: 12px 28px; 
      border-radius: 14px; 
      font-weight: 800; 
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-submit:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(61,43,31,0.2); }
    .btn-cancel { background: transparent; border: none; font-weight: 800; color: #8c7a6e; cursor: pointer; padding: 12px; }

    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class OwnerDashboardComponent {
  public authService = inject(AuthService);
  public restaurantService = inject(RestaurantService);
  public orderService = inject(OrderService);
  public menuService = inject(MenuService);
  public http = inject(HttpClient);
  public router = inject(Router);

  activeTab = signal('overview');
  loading = signal(false);

  myRestaurants = signal<Restaurant[]>([]);
  selectedRestaurantId = signal<string | null>(null);
  
  currentOrders = signal<Order[]>([]);
  stats = signal<any>(null);
  menuCategories = signal<any[]>([]);

  // Add Restaurant Modal
  showAddModal = signal(false);
  newRestaurant = {
    name: '',
    description: '',
    cuisine: '',
    address: '',
    city: '',
    phone: '',
    latitude: 12.9716, // Default to Bangalore
    longitude: 77.5946
  };

  // Menu Editor state
  editingCategory = signal<any>(null);
  editingItem = signal<any>(null);
  showCategoryModal = signal(false);
  showItemModal = signal(false);
  
  // Computed Stats
  currentRestaurant = computed(() => 
    this.myRestaurants().find(r => r.id === this.selectedRestaurantId())
  );

  todayRevenue = computed(() => this.stats()?.todayRevenue || 0);
  activeOrdersCount = computed(() => this.stats()?.activeOrdersCount || 0);
  totalOrdersToday = computed(() => this.stats()?.totalOrdersToday || 0);

  upcomingOrders = computed(() => {
    return this.currentOrders().filter(o => o.status === 'PLACED');
  });

  activeOrders = computed(() => {
    return this.currentOrders().filter(o => 
       o.status === 'CONFIRMED' || o.status === 'PREPARING' || o.status === 'READY'
    );
  });

  recentOrders = computed(() => this.upcomingOrders().slice(0, 5));

  avgRating = computed(() => this.currentRestaurant()?.avgRating || 0.0);
  reviewCount = computed(() => this.currentRestaurant()?.reviewCount || 0);

  constructor() {
    this.refreshAll();
    
    // Auto-refresh every 30 seconds for live orders
    setInterval(() => this.fetchRestaurantData(), 30000);
  }

  refreshAll() {
    this.loading.set(true);
    this.restaurantService.getMyRestaurants().subscribe({
      next: (data: Restaurant[]) => {
        this.myRestaurants.set(data);
        if (data.length > 0 && !this.selectedRestaurantId()) {
          this.selectedRestaurantId.set(data[0].id);
        }
        this.fetchRestaurantData();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error fetching restaurants', err);
        this.loading.set(false);
      }
    });
  }

  onRestaurantChange() {
    this.fetchRestaurantData();
  }

  fetchRestaurantData() {
    const id = this.selectedRestaurantId();
    if (!id) return;

    // Fetch Orders
    this.orderService.getRestaurantOrders(id).subscribe({
      next: (orders: Order[]) => this.currentOrders.set(orders),
      error: (err) => console.error('Error fetching orders', err)
    });

    // Fetch Stats
    this.orderService.getRestaurantStats(id).subscribe({
      next: (data: any) => this.stats.set(data),
      error: (err) => console.error('Error fetching stats', err)
    });

    // Fetch Menu if in menu tab
    if (this.activeTab() === 'menu') {
      this.fetchMenu();
    }
  }

  fetchMenu() {
    const id = this.selectedRestaurantId();
    if (!id) return;
    this.menuService.getMenu(id).subscribe({
      next: (cats: any[]) => this.menuCategories.set(cats),
      error: (err) => console.error('Error fetching menu', err)
    });
  }

  updateStatus(orderId: string, status: string) {
    this.orderService.updateOrderStatus(orderId, status).subscribe(() => {
      this.fetchRestaurantData();
    });
  }

  advanceStatus(order: Order) {
    const sequence: Record<string, string> = {
      'PLACED': 'CONFIRMED',
      'CONFIRMED': 'PREPARING',
      'PREPARING': 'READY'
    };
    const next = sequence[order.status];
    if (next) this.updateStatus(order.id, next);
  }

  // Restaurant Management
  submitNewRestaurant() {
    this.loading.set(true);
    this.restaurantService.registerRestaurant(this.newRestaurant).subscribe(() => {
      this.showAddModal.set(false);
      this.refreshAll();
      alert('Restaurant registration submitted! Waiting for Admin approval.');
    });
  }

  toggleRestaurantStatus() {
    const res = this.currentRestaurant();
    if (!res) return;
    this.restaurantService.toggleRestaurantStatus(res.id).subscribe(() => this.refreshAll());
  }

  // Menu Management
  saveCategory(name: string, description: string) {
    const id = this.selectedRestaurantId();
    if (!id) return;
    
    if (this.editingCategory()) {
       this.menuService.updateCategory(this.editingCategory().categoryId, { restaurantId: id, name, description }).subscribe(() => {
         this.showCategoryModal.set(false);
         this.fetchMenu();
       });
    } else {
       this.menuService.addCategory({ restaurantId: id, name, description }).subscribe(() => {
         this.showCategoryModal.set(false);
         this.fetchMenu();
       });
    }
  }

  deleteCategory(catId: string) {
    if (confirm('Delete this category and all its items?')) {
      this.menuService.deleteCategory(catId).subscribe(() => this.fetchMenu());
    }
  }

  saveMenuItem(itemData: any) {
    const id = this.selectedRestaurantId();
    if (!id) return;
    itemData.restaurantId = id;

    if (this.editingItem()) {
      this.menuService.updateMenuItem(this.editingItem().id, itemData).subscribe(() => {
        this.showItemModal.set(false);
        this.fetchMenu();
      });
    } else {
      this.menuService.addMenuItem(itemData).subscribe(() => {
        this.showItemModal.set(false);
        this.fetchMenu();
      });
    }
  }

  deleteItem(itemId: string) {
    if (confirm('Delete this item?')) {
      this.menuService.deleteMenuItem(itemId).subscribe(() => this.fetchMenu());
    }
  }

  toggleItem(itemId: string) {
    this.menuService.toggleItemAvailability(itemId).subscribe(() => this.fetchMenu());
  }

  seedMyOutlets() {
    this.loading.set(true);
    this.http.post('http://localhost:5000/api/v1/restaurants/seed-my-outlets', {}).subscribe({
      next: () => {
        this.refreshAll();
        alert('SUCCESS: 5 outlets seeded with test orders! Refreshing dashboard...');
      },
      error: (err) => {
        this.loading.set(false);
        console.error('Seeding failed:', err);
        alert('ERROR: Seeding failed. Please ensure the Restaurant service and Gateway are running. Details in console.');
      }
    });
  }

  logout() {
    this.authService.logout();
  }
}
