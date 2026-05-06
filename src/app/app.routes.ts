import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login.component';
import { SignupComponent } from './features/auth/signup.component';
import { CustomerLayoutComponent } from './features/customer/customer-layout.component';
import { BrowseRestaurantsComponent } from './features/customer/browse-restaurants.component';
import { WalletComponent } from './features/customer/wallet.component';
import { OrderHistoryComponent } from './features/customer/order-history.component';
import { ProfileComponent } from './features/customer/profile.component';
import { RestaurantDetailComponent } from './features/customer/restaurant-detail.component';
import { CartComponent } from './features/customer/cart.component';
import { AdminDashboardComponent } from './features/admin/admin-dashboard.component';
import { AgentDashboardComponent } from './features/agent/agent-dashboard.component';
import { OwnerDashboardComponent } from './features/owner/owner-dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { 
    path: 'customer', 
    component: CustomerLayoutComponent,
    children: [
      { path: '', component: BrowseRestaurantsComponent },
      { path: 'restaurant/:id', component: RestaurantDetailComponent },
      { path: 'cart', component: CartComponent },
      { path: 'wallet', component: WalletComponent },
      { path: 'history', component: OrderHistoryComponent },
      { path: 'profile', component: ProfileComponent },
    ]
  },
  
  // Placeholder for other roles
  { path: 'owner', component: OwnerDashboardComponent }, 
  { path: 'agent', component: AgentDashboardComponent },
  { path: 'admin', component: AdminDashboardComponent },
];
