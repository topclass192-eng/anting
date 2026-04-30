import * as admin from 'firebase-admin';

// Firebase Admin SDK 초기화
if (!admin.apps.length) {
    admin.initializeApp();
}

export * from './auth/onUserCreate';
export * from './auth/setRole';
export * from './auth/index';
export * from './campaigns/createCampaign';
export * from './campaigns/getCampaigns';
export * from './campaigns/updateStatus';
export * from './applications/apply';
export * from './applications/getApplications';
export * from './applications/selectApplicant';
export * from './applications/updateShipping';
export * from './applications/confirmDelivery';
export * from './applications/submitContent';
export * from './applications/approveContent';
export * from './applications/rejectContent';
export * from './brands/updateBrand';
export * from './points/withdrawPoints';

// Campaign Functions
export * from './campaigns/createCampaign';
export * from './campaigns/getCampaigns';
export * from './campaigns/updateStatus';
export * from './campaigns/saveCampaignDraft';
export * from './campaigns/getCampaignDraft';


// Product Functions
export * from './products/createProduct';
export * from './products/getProducts';
export * from './products/updateProduct';
export * from './products/deleteProduct';
