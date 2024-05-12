export const SuccessResponse = (message = 'Success', others = {}) => ({success: true, message, ...others});
export const FailedResponse = (message = 'Failed', others = {}) => ({success: false, message, ...others});
