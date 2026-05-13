import { TestBed } from '@angular/core/testing';
import { AgentDashboardComponent } from './agent-dashboard.component';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { of } from 'rxjs';

describe('AgentDashboardComponent', () => {
  beforeEach(async () => {
    const mockOrderService = {
      getAvailableOrders: () => of([]),
      getAgentOrders: () => of([])
    };
    
    const mockAuthService = {
      currentUser: () => ({ id: '1', fullName: 'Agent' }),
      logout: () => {}
    };

    await TestBed.configureTestingModule({
      imports: [AgentDashboardComponent],
      providers: [
        { provide: OrderService, useValue: mockOrderService },
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(AgentDashboardComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
