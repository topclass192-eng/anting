"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStatus = void 0;
const functions = require("firebase-functions");
const errors_1 = require("../utils/errors");
exports.updateStatus = functions.region('asia-northeast3').https.onCall(async (_data, _context) => {
    try {
        return { success: true, message: 'updateStatus called' };
    }
    catch (error) {
        return (0, errors_1.handleError)(error);
    }
});
//# sourceMappingURL=updateStatus.js.map