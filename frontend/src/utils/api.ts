/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

export const parseError = (error: unknown) => {
  if (!error) {
    return 'Unknown error';
  }
  if (typeof error === 'string') {
    return error;
  }
  if (
    // If API returns {"error": "some error message""}
    typeof error === 'object' &&
    (error as any)?.response?.data?.error
  ) {
    return (error as any)?.response?.data?.error;
  }
  if (
    // If API returns {"message": "some error message""}
    typeof error === 'object' &&
    (error as any)?.response?.data?.message
  ) {
    return (error as any)?.response?.data?.message;
  }
  if (
    // API returns a raw string error
    typeof error === 'object' &&
    (error as any)?.response?.data
  ) {
    return (error as any)?.response?.data;
  }
  // If the error is actually a JS error object
  if (typeof error === 'object' && 'message' in error) {
    return (error as any).message;
  }
  return 'Unknown error';
};
