// Unions espelhando os enums Prisma reais (services/api/prisma/schema.prisma).
// Campos monetarios/decimais sao sempre `string` — Decimal do Prisma
// serializa como string no JSON, nunca number.

export type OrderStatus =
  | 'pending'
  | 'searching_washer'
  | 'accepted'
  | 'en_route'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type ServiceType = 'DRY_WASH' | 'EXPRESS_WASH' | 'HEAVY_SERVICE';

export type DriverStatus =
  | 'draft'
  | 'pending_documents'
  | 'awaiting_kit'
  | 'active'
  | 'inactive'
  | 'rejected'
  | 'blocked';

export type DriverType = 'MOTO_WASHER' | 'CAR_WASHER' | 'CARWASH_SHOP';

export type ProductStatus = 'draft' | 'pending_approval' | 'active' | 'inactive' | 'rejected';

export type StoreStatus = 'pending' | 'active' | 'inactive' | 'blocked';

export type StoreType = 'LAVADOR' | 'CLIENTE';

export type LogisticsPlan = 'INTEGRATED' | 'OWN';

export type PayoutStatus = 'pending' | 'approved' | 'paid' | 'rejected';

export type PayoutRecipientType = 'WASHER' | 'STORE';

export type CouponDiscountType = 'percent' | 'fixed';

export type StarterKitStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

export type SupportTicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export type RentalStatus = 'requested' | 'active' | 'completed' | 'cancelled' | 'overdue';

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'CLIENTE' | 'LAVADOR' | 'ADMIN';
}

export interface OrderItem {
  id: string;
  name: string;
  price: string;
  quantity: number;
}

export interface Vehicle {
  id: string;
  type: string;
  brand: string;
  model: string;
  color: string | null;
  plate: string;
}

export interface Address {
  id: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface Zone {
  id: string;
  name: string;
}

export interface ZoneAdmin {
  id: string;
  city: string;
  state: string;
  name: string;
  slug: string;
  neighborhoods: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { drivers: number; orders: number };
}

export interface Order {
  id: string;
  customerId: string;
  driverId: string | null;
  vehicleId: string;
  addressId: string;
  zoneId: string | null;
  status: OrderStatus;
  serviceType: ServiceType | null;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  totalAmount: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  vehicle: Vehicle;
  address: Address;
  zone: Zone | null;
  customer: { id: string; name: string };
}

export interface DriverProfileUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

export interface DriverProfile {
  userId: string;
  driverType: DriverType;
  allowedServices: ServiceType[];
  serviceRadiusKm: string;
  status: DriverStatus;
  currentZoneId: string | null;
  createdAt: string;
  user: DriverProfileUser;
  zone: Zone | null;
}

export interface CommissionPlan {
  storeType: StoreType;
  logisticsPlan: LogisticsPlan;
  monthlyFee: string;
  takeRate: string;
}

export interface Store {
  id: string;
  ownerUserId: string;
  name: string;
  storeType: StoreType;
  logisticsPlan: LogisticsPlan;
  status: StoreStatus;
  commissionPlan: CommissionPlan | null;
  _count: { products: number };
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  category: string | null;
  price: string;
  stockQuantity: number;
  status: ProductStatus;
  createdAt: string;
  store: { id: string; name: string };
}

export interface CouponCampaign {
  id: string;
  name: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: CouponDiscountType;
  discountValue: string;
  maxUses: number | null;
  usedCount: number;
  minOrderAmount: string | null;
  expiresAt: string | null;
  isActive: boolean;
  campaignId: string | null;
  createdAt: string;
  campaign: CouponCampaign | null;
}

export interface StarterKit {
  washerId: string;
  status: StarterKitStatus;
  price: string;
  installments: number;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  washer: {
    userId: string;
    user: { id: string; name: string; email: string; phone: string | null };
  };
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  message: string;
  status: SupportTicketStatus;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string; email: string };
}

export interface Rental {
  id: string;
  userId: string;
  driverId: string | null;
  status: RentalStatus;
  weeklyRate: string;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string; email: string };
  driver: { userId: string; user: { id: string; name: string; email: string } } | null;
}

export interface LoyaltyReportHolder {
  userId: string;
  userName: string;
  userEmail: string;
  balance: number;
  balanceValue: number;
}

export interface LoyaltyReport {
  totalGranted: number;
  totalGrantedValue: number;
  totalRedeemed: number;
  totalRedeemedValue: number;
  totalOutstanding: number;
  totalOutstandingValue: number;
  totalExpired: number;
  totalExpiredValue: number;
  topHolders: LoyaltyReportHolder[];
}

export interface Payout {
  id: string;
  recipientType: PayoutRecipientType;
  recipientWasherId: string | null;
  recipientStoreId: string | null;
  periodStart: string;
  periodEnd: string;
  ordersCount: number;
  grossAmount: string;
  commissionAmount: string;
  netAmount: string;
  status: PayoutStatus;
  rejectionReason: string | null;
  providerReference: string | null;
  approvedAt: string | null;
  paidAt: string | null;
  createdAt: string;
  recipientWasher: { userId: string; user: { id: string; name: string; email: string } } | null;
  recipientStore: { id: string; name: string } | null;
}
