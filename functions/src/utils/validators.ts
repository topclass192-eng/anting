import { AppError, ERROR_MESSAGES } from './errors';
import type { Role } from '../types';

export const validateCampaignInput = (data: unknown) => {
  const d = data as Record<string, unknown>;
  if (!d || !d.title || !d.description || !d.productName) {
    throw new AppError(ERROR_MESSAGES.INVALID_INPUT, 'invalid-argument', 400);
  }
};

export const validateUserRole = (role: string): role is Role => {
  const allowedRoles = ['brand', 'influencer', 'shopper', 'admin'];
  if (!allowedRoles.includes(role)) {
    throw new AppError(ERROR_MESSAGES.INVALID_INPUT, 'invalid-argument', 400);
  }
  return true;
};

export const validateApplicationInput = (data: unknown) => {
  const d = data as Record<string, unknown>;
  if (!d || !d.campaignId) {
    throw new AppError(ERROR_MESSAGES.INVALID_INPUT, 'invalid-argument', 400);
  }
};
