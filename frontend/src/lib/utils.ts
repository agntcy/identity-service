/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {clsx, type ClassValue} from 'clsx';
import {twMerge} from 'tailwind-merge';
import z from 'zod';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export const validateForm = <T>(schema: z.ZodSchema<T>, values: T): {success: boolean; errors?: z.ZodIssue[]; data?: T} => {
  const result = schema.safeParse(values);
  if (!result.success) {
    return {success: false, errors: result.error.errors};
  }
  return {success: true, data: result.data};
};

export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return window.btoa(binary);
};

export const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export async function apiRequest(method: string, url: string, data?: unknown): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? {'Content-Type': 'application/json'} : {},
    body: data ? JSON.stringify(data) : undefined
  });

  await throwIfResNotOk(res);
  return res;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}
