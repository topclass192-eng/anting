"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onUserCreate = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const firestore_1 = require("firebase-admin/firestore");
const errors_1 = require("../utils/errors");
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
    try {
        const db = admin.firestore();
        const userRef = db.collection('users').doc(user.uid);
        const newUser = {
            id: user.uid,
            email: user.email || '',
            displayName: user.displayName || '',
            role: null,
            onboardingStep: 0,
            createdAt: firestore_1.FieldValue.serverTimestamp(),
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        };
        await userRef.set(newUser);
        functions.logger.info(`기본 유저 문서 생성 성공: ${user.uid}`);
    }
    catch (error) {
        functions.logger.error('onUserCreate 에러:', (0, errors_1.handleError)(error));
    }
});
//# sourceMappingURL=onUserCreate.js.map