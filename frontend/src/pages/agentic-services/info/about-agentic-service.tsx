/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {ContentAboutAgenticService} from '@/components/agentic-platforms/info/about';
import {App} from '@/types/api/app';
import {useOutletContext} from 'react-router-dom';

const AboutAgenticService: React.FC = () => {
  const {app} = useOutletContext<{app?: App}>();

  if (!app) {
    return null;
  }

  return <ContentAboutAgenticService app={app} />;
};

export default AboutAgenticService;
