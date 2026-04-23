export const ERROR_MESSAGES = {
  UNAUTHORIZED: '?몄쬆???꾩슂?⑸땲??',
  FORBIDDEN: '?묎렐 沅뚰븳???놁뒿?덈떎.',
  NOT_FOUND: '?붿껌???곗씠?곕? 李얠쓣 ???놁뒿?덈떎.',
  INVALID_INPUT: '?낅젰媛믪씠 ?щ컮瑜댁? ?딆뒿?덈떎.',
  INTERNAL_SERVER_ERROR: '?쒕쾭 ?대? ?ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.',
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
