/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

// Applies a :before to the ref element when the user scrolls through it
import {ScrollArea} from '@/components/ui/scroll-area';
import {cn} from '@/lib/utils';
import React, {useState, useEffect, ReactNode} from 'react';

const checkScroll = (el: Element | undefined) => {
  if (!el) {
    return {top: false, bottom: false, left: false, right: false};
  }

  return {
    top: el.scrollTop > 0,
    bottom: el.scrollTop < el.scrollHeight - el.clientHeight,
    left: el.scrollLeft > 0,
    right: el.scrollLeft < el.scrollWidth - el.clientWidth
  };
};

const getOverflowingElement = (ref: React.RefObject<HTMLElement>) => {
  const element = ref.current;
  if (!element) {
    return;
  }

  // This is the element in <ScrollArea /> that will overflow
  return element.querySelector('[data-radix-scroll-area-viewport]');
};

const useScrollShadow: UseScrollShadow = (ref) => {
  const [overflow, setOverflow] = useState<Element | null | undefined>(getOverflowingElement(ref));
  const [shadow, setShadow] = useState({
    top: false,
    bottom: false,
    left: false,
    right: false
  });

  const updateShadow = () => {
    if (!overflow) {
      return;
    }
    setShadow(checkScroll(overflow));
  };

  const updateOverflow = () => {
    setOverflow(getOverflowingElement(ref));
  };

  // Gets the overflow element when the ref changes
  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const elObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          updateOverflow();
        }
      });
    });

    elObserver.observe(element, {childList: true, subtree: true});
    window.addEventListener('resize', updateOverflow);
    updateOverflow();

    return () => {
      elObserver.disconnect();
      window.removeEventListener('resize', updateOverflow);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, ref.current]);

  // Updates the shadow when the overflow element changes
  useEffect(() => {
    if (!overflow) {
      return;
    }

    const ofObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          updateOverflow();
        }
      });
    });

    ofObserver.observe(overflow, {childList: true, subtree: true});
    overflow.addEventListener('scroll', updateShadow);
    overflow.addEventListener('resize', updateShadow);
    window.addEventListener('resize', updateShadow);
    updateShadow();

    return () => {
      overflow.removeEventListener('scroll', updateShadow);
      overflow.removeEventListener('resize', updateShadow);
      window.removeEventListener('resize', updateShadow);
      ofObserver.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref.current, overflow]);

  return shadow;
};

type UseScrollShadow = (ref: React.RefObject<HTMLElement>) => {
  top: boolean;
  bottom: boolean;
  left: boolean;
  right: boolean;
};

const ScrollShadowWrapper: React.FC<ScrollShadowWrapperProps> = ({children, className, withBorder = false}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const {top, bottom, left, right} = useScrollShadow(ref);
  const isOverflowing = top || bottom;

  return (
    <div
      className={cn(
        'relative',
        isOverflowing && withBorder && 'border',
        top && 'scrollable-shadow-top',
        bottom && 'scrollable-shadow-bottom',
        left && 'scrollable-shadow-left',
        right && 'scrollable-shadow-right'
      )}
    >
      <ScrollArea ref={ref} className={cn('relative scroll-container', className)}>
        <div className={cn(isOverflowing && 'p-0')}>{children}</div>
      </ScrollArea>
    </div>
  );
};

interface ScrollShadowWrapperProps {
  children: ReactNode;
  className?: string;
  withBorder?: boolean;
}

export default ScrollShadowWrapper;
