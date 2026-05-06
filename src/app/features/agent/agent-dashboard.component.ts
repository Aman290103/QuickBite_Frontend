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
      <aside class="sidebar">
        <div class="brand">
          <div class="logo-shield">🏍️</div>
          <h1>Agent Hub</h1>
        </div>

        <nav class="nav-menu">
          <button 
            class="nav-item" 
            [class.active]="activeTab() === 'rides'"
            (click)="activeTab.set('rides')"
          >
            <span class="icon">🔍</span> Rides
          </button>
          <button 
            class="nav-item" 
            [class.active]="activeTab() === 'past'"
            (click)="activeTab.set('past')"
          >
            <span class="icon">🕒</span> Past Rides
          </button>
        </nav>

        <div class="sidebar-footer">
          <button class="logout-btn" (click)="logout()">
            <span class="icon">🚪</span> Logout
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <header class="hub-header">
          <div class="header-main">
            <h1>My Rides</h1>
            <p>Browse available deliveries and manage your active rides</p>
          </div>
          @if (authService.currentUser(); as user) {
            <div class="user-info">
              <span class="user-name">Agent: {{ user.fullName }}</span>
              <span class="user-id">ID: {{ user.id }}</span>
            </div>
          }
        </header>

        <div class="content-body">
          @if (loading()) {
            <div class="loading-overlay">
              <div class="spinner"></div>
            </div>
          }

          @if (activeTab() === 'rides') {
            <div class="rides-grid animate-fade-in">
              <!-- Available Rides -->
              <section class="ride-section">
                <div class="section-header">
                  <span class="icon">📡</span>
                  <h2 class="section-title">Available Rides</h2>
                  <button class="refresh-pill" (click)="fetchRides()" [class.spinning]="loading()">
                    🔄 Refresh
                  </button>
                </div>
                
                <div class="ride-list card">
                  @if (filteredAvailableRides().length === 0) {
                    <div class="empty-state">
                      <div class="empty-icon">📍</div>
                      <p>No rides available right now. Stay tuned!</p>
                    </div>
                  } @else {
                    @for (ride of filteredAvailableRides(); track ride.id) {
                      <div class="ride-card">
                        <div class="ride-info">
                          <span class="res-name">{{ ride.restaurantName }}</span>
                          <span class="address">{{ ride.deliveryAddress }}</span>
                          <span class="amount">Earnings: ₹40</span>
                        </div>
                        <div class="ride-actions">
                          <button class="btn-refuse" (click)="refuseRide(ride.id)">Refuse</button>
                          <button class="btn-accept" (click)="acceptRide(ride.id)">Accept</button>
                        </div>
                      </div>
                    }
                  }
                </div>
              </section>

              <!-- Active Rides -->
              <section class="ride-section">
                <div class="section-header">
                  <span class="icon">📦</span>
                  <h2 class="section-title">Active Rides</h2>
                </div>

                <div class="ride-list card">
                  @if (activeRides().length === 0) {
                    <div class="empty-state">
                      <div class="empty-icon">📦</div>
                      <p>No active deliveries. Browse and accept a ride!</p>
                    </div>
                  } @else {
                    @for (ride of activeRides(); track ride.id) {
                      <div class="ride-card active">
                        <div class="ride-info">
                          <span class="status-badge" [class]="ride.status.toLowerCase()">{{ ride.status }}</span>
                          <span class="res-name">{{ ride.restaurantName }}</span>
                          <span class="address">{{ ride.deliveryAddress }}</span>
                        </div>
                        <div class="ride-actions">
                          @if (canPickUp(ride)) {
                            <button class="btn-step" (click)="updateStatus(ride.id, 'PICKED_UP')">Pick Up</button>
                          } @else if (isPickedUp(ride)) {
                            <button class="btn-step delivered" (click)="updateStatus(ride.id, 'DELIVERED')">Complete Delivery</button>
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
            <section class="past-rides card animate-fade-in">
              <h2 class="section-title">Ride History</h2>
              @if (pastRides().length === 0) {
                <div class="empty-state">
                  <p>You haven't completed any rides yet.</p>
                </div>
              } @else {
                <table class="history-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Restaurant</th>
                      <th>Address</th>
                      <th>Earnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (ride of pastRides(); track ride.id) {
                      <tr>
                        <td>{{ ride.createdAt | date:'shortDate' }}</td>
                        <td>{{ ride.restaurantName }}</td>
                        <td>{{ ride.deliveryAddress }}</td>
                        <td>₹40</td>
                      </tr>
                    }
                  </tbody>
                </table>
              }
            </section>
          }
        </div>
      </main>
    </div>
  `,
  styles: [`
    .agent-container {
      display: flex;
      height: 100vh;
      background: #fff8f0; /* Slight warm tint for Agent Hub */
      color: #2d2d2d;
      font-family: 'Inter', sans-serif;
    }

    /* Sidebar */
    .sidebar {
      width: 280px;
      background: white;
      border-right: 1px solid #eee;
      display: flex; flex-direction: column;
      padding: 2.5rem 1.5rem;
      box-shadow: 4px 0 24px rgba(0,0,0,0.02);
    }

    .brand { display: flex; align-items: center; gap: 1rem; margin-bottom: 3.5rem; }
    .logo-shield {
      font-size: 1.8rem;
      background: #fff4e5;
      padding: 10px;
      border-radius: 16px;
    }
    .brand h1 {
      font-size: 1.6rem;
      font-weight: 800;
      color: #3d2b1f;
      letter-spacing: -1px;
    }

    .nav-menu { display: flex; flex-direction: column; gap: 0.75rem; flex: 1; }
    .nav-item {
      display: flex; align-items: center; gap: 1rem; width: 100%; padding: 14px 18px;
      border: none; background: transparent; color: #686b78; border-radius: 14px;
      font-weight: 600; cursor: pointer; transition: all 0.2s; text-align: left;
    }
    .nav-item:hover { background: #fef2f2; color: #ff5231; }
    .nav-item.active {
      background: #ff5231; color: white;
      box-shadow: 0 8px 20px rgba(255, 82, 49, 0.2);
    }

    .sidebar-footer { margin-top: auto; }
    .logout-btn {
      width: 100%; padding: 14px; background: #3d2b1f; border: none; color: white;
      border-radius: 14px; display: flex; align-items: center; justify-content: center;
      gap: 0.75rem; cursor: pointer; font-weight: 700; transition: all 0.2s;
    }
    .logout-btn:hover { background: #2a1d15; transform: translateY(-2px); }

    /* Main Content */
    .main-content { flex: 1; padding: 3.5rem 4.5rem; overflow-y: auto; }
    .hub-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 4rem;
    }
    .header-main h1 { font-size: 2.8rem; font-weight: 900; color: #3d2b1f; margin-bottom: 0.75rem; letter-spacing: -1.5px; }
    .header-main p { color: #8c7a6e; font-size: 1.2rem; font-weight: 500; }

    .user-info {
      background: white;
      padding: 1rem 1.5rem;
      border-radius: 20px;
      border: 1px solid #f0e0d0;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      box-shadow: 0 8px 24px rgba(61, 43, 31, 0.05);
      text-align: right;
    }

    .user-name { font-weight: 800; color: #3d2b1f; font-size: 1.1rem; }
    .user-id { font-size: 0.85rem; color: #ff5231; font-weight: 600; font-family: 'JetBrains Mono', monospace; }

    .ride-section { flex: 1; display: flex; flex-direction: column; }
    .section-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; }
    .section-title {
      font-size: 1rem; font-weight: 800; color: #3d2b1f;
      text-transform: uppercase; letter-spacing: 1px; margin: 0;
    }

    .rides-grid { display: flex; gap: 2.5rem; }

    .card {
      background: white; border: 1px solid #f0e0d0; border-radius: 28px;
      padding: 2rem; box-shadow: 0 12px 40px rgba(61, 43, 31, 0.04);
      min-height: 400px;
    }

    .ride-list { display: flex; flex-direction: column; gap: 1.25rem; }
    
    .ride-card {
      background: #fdfaf7; border: 1px solid #f0e0d0; border-radius: 20px;
      padding: 1.5rem; display: flex; justify-content: space-between; align-items: center;
      transition: all 0.2s;
    }
    .ride-card:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,0.05); }
    .ride-card.active { border-left: 5px solid #ff5231; }

    .ride-info { display: flex; flex-direction: column; gap: 0.4rem; }
    
    .section-header { 
      display: flex; align-items: center; justify-content: space-between; 
      margin-bottom: 1.5rem; 
    }
    .section-title { font-size: 1.25rem; font-weight: 800; color: #3d2b1f; display: flex; align-items: center; gap: 0.5rem; }

    .refresh-pill {
      background: #fff; color: #ff5231; border: 1px solid #f0e0d0; padding: 8px 16px;
      border-radius: 50px; font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: 0.2s;
      display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    .refresh-pill:hover { background: #fdfaf7; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .refresh-pill.spinning { animation: spin-alt 1s linear infinite; }
    @keyframes spin-alt { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .res-name { font-weight: 800; color: #3d2b1f; font-size: 1.1rem; }
    .address { color: #8c7a6e; font-size: 0.9rem; font-weight: 500; }
    .amount { color: #22c55e; font-weight: 700; font-size: 0.85rem; margin-top: 0.25rem; }

    .btn-accept {
      background: #ff5231; color: white; border: none; padding: 10px 24px;
      border-radius: 12px; font-weight: 800; cursor: pointer; transition: 0.2s;
    }
    .btn-accept:hover { background: #e63e1f; transform: scale(1.05); }

    .btn-refuse {
      background: #fdfaf7; color: #8c7a6e; border: 1px solid #f0e0d0; padding: 10px 20px;
      border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.2s;
    }
    .btn-refuse:hover { background: #fff4e5; color: #ff5231; }

    .ride-actions { display: flex; gap: 10px; }

    .btn-step {
      background: #3d2b1f; color: white; border: none; padding: 10px 20px;
      border-radius: 12px; font-weight: 700; cursor: pointer;
    }
    .btn-step.delivered { background: #22c55e; }

    .status-badge {
      font-size: 0.65rem; font-weight: 800; text-transform: uppercase;
      padding: 4px 10px; border-radius: 6px; width: fit-content; margin-bottom: 0.5rem;
    }
    .status-badge.picked_up { background: #eff6ff; color: #3b82f6; }
    .status-badge.ready { background: #ecfdf5; color: #22c55e; }

    .empty-state {
      flex: 1; display: flex; flex-direction: column; align-items: center;
      justify-content: center; text-align: center; color: #8c7a6e; padding: 2rem;
    }
    .empty-icon { font-size: 3rem; margin-bottom: 1.5rem; opacity: 0.5; }

    .history-table { width: 100%; border-collapse: collapse; text-align: left; }
    .history-table th { padding: 1.25rem; border-bottom: 2px solid #f8f0e5; color: #8c7a6e; font-size: 0.85rem; font-weight: 800; text-transform: uppercase; }
    .history-table td { padding: 1.5rem 1.25rem; border-bottom: 1px solid #f8f0e5; font-weight: 600; color: #3d2b1f; }

    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    .loading-overlay { display: flex; justify-content: center; padding: 4rem; }
    .spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #ff5231; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
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
