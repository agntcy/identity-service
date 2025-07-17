/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ApprovalRequestInfo {
  callerApp?: string;
  calleeApp?: string;
  toolName?: string;
  otp?: string;
  deviceId?: string;
  sessionId?: string;
  timeoutInSeconds?: number;
}

export interface Device {
  id?: string;
  userId?: string;
  subscriptionToken?: string;
  name?: string;
  createdAt?: Date;
}

export enum NotificationType {
  UNSPECIFIED = 'NOTIFICATION_TYPE_UNSPECIFIED',
  INFO = 'NOTIFICATION_TYPE_INFO',
  APPROVAL_REQUEST = 'NOTIFICATION_TYPE_APPROVAL_REQUEST'
}

export interface Notification {
  body?: string;
  type?: NotificationType;
  approvalRequestInfo?: ApprovalRequestInfo;
}
