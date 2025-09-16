/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable indent */
// device maps
const iosDeviceMapping = new Map([
  // iPhones
  ['320x480', 'iPhone 4S, 4, 3GS, 3G, 1st gen'],
  ['320x568', 'iPhone 5, SE 1st Gen, 5C, 5S'],
  ['375x667', 'iPhone SE 2nd Gen, 6, 6S, 7, 8'],
  ['375x812', 'iPhone X, XS, 11 Pro, 12 Mini, 13 Mini'],
  ['390x844', 'iPhone 13, 13 Pro, 12, 12 Pro'],
  ['393x852', 'iPhone 14, 14 Pro, 15, 15 Pro, 16, 16 Pro'],
  ['414x736', 'iPhone 8+, 7+, 6S+, 6+'],
  ['414x896', 'iPhone 11, XR, XS Max, 11 Pro Max'],
  ['428x926', 'iPhone 13 Pro Max, 12 Pro Max'],
  ['430x932', 'iPhone 14 Pro Max, 15 Pro Max, 16 Pro Max'],
  ['476x847', 'iPhone 7+, 6+, 6S+'],

  // iPads
  ['744x1133', 'iPad Mini 6th Gen'],
  ['768x1024', 'iPad Mini (1-5th Gen), iPad (1-6th Gen), iPad Pro (1st Gen 9.7), iPad Mini (1-4), iPad Air (1-2)'],
  ['810x1080', 'iPad 7-9th Gen'],
  ['820x1180', 'iPad Air (4th-5th Gen)'],
  ['834x1194', 'iPad Pro (3-6th Gen 11-inch)'],
  ['834x1112', 'iPad Air (3rd Gen), iPad Pro (2nd Gen 10.5)'],
  ['1024x1366', 'iPad Pro (1-6th Gen 12.9-inch)']
]);

const desktopDeviceMapping = new Map([
  ['Win32', 'Windows'],
  ['Linux', 'Linux'],
  ['MacIntel', 'Mac OS'],
  ['MacArm64', 'Mac OS (Apple Silicon)'],
  ['FreeBSD', 'FreeBSD'],
  ['OpenBSD', 'OpenBSD'],
  ['CrOS', 'Chrome OS']
]);

interface DeviceInfo {
  name: string;
  model: string;
  os: string;
  osVersion: string;
  browser: string;
  screenSize: string;
  isMobile: boolean;
}
// get device name for android
const getAndroidDeviceName = (): DeviceInfo => {
  const ua = window.navigator.userAgent;
  const androidIndex = ua.indexOf('Android');

  // Get Android version
  const versionMatch = ua.match(/Android\s+([\d.]+)/);
  const androidVersion = versionMatch ? versionMatch[1] : '';

  // Get device model
  const afterAndroid = ua.slice(androidIndex);
  const modelMatch = afterAndroid.match(/; ([^;)]*)\)/);
  const deviceModel = modelMatch && modelMatch[1] ? modelMatch[1].trim() : 'Android';

  // Get browser info
  const browserMatch = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/);
  const browser = browserMatch ? browserMatch[0].split('/')[0] : 'Unknown';

  return {
    name: `${deviceModel} (Android ${androidVersion}) - ${browser}`,
    model: deviceModel,
    os: 'Android',
    osVersion: androidVersion,
    browser,
    screenSize: `${window.screen.width}x${window.screen.height}`,
    isMobile: true
  };
};

// get device name for ios
const getIosDeviceName = (): DeviceInfo => {
  const ua = window.navigator.userAgent;
  const screenResolution = `${window.screen.width}x${window.screen.height}`;

  // Get iOS version
  const versionMatch = ua.match(/OS (\d+_\d+(?:_\d+)?)/);
  const iosVersion = versionMatch ? versionMatch[1].replace(/_/g, '.') : '';

  // Get device model
  const deviceModel = iosDeviceMapping.get(screenResolution) || 'iPhone';

  // Get browser info (on iOS it's usually Safari or WebKit-based)
  const browserMatch = ua.match(/(CriOS|FxiOS|EdgiOS|Version)\/[\d.]+/);
  const browser = browserMatch
    ? (
        {
          CriOS: 'Chrome',
          FxiOS: 'Firefox',
          EdgiOS: 'Edge',
          Version: 'Safari'
        } as Record<string, string>
      )[browserMatch[1]] || 'Safari'
    : 'Safari';

  return {
    name: `${deviceModel} (iOS ${iosVersion}) - ${browser}`,
    model: deviceModel,
    os: 'iOS',
    osVersion: iosVersion,
    browser,
    screenSize: screenResolution,
    isMobile: true
  };
};

// get service utility
const getPlatform = (): string => {
  // Use platform property if available, otherwise fallback to userAgent
  if (typeof navigator.userAgentData?.platform === 'string') {
    return navigator.userAgentData.platform;
  }
  if (typeof navigator.platform === 'string') {
    return navigator.platform;
  }
  return 'unknown';
};

// get device name for desktop
const getDesktopDeviceName = (): DeviceInfo => {
  const service = getPlatform();
  const osName = desktopDeviceMapping.get(service) ?? 'Unknown';

  // Get browser info
  const ua = window.navigator.userAgent;
  const browserMatch = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/);
  const browser = browserMatch ? browserMatch[0].split('/')[0] : 'Unknown';

  // Get OS version
  const osVersion = ua.match(/(?:Windows NT|Mac OS X|Linux) ([^;)]+)/)?.[1] || '';

  return {
    name: `${osName} ${osVersion} - ${browser}`,
    model: osName,
    os: osName,
    osVersion,
    browser,
    screenSize: `${window.screen.width}x${window.screen.height}`,
    isMobile: false
  };
};

// get device name utility
export default function getDeviceInfo(): DeviceInfo {
  const isMobileDevice = window.navigator.userAgent.toLowerCase().includes('mobi');

  if (isMobileDevice) {
    if (window.navigator.userAgent.includes('Android')) {
      return getAndroidDeviceName();
    }
    return getIosDeviceName();
  }
  return getDesktopDeviceName();
}
