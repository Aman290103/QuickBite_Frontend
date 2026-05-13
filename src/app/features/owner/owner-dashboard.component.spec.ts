import { TestBed } from '@angular/core/testing';
import { OwnerDashboardComponent } from './owner-dashboard.component';
import { RestaurantService } from '../../core/services/restaurant.service';
import { OrderService } from '../../core/services/order.service';
import { MenuService } from '../../core/services/menu.service';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';

describe('OwnerDashboardComponent', () => {
  beforeEach(async () => {
    const mockAuthService = { logout: () => {} };
    const mockRestaurantService = { getMyRestaurants: () => of([]) };
    const mockOrderService = {};
    const mockMenuService = {};
    const mockRouter = { navigate: () => {} };

    await TestBed.configureTestingModule({
      imports: [OwnerDashboardComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: RestaurantService, useValue: mockRestaurantService },
        { provide: OrderService, useValue: mockOrderService },
        { provide: MenuService, useValue: mockMenuService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(OwnerDashboardComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
