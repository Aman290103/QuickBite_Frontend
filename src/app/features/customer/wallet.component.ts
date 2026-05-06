import { inject, Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WalletService } from '../../core/services/wallet.service';
import { WalletBalance, WalletStatement } from '../../core/models';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="wallet-container animate-slide-up">
      <header class="section-header">
        <h1>My Wallet</h1>
        <p class="text-muted">Manage your funds and transaction history</p>
      </header>

      <div class="wallet-grid">
        <div class="balance-card">
          <div class="card-glass">
            <span class="label">Current Balance</span>
            <h2 class="amount">₹{{ balance().balance | number:'1.2-2' }}</h2>
            <div class="actions">
              <button class="btn-primary full-width" (click)="showAddMoney = true">Add Money</button>
            </div>
          </div>
          
          <div *ngIf="showAddMoney" class="add-money-modal">
             <div class="modal-content card">
                <h3>Add Funds</h3>
                <p class="text-muted">Enter amount to add to your wallet</p>
                <div class="amount-input">
                  <span class="currency">₹</span>
                  <input type="number" [(ngModel)]="addAmount" placeholder="0.00" autofocus>
                </div>
                <div class="quick-amounts">
                  <button (click)="addAmount = 500">₹500</button>
                  <button (click)="addAmount = 1000">₹1000</button>
                  <button (click)="addAmount = 2000">₹2000</button>
                </div>
                <div class="modal-actions">
                  <button class="btn-primary" (click)="onAddMoney()" [disabled]="addAmount <= 0">Confirm Payment</button>
                  <button (click)="showAddMoney = false" class="btn-ghost">Cancel</button>
                </div>
             </div>
          </div>
        </div>

        <div class="history-card card">
          <div class="card-header">
            <h3>Transaction History</h3>
            <button class="btn-ghost" (click)="loadData()">Refresh</button>
          </div>
          <div class="statement-list">
            @for (item of statements(); track item.id) {
              <div class="statement-item">
                <div class="item-icon" [class.credit]="item.type === 'CREDIT'" [class.debit]="item.type === 'DEBIT'">
                  {{ item.type === 'CREDIT' ? '↓' : '↑' }}
                </div>
                <div class="item-info">
                  <span class="desc">{{ item.description }}</span>
                  <span class="date">{{ item.createdAt | date:'medium' }}</span>
                </div>
                <div class="item-amount" [class.credit]="item.type === 'CREDIT'">
                  {{ item.type === 'CREDIT' ? '+' : '-' }} ₹{{ item.amount }}
                </div>
              </div>
            } @empty {
              <div class="empty-statements">
                <img src="https://cdni.iconscout.com/illustration/premium/thumb/no-transaction-found-5301140-4424388.png" alt="No data">
                <p>No transactions found yet.</p>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .wallet-container {
      padding: 1rem;
    }
    
    .section-header {
      margin-bottom: 3rem;
    }
    
    .wallet-grid {
      display: grid;
      grid-template-columns: 400px 1fr;
      gap: 3rem;
    }
    
    .balance-card {
      position: relative;
    }
    
    .card-glass {
      padding: 3rem;
      border-radius: 24px;
      background: linear-gradient(135deg, var(--secondary), #1a1c23);
      color: white;
      box-shadow: var(--shadow-lg);
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: 250px;
    }
    
    .card-glass .label {
      color: rgba(255,255,255,0.6);
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 0.5rem;
    }
    
    .amount {
      font-size: 3.5rem;
      font-weight: 800;
      margin-bottom: 2.5rem;
      letter-spacing: -1px;
    }
    
    .history-card {
      padding: 2rem;
      height: 600px;
      display: flex;
      flex-direction: column;
    }
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }
    
    .statement-list {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding-right: 0.5rem;
    }
    
    .statement-item {
      display: flex;
      align-items: center;
      padding: 1.25rem;
      background: var(--bg-light);
      border-radius: 16px;
      gap: 1.25rem;
      transition: var(--transition);
    }
    
    .statement-item:hover {
      background: white;
      box-shadow: var(--shadow-sm);
    }
    
    .item-icon {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
      font-weight: 800;
      font-size: 1.25rem;
    }
    
    .item-icon.credit {
      color: #22c55e;
      background: rgba(34, 197, 94, 0.1);
    }
    
    .item-icon.debit {
      color: #ef4444;
      background: rgba(239, 68, 68, 0.1);
    }
    
    .item-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    
    .desc {
      font-weight: 700;
      color: var(--secondary);
    }
    
    .date {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 2px;
    }
    
    .item-amount {
      font-weight: 800;
      font-size: 1.125rem;
    }
    
    .item-amount.credit { color: #22c55e; }
    
    /* Modal Styles */
    .add-money-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0,0,0,0.5);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
    }
    
    .modal-content {
      width: 400px;
      padding: 2.5rem;
      text-align: center;
    }
    
    .amount-input {
      margin: 2rem 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border-bottom: 2px solid var(--primary);
      padding-bottom: 0.5rem;
    }
    
    .currency {
      font-size: 2rem;
      font-weight: 700;
      color: var(--primary);
      margin-right: 0.5rem;
    }
    
    .amount-input input {
      border: none;
      font-size: 2.5rem;
      font-weight: 800;
      width: 150px;
      text-align: center;
      outline: none;
    }
    
    .quick-amounts {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
      margin-bottom: 2.5rem;
    }
    
    .quick-amounts button {
      padding: 0.5rem 1rem;
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      transition: var(--transition);
    }
    
    .quick-amounts button:hover {
      background: var(--primary);
      color: white;
      border-color: var(--primary);
    }
    
    .modal-actions {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .btn-ghost {
      color: var(--text-muted);
      font-weight: 600;
    }
    
    .empty-statements {
      text-align: center;
      padding: 4rem 2rem;
      color: var(--text-muted);
    }
    
    .empty-statements img {
      width: 150px;
      margin-bottom: 1.5rem;
      opacity: 0.5;
    }
    
    @media (max-width: 900px) {
      .wallet-grid { grid-template-columns: 1fr; }
      .card-glass { min-height: 200px; }
    }
  `]
})
export class WalletComponent implements OnInit {
  private walletService = inject(WalletService);
  
  balance = signal<WalletBalance>({ balance: 0 });
  statements = signal<WalletStatement[]>([]);
  showAddMoney = false;
  addAmount = 0;

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.walletService.getBalance().subscribe(data => this.balance.set(data));
    this.walletService.getStatements().subscribe(data => this.statements.set(data));
  }

  onAddMoney() {
    if (this.addAmount > 0) {
      this.walletService.addMoney(this.addAmount).subscribe(() => {
        this.loadData();
        this.showAddMoney = false;
        this.addAmount = 0;
      });
    }
  }
}
