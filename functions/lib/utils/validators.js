"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCampaignInput = exports.validateCampaignDraft = exports.validateProductInput = exports.validateBrandProfile = exports.validateApplicationInput = exports.validateUserRole = void 0;
const errors_1 = require("./errors");
const validateUserRole = (role) => {
    const allowedRoles = ['brand', 'influencer', 'shopper', 'admin'];
    if (!allowedRoles.includes(role)) {
        throw new errors_1.AppError(errors_1.ERROR_MESSAGES.INVALID_INPUT, 'invalid-argument', 400);
    }
    return true;
};
exports.validateUserRole = validateUserRole;
const validateApplicationInput = (data) => {
    const d = data;
    if (!d || !d.campaignId) {
        throw new errors_1.AppError(errors_1.ERROR_MESSAGES.INVALID_INPUT, 'invalid-argument', 400);
    }
};
exports.validateApplicationInput = validateApplicationInput;
const validateBrandProfile = (data) => {
    const d = data;
    if (!d)
        throw new errors_1.AppError('입력값이 없습니다.', 'invalid-argument', 400);
    if (!d.companyName || typeof d.companyName !== 'string' || d.companyName.trim().length === 0 || d.companyName.length > 50) {
        throw new errors_1.AppError('회사명을 1~50자 이내로 입력해주세요.', 'invalid-argument', 400);
    }
    const allowedCategories = ['뷰티', '식품', '생활', '패션', '육아', '기타'];
    if (!d.category || typeof d.category !== 'string' || !allowedCategories.includes(d.category)) {
        throw new errors_1.AppError('유효한 카테고리를 선택해주세요.', 'invalid-argument', 400);
    }
    if (!d.contactName || typeof d.contactName !== 'string' || d.contactName.trim().length === 0 || d.contactName.length > 20) {
        throw new errors_1.AppError('담당자명을 1~20자 이내로 입력해주세요.', 'invalid-argument', 400);
    }
    const phoneRegex = /^010-\d{4}-\d{4}$/;
    if (!d.contactPhone || typeof d.contactPhone !== 'string' || !phoneRegex.test(d.contactPhone)) {
        throw new errors_1.AppError('올바른 연락처 형식(010-0000-0000)으로 입력해주세요.', 'invalid-argument', 400);
    }
    if (d.description && typeof d.description === 'string' && d.description.length > 200) {
        throw new errors_1.AppError('회사 소개는 최대 200자까지 입력 가능합니다.', 'invalid-argument', 400);
    }
};
exports.validateBrandProfile = validateBrandProfile;
const validateProductInput = (data) => {
    const d = data;
    if (!d)
        throw new errors_1.AppError('입력값이 없습니다.', 'invalid-argument', 400);
    if (!d.name || typeof d.name !== 'string' || d.name.trim().length === 0 || d.name.length > 50) {
        throw new errors_1.AppError('제품명을 1~50자 이내로 입력해주세요.', 'invalid-argument', 400);
    }
    const allowedCategories = ['뷰티', '식품', '생활', '패션', '육아', '기타'];
    if (!d.category || typeof d.category !== 'string' || !allowedCategories.includes(d.category)) {
        throw new errors_1.AppError('유효한 카테고리를 선택해주세요.', 'invalid-argument', 400);
    }
    if (!d.description || typeof d.description !== 'string' || d.description.trim().length === 0 || d.description.length > 500) {
        throw new errors_1.AppError('제품 설명을 1~500자 이내로 입력해주세요.', 'invalid-argument', 400);
    }
    if (typeof d.price !== 'number' || isNaN(d.price) || d.price < 0) {
        throw new errors_1.AppError('소비자가를 올바른 금액으로 입력해주세요.', 'invalid-argument', 400);
    }
    if (!Array.isArray(d.images) || d.images.length === 0 || d.images.length > 5) {
        throw new errors_1.AppError('제품 이미지는 최소 1장, 최대 5장까지 등록 가능합니다.', 'invalid-argument', 400);
    }
};
exports.validateProductInput = validateProductInput;
const validateCampaignDraft = (data) => {
    const d = data;
    if (!d)
        throw new errors_1.AppError('입력값이 없습니다.', 'invalid-argument', 400);
    if (d.name && (typeof d.name !== 'string' || d.name.length > 50)) {
        throw new errors_1.AppError('캠페인명은 최대 50자까지 입력 가능합니다.', 'invalid-argument', 400);
    }
    if (d.participants && (typeof d.participants !== 'number' || d.participants < 1 || d.participants > 100)) {
        throw new errors_1.AppError('모집 인원은 1명에서 100명 사이여야 합니다.', 'invalid-argument', 400);
    }
    // 기타 필드들은 draft 상태이므로 엄격히 검사하지 않음.
};
exports.validateCampaignDraft = validateCampaignDraft;
const validateCampaignInput = (data) => {
    const d = data;
    if (!d)
        throw new errors_1.AppError('입력값이 없습니다.', 'invalid-argument', 400);
    // Step 1 validation
    if (!d.name || typeof d.name !== 'string' || d.name.trim().length === 0 || d.name.length > 50) {
        throw new errors_1.AppError('캠페인명을 1~50자 이내로 입력해주세요.', 'invalid-argument', 400);
    }
    if (!d.productId || typeof d.productId !== 'string') {
        throw new errors_1.AppError('연결 제품을 선택해주세요.', 'invalid-argument', 400);
    }
    if (typeof d.participants !== 'number' || d.participants < 1 || d.participants > 100) {
        throw new errors_1.AppError('모집 인원은 1명에서 100명 사이여야 합니다.', 'invalid-argument', 400);
    }
    if (!Array.isArray(d.regions) || d.regions.length === 0) {
        throw new errors_1.AppError('지역 조건을 최소 1개 선택해주세요.', 'invalid-argument', 400);
    }
    if (!Array.isArray(d.platforms) || d.platforms.length === 0) {
        throw new errors_1.AppError('진행 플랫폼을 최소 1개 선택해주세요.', 'invalid-argument', 400);
    }
    if (!d.deadline || typeof d.deadline !== 'string') {
        throw new errors_1.AppError('모집 마감일을 선택해주세요.', 'invalid-argument', 400);
    }
    // Date validation (min 7 days)
    const deadlineDate = new Date(d.deadline);
    const minDate = new Date();
    minDate.setHours(0, 0, 0, 0);
    minDate.setDate(minDate.getDate() + 7);
    if (deadlineDate < minDate) {
        throw new errors_1.AppError('모집 마감일은 오늘 기준 최소 7일 이후여야 합니다.', 'invalid-argument', 400);
    }
    // Step 2 validation
    if (!d.requiredText || typeof d.requiredText !== 'string' || d.requiredText.length > 300) {
        throw new errors_1.AppError('필수 문구는 1~300자 이내로 입력해주세요.', 'invalid-argument', 400);
    }
    if (!Array.isArray(d.forbiddenWords) || d.forbiddenWords.length > 20) {
        throw new errors_1.AppError('금지어는 최대 20개까지 입력 가능합니다.', 'invalid-argument', 400);
    }
    if (!Array.isArray(d.hashtags) || d.hashtags.length > 30) {
        throw new errors_1.AppError('해시태그는 최대 30개까지 입력 가능합니다.', 'invalid-argument', 400);
    }
    if (Array.isArray(d.referenceUrls)) {
        const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
        for (const url of d.referenceUrls) {
            if (typeof url !== 'string' || (url && !urlPattern.test(url))) {
                throw new errors_1.AppError('올바른 URL 형식을 입력해주세요.', 'invalid-argument', 400);
            }
        }
    }
};
exports.validateCampaignInput = validateCampaignInput;
//# sourceMappingURL=validators.js.map