/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ApprovalRequestInfo {
  callee_app?: string;
  caller_app?: string;
  tool_name?: string;
  otp?: string;
  device_id?: string;
  session_id?: string;
  timeout_in_seconds?: number;
  timstamp?: number;
}

export enum NotificationType {
  UNSPECIFIED = 'NOTIFICATION_TYPE_UNSPECIFIED',
  INFO = 'NOTIFICATION_TYPE_INFO',
  APPROVAL_REQUEST = 'NOTIFICATION_TYPE_APPROVAL_REQUEST'
}

export interface INotification {
  body?: string;
  type?: NotificationType;
  id?: string;
  timestamp?: number;
  approval_request_info?: ApprovalRequestInfo;
}
