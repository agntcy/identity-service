/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {BasePage as SparkBasePage, BasePageProps as SparkBasePageProps} from '@outshift/spark-design';
import ScrollShadowWrapper from '../ui/scroll-shadow-wrapper';

export const BasePage: React.FC<SparkBasePageProps> = (props) => {
  return (
    <ScrollShadowWrapper>
      <SparkBasePage {...props} />
    </ScrollShadowWrapper>
  );
};
