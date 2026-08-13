import { apiClient } from '../api-client';
import type { Coupon, CouponCampaign, CouponDiscountType, Paginated } from '../types';

export function listCampaigns() {
  return apiClient.get<CouponCampaign[]>('/admin/coupons/campaigns').then((r) => r.data);
}

export interface CreateCampaignBody {
  name: string;
  description?: string;
  startsAt: string;
  endsAt?: string;
  isActive?: boolean;
}

export function createCampaign(body: CreateCampaignBody) {
  return apiClient.post<CouponCampaign>('/admin/coupons/campaigns', body).then((r) => r.data);
}

export function updateCampaign(id: string, body: Partial<CreateCampaignBody>) {
  return apiClient.patch<CouponCampaign>(`/admin/coupons/campaigns/${id}`, body).then((r) => r.data);
}

export interface AdminListCouponsParams {
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export function listCoupons(params: AdminListCouponsParams) {
  return apiClient.get<Paginated<Coupon>>('/admin/coupons', { params }).then((r) => r.data);
}

export function getCoupon(id: string) {
  return apiClient.get<Coupon>(`/admin/coupons/${id}`).then((r) => r.data);
}

export interface CreateCouponBody {
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  maxUses?: number;
  minOrderAmount?: number;
  expiresAt?: string;
  isActive?: boolean;
  campaignId?: string;
}

export function createCoupon(body: CreateCouponBody) {
  return apiClient.post<Coupon>('/admin/coupons', body).then((r) => r.data);
}

export function updateCoupon(id: string, body: Partial<CreateCouponBody>) {
  return apiClient.patch<Coupon>(`/admin/coupons/${id}`, body).then((r) => r.data);
}

export function deleteCoupon(id: string) {
  return apiClient.delete<Coupon>(`/admin/coupons/${id}`).then((r) => r.data);
}
