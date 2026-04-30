"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFirebaseToken = createFirebaseToken;
const admin = require("firebase-admin");
async function createFirebaseToken(socialUser) {
    // Check for email conflicts
    // Firebase Auth supports multiple providers linked to the same user, but we'll manually link or use email
    let userRecord = null;
    let isNewUser = false;
    const targetUid = `${socialUser.providerId}:${socialUser.socialUserId}`;
    const mockEmail = `${socialUser.providerId}_${socialUser.socialUserId}@anting.app`;
    const primaryEmail = socialUser.email || mockEmail;
    try {
        // 1. Try to find the exact existing user by provider UID
        userRecord = await admin.auth().getUser(targetUid);
    }
    catch (error) {
        if (error.code === 'auth/user-not-found') {
            try {
                // 2. If exact UID not found, maybe email already exists? (for merging)
                if (socialUser.email) {
                    userRecord = await admin.auth().getUserByEmail(socialUser.email);
                    // Same email exists. We will NOT create a new UID, we'll just link or bypass
                    // But wait, our system links identities or we just issue token for the existing user UID?
                    // Usually, if email matches, we can just issue token for the existing user! 
                    // So user logs in to their old account.
                }
                else {
                    userRecord = null; // No email, so it's a completely new user
                }
            }
            catch (emailError) {
                if (emailError.code === 'auth/user-not-found') {
                    userRecord = null;
                }
                else {
                    throw emailError;
                }
            }
        }
        else {
            throw error;
        }
    }
    if (!userRecord) {
        isNewUser = true;
        userRecord = await admin.auth().createUser({
            uid: targetUid,
            email: primaryEmail,
            displayName: socialUser.displayName,
            photoURL: socialUser.profileImageUrl,
            emailVerified: true,
        });
    }
    // userRecord.uid handles the merged/existing or newly created uid
    const firebaseToken = await admin.auth().createCustomToken(userRecord.uid);
    return { firebaseToken, isNewUser };
}
//# sourceMappingURL=socialAuth.js.map