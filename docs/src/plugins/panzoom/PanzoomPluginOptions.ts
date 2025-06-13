/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PanzoomOptions } from "@panzoom/panzoom";

export type PanZoomPluginOptions = PanzoomOptions & {
  selectors?: string[];
  wrap?: boolean;
  timeout?: number;
};
