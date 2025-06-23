/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Outlet, useLocation} from 'react-router-dom';
import {useEffect, useState} from 'react';
import {cn} from '@/lib/utils';
import {ResizablePanel, ResizablePanelGroup} from '@/components/ui/resizable';
import {AppBar} from './app-bar';
import {PATHS} from '@/router/paths';
import {Footer} from '@outshift/spark-design';
import {SideNav} from './side-nav';

const Layout = () => {
  const defaultLayout = [15, 85];
  const defaultCollapsedLayout = [3.5, 96.5];
  const [layout, setLayout] = useState<number[]>(window.innerWidth < 768 ? defaultCollapsedLayout : defaultLayout);
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth < 768 ? true : false);

  const location = useLocation();

  const handleResize = () => {
    if (window.innerWidth < 768) {
      setIsCollapsed(true);
    } else {
      setIsCollapsed(false);
    }
  };

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const onLayout = (sizes: number[]) => {
    setLayout(sizes);
  };

  useEffect(() => {
    if (isCollapsed) {
      onLayout(defaultCollapsedLayout);
    } else {
      onLayout(defaultLayout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCollapsed]);

  return (
    <ResizablePanelGroup
      direction="vertical"
      style={{
        height: '100vh'
      }}
      className="fixed"
    >
      <AppBar />
      <ResizablePanelGroup direction="horizontal" onLayout={onLayout}>
        {!location.pathname.includes(PATHS.onBoarding) && (
          <ResizablePanel
            defaultSize={layout[0]}
            collapsedSize={defaultCollapsedLayout[0]}
            minSize={10}
            maxSize={15}
            collapsible={true}
            onCollapse={() => {
              setIsCollapsed(true);
            }}
            onExpand={() => {
              setIsCollapsed(false);
            }}
            className={cn(
              'transition-all duration-300 ease-in-out',
              isCollapsed && 'min-w-[3.5rem] max-w-[3.5rem]',
              !isCollapsed && 'min-w-[264px] max-w-[264px]'
            )}
          >
            <SideNav isCollapsed={isCollapsed} onChangeCollapsed={(value) => setIsCollapsed(value as boolean)} />
          </ResizablePanel>
        )}
        <ResizablePanel defaultSize={defaultLayout[1]} collapsible={false} minSize={30}>
          <main className="pt-[56px] h-full">
            <Outlet />
          </main>
        </ResizablePanel>
      </ResizablePanelGroup>
      <Footer
        productName="Agntcy Inc."
        links={[
          {
            children: 'support@agntcy.com',
            href: 'mailto:support@agntcy.com',
            openInNewTab: true
          },
          {
            children: 'Terms & Conditions',
            href: PATHS.termsAndConditions
          },
          {
            children: 'Privacy Policy',
            href: 'https://www.cisco.com/c/en/us/about/legal/privacy-full.html',
            openInNewTab: true
          },
          {
            children: 'Cookies',
            href: '#'
          }
        ]}
      />
    </ResizablePanelGroup>
  );
};

export default Layout;
