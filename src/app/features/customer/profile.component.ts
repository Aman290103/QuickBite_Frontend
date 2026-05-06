import { inject, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="profile-container animate-fade-in">
      <header class="section-header">
        <h1>Profile Settings</h1>
        <p class="text-muted">Manage your personal information</p>
      </header>

      <div class="profile-card glass">
        <div class="profile-header">
          <div class="avatar">
            {{ user()?.fullName?.charAt(0) }}
          </div>
          <div>
            <h2>{{ user()?.fullName }}</h2>
            <p class="role-badge">{{ user()?.role }}</p>
          </div>
        </div>

        <form class="profile-form">
          <div class="form-grid">
            <div class="form-group">
              <label>Full Name</label>
              <input type="text" [value]="user()?.fullName" readonly class="form-input">
            </div>
            <div class="form-group">
              <label>Email Address</label>
              <input type="email" [value]="user()?.email" readonly class="form-input">
            </div>
            <div class="form-group">
              <label>Phone Number</label>
              <input type="text" [value]="user()?.phone" readonly class="form-input">
            </div>
          </div>
          
          <div class="form-footer">
            <p class="info-note">Profile editing is currently disabled in this preview.</p>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .profile-container {
      padding: 1rem;
    }
    
    .profile-card {
      max-width: 700px;
      margin-top: 2rem;
      padding: 2.5rem;
      border-radius: 1.5rem;
    }
    
    .profile-header {
      display: flex;
      align-items: center;
      gap: 2rem;
      margin-bottom: 3rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid var(--border);
    }
    
    .avatar {
      width: 100px;
      height: 100px;
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 3rem;
      font-weight: 800;
      color: white;
    }
    
    .role-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: rgba(249, 115, 22, 0.1);
      color: var(--primary);
      border-radius: 2rem;
      font-size: 0.75rem;
      font-weight: 700;
      margin-top: 0.5rem;
    }
    
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }
    
    @media (max-width: 600px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
    }
    
    .form-group {
      margin-bottom: 1rem;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      color: var(--text-muted);
      font-size: 0.875rem;
    }
    
    .form-input {
      width: 100%;
      padding: 0.875rem 1rem;
      background: var(--bg-surface-light);
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      color: var(--text-main);
      opacity: 0.8;
    }
    
    .form-footer {
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border);
    }
    
    .info-note {
      color: var(--text-muted);
      font-size: 0.875rem;
      font-style: italic;
    }
  `]
})
export class ProfileComponent {
  private authService = inject(AuthService);
  user = this.authService.currentUser;
}
