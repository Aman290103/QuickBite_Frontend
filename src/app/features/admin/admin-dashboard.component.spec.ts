import { TestBed } from '@angular/core/testing';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { AuthService } from '../../core/services/auth.service';
import { RestaurantService } from '../../core/services/restaurant.service';
import { of } from 'rxjs';

describe('AdminDashboardComponent', () => {
  beforeEach(async () => {
    const mockAuthService = {
      getAllUsers: () => of([]),
      logout: () => {}
    };
    
    const mockRestaurantService = {
      getPendingApprovals: () => of([]),
      getAllRestaurants: () => of([])
    };

    await TestBed.configureTestingModule({
      imports: [AdminDashboardComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: RestaurantService, useValue: mockRestaurantService }
      ]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(AdminDashboardComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
