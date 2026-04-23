import type { Timestamp } from 'firebase/firestore';

export type Role = 'brand' | 'influencer' | 'shopper' | 'admin';
export type CampaignStatus = 'draft' | 'active' | 'closed' | 'completed';
export type ApplicationStatus = 'pending' | 'selected' | 'rejected' | 'cancelled';

export interface IUser {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  profileImageUrl?: string;
  phoneNumber?: string;
}

export interface IBrand {
  userId: string;
  companyName: string;
  businessRegistrationNumber: string;
  managerName: string;
  managerPhone: string;
  managerEmail: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  description?: string;
  websiteUrl?: string;
}

export interface IInfluencer {
  userId: string;
  sellerCode: string;
  grade: string;
  socialLinks: {
    instagram?: string;
    youtube?: string;
    blog?: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    holderName: string;
  };
}

export interface ICampaign {
  id: string;
  brandId: string;
  title: string;
  description: string;
  productName: string;
  status: CampaignStatus;
  startDate: Timestamp;
  endDate: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  thumbnailUrl?: string;
  budget?: number;
  maxApplicants?: number;
}

export interface IApplication {
  id: string;
  campaignId: string;
  influencerId: string;
  status: ApplicationStatus;
  appliedAt: Timestamp;
  updatedAt: Timestamp;
  message?: string;
}

export interface IProduct {
  id: string;
  brandId: string;
  name: string;
  price: number;
  stock: number;
  description: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  imageUrls?: string[];
}

export interface IPoint {
  id: string;
  userId: string;
  amount: number;
  type: 'earn' | 'spend';
  description: string;
  createdAt: Timestamp;
  referenceId?: string;
}

export interface INotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: Timestamp;
  link?: string;
}

export interface IOrder {
  id: string;
  productId: string;
  buyerId: string;
  sellerCode?: string;
  quantity: number;
  totalPrice: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
