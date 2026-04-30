"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleError = exports.AppError = exports.ERROR_MESSAGES = void 0;
exports.ERROR_MESSAGES = {
    UNAUTHORIZED: '?몄쬆???꾩슂?⑸땲??',
    FORBIDDEN: '?묎렐 沅뚰븳???놁뒿?덈떎.',
    NOT_FOUND: '?붿껌???곗씠?곕? 李얠쓣 ???놁뒿?덈떎.',
    INVALID_INPUT: '?낅젰媛믪씠 ?щ컮瑜댁? ?딆뒿?덈떎.',
    INTERNAL_SERVER_ERROR: '?쒕쾭 ?대? ?ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.',
};
class AppError extends Error {
    constructor(message, code = 'internal', status = 500) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.status = status;
    }
}
exports.AppError = AppError;
const handleError = (error) => {
    if (error instanceof AppError) {
        return { error: true, code: error.code, message: error.message };
    }
    const msg = error instanceof Error ? error.message : String(error);
    return { error: true, code: 'internal', message: exports.ERROR_MESSAGES.INTERNAL_SERVER_ERROR, details: msg };
};
exports.handleError = handleError;
//# sourceMappingURL=errors.js.map