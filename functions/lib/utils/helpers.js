"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createResponse = void 0;
const createResponse = (data, message = '성공') => {
    return { success: true, message, data };
};
exports.createResponse = createResponse;
//# sourceMappingURL=helpers.js.map