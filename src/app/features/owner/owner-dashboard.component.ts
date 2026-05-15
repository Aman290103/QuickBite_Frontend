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
import { NotificationService } from '../../core/services/notification.service';
import { AppNotification } from '../../core/models';

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="owner-container">
      <!-- Toast Notification -->
      @if (showToast()) {
        <div class="toast-wrapper">
          <div class="toast glass animate-fade-in" [class.error]="isError()" [class.success]="!isError()">
            <span class="toast-icon">{{ isError() ? '✕' : '✓' }}</span>
            <span class="toast-text">{{ toastMessage() }}</span>
          </div>
        </div>
      }

      <!-- Sidebar -->
      <aside class="sidebar glass">
        <div class="brand">
          <div class="logo-shield">🍕</div>
          <div class="brand-text">
            <h1>QuickBite</h1>
            <span>OWNER PORTAL</span>
          </div>
        </div>

        <div class="outlet-selector">
          <label class="label-tiny">Manage Outlet</label>
          <div class="selector-container">
            <select [ngModel]="selectedRestaurantId()" (ngModelChange)="selectedRestaurantId.set($event); onRestaurantChange()">
              @for (res of myRestaurants(); track res.id) {
                <option [value]="res.id">{{ res.name }}</option>
              }
            </select>
            <button class="btn-add-mini" (click)="showAddModal.set(true)" title="Register New">+</button>
          </div>
          @if (currentRestaurant(); as res) {
            <div class="outlet-status" [class.approved]="res.isApproved">
              {{ res.isApproved ? '● Approved' : '● Pending Approval' }}
            </div>
          }
        </div>

        <nav class="nav-menu">
          <button class="nav-item" [class.active]="activeTab() === 'overview'" (click)="activeTab.set('overview')">
            <span class="icon">📊</span> Overview
          </button>
          <button class="nav-item" [class.active]="activeTab() === 'live'" (click)="activeTab.set('live')">
            <span class="icon">⚡</span> Live Orders
            @if (activeOrdersCount() > 0) {
              <span class="badge">{{ activeOrdersCount() }}</span>
            }
          </button>
          <button class="nav-item" [class.active]="activeTab() === 'broadcast'" (click)="activeTab.set('broadcast')">
            <span class="icon">📢</span> Broadcast
          </button>
          <button class="nav-item" [class.active]="activeTab() === 'restaurant'" (click)="activeTab.set('restaurant')">
            <span class="icon">🏠</span> Restaurant Profile
          </button>
        </nav>

        <div class="sidebar-footer">
          <button class="exit-btn" (click)="logout()">
            <span class="icon">🏁</span> Exit Dashboard
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <header class="hub-header">
          <div class="header-welcome">
            <h1>Welcome, {{ (authService.currentUser()?.fullName || 'Partner').split(' ')[0] }}</h1>
            <p>Your business summary for today</p>
          </div>
          <div class="header-actions">
             <div class="date-pill">{{ today | date:'fullDate' }}</div>
          </div>
        </header>

        <div class="content-body">
          @if (myRestaurants().length === 0 && !loading()) {
            <div class="empty-state-card glass animate-fade-in">
              <div class="empty-icon">🏪</div>
              <h2>Ready to grow?</h2>
              <p>Register your first restaurant to start receiving orders and managing your menu.</p>
              <div class="empty-actions">
                <button class="btn-primary" (click)="showAddModal.set(true)">Register Restaurant</button>
                <button class="btn-outline" (click)="seedMyOutlets()">Seed Test Data</button>
              </div>
            </div>
          }

          @if (loading()) {
            <div class="loader-overlay">
              <div class="loader-spinner"></div>
            </div>
          }

          @if (myRestaurants().length > 0) {
            <!-- Premium Stats Grid -->
            <div class="stats-grid">
              <div class="stat-card glass animate-fade-in" style="--delay: 0.1s">
                <div class="stat-icon revenue">₹</div>
                <div class="stat-info">
                  <div class="stat-val">₹{{ todayRevenue().toLocaleString() }}</div>
                  <div class="stat-label">TODAY'S REVENUE</div>
                </div>
              </div>
              <div class="stat-card glass animate-fade-in" style="--delay: 0.2s">
                <div class="stat-icon orders">⚡</div>
                <div class="stat-info">
                  <div class="stat-val">{{ activeOrdersCount() }}</div>
                  <div class="stat-label">ACTIVE ORDERS</div>
                </div>
              </div>
              <div class="stat-card glass animate-fade-in" style="--delay: 0.3s">
                <div class="stat-icon rating">⭐</div>
                <div class="stat-info">
                  <div class="stat-val">{{ avgRating() }}</div>
                  <div class="stat-label">AVG RATING ({{ reviewCount() }})</div>
                </div>
              </div>
            </div>

            @if (activeTab() === 'overview') {
              <section class="section-container animate-fade-in">
                <div class="section-header">
                  <h2 class="section-title">Newest Orders</h2>
                  <button class="text-link" (click)="activeTab.set('live')">View All Orders →</button>
                </div>

                <div class="table-card glass">
                  <table class="premium-table">
                    <thead>
                      <tr>
                        <th>ORDER ID</th>
                        <th>ORDER DETAILS</th>
                        <th>VALUE</th>
                        <th>STATUS</th>
                        <th>ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      @if (currentOrders().length === 0) {
                        <tr>
                          <td colspan="5" class="empty-table-msg">No recent orders yet</td>
                        </tr>
                      }
                      @for (order of currentOrders(); track order.id) {
                        <tr>
                          <td><span class="order-id">#{{ order.id.substring(0,8) }}</span></td>
                          <td>
                            <div class="item-stack">
                              <span class="main-text">{{ order.items.length }} Items</span>
                              <span class="sub-text">{{ order.createdAt | date:'shortTime' }}</span>
                            </div>
                          </td>
                          <td><span class="price-text">₹{{ order.totalAmount }}</span></td>
                          <td><span class="status-pill" [class]="order.status.toLowerCase()">{{ order.status }}</span></td>
                          <td>
                            @if (order.status === 'PLACED') {
                              <button class="btn-action primary" (click)="updateStatus(order.id, 'CONFIRMED')">Accept</button>
                            } @else if (order.status === 'CONFIRMED') {
                              <button class="btn-action secondary" (click)="updateStatus(order.id, 'PREPARING')">Prepare</button>
                            } @else if (order.status === 'PREPARING') {
                              <button class="btn-action success" (click)="updateStatus(order.id, 'READY')">Ready</button>
                            } @else {
                              <span class="status-waiting">In Transit</span>
                            }
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </section>
            }

            @if (activeTab() === 'live') {
              <section class="section-container animate-fade-in">
                <h2 class="section-title">Active Orders Tracking</h2>
                <div class="table-card glass">
                  <table class="premium-table">
                    <thead>
                      <tr>
                        <th>ORDER ID</th>
                        <th>EST. TIME</th>
                        <th>ITEMS</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (order of activeOrders(); track order.id) {
                        <tr>
                          <td><span class="order-id">#{{ order.id.substring(0,8) }}</span></td>
                          <td>{{ order.createdAt | date:'shortTime' }}</td>
                          <td>{{ order.items.length }} Items</td>
                          <td><span class="status-pill" [class]="order.status.toLowerCase()">{{ order.status }}</span></td>
                        </tr>
                      } @empty {
                        <tr>
                          <td colspan="4" class="empty-table-msg">All orders are up to date!</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </section>
            }

            @if (activeTab() === 'menu') {
              <section class="section-container animate-fade-in">
                <div class="section-header">
                  <h2 class="section-title">Menu Management</h2>
                  <div class="menu-header-actions">
                    <button class="btn-menu glass" (click)="showCategoryModal.set(true)">+ Add Category</button>
                    <button class="btn-menu dark" (click)="showItemModal.set(true)">+ Add New Item</button>
                  </div>
                </div>

                <div class="menu-grid">
                  @for (cat of menuCategories(); track cat.categoryId) {
                    <div class="menu-cat-card glass">
                      <div class="cat-header">
                        <div class="cat-info">
                          <h3>{{ cat.name }}</h3>
                          <p>{{ cat.description }}</p>
                        </div>
                        <div class="cat-actions">
                           <!-- Cat actions if needed -->
                        </div>
                      </div>

                      <div class="items-container">
                        @for (item of cat.items; track item.id) {
                          <div class="menu-item-row" [class.disabled]="!item.isAvailable">
                            <div class="item-img-wrapper">
                              <img [src]="item.imageUrl || 'assets/dish-placeholder.png'" alt="dish">
                            </div>
                            <div class="item-body">
                              <h4>{{ item.name }}</h4>
                              <div class="item-meta">
                                <span class="price">₹{{ item.price }}</span>
                                @if (item.isVeg) { <span class="veg-tag">VEG</span> }
                              </div>
                            </div>
                            <div class="item-toggle">
                               <label class="switch">
                                 <input type="checkbox" [checked]="item.isAvailable" (change)="toggleItem(item.id)">
                                 <span class="slider round"></span>
                               </label>
                            </div>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              </section>
            }

            @if (activeTab() === 'broadcast') {
              <section class="section-container animate-fade-in">
                <div class="section-header">
                  <h2 class="section-title">Store Announcements</h2>
                  <button class="btn-primary" (click)="showNotifyModal.set(true)">+ New Broadcast</button>
                </div>

                <div class="table-card glass">
                  <table class="premium-table">
                    <thead>
                      <tr>
                        <th>TITLE</th>
                        <th>MESSAGE</th>
                        <th>STATUS</th>
                        <th>POSTED</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (note of myNotifications(); track note.id) {
                        <tr>
                          <td><span class="bold-text">{{ note.title }}</span></td>
                          <td><span class="muted-text">{{ note.message }}</span></td>
                          <td>
                            <span class="status-pill" [class]="note.status.toLowerCase()">
                              {{ note.status }}
                            </span>
                          </td>
                          <td>{{ note.createdAt | date:'shortDate' }}</td>
                        </tr>
                      } @empty {
                        <tr>
                          <td colspan="4" class="empty-table-msg">No broadcasts yet. Reach out to your customers!</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </section>
            }

            @if (activeTab() === 'restaurant') {
              <section class="section-container animate-fade-in">
                <div class="profile-card glass">
                  <div class="profile-header">
                    <div class="profile-cover">
                      <img [src]="currentRestaurant()?.imageUrl" alt="cover">
                      <div class="profile-badge">PRO PARTNER</div>
                    </div>
                    <div class="profile-main-info">
                      <div class="profile-titles">
                        <h2>{{ currentRestaurant()?.name }}</h2>
                        <span class="cuisine-pill">{{ currentRestaurant()?.cuisine }}</span>
                      </div>
                      <button class="btn-status-toggle" [class.open]="currentRestaurant()?.isOpen" (click)="toggleRestaurantStatus()">
                        {{ currentRestaurant()?.isOpen ? '● Currently Open' : '○ Currently Closed' }}
                      </button>
                    </div>
                  </div>
                  
                  <div class="profile-grid">
                    <div class="info-box">
                      <label>LOCATION</label>
                      <p>{{ currentRestaurant()?.address }}, {{ currentRestaurant()?.city }}</p>
                    </div>
                    <div class="info-box">
                      <label>CONTACT</label>
                      <p>{{ currentRestaurant()?.phone }}</p>
                    </div>
                  </div>
                </div>
              </section>
            }
          }
        </div>
      </main>

      <!-- MODALS (kept same features, updated UI) -->
      @if (showAddModal()) {
        <div class="modal-overlay glass animate-fade-in">
          <div class="modal-content animate-slide-up">
            <div class="modal-header">
              <h2>Register New Outlet</h2>
              <button class="close-btn" (click)="showAddModal.set(false)">✕</button>
            </div>
            <div class="modal-body">
              <div class="input-grid">
                <div class="form-field">
                  <label>Restaurant Name</label>
                  <input type="text" [(ngModel)]="newRestaurant.name" placeholder="e.g. Pizza Paradise">
                </div>
                <div class="form-field">
                  <label>Cuisine Type</label>
                  <input type="text" [(ngModel)]="newRestaurant.cuisine" placeholder="e.g. Italian, Bakery">
                </div>
                <div class="form-field full">
                  <label>Description</label>
                  <textarea [(ngModel)]="newRestaurant.description" placeholder="A short catch-phrase for your outlet"></textarea>
                </div>
                <div class="form-field">
                  <label>City</label>
                  <input type="text" [(ngModel)]="newRestaurant.city" placeholder="e.g. Mathura">
                </div>
                <div class="form-field">
                  <label>Contact Phone</label>
                  <input type="text" [(ngModel)]="newRestaurant.phone" placeholder="+91 ...">
                </div>
                <div class="form-field full">
                  <label>Address Details</label>
                  <textarea [(ngModel)]="newRestaurant.address" placeholder="Complete location details..."></textarea>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-text" (click)="showAddModal.set(false)">Cancel</button>
              <button class="btn-primary" (click)="submitNewRestaurant()">Submit Registration</button>
            </div>
          </div>
        </div>
      }

      <!-- Notification Modal -->
      @if (showNotifyModal()) {
        <div class="modal-overlay glass animate-fade-in">
          <div class="modal-content animate-slide-up">
            <div class="modal-header">
              <h2>New Store Announcement</h2>
              <button class="close-btn" (click)="showNotifyModal.set(false)">✕</button>
            </div>
            <div class="modal-body">
              <div class="form-field full">
                <label>Announcement Title</label>
                <input type="text" [(ngModel)]="newNotification.title" placeholder="e.g. Weekend Flash Sale!">
              </div>
              <div class="form-field full" style="margin-top: 1.5rem">
                <label>Message Content</label>
                <textarea [(ngModel)]="newNotification.message" rows="4" placeholder="Tell your customers something exciting..."></textarea>
              </div>
              <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 1rem; font-weight: 600;">
                Note: Announcements must be reviewed by the admin team before they are sent to customers.
              </p>
            </div>
            <div class="modal-footer">
              <button class="btn-text" (click)="showNotifyModal.set(false)">Discard</button>
              <button class="btn-primary" (click)="submitNotification()">Send for Review</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .owner-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background-color: var(--bg-warm);
      color: var(--text-main);
      overflow: hidden;
    }

    /* Top Navigation Bar */
    .sidebar {
      height: 90px;
      margin: 1.5rem 1.5rem 0.5rem;
      border-radius: 24px;
      display: flex;
      flex-direction: row;
      align-items: center;
      padding: 0 2rem;
      border: 1px solid var(--border-light);
      box-shadow: var(--shadow-sm);
      gap: 2rem;
      position: sticky;
      top: 0;
      z-index: 1000;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(10px);
    }

    .brand { display: flex; align-items: center; gap: 1rem; margin-bottom: 0; padding-left: 0; }
    .logo-shield { font-size: 1.8rem; background: white; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 12px; box-shadow: var(--shadow-sm); }
    .brand-text h1 { font-size: 1.2rem; font-weight: 900; color: var(--text-main); margin: 0; line-height: 1.1; }
    .brand-text span { font-size: 0.55rem; font-weight: 800; color: var(--primary); letter-spacing: 1px; }

    .outlet-selector {
      background: rgba(255, 255, 255, 0.5);
      padding: 8px 16px;
      border-radius: 16px;
      margin-bottom: 0;
      border: 1px solid var(--border-light);
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .label-tiny { font-size: 0.5rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0; }
    .selector-container { display: flex; gap: 0.5rem; align-items: center; }
    .selector-container select { 
      padding: 6px 12px; border-radius: 10px; border: 1px solid var(--border-light); 
      font-weight: 700; background: white; color: var(--text-main); outline: none; cursor: pointer; font-size: 0.85rem;
    }
    .btn-add-mini {
      background: var(--secondary); color: white; width: 32px; height: 32px; border-radius: 10px; font-weight: 800;
    }
    .outlet-status { font-size: 0.65rem; font-weight: 700; margin-top: 0; color: #f59e0b; }
    .outlet-status.approved { color: #10b981; }

    .nav-menu { display: flex; flex-direction: row; gap: 0.5rem; flex: 1; justify-content: center; }
    .nav-item {
      display: flex; align-items: center; gap: 0.75rem; padding: 10px 18px;
      color: var(--text-muted); border-radius: 14px; font-weight: 700; transition: var(--transition);
      width: auto;
    }
    .nav-item:hover { background: rgba(255, 82, 49, 0.05); color: var(--primary); }
    .nav-item.active { background: var(--primary); color: white; box-shadow: var(--shadow-primary); }
    .badge { background: white; color: var(--primary); font-size: 0.65rem; padding: 2px 6px; border-radius: 20px; margin-left: 6px; }

    .sidebar-footer { margin-top: 0; }
    .exit-btn {
      padding: 10px 18px; background: var(--secondary); color: white;
      border-radius: 14px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 0.75rem;
      width: auto;
    }

    .main-content { flex: 1; padding: 2rem 4rem; overflow-y: auto; scroll-behavior: smooth; }
    .hub-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3.5rem; }
    .header-welcome h1 { font-size: 2.4rem; font-weight: 900; letter-spacing: -1.5px; margin-bottom: 0.25rem; }
    .header-welcome p { color: var(--text-muted); font-size: 1.1rem; font-weight: 500; }
    .date-pill { background: white; padding: 8px 20px; border-radius: 100px; font-weight: 700; border: 1px solid var(--border-light); color: var(--text-muted); font-size: 0.9rem; }

    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; margin-bottom: 4rem; }
    .stat-card {
      display: flex; align-items: center; gap: 1.5rem; padding: 1.75rem; border-radius: 28px;
      animation: fadeIn 0.6s var(--ease-out) both; animation-delay: var(--delay);
    }
    .stat-icon {
      width: 56px; height: 56px; border-radius: 18px; display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem; font-weight: 900;
    }
    .stat-icon.revenue { background: #ecfdf5; color: #10b981; }
    .stat-icon.orders { background: #eff6ff; color: #3b82f6; }
    .stat-icon.rating { background: #fffbeb; color: #f59e0b; }
    
    .stat-info .stat-val { font-size: 1.8rem; font-weight: 900; line-height: 1.1; margin-bottom: 0.25rem; }
    .stat-info .stat-label { font-size: 0.65rem; font-weight: 800; color: var(--text-muted); letter-spacing: 1px; }

    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.75rem; }
    .section-title { font-size: 1.5rem; font-weight: 900; margin: 0; }
    .text-link { color: var(--primary); font-weight: 800; font-size: 0.9rem; }

    .table-card { border-radius: 28px; overflow: hidden; }
    .premium-table { width: 100%; border-collapse: collapse; text-align: left; }
    .premium-table th { padding: 1.5rem; color: var(--text-muted); font-size: 0.7rem; font-weight: 900; letter-spacing: 1.5px; border-bottom: 1px solid var(--border-light); background: rgba(255,255,255,0.3); }
    .premium-table td { padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(240, 224, 208, 0.5); }

    .order-id { font-family: 'JetBrains Mono', monospace; font-weight: 700; color: var(--text-muted); }
    .item-stack { display: flex; flex-direction: column; }
    .item-stack .main-text { font-weight: 800; color: var(--text-main); }
    .item-stack .sub-text { font-size: 0.8rem; color: var(--text-muted); }
    .price-text { font-weight: 900; font-size: 1.1rem; }

    .status-pill {
      padding: 6px 14px; border-radius: 100px; font-size: 0.7rem; font-weight: 900; text-transform: uppercase;
    }
    .status-pill.placed { background: #fffbeb; color: #f59e0b; }
    .status-pill.confirmed { background: #eff6ff; color: #3b82f6; }
    .status-pill.preparing { background: #f5f3ff; color: #8b5cf6; }
    .status-pill.ready { background: #ecfdf5; color: #10b981; }

    .btn-action {
      padding: 8px 20px; border-radius: 12px; font-weight: 800; font-size: 0.85rem;
      transition: var(--transition);
    }
    .btn-action.primary { background: var(--primary); color: white; }
    .btn-action.secondary { background: #3d2b1f; color: white; }
    .btn-action.success { background: #10b981; color: white; }
    .btn-action:hover { transform: scale(1.05); }

    /* Menu Editor Grid */
    .menu-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 2rem; }
    .menu-cat-card { padding: 1.5rem; border-radius: 28px; }
    .cat-header { display: flex; justify-content: space-between; margin-bottom: 1.5rem; }
    .cat-info h3 { font-size: 1.3rem; margin-bottom: 0.25rem; }
    .cat-info p { font-size: 0.85rem; color: var(--text-muted); }

    .menu-item-row { display: flex; align-items: center; gap: 1.25rem; padding: 1rem; border-radius: 20px; transition: 0.2s; }
    .menu-item-row:hover { background: white; box-shadow: var(--shadow-sm); }
    .menu-item-row.disabled { opacity: 0.5; filter: grayscale(1); }
    
    .item-img-wrapper { width: 64px; height: 64px; border-radius: 14px; overflow: hidden; background: #eee; }
    .item-img-wrapper img { width: 100%; height: 100%; object-fit: cover; }
    
    .item-body { flex: 1; }
    .item-body h4 { margin: 0 0 4px 0; font-size: 1rem; }
    .item-meta { display: flex; align-items: center; gap: 10px; }
    .price { font-weight: 800; color: var(--primary); }
    .veg-tag { font-size: 0.6rem; background: #ecfdf5; color: #10b981; padding: 2px 6px; border-radius: 4px; font-weight: 900; }

    /* Toggle Switch */
    .switch { position: relative; display: inline-block; width: 44px; height: 24px; }
    .switch input { opacity: 0; width: 0; height: 0; }
    .slider { position: absolute; cursor: pointer; inset: 0; background-color: #eee; transition: .4s; }
    .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; }
    input:checked + .slider { background-color: #10b981; }
    input:checked + .slider:before { transform: translateX(20px); }
    .slider.round { border-radius: 34px; }
    .slider.round:before { border-radius: 50%; }

    /* Profile Card */
    .profile-card { border-radius: 32px; overflow: hidden; }
    .profile-cover { height: 250px; position: relative; }
    .profile-cover img { width: 100%; height: 100%; object-fit: cover; }
    .profile-badge { position: absolute; bottom: 20px; left: 20px; background: var(--primary); color: white; padding: 6px 14px; border-radius: 100px; font-weight: 800; font-size: 0.75rem; }
    
    .profile-main-info { padding: 2rem; display: flex; justify-content: space-between; align-items: flex-end; }
    .profile-titles h2 { font-size: 2.2rem; margin-bottom: 0.5rem; }
    .cuisine-pill { background: #fff4e5; color: var(--primary); padding: 4px 14px; border-radius: 100px; font-weight: 800; font-size: 0.8rem; }
    
    .btn-status-toggle { padding: 12px 24px; border-radius: 16px; font-weight: 800; background: #eee; color: #8c7a6e; }
    .btn-status-toggle.open { background: #ecfdf5; color: #10b981; }

    .profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; padding: 0 2rem 2rem; }
    .info-box { background: rgba(255,255,255,0.4); padding: 1.5rem; border-radius: 20px; }
    .info-box label { font-size: 0.65rem; font-weight: 900; color: var(--text-muted); letter-spacing: 1.2px; margin-bottom: 0.5rem; display: block; }
    .info-box p { font-weight: 700; font-size: 1.1rem; }

    /* Empty State */
    .empty-state-card { padding: 4rem; text-align: center; border-radius: 40px; margin: 2rem 0; }
    .empty-icon { font-size: 4rem; margin-bottom: 2rem; }
    .empty-actions { display: flex; gap: 1rem; justify-content: center; margin-top: 2rem; }
    .btn-outline { border: 2px solid var(--border-light); padding: 14px 28px; border-radius: 16px; font-weight: 800; }

    /* Modals Premium */
    .modal-overlay { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 2rem; background: rgba(61, 43, 31, 0.4); }
    .modal-content { background: white; width: 100%; max-width: 650px; border-radius: 40px; padding: 3rem; box-shadow: var(--shadow-lg); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
    .input-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .form-field.full { grid-column: span 2; }
    .form-field label { display: block; font-size: 0.75rem; font-weight: 800; color: var(--text-muted); margin-bottom: 0.5rem; text-transform: uppercase; }
    .form-field input, .form-field textarea { width: 100%; padding: 14px; border-radius: 16px; border: 1px solid var(--border-light); background: #fafafa; font-family: inherit; font-weight: 600; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 3rem; }

    /* Toast Premium */
    .toast-wrapper { position: fixed; top: 2rem; left: 50%; transform: translateX(-50%); z-index: 10000; }
    .toast { padding: 1rem 2rem; border-radius: 100px; display: flex; align-items: center; gap: 1rem; box-shadow: var(--shadow-lg); border: 1px solid rgba(255,255,255,0.2); }
    .toast.success { background: rgba(16, 185, 129, 0.9); color: white; }
    .toast.error { background: rgba(239, 68, 68, 0.9); color: white; }
    .toast-icon { font-size: 1.2rem; font-weight: 900; }

    .loader-overlay { display: flex; justify-content: center; padding: 5rem; }
    .loader-spinner { width: 50px; height: 50px; border: 5px solid #eee; border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
  `]

})
export class OwnerDashboardComponent {
  public authService = inject(AuthService);
  public restaurantService = inject(RestaurantService);
  public orderService = inject(OrderService);
  public menuService = inject(MenuService);
  public http = inject(HttpClient);
  public router = inject(Router);
  public notificationService = inject(NotificationService);

  activeTab = signal('overview');
  loading = signal(false);
  today = new Date();
  
  // Toast
  showToast = signal(false);
  toastMessage = signal('');
  isError = signal(false);

  myRestaurants = signal<Restaurant[]>([]);
  selectedRestaurantId = signal<string | null>(null);
  
  currentOrders = signal<Order[]>([]);
  stats = signal<any>(null);
  menuCategories = signal<any[]>([]);
  myNotifications = signal<AppNotification[]>([]);

  // Modals
  showAddModal = signal(false);
  showNotifyModal = signal(false);
  
  newNotification = {
    title: '',
    message: ''
  };
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

    // Fetch Notifications
    this.notificationService.getRestaurantNotifications(id).subscribe({
      next: (notes) => this.myNotifications.set(notes),
      error: (err) => console.error('Error fetching notifications', err)
    });
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
    this.orderService.updateOrderStatus(orderId, status).subscribe({
      next: () => {
        this.fetchRestaurantData();
        this.showSuccess('Order status updated!');
      },
      error: (err) => {
        console.error('Error updating status', err);
        this.showError('Failed to update status. Ensure you have the correct permissions.');
      }
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
         this.showSuccess('Category updated successfully!');
       });
    } else {
       this.menuService.addCategory({ restaurantId: id, name, description }).subscribe(() => {
         this.showCategoryModal.set(false);
         this.fetchMenu();
         this.showSuccess('Category added successfully!');
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
        this.showSuccess('Menu item updated!');
      });
    } else {
      this.menuService.addMenuItem(itemData).subscribe(() => {
        this.showItemModal.set(false);
        this.fetchMenu();
        this.showSuccess('New item added to menu!');
      });
    }
  }

  deleteItem(itemId: string) {
    if (confirm('Delete this item?')) {
      this.menuService.deleteMenuItem(itemId).subscribe(() => this.fetchMenu());
    }
  }

  toggleItem(itemId: string) {
    this.menuService.toggleItemAvailability(itemId).subscribe(() => {
      this.fetchMenu();
      this.showSuccess('Availability updated');
    });
  }

  submitNotification() {
    const id = this.selectedRestaurantId();
    const res = this.currentRestaurant();
    if (!id || !res) return;

    this.notificationService.postNotification({
      restaurantId: id,
      restaurantName: res.name,
      title: this.newNotification.title,
      message: this.newNotification.message
    }).subscribe({
      next: () => {
        this.showNotifyModal.set(false);
        this.newNotification = { title: '', message: '' };
        this.fetchRestaurantData();
        this.showSuccess('Announcement submitted for admin review!');
      },
      error: () => this.showError('Failed to submit announcement.')
    });
  }

  showSuccess(msg: string) {
    this.toastMessage.set(msg);
    this.isError.set(false);
    this.showToast.set(true);
    setTimeout(() => this.showToast.set(false), 3000);
  }

  showError(msg: string) {
    this.toastMessage.set(msg);
    this.isError.set(true);
    this.showToast.set(true);
    setTimeout(() => this.showToast.set(false), 3000);
  }

  seedMyOutlets() {
    this.loading.set(true);
    this.http.post('https://gateway-service-a8bo.onrender.com/api/v1/restaurants/seed-my-outlets', {}).subscribe({
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
