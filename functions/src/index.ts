import * as admin from 'firebase-admin';

// Firebase Admin SDK 초기화
if (!admin.apps.length) {
    admin.initializeApp();
}

export * from './auth/onUserCreate';
export * from './auth/setRole';
export * from './campaigns/createCampaign';
export * from './campaigns/getCampaigns';
export * from './campaigns/updateStatus';
export * from './applications/apply';
export * from './applications/select';
