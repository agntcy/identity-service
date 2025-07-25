/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {useLayoutEffect, useMemo, useState} from 'react';

export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({width: 0, height: 0});
  const isMobile = useMemo(() => windowSize.width < 768, [windowSize.width]);
  const isTablet = useMemo(() => windowSize.width >= 768 && windowSize.width < 1024, [windowSize.width]);

  const handleSize = () => {
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight
    });
  };

  useLayoutEffect(() => {
    handleSize();
    window.addEventListener('resize', handleSize);
    return () => window.removeEventListener('resize', handleSize);
  }, []);

  return {windowSize, isMobile, isTablet};
};
