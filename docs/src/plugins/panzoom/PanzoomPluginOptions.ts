/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PanzoomOptions } from "@panzoom/panzoom";

export type PanZoomPluginOptions = PanzoomOptions & {
  selectors?: string[];
  wrap?: boolean;
  timeout?: number;
};
