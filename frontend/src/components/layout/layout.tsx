/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Outlet} from 'react-router-dom';
import {useEffect, useState} from 'react';
import {cn} from '@/lib/utils';
import {ResizablePanel, ResizablePanelGroup} from '@/components/ui/resizable';
import {SideNav} from './side-nav';
import {Header} from './header';
import {Footer} from './footer';

const Layout = () => {
  const defaultLayout = [15, 85];
  const defaultCollapsedLayout = [3.5, 96.5];
  const [layout, setLayout] = useState<number[]>(window.innerWidth < 768 ? defaultCollapsedLayout : defaultLayout);
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth < 768 ? true : false);

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
      <Header />
      <ResizablePanelGroup direction="horizontal" onLayout={onLayout}>
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
            isCollapsed && 'min-w-[88px] max-w-[88px]',
            !isCollapsed && 'min-w-[264px] max-w-[264px]'
          )}
        >
          <SideNav isCollapsed={isCollapsed} onChangeCollapsed={(value) => setIsCollapsed(value as boolean)} />
        </ResizablePanel>
        <ResizablePanel defaultSize={defaultLayout[1]} collapsible={false} minSize={30}>
          <main className="h-full">
            <Outlet />
          </main>
        </ResizablePanel>
      </ResizablePanelGroup>
      <Footer />
    </ResizablePanelGroup>
  );
};

export default Layout;
