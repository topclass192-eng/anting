"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
const admin = require("firebase-admin");
// Firebase Admin SDK 초기화
if (!admin.apps.length) {
    admin.initializeApp();
}
__exportStar(require("./auth/onUserCreate"), exports);
__exportStar(require("./auth/setRole"), exports);
__exportStar(require("./auth/index"), exports);
__exportStar(require("./campaigns/createCampaign"), exports);
__exportStar(require("./campaigns/getCampaigns"), exports);
__exportStar(require("./campaigns/updateStatus"), exports);
__exportStar(require("./applications/apply"), exports);
__exportStar(require("./applications/getApplications"), exports);
__exportStar(require("./applications/selectApplicant"), exports);
__exportStar(require("./applications/updateShipping"), exports);
__exportStar(require("./applications/confirmDelivery"), exports);
__exportStar(require("./applications/submitContent"), exports);
__exportStar(require("./applications/approveContent"), exports);
__exportStar(require("./applications/rejectContent"), exports);
__exportStar(require("./brands/updateBrand"), exports);
__exportStar(require("./points/withdrawPoints"), exports);
// Campaign Functions
__exportStar(require("./campaigns/createCampaign"), exports);
__exportStar(require("./campaigns/getCampaigns"), exports);
__exportStar(require("./campaigns/updateStatus"), exports);
__exportStar(require("./campaigns/saveCampaignDraft"), exports);
__exportStar(require("./campaigns/getCampaignDraft"), exports);
// Product Functions
__exportStar(require("./products/createProduct"), exports);
__exportStar(require("./products/getProducts"), exports);
__exportStar(require("./products/updateProduct"), exports);
__exportStar(require("./products/deleteProduct"), exports);
//# sourceMappingURL=index.js.map