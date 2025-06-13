/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  PluginModule,
  ThemeConfigValidationContext,
} from "@docusaurus/types";
import { Joi } from "@docusaurus/utils-validation";
import { PanZoomPluginOptions } from "./PanzoomPluginOptions";
import { resolve } from "path";

export const PanZoomPlugin: PluginModule = (context, options) => {
  return {
    name: "docusaurus-plugin-image-zoom",
    getClientModules() {
      return [resolve(__dirname, "./PanZoom")];
    },
  };
};

const panZoomValidator = Joi.object({
  zoom: Joi.object({
    selectors: Joi.array<string>(),
    wrap: Joi.boolean(),
    timeout: Joi.number(),
  }),
});

export function validatedThemeConfig(
  data: ThemeConfigValidationContext<PanZoomPluginOptions>
) {
  const { themeConfig, validate } = data;
  const validated = validate(panZoomValidator, themeConfig);
  return validated;
}
