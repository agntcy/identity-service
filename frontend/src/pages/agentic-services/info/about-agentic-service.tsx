/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {ContentAboutAgenticService} from '@/components/agentic-services/info/about';
import {App} from '@/types/api/app';
import {useOutletContext} from 'react-router-dom';

const AboutAgenticService: React.FC = () => {
  const context = useOutletContext<{app?: App}>();

  if (!context) {
    return null;
  }

  const {app} = context;

  if (!app) {
    return null;
  }

  return <ContentAboutAgenticService app={app} />;
};

export default AboutAgenticService;
