import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { RestaurantService } from '../../core/services/restaurant.service';
import { OrderService } from '../../core/services/order.service';
import { Restaurant, Order, User } from '../../core/models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-container">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="brand">
          <div class="logo-shield">🛡️</div>
          <h1>Admin Core</h1>
        </div>

        <nav class="nav-menu">
          <button 
            class="nav-item" 
            [class.active]="activeTab() === 'health'"
            (click)="activeTab.set('health')"
          >
            <span class="icon">📟</span> System Health
          </button>
          <button 
            class="nav-item" 
            [class.active]="activeTab() === 'approval'"
            (click)="activeTab.set('approval')"
          >
            <span class="icon">🏪</span> Outlet Approval
          </button>
          <button 
            class="nav-item" 
            [class.active]="activeTab() === 'fleet'"
            (click)="activeTab.set('fleet')"
          >
            <span class="icon">🛵</span> Fleet Ops
          </button>
          <button 
            class="nav-item" 
            [class.active]="activeTab() === 'orders'"
            (click)="activeTab.set('orders')"
          >
            <span class="icon">🌐</span> Global Orders
          </button>
        </nav>

        <div class="sidebar-footer">
          <button class="terminate-btn" (click)="logout()">
            <span class="icon">📤</span> Logout
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <header class="terminal-header">
          <h1>Admin Terminal</h1>
          <p>Platform-wide oversight and control</p>
        </header>

        <div class="content-body">
          <!-- Loading State -->
          @if (loading()) {
            <div class="loading-overlay">
              <div class="spinner"></div>
              <p>Fetching platform data...</p>
            </div>
          }

          <!-- System Health Tab -->
          @if (activeTab() === 'health') {
            <section class="stats-container animate-fade-in">
              <h2 class="section-title">System Health Metrics</h2>
              <div class="stats-grid">
                <div class="stat-card card">
                  <p class="label">PLATFORM USERS</p>
                  <h3 class="value">{{ stats.users }}</h3>
                  <p class="trend positive">+12% from last week</p>
                </div>
                <div class="stat-card card">
                  <p class="label">TOTAL TRANSACTIONS</p>
                  <h3 class="value">{{ stats.orders }}</h3>
                  <p class="trend">Avg. ₹{{ stats.avgOrder }} per order</p>
                </div>
                <div class="stat-card card">
                  <p class="label">GROSS REVENUE</p>
                  <h3 class="value">₹{{ stats.revenue }}</h3>
                  <p class="trend positive">7.2% tax collected</p>
                </div>
                <div class="stat-card card">
                  <p class="label">ACTIVE FLEET</p>
                  <h3 class="value">{{ stats.fleet }}</h3>
                  <p class="trend positive">98% availability rate</p>
                </div>
              </div>
            </section>

            <section class="network-container card animate-fade-in">
              <h2 class="section-title">Network Nodes & Resources</h2>
              <div class="node-grid">
                <div class="node-item">
                  <span class="node-name">Auth_Service</span>
                  <span class="status online">Online</span>
                </div>
                <div class="node-item">
                  <span class="node-name">Order_Service</span>
                  <span class="status online">Online</span>
                </div>
                <div class="node-item">
                  <span class="node-name">Review_Service</span>
                  <span class="status online">Online</span>
                </div>
                <div class="node-item">
                  <span class="node-name">Notification_Service</span>
                  <span class="status high-latency">High Latency</span>
                </div>
              </div>
            </section>
          }

          <!-- Outlet Approval Tab -->
          @if (activeTab() === 'approval') {
            <section class="approval-container animate-fade-in">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h2 class="section-title" style="margin: 0;">Outlet Approval Management</h2>
                <button class="btn-update" (click)="fetchDataForTab('approval')">🔄 Refresh Data</button>
              </div>
              <div class="data-table card">
                @if (allRestaurants().length === 0) {
                  <div class="empty-state">
                    <p>No restaurants found on the platform.</p>
                  </div>
                } @else {
                  <table class="admin-table">
                    <thead>
                      <tr>
                        <th>RESTAURANT NAME</th>
                        <th>OWNER CONTACT</th>
                        <th>LOCATION</th>
                        <th>STATUS</th>
                        <th>ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (r of allRestaurants(); track r.id) {
                        <tr>
                          <td>
                            <div class="res-info">
                              <span class="name">{{ r.name }}</span>
                              <span class="id">ID: {{ r.id.substring(0,8) }}</span>
                            </div>
                          </td>
                          <td>{{ r.phone }}</td>
                          <td>{{ r.address }}, {{ r.city }}</td>
                          <td>
                            @if (r.isApproved) {
                              <span class="status online">AUTHORIZED</span>
                            } @else {
                              <span class="status pending">PENDING</span>
                            }
                          </td>
                          <td>
                            <div class="actions">
                              @if (!r.isApproved) {
                                <button class="btn-approve" (click)="approve(r.id)">Approve</button>
                              }
                              <button class="btn-reject" (click)="deactivate(r.id)">{{ r.isApproved ? 'Deactivate' : 'Reject' }}</button>
                            </div>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                }
              </div>
            </section>
          }

          <!-- Fleet Ops Tab -->
          @if (activeTab() === 'fleet') {
            <section class="fleet-container animate-fade-in">
              <h2 class="section-title">Delivery Fleet Status</h2>
              <div class="data-table card">
                <table class="admin-table">
                  <thead>
                    <tr>
                      <th>Agent Name</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (agent of deliveryAgents(); track agent.id) {
                      <tr>
                        <td>{{ agent.fullName }}</td>
                        <td>{{ agent.email }}</td>
                        <td><span class="status online">Available</span></td>
                        <td>⭐ 4.8</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </section>
          }

          <!-- Global Orders Tab -->
          @if (activeTab() === 'orders') {
            <section class="orders-container animate-fade-in">
              <div class="data-table card">
                <table class="admin-table">
                  <thead>
                    <tr>
                      <th>ORDER REF</th>
                      <th>CUSTOMER NAME</th>
                      <th>TOTAL VALUE</th>
                      <th>ORDER STATUS</th>
                      <th>FORCE UPDATE</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (order of allOrders(); track order.id) {
                      <tr>
                        <td>#{{ order.id.substring(0,8) }}</td>
                        <td>{{ order.items[0]?.name || 'N/A' }}</td>
                        <td>₹{{ order.totalAmount }}</td>
                        <td>
                          <span class="status" [class]="order.status.toLowerCase()">
                            {{ order.status }}
                          </span>
                        </td>
                        <td>
                          <div class="force-update">
                            <select #statusSelect [value]="order.status">
                              <option value="PLACED">Placed</option>
                              <option value="CONFIRMED">Confirmed</option>
                              <option value="PREPARING">Preparing</option>
                              <option value="READY">Ready</option>
                              <option value="PICKED_UP">Picked Up</option>
                              <option value="DELIVERED">Delivered</option>
                              <option value="CANCELLED">Cancelled</option>
                            </select>
                            <button class="btn-update" (click)="forceUpdateStatus(order.id, statusSelect.value)">Update</button>
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </section>
          }
        </div>
      </main>
    </div>
  `,
  styles: [`
    .admin-container {
      display: flex;
      height: 100vh;
      background: #f8f9fa;
      color: #2d2d2d;
      font-family: 'Inter', sans-serif;
    }

    /* Sidebar and Base Styles (reused from previous implementation) */
    .sidebar {
      width: 280px;
      background: white;
      border-right: 1px solid #eee;
      display: flex;
      flex-direction: column;
      padding: 2rem 1.5rem;
      box-shadow: 4px 0 24px rgba(0,0,0,0.02);
    }

    .brand { display: flex; align-items: center; gap: 1rem; margin-bottom: 3rem; }
    .logo-shield { font-size: 1.5rem; background: #fff4e5; padding: 8px; border-radius: 12px; }
    .brand h1 { font-size: 1.5rem; font-weight: 800; color: #ff5231; letter-spacing: -1px; }

    .nav-menu { display: flex; flex-direction: column; gap: 0.5rem; flex: 1; }
    .nav-item {
      display: flex; align-items: center; gap: 1rem; width: 100%; padding: 12px 16px;
      border: none; background: transparent; color: #686b78; border-radius: 12px;
      font-weight: 600; cursor: pointer; transition: all 0.2s; text-align: left;
    }
    .nav-item:hover { background: #f3f3f3; color: #ff5231; }
    .nav-item.active { background: #ff5231; color: white; box-shadow: 0 8px 16px rgba(255, 82, 49, 0.2); }

    .sidebar-footer { margin-top: auto; padding-top: 2rem; }
    .terminate-btn {
      width: 100%; padding: 12px; background: #f3f3f3; border: none; color: #686b78;
      border-radius: 12px; display: flex; align-items: center; justify-content: center;
      gap: 0.75rem; cursor: pointer; font-weight: 700; transition: all 0.2s;
    }
    .terminate-btn:hover { background: #eee; color: #ff5231; }

    /* Main Content */
    .main-content { flex: 1; padding: 3rem 4rem; overflow-y: auto; }
    .terminal-header { margin-bottom: 3.5rem; }
    .terminal-header h1 { font-size: 2.5rem; font-weight: 900; color: #2d2d2d; margin-bottom: 0.5rem; letter-spacing: -1px; }
    .terminal-header p { color: #686b78; font-size: 1.1rem; font-weight: 500; }
    .section-title { font-size: 0.9rem; font-weight: 800; color: #9c9c9c; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 1.5rem; }

    /* Data Table Styles */
    .card {
      background: white; border: 1px solid #f0f0f0; border-radius: 24px;
      padding: 1.75rem; box-shadow: 0 10px 30px rgba(0,0,0,0.03);
    }

    .admin-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .admin-table th {
      padding: 1rem;
      border-bottom: 2px solid #f8f9fa;
      color: #9c9c9c;
      font-size: 0.8rem;
      font-weight: 800;
      text-transform: uppercase;
    }

    .admin-table td {
      padding: 1.25rem 1rem;
      border-bottom: 1px solid #f8f9fa;
      font-weight: 500;
    }

    .res-info { display: flex; flex-direction: column; }
    .res-info .name { font-weight: 700; color: #2d2d2d; }
    .res-info .id { font-size: 0.75rem; color: #9c9c9c; }

    .actions { display: flex; gap: 0.5rem; }
    .btn-approve {
      background: #22c55e; color: white; border: none; padding: 6px 12px;
      border-radius: 8px; font-weight: 700; cursor: pointer;
    }
    .btn-reject {
      background: #fef2f2; color: #ef4444; border: none; padding: 6px 12px;
      border-radius: 8px; font-weight: 700; cursor: pointer;
    }

    .force-update {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .force-update select {
      padding: 6px 10px;
      border-radius: 8px;
      border: 1px solid #eee;
      background: #f8f9fa;
      font-weight: 600;
      color: #686b78;
    }

    .btn-update {
      background: #9c7b62;
      color: white;
      border: none;
      padding: 6px 14px;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-update:hover {
      background: #866752;
    }

    /* Status Badges */
    .status {
      font-size: 0.7rem; font-weight: 800; text-transform: uppercase;
      padding: 4px 10px; border-radius: 6px;
    }
    .status.online, .status.delivered, .status.ready { color: #22c55e; background: #ecfdf5; }
    .status.pending, .status.placed { color: #f59e0b; background: #fffbeb; }
    .status.confirmed { color: #3b82f6; background: #eff6ff; }
    .status.preparing { color: #8b5cf6; background: #f5f3ff; }
    .status.picked_up { color: #ec4899; background: #fdf2f8; }
    .status.cancelled { color: #ef4444; background: #fef2f2; }
    .status.high-latency { color: #f59e0b; background: #fffbeb; }

    /* Loading Overlay */
    .loading-overlay {
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(255,255,255,0.7); display: flex; flex-direction: column;
      align-items: center; justify-content: center; z-index: 10;
    }
    .spinner {
      width: 40px; height: 40px; border: 4px solid #f3f3f3;
      border-top: 4px solid #ff5231; border-radius: 50%;
      animation: spin 1s linear infinite; margin-bottom: 1rem;
    }

    /* Stats (reused) */
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-bottom: 2rem; }
    .stat-card .label { font-size: 0.75rem; font-weight: 800; color: #9c9c9c; margin-bottom: 1rem; }
    .stat-card .value { font-size: 2rem; font-weight: 900; color: #2d2d2d; margin-bottom: 0.75rem; }
    .stat-card .trend { font-size: 0.8rem; color: #686b78; font-weight: 600; }
    .stat-card .trend.positive { color: #22c55e; }

    .node-grid { display: flex; gap: 1.5rem; flex-wrap: wrap; }
    .node-item {
      background: #f8f9fa; padding: 1rem 1.5rem; border-radius: 16px;
      display: flex; align-items: center; gap: 1.25rem; border: 1px solid #eee;
    }
    .node-name { font-family: 'JetBrains Mono', monospace; font-size: 0.9rem; font-weight: 700; color: #2d2d2d; }

    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

    .empty-state { text-align: center; padding: 3rem; color: #686b78; }
  `]
})
export class AdminDashboardComponent {
  private authService = inject(AuthService);
  private restaurantService = inject(RestaurantService);
  private orderService = inject(OrderService);
  private router = inject(Router);

  activeTab = signal('approval');
  loading = signal(false);

  // Data signals
  allRestaurants = signal<Restaurant[]>([]);
  deliveryAgents = signal<User[]>([]);
  allOrders = signal<Order[]>([]);

  stats = {
    users: 142,
    orders: 1204,
    revenue: '85,200',
    fleet: 12,
    avgOrder: 71
  };

  constructor() {
    effect(() => {
      const tab = this.activeTab();
      this.fetchDataForTab(tab);
    });
  }

  async fetchDataForTab(tab: string) {
    this.loading.set(true);
    const handleError = (err: any) => {
      console.error('Error fetching admin data', err);
      this.loading.set(false);
      // alert('Failed to connect to backend service. Please ensure the Gateway and Microservices are running.');
    };

    try {
      switch (tab) {
        case 'approval':
          this.restaurantService.getAllRestaurants().subscribe({
            next: data => {
              this.allRestaurants.set(data);
              this.loading.set(false);
            },
            error: handleError
          });
          break;
        case 'fleet':
          this.authService.getAllUsers().subscribe({
            next: users => {
              this.deliveryAgents.set(users.filter(u => u.role === 'DELIVERY_AGENT'));
              this.loading.set(false);
            },
            error: handleError
          });
          break;
        case 'orders':
          this.orderService.getAllOrders().subscribe({
            next: orders => {
              this.allOrders.set(orders);
              this.loading.set(false);
            },
            error: handleError
          });
          break;
        default:
          this.loading.set(false);
      }
    } catch (err) {
      handleError(err);
    }
  }

  approve(id: string) {
    this.restaurantService.approveRestaurant(id).subscribe(() => {
      this.fetchDataForTab('approval');
    });
  }

  deactivate(id: string) {
    this.restaurantService.deleteRestaurant(id).subscribe(() => {
      this.fetchDataForTab('approval');
    });
  }

  forceUpdateStatus(orderId: string, status: string) {
    this.orderService.updateOrderStatus(orderId, status).subscribe({
      next: () => {
        this.fetchDataForTab('orders');
        alert('Order status force-updated successfully');
      },
      error: (err) => {
        console.error('Error force updating status', err);
        alert('Failed to update status. Ensure you have the correct permissions.');
      }
    });
  }

  logout() {
    this.authService.logout();
  }
}
