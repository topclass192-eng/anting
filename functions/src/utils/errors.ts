export const ERROR_MESSAGES = {
  UNAUTHORIZED: '인증이 필요합니다.',
  FORBIDDEN: '접근 권한이 없습니다.',
  NOT_FOUND: '요청한 데이터를 찾을 수 없습니다.',
  INVALID_INPUT: '입력값이 올바르지 않습니다.',
  INTERNAL_SERVER_ERROR: '서버 내부 오류가 발생했습니다.',
};

export class AppError extends Error {
  public code: string;
  public status: number;

  constructor(message: string, code: string = 'internal', status: number = 500) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
  }
}

export const handleError = (error: unknown) => {
  if (error instanceof AppError) {
    return { error: true, code: error.code, message: error.message };
  }
  const msg = error instanceof Error ? error.message : String(error);
  return { error: true, code: 'internal', message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, details: msg };
};
