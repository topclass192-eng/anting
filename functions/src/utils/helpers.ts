export const createResponse = (data: any, message: string = '성공') => {
  return { success: true, message, data };
};
