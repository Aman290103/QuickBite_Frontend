import { Component, inject, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { OrderService } from '../../core/services/order.service';
import { Order } from '../../core/models';

@Component({
  selector: 'app-agent-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="agent-container">
      <!-- Sidebar -->
      <aside class="sidebar glass">
        <div class="brand">
          <div class="logo-shield">🏍️</div>
          <div class="brand-text">
            <h1>Agent Hub</h1>
            <span>DELIVERY FLEET</span>
          </div>
        </div>

        <nav class="nav-menu">
          <button class="nav-item" [class.active]="activeTab() === 'rides'" (click)="activeTab.set('rides')">
            <span class="icon">🔍</span> Available Rides
          </button>
          <button class="nav-item" [class.active]="activeTab() === 'past'" (click)="activeTab.set('past')">
            <span class="icon">🕒</span> Ride History
          </button>
        </nav>

        <div class="sidebar-footer">
          <button class="logout-btn" (click)="logout()">
            <span class="icon">🚪</span> End Shift
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <header class="hub-header">
          <div class="header-main">
            <h1>My Deliveries</h1>
            <p>Manage your active route and discover new opportunities</p>
          </div>
          @if (authService.currentUser(); as user) {
            <div class="agent-card glass">
              <div class="agent-avatar">{{ user.fullName[0] }}</div>
              <div class="agent-details">
                <span class="name">{{ user.fullName }}</span>
                <span class="status">● Active Duty</span>
              </div>
            </div>
          }
        </header>

        <div class="content-body">
          @if (loading()) {
            <div class="loader-container">
              <div class="spinner"></div>
            </div>
          }

          @if (activeTab() === 'rides') {
            <div class="rides-grid animate-fade-in">
              <!-- Available Rides Column -->
              <section class="ride-column">
                <div class="column-header">
                  <h2 class="column-title"><span class="dot live"></span> Available Now</h2>
                  <button class="refresh-btn" (click)="fetchRides()" [class.spinning]="loading()">
                    🔄 Sync
                  </button>
                </div>
                
                <div class="ride-stack">
                  @if (filteredAvailableRides().length === 0) {
                    <div class="empty-state glass">
                      <div class="empty-icon">📍</div>
                      <p>No nearby rides found. Checking for updates...</p>
                    </div>
                  } @else {
                    @for (ride of filteredAvailableRides(); track ride.id) {
                      <div class="ride-card glass animate-slide-in">
                        <div class="ride-body">
                          <div class="ride-header">
                            <span class="res-name">{{ ride.restaurantName }}</span>
                            <span class="earnings-tag">₹40.00</span>
                          </div>
                          <p class="address-text">{{ ride.deliveryAddress }}</p>
                        </div>
                        <div class="ride-actions">
                          <button class="btn-refuse" (click)="refuseRide(ride.id)">Ignore</button>
                          <button class="btn-primary-mini" (click)='acceptRide(ride.id)'>Accept Ride</button>
                        </div>
                      </div>
                    }
                  }
                </div>
              </section>

              <!-- Active Rides Column -->
              <section class="ride-column">
                <div class="column-header">
                  <h2 class="column-title">Active Route</h2>
                </div>

                <div class="ride-stack">
                  @if (activeRides().length === 0) {
                    <div class="empty-state glass">
                      <div class="empty-icon">📦</div>
                      <p>Your route is currently empty. Accept a ride to begin!</p>
                    </div>
                  } @else {
                    @for (ride of activeRides(); track ride.id) {
                      <div class="ride-card glass active-ride animate-slide-in">
                        <div class="ride-status-line">
                           <span class="status-pill" [class]="ride.status.toLowerCase()">{{ ride.status }}</span>
                           <span class="order-id">#{{ ride.id.substring(0,8) }}</span>
                        </div>
                        <div class="ride-body">
                          <span class="res-name">{{ ride.restaurantName }}</span>
                          <p class="address-text">{{ ride.deliveryAddress }}</p>
                        </div>
                        <div class="ride-footer">
                          @if (ride.status === 'PLACED' || ride.status === 'CONFIRMED' || ride.status === 'PREPARING') {
                            <div class="waiting-notice">Waiting for preparation...</div>
                          } @else if (ride.status === 'READY') {
                            <button class="btn-step pickup" (click)="updateStatus(ride.id, 'PICKED_UP')">Confirm Pick Up</button>
                          } @else if (ride.status === 'PICKED_UP') {
                            <button class="btn-step deliver" (click)="updateStatus(ride.id, 'DELIVERED')">Complete Delivery</button>
                          }
                        </div>
                      </div>
                    }
                  }
                </div>
              </section>
            </div>
          }

          @if (activeTab() === 'past') {
            <section class="history-section animate-fade-in">
              <h2 class="section-title">Completed Earnings</h2>
              <div class="history-card glass">
                @if (pastRides().length === 0) {
                  <div class="empty-state">
                    <p>No completed rides in this cycle.</p>
                  </div>
                } @else {
                  <table class="premium-table">
                    <thead>
                      <tr>
                        <th>COMPLETED DATE</th>
                        <th>RESTAURANT</th>
                        <th>DESTINATION</th>
                        <th>EARNINGS</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (ride of pastRides(); track ride.id) {
                        <tr>
                          <td>{{ ride.createdAt | date:'MMM d, h:mm a' }}</td>
                          <td><span class="bold-text">{{ ride.restaurantName }}</span></td>
                          <td><span class="muted-text">{{ ride.deliveryAddress }}</span></td>
                          <td><span class="price-text">₹40.00</span></td>
                        </tr>
                      }
                    </tbody>
                  </table>
                }
              </div>
            </section>
          }
        </div>
      </main>
    </div>
  `,
  styles: [`
    .agent-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: var(--bg-warm);
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
      gap: 3rem;
      position: sticky;
      top: 0;
      z-index: 1000;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(10px);
    }

    .brand { display: flex; align-items: center; gap: 1rem; margin-bottom: 0; padding-left: 0; }
    .logo-shield { font-size: 1.8rem; background: var(--white); width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 12px; box-shadow: var(--shadow-sm); }
    .brand-text h1 { font-size: 1.2rem; font-weight: 900; line-height: 1; margin: 0; }
    .brand-text span { font-size: 0.5rem; font-weight: 900; color: var(--primary); letter-spacing: 1px; }

    .nav-menu { display: flex; flex-direction: row; gap: 0.75rem; flex: 1; justify-content: center; }
    .nav-item {
      display: flex; align-items: center; gap: 0.75rem; padding: 10px 18px;
      color: var(--text-muted); border-radius: 14px; font-weight: 700; transition: var(--transition);
      width: auto;
    }
    .nav-item:hover { background: var(--primary-light); color: var(--primary); }
    .nav-item.active { background: var(--primary); color: white; box-shadow: var(--shadow-primary); }

    .sidebar-footer { margin-top: 0; }
    .logout-btn {
      padding: 10px 18px; background: var(--secondary); color: white;
      border-radius: 14px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 0.75rem;
      width: auto;
    }

    /* Main Hub UI */
    .main-content { flex: 1; padding: 2rem 4rem; overflow-y: auto; scroll-behavior: smooth; }
    .hub-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4rem; }
    .header-main h1 { font-size: 2.8rem; font-weight: 900; letter-spacing: -2px; margin-bottom: 0.5rem; }
    .header-main p { color: var(--text-muted); font-size: 1.2rem; font-weight: 500; }

    .agent-card {
      display: flex; align-items: center; gap: 1rem; padding: 0.75rem 1.5rem; border-radius: 100px;
      border: 1px solid var(--border-light);
    }
    .agent-avatar { width: 44px; height: 44px; background: var(--secondary); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.2rem; }
    .agent-details { display: flex; flex-direction: column; }
    .agent-details .name { font-weight: 800; font-size: 1rem; }
    .agent-details .status { font-size: 0.7rem; font-weight: 800; color: #10b981; text-transform: uppercase; }

    /* Rides Grid Premium */
    .rides-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; }
    .ride-column { display: flex; flex-direction: column; gap: 1.5rem; }
    .column-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .column-title { font-size: 0.75rem; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: var(--text-muted); display: flex; align-items: center; gap: 8px; }
    
    .dot { width: 8px; height: 8px; border-radius: 50%; }
    .dot.live { background: #ef4444; box-shadow: 0 0 10px #ef4444; animation: pulse 2s infinite; }

    .refresh-btn { padding: 8px 16px; border-radius: 100px; border: 1px solid var(--border-light); font-weight: 800; font-size: 0.8rem; background: var(--white); }
    .refresh-btn:hover { background: var(--bg-warm); }

    .ride-stack { display: flex; flex-direction: column; gap: 1.25rem; }
    .ride-card { padding: 1.75rem; border-radius: 28px; border: 1px solid var(--border-light); transition: var(--transition); }
    .ride-card:hover { transform: translateY(-5px); box-shadow: var(--shadow-md); background: var(--white); }
    .ride-card.active-ride { border-left: 6px solid var(--primary); }

    .ride-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; }
    .res-name { font-size: 1.25rem; font-weight: 900; letter-spacing: -0.5px; }
    .earnings-tag { background: #ecfdf5; color: #10b981; padding: 4px 10px; border-radius: 8px; font-weight: 900; font-size: 0.9rem; }
    
    .address-text { color: var(--text-muted); font-weight: 500; font-size: 0.95rem; line-height: 1.4; margin-bottom: 1.5rem; }
    
    .ride-actions { display: flex; gap: 10px; }
    .btn-refuse { flex: 1; padding: 12px; border-radius: 14px; border: 1px solid var(--border-light); font-weight: 800; color: var(--text-muted); }
    .btn-primary-mini { flex: 2; background: var(--primary); color: white; padding: 12px; border-radius: 14px; font-weight: 800; box-shadow: var(--shadow-primary); }

    .ride-status-line { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .status-pill { padding: 4px 12px; border-radius: 100px; font-size: 0.65rem; font-weight: 900; text-transform: uppercase; }
    .status-pill.ready { background: #eff6ff; color: #3b82f6; }
    .status-pill.picked_up { background: #f5f3ff; color: #8b5cf6; }
    .order-id { font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; color: var(--text-muted); }

    .ride-footer { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(240, 224, 208, 0.4); }
    .btn-step { width: 100%; padding: 14px; border-radius: 16px; font-weight: 900; font-size: 1rem; }
    .btn-step.pickup { background: var(--secondary); color: white; }
    .btn-step.deliver { background: #10b981; color: white; box-shadow: 0 8px 20px rgba(16, 185, 129, 0.2); }
    .waiting-notice { text-align: center; font-size: 0.85rem; font-weight: 700; color: var(--text-muted); padding: 10px; background: rgba(0,0,0,0.03); border-radius: 10px; }

    /* History Premium */
    .history-card { border-radius: 32px; overflow: hidden; margin-top: 2rem; }
    .premium-table { width: 100%; border-collapse: collapse; text-align: left; }
    .premium-table th { padding: 1.5rem; background: rgba(255,255,255,0.4); color: var(--text-muted); font-size: 0.7rem; font-weight: 900; letter-spacing: 1.5px; border-bottom: 1px solid var(--border-light); }
    .premium-table td { padding: 1.5rem; border-bottom: 1px solid rgba(240, 224, 208, 0.3); }
    .bold-text { font-weight: 800; font-size: 1.1rem; }
    .muted-text { color: var(--text-muted); font-size: 0.9rem; }
    .price-text { font-weight: 900; color: #10b981; font-size: 1.1rem; }

    /* Utilities */
    .empty-state { padding: 3rem; text-align: center; border-radius: 28px; border: 2px dashed var(--border-light); color: var(--text-muted); }
    .empty-icon { font-size: 3rem; margin-bottom: 1rem; opacity: 0.3; }
    
    @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.2); opacity: 0.7; } 100% { transform: scale(1); opacity: 1; } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
    .animate-slide-in { animation: slideIn 0.4s var(--ease-out) both; }
  `]

})
export class AgentDashboardComponent {
  public authService = inject(AuthService);
  private orderService = inject(OrderService);
  private router = inject(Router);

  activeTab = signal('rides');
  loading = signal(false);

  availableRides = signal<Order[]>([]);
  activeRides = signal<Order[]>([]);
  pastRides = signal<Order[]>([]);
  refusedRides = signal<string[]>([]); // Locally refused ride IDs

  filteredAvailableRides = computed(() => {
    const refused = this.refusedRides();
    return this.availableRides().filter(r => !refused.includes(r.id));
  });

  constructor() {
    this.fetchRides();
    // Poll for new rides every 5 seconds
    setInterval(() => this.fetchRides(), 5000);
  }

  fetchRides() {
    this.orderService.getAvailableOrders().subscribe(rides => this.availableRides.set(rides));
    this.orderService.getAgentOrders().subscribe(rides => {
      this.activeRides.set(rides.filter(r => r.status !== 'DELIVERED' && r.status !== 'CANCELLED'));
      this.pastRides.set(rides.filter(r => r.status === 'DELIVERED'));
    });
  }

  refuseRide(orderId: string) {
    this.refusedRides.update(ids => [...ids, orderId]);
  }

  acceptRide(orderId: string) {
    const user = this.authService.currentUser();
    if (!user) {
      alert('You must be logged in to accept rides.');
      return;
    }

    this.orderService.assignAgent(orderId, user.id).subscribe({
      next: () => {
        alert('Ride accepted successfully! Check "Active Rides".');
        this.fetchRides();
      },
      error: (err) => {
        console.error('Failed to accept ride:', err);
        alert('Could not accept ride. It might have been taken by another agent.');
      }
    });
  }

  updateStatus(orderId: string, status: string) {
    this.orderService.updateOrderStatus(orderId, status).subscribe(() => {
      this.fetchRides();
    });
  }

  canPickUp(ride: Order): boolean {
    const s = ride.status as any;
    return s === 'READY' || s === 'CONFIRMED' || s === 'PREPARING';
  }

  isPickedUp(ride: Order): boolean {
    return (ride.status as any) === 'PICKED_UP';
  }

  logout() {
    this.authService.logout();
  }
}
