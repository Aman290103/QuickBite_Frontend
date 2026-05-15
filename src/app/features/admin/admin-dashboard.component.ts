import { Component, inject, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { RestaurantService } from '../../core/services/restaurant.service';
import { OrderService } from '../../core/services/order.service';
import { Restaurant, Order, User, AppNotification } from '../../core/models';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-container">
      <!-- Sidebar -->
      <aside class="sidebar glass">
        <div class="brand">
          <div class="logo-shield">🛡️</div>
          <div class="brand-text">
            <h1>Admin Core</h1>
            <span>SYSTEM CONTROL</span>
          </div>
        </div>

        <nav class="nav-menu">
          <button class="nav-item" [class.active]="activeTab() === 'health'" (click)="activeTab.set('health')">
            <span class="icon">📟</span> System Health
          </button>
          <button class="nav-item" [class.active]="activeTab() === 'approval'" (click)="activeTab.set('approval')">
            <span class="icon">🏪</span> Outlet Approval
            @if (pendingCount() > 0) {
              <span class="badge">{{ pendingCount() }}</span>
            }
          </button>
          <button class="nav-item" [class.active]="activeTab() === 'notifications'" (click)="activeTab.set('notifications')">
            <span class="icon">📡</span> Signals
            @if (pendingNotesCount() > 0) {
              <span class="badge">{{ pendingNotesCount() }}</span>
            }
          </button>
          <button class="nav-item" [class.active]="activeTab() === 'fleet'" (click)="activeTab.set('fleet')">
            <span class="icon">🛵</span> Fleet Ops
          </button>
          <button class="nav-item" [class.active]="activeTab() === 'orders'" (click)="activeTab.set('orders')">
            <span class="icon">🌐</span> Global Orders
          </button>
        </nav>

        <div class="sidebar-footer">
          <button class="logout-btn" (click)="logout()">
            <span class="icon">📤</span> Terminate Session
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <header class="terminal-header">
          <div class="header-main">
            <h1>Admin Terminal</h1>
            <p>Platform-wide oversight and high-level control</p>
          </div>
          <div class="system-time">
            {{ currentTime() | date:'HH:mm:ss' }} <span>UTC</span>
          </div>
        </header>

        <div class="content-body">
          @if (loading()) {
            <div class="loading-overlay">
              <div class="loader"></div>
              <p>Syncing encrypted data...</p>
            </div>
          }

          @if (activeTab() === 'health') {
            <section class="tab-section animate-fade-in">
              <h2 class="section-title">System Health Metrics</h2>
              <div class="stats-grid">
                <div class="stat-card glass">
                  <div class="stat-header">
                    <span class="label">PLATFORM USERS</span>
                    <span class="trend positive">↑ 12%</span>
                  </div>
                  <h3 class="value">{{ stats.users }}</h3>
                  <div class="stat-footer">New registrations active</div>
                </div>
                <div class="stat-card glass">
                  <div class="stat-header">
                    <span class="label">TRANSACTIONS</span>
                    <span class="trend">AVG ₹{{ stats.avgOrder }}</span>
                  </div>
                  <h3 class="value">{{ stats.orders }}</h3>
                  <div class="stat-footer">Total orders processed</div>
                </div>
                <div class="stat-card glass highlight">
                  <div class="stat-header">
                    <span class="label">GROSS REVENUE</span>
                    <span class="trend positive">7.2% Tax</span>
                  </div>
                  <h3 class="value">₹{{ stats.revenue }}</h3>
                  <div class="stat-footer">Revenue across all outlets</div>
                </div>
                <div class="stat-card glass">
                  <div class="stat-header">
                    <span class="label">ACTIVE FLEET</span>
                    <span class="trend positive">98% Avail</span>
                  </div>
                  <h3 class="value">{{ stats.fleet }}</h3>
                  <div class="stat-footer">Delivery agents online</div>
                </div>
              </div>

              <div class="network-status-card glass animate-fade-in" style="animation-delay: 0.2s">
                <h2 class="section-title">Network Infrastructure Nodes</h2>
                <div class="node-grid">
                  <div class="node-item glass">
                    <div class="node-indicator online"></div>
                    <div class="node-info">
                      <span class="node-name">Auth_Service</span>
                      <span class="node-meta">Primary Hub</span>
                    </div>
                  </div>
                  <div class="node-item glass">
                    <div class="node-indicator online"></div>
                    <div class="node-info">
                      <span class="node-name">Order_Service</span>
                      <span class="node-meta">Core Transactional</span>
                    </div>
                  </div>
                  <div class="node-item glass">
                    <div class="node-indicator online"></div>
                    <div class="node-info">
                      <span class="node-name">Review_Service</span>
                      <span class="node-meta">Social Layer</span>
                    </div>
                  </div>
                  <div class="node-item glass warning">
                    <div class="node-indicator latency"></div>
                    <div class="node-info">
                      <span class="node-name">Notification_Service</span>
                      <span class="node-meta">High Latency Detected</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          }

          @if (activeTab() === 'notifications') {
            <section class="tab-section animate-fade-in">
              <div class="section-header">
                <h2 class="section-title">Signal Authorization (Notifications)</h2>
                <button class="btn-refresh glass" (click)="fetchDataForTab('notifications')">Refresh Queue</button>
              </div>

              <div class="table-container glass">
                <table class="admin-table">
                  <thead>
                    <tr>
                      <th>ORIGIN ENTITY</th>
                      <th>ANNOUNCEMENT</th>
                      <th>MESSAGE PREVIEW</th>
                      <th>DECISION</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (note of pendingNotifications(); track note.id) {
                      <tr>
                        <td><span class="res-name">{{ note.restaurantName }}</span></td>
                        <td><span class="bold-text">{{ note.title }}</span></td>
                        <td><span class="muted-text">{{ note.message }}</span></td>
                        <td>
                          <div class="action-stack">
                            <button class="btn-ctrl approve" (click)="authorizeNote(note.id)">AUTHORIZE</button>
                            <button class="btn-ctrl reject" (click)="dismissNote(note.id)">DISMISS</button>
                          </div>
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="4" class="empty-msg">No pending signals in the queue.</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </section>
          }

          @if (activeTab() === 'approval') {
            <section class="tab-section animate-fade-in">
              <div class="section-header">
                <h2 class="section-title">Pending Approvals</h2>
                <button class="btn-refresh glass" (click)="fetchDataForTab('approval')">Sync Database</button>
              </div>

              <div class="table-container glass">
                <table class="admin-table">
                  <thead>
                    <tr>
                      <th>OUTLET IDENTIFIER</th>
                      <th>REPRESENTATIVE</th>
                      <th>LOCATION</th>
                      <th>AUTHORIZATION</th>
                      <th>CONTROL</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (r of allRestaurants(); track r.id) {
                      <tr>
                        <td>
                          <div class="res-id-block">
                            <span class="res-name">{{ r.name }}</span>
                            <span class="res-id">UID: {{ r.id.substring(0,8) }}</span>
                          </div>
                        </td>
                        <td>{{ r.phone }}</td>
                        <td><span class="location-text">{{ r.city }}</span></td>
                        <td>
                          <span class="status-pill" [class.authorized]="r.isApproved" [class.pending]="!r.isApproved">
                            {{ r.isApproved ? 'AUTHORIZED' : 'PENDING_REV' }}
                          </span>
                        </td>
                        <td>
                          <div class="action-stack">
                            @if (!r.isApproved) {
                              <button class="btn-ctrl approve" (click)="approve(r.id)">GRANT ACCESS</button>
                            }
                            <button class="btn-ctrl reject" (click)="deactivate(r.id)">
                              {{ r.isApproved ? 'REVOKE ACCESS' : 'REJECT' }}
                            </button>
                          </div>
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="5" class="empty-msg">No pending requests in the queue.</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </section>
          }

          @if (activeTab() === 'fleet') {
             <!-- Similar premium treatment for fleet -->
             <section class="tab-section animate-fade-in">
               <h2 class="section-title">Active Delivery Fleet</h2>
               <div class="table-container glass">
                 <table class="admin-table">
                    <thead>
                      <tr>
                        <th>AGENT NAME</th>
                        <th>COMMUNICATION</th>
                        <th>OPERATIONAL STATUS</th>
                        <th>EFFICIENCY</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (agent of deliveryAgents(); track agent.id) {
                        <tr>
                          <td><span class="res-name">{{ agent.fullName }}</span></td>
                          <td>{{ agent.email }}</td>
                          <td><span class="status-pill authorized">AVAILABLE</span></td>
                          <td><span class="rating-badge">⭐ 4.8</span></td>
                        </tr>
                      }
                    </tbody>
                 </table>
               </div>
             </section>
          }

          @if (activeTab() === 'orders') {
            <section class="tab-section animate-fade-in">
              <h2 class="section-title">Global Transaction Stream</h2>
              <div class="table-container glass">
                <table class="admin-table">
                  <thead>
                    <tr>
                      <th>TX_REF</th>
                      <th>ENTITY</th>
                      <th>VALUE</th>
                      <th>LIFECYCLE</th>
                      <th>OVERRIDE</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (order of allOrders(); track order.id) {
                      <tr>
                        <td><span class="res-id">#{{ order.id.substring(0,8) }}</span></td>
                        <td>{{ order.restaurantName || 'Order Entity' }}</td>
                        <td><span class="price-text">₹{{ order.totalAmount }}</span></td>
                        <td>
                          <span class="status-pill" [class]="order.status.toLowerCase()">
                            {{ order.status }}
                          </span>
                        </td>
                        <td>
                          <div class="override-ctrl">
                            <select #statusSelect [value]="order.status">
                              <option value="PLACED">PLACED</option>
                              <option value="CONFIRMED">CONFIRMED</option>
                              <option value="PREPARING">PREPARING</option>
                              <option value="READY">READY</option>
                              <option value="PICKED_UP">PICKED_UP</option>
                              <option value="DELIVERED">DELIVERED</option>
                            </select>
                            <button class="btn-tiny" (click)="forceUpdateStatus(order.id, statusSelect.value)">SET</button>
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
      flex-direction: column;
      height: 100vh;
      background: var(--bg-warm);
      color: var(--text-main);
      overflow: hidden;
    }

    /* Top Bar Integrated */
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
      gap: 3rem;
    }

    .brand { display: flex; align-items: center; gap: 1rem; margin-bottom: 0; padding-left: 0; }
    .logo-shield { font-size: 1.5rem; background: var(--white); width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 12px; box-shadow: var(--shadow-sm); }
    .brand-text h1 { font-size: 1.2rem; font-weight: 900; line-height: 1; margin: 0; }
    .brand-text span { font-size: 0.5rem; font-weight: 900; color: var(--primary); letter-spacing: 1px; }

    .nav-menu { display: flex; flex-direction: row; gap: 0.75rem; flex: 1; justify-content: center; }
    .nav-item {
      display: flex; align-items: center; gap: 0.75rem; padding: 10px 20px;
      color: var(--text-muted); border-radius: 14px; font-weight: 700; transition: var(--transition);
      width: auto;
    }
    .nav-item:hover { background: var(--primary-light); color: var(--primary); }
    .nav-item.active { background: var(--primary); color: white; box-shadow: var(--shadow-primary); }
    
    .badge { background: white; color: var(--primary); font-size: 0.65rem; font-weight: 900; padding: 2px 6px; border-radius: 20px; margin-left: 6px; }

    .sidebar-footer { margin-top: 0; }
    .logout-btn {
      padding: 10px 20px; background: var(--secondary); color: white;
      border-radius: 14px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 0.75rem;
      width: auto;
    }

    /* Main Terminal UI */
    .main-content { flex: 1; padding: 2rem 4rem; overflow-y: auto; scroll-behavior: smooth; }
    .terminal-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 3.5rem; }
    .header-main h1 { font-size: 2.6rem; font-weight: 900; letter-spacing: -1.5px; margin-bottom: 0.25rem; }
    .header-main p { color: var(--text-muted); font-size: 1.2rem; font-weight: 500; }
    .system-time { font-family: 'JetBrains Mono', monospace; background: var(--white); padding: 10px 20px; border-radius: 100px; border: 1px solid var(--border-light); font-weight: 800; font-size: 1rem; color: var(--secondary); }
    .system-time span { color: var(--primary); font-size: 0.7rem; }

    .tab-section { animation: fadeIn 0.5s var(--ease-out); }
    .section-title { font-size: 0.75rem; font-weight: 900; color: var(--text-muted); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 2rem; display: block; }

    /* Stats Grid Premium */
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-bottom: 3rem; }
    .stat-card { padding: 1.75rem; border-radius: 28px; transition: var(--transition); border: 1px solid var(--border-light); }
    .stat-card.highlight { background: var(--primary); color: white; border: none; box-shadow: var(--shadow-primary); }
    .stat-card.highlight .label, .stat-card.highlight .stat-footer { color: rgba(255,255,255,0.8); }
    .stat-card.highlight .value { color: white; }

    .stat-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
    .stat-header .label { font-size: 0.65rem; font-weight: 900; letter-spacing: 1px; color: var(--text-muted); }
    .trend { font-size: 0.7rem; font-weight: 800; }
    .trend.positive { color: #10b981; }
    .stat-card.highlight .trend.positive { color: white; }

    .stat-card .value { font-size: 2.2rem; font-weight: 900; margin-bottom: 0.5rem; }
    .stat-footer { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); }

    /* Network Node Grid */
    .network-status-card { padding: 2rem; border-radius: 32px; }
    .node-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1.25rem; }
    .node-item { display: flex; align-items: center; gap: 1.25rem; padding: 1.25rem; border-radius: 22px; transition: var(--transition); }
    .node-item:hover { transform: scale(1.03); background: var(--white); }
    .node-item.warning { border-color: rgba(245, 158, 11, 0.3); }

    .node-indicator { width: 12px; height: 12px; border-radius: 50%; position: relative; }
    .node-indicator.online { background: #10b981; box-shadow: 0 0 12px #10b981; }
    .node-indicator.latency { background: #f59e0b; box-shadow: 0 0 12px #f59e0b; animation: pulse 2s infinite; }

    .node-info { display: flex; flex-direction: column; }
    .node-name { font-family: 'JetBrains Mono', monospace; font-weight: 800; font-size: 0.9rem; }
    .node-meta { font-size: 0.7rem; font-weight: 600; color: var(--text-muted); }

    /* Table System Premium */
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .btn-refresh { padding: 10px 20px; border-radius: 12px; font-weight: 800; font-size: 0.85rem; color: var(--primary); border-color: var(--border-light); }
    .btn-refresh:hover { background: var(--primary); color: white; }

    .table-container { border-radius: 32px; overflow: hidden; }
    .admin-table { width: 100%; border-collapse: collapse; text-align: left; }
    .admin-table th { padding: 1.5rem; background: rgba(255,255,255,0.4); color: var(--text-muted); font-size: 0.7rem; font-weight: 900; letter-spacing: 1.5px; border-bottom: 1px solid var(--border-light); }
    .admin-table td { padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(240, 224, 208, 0.3); }

    .res-id-block { display: flex; flex-direction: column; }
    .res-name { font-weight: 800; font-size: 1.1rem; color: var(--secondary); }
    .res-id { font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; color: var(--text-muted); }
    .location-text { font-weight: 700; color: var(--text-muted); }

    .status-pill { padding: 6px 14px; border-radius: 100px; font-size: 0.65rem; font-weight: 900; }
    .status-pill.authorized { background: #ecfdf5; color: #10b981; }
    .status-pill.pending { background: #fffbeb; color: #f59e0b; }
    .status-pill.placed { background: #eff6ff; color: #3b82f6; }
    .status-pill.delivered { background: #ecfdf5; color: #10b981; }

    .action-stack { display: flex; gap: 10px; }
    .btn-ctrl { padding: 8px 16px; border-radius: 12px; font-size: 0.75rem; font-weight: 800; transition: var(--transition); }
    .btn-ctrl.approve { background: var(--primary); color: white; box-shadow: var(--shadow-primary); }
    .btn-ctrl.reject { background: #eee; color: var(--text-muted); }
    .btn-ctrl:hover { transform: translateY(-2px); }

    .override-ctrl { display: flex; gap: 8px; align-items: center; }
    .override-ctrl select { padding: 6px 10px; border-radius: 10px; border: 1px solid var(--border-light); font-weight: 700; font-size: 0.75rem; outline: none; }
    .btn-tiny { background: var(--secondary); color: white; padding: 6px 12px; border-radius: 8px; font-weight: 800; font-size: 0.7rem; }

    .rating-badge { background: #fffbeb; color: #f59e0b; padding: 4px 10px; border-radius: 100px; font-weight: 900; font-size: 0.8rem; }
    .price-text { font-weight: 900; font-size: 1.1rem; }

    /* Loading / Empty States */
    .loading-overlay { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 6rem; gap: 1.5rem; }
    .loader { width: 50px; height: 50px; border: 5px solid #eee; border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .empty-msg { text-align: center; padding: 4rem; color: var(--text-muted); font-weight: 600; }
  `]

})
export class AdminDashboardComponent {
  private authService = inject(AuthService);
  private restaurantService = inject(RestaurantService);
  private orderService = inject(OrderService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  activeTab = signal('approval');
  loading = signal(false);
  currentTime = signal(new Date());

  // Data signals
  allRestaurants = signal<Restaurant[]>([]);
  deliveryAgents = signal<User[]>([]);
  allOrders = signal<Order[]>([]);
  pendingNotifications = signal<AppNotification[]>([]);

  pendingCount = computed(() => this.allRestaurants().filter(r => !r.isApproved).length);
  pendingNotesCount = computed(() => this.pendingNotifications().length);

  stats = {
    users: 142,
    orders: 1204,
    revenue: '85,200',
    fleet: 12,
    avgOrder: 342
  };

  constructor() {
    effect(() => {
      const tab = this.activeTab();
      this.fetchDataForTab(tab);
    });
    setInterval(() => this.currentTime.set(new Date()), 1000);
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
        case 'notifications':
          this.notificationService.getPendingNotifications().subscribe({
            next: notes => {
              this.pendingNotifications.set(notes);
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

  authorizeNote(id: string) {
    this.notificationService.approveNotification(id).subscribe(() => {
      this.fetchDataForTab('notifications');
    });
  }

  dismissNote(id: string) {
    this.notificationService.rejectNotification(id).subscribe(() => {
      this.fetchDataForTab('notifications');
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
