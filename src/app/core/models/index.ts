export interface User { // Admin-controlled model
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'CUSTOMER' | 'OWNER' | 'DELIVERY_AGENT' | 'ADMIN';
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  address: string;
  city: string;
  phone: string;
  avgRating: number;
  reviewCount: number;
  imageUrl?: string;
  minOrderAmount: number;
  estimatedDeliveryMin: number;
  isOpen: boolean;
  isApproved: boolean;
}

export interface CartItem {
  itemId: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
  customization?: string;
}

export interface Cart {
  cartId: string;
  restaurantId: string;
  items: CartItem[];
  subTotal: number;
  discountAmount: number;
  taxAmount: number;
  appliedPromoCode?: string;
  grandTotal: number;
}

export interface Order {
  id: string;
  orderNumber?: string;
  restaurantId: string;
  restaurantName: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'PLACED' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'PICKED_UP' | 'DELIVERED' | 'CANCELLED';
  deliveryAddress: string;
  agentId?: string;
  specialInstructions?: string;
  createdAt: string;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface WalletBalance {
  balance: number;
}

export interface WalletStatement {
  id: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  description: string;
  createdAt: string;
}

export interface MenuCategory {
  categoryId: string;
  restaurantId: string;
  name: string;
  description: string;
  displayOrder: number;
  items: MenuItem[];
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  isVeg: boolean;
  calories: number;
  imageUrl?: string;
  isAvailable: boolean;
  avgRating: number;
}

export interface AppNotification {
  id: string;
  restaurantId: string;
  restaurantName: string;
  title: string;
  message: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}
