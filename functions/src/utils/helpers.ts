export const createResponse = <T>(data: T, message: string = '성공') => {
  return { success: true, message, data };
};
