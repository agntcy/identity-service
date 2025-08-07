/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

export const encodeBase64 = (input: string): string => {
  return btoa(input);
};

export const generateRandomId = () => Math.random().toString(36).slice(2);

export const fetchCurrentManifest = async () => {
  try {
    const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    if (!manifestLink) {
      console.warn('No manifest link found');
      return null;
    }

    const response = await fetch(manifestLink.href);
    if (!response.ok) {
      throw new Error(`Failed to fetch manifest: ${response.status} ${response.statusText}`);
    }

    const manifest = await response.json();
    return manifest;
  } catch (error) {
    console.error('Error fetching manifest:', error);
    return null;
  }
};
