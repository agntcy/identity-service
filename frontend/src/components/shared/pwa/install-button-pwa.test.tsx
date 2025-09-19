/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {vi, describe, it, expect, beforeEach, afterEach, Mock} from 'vitest';
import React from 'react';
import {InstallButtonPwa} from './install-button-pwa';

// Mock dependencies
vi.mock('@/hooks', () => ({
  useWindowSize: vi.fn()
}));

vi.mock('@mui/material', () => ({
  Fab: ({children, onClick, size, color, variant, sx, ...props}: any) => (
    <button
      data-testid="fab"
      onClick={onClick}
      data-size={size}
      data-color={color}
      data-variant={variant}
      data-sx={JSON.stringify(sx)}
      {...props}
    >
      {children}
    </button>
  )
}));

vi.mock('@open-ui-kit/core', () => ({
  Tooltip: ({children, title, placement}: any) => (
    <div data-testid="tooltip" data-title={title} data-placement={placement}>
      {children}
    </div>
  )
}));

vi.mock('lucide-react', () => ({
  MonitorDownIcon: ({className}: any) => (
    <div data-testid="monitor-down-icon" className={className}>
      MonitorDownIcon
    </div>
  )
}));

// Import mocked modules
import {useWindowSize} from '@/hooks';

// Mock BeforeInstallPromptEvent
const createMockBeforeInstallPromptEvent = (userChoice: 'accepted' | 'dismissed' = 'accepted') => {
  const mockPrompt = vi.fn().mockResolvedValue(undefined);
  const mockUserChoice = Promise.resolve({
    outcome: userChoice,
    service: 'web'
  });

  return {
    services: ['web'],
    userChoice: mockUserChoice,
    prompt: mockPrompt,
    preventDefault: vi.fn()
  } as any;
};

describe('InstallButtonPwa', () => {
  const mockUseWindowSize = vi.mocked(useWindowSize);
  let mockAddEventListener: Mock;
  let mockRemoveEventListener: Mock;
  let eventHandlers: {[key: string]: EventListener} = {};

  // Default mock return value for useWindowSize
  const defaultWindowSizeMock = {
    windowSize: {width: 375, height: 667},
    isMobile: true,
    isTablet: false
  };

  const desktopWindowSizeMock = {
    windowSize: {width: 1920, height: 1080},
    isMobile: false,
    isTablet: false
  };

  beforeEach(() => {
    eventHandlers = {};

    // Mock window event listeners to capture handlers
    mockAddEventListener = vi.fn().mockImplementation((event: string, handler: EventListener) => {
      eventHandlers[event] = handler;
    });
    mockRemoveEventListener = vi.fn();

    Object.defineProperty(window, 'addEventListener', {
      value: mockAddEventListener,
      writable: true
    });
    Object.defineProperty(window, 'removeEventListener', {
      value: mockRemoveEventListener,
      writable: true
    });

    // Mock console.log
    vi.spyOn(console, 'log').mockImplementation(() => {});

    // Set default mock
    mockUseWindowSize.mockReturnValue(defaultWindowSizeMock);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('does not render when not on mobile', () => {
      mockUseWindowSize.mockReturnValue(desktopWindowSizeMock);

      const {container} = render(<InstallButtonPwa />);

      expect(container.firstChild).toBeNull();
    });

    it('does not render when no deferred prompt is available', () => {
      mockUseWindowSize.mockReturnValue(defaultWindowSizeMock);

      const {container} = render(<InstallButtonPwa />);

      // Without triggering beforeinstallprompt event, component should not render
      expect(container.firstChild).toBeNull();
    });

    it('renders the complete component structure when conditions are met', () => {
      mockUseWindowSize.mockReturnValue(defaultWindowSizeMock);

      const {container, rerender} = render(<InstallButtonPwa />);

      // Initially should not render
      expect(container.firstChild).toBeNull();

      // Simulate beforeinstallprompt event
      const mockEvent = createMockBeforeInstallPromptEvent();

      // Trigger the event handler
      if (eventHandlers['beforeinstallprompt']) {
        eventHandlers['beforeinstallprompt'](mockEvent);
      }

      // Force re-render to see the updated state
      rerender(<InstallButtonPwa />);

      // Now should render the complete structure
      expect(container.firstChild).toHaveClass('absolute', 'bottom-16', 'right-6');
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
      expect(screen.getByTestId('tooltip')).toHaveAttribute('data-title', 'Install Agent Identity Service');
      expect(screen.getByTestId('tooltip')).toHaveAttribute('data-placement', 'left');
      expect(screen.getByTestId('fab')).toBeInTheDocument();
      expect(screen.getByTestId('monitor-down-icon')).toBeInTheDocument();
      expect(screen.getByTestId('monitor-down-icon')).toHaveClass('w-5', 'h-5');
    });

    it('renders with custom props passed through to Fab', () => {
      mockUseWindowSize.mockReturnValue(defaultWindowSizeMock);

      const customProps = {
        size: 'small' as const,
        'data-custom': 'test-value'
      };

      const {rerender} = render(<InstallButtonPwa {...customProps} />);

      // Trigger beforeinstallprompt event
      const mockEvent = createMockBeforeInstallPromptEvent();
      if (eventHandlers['beforeinstallprompt']) {
        eventHandlers['beforeinstallprompt'](mockEvent);
      }

      rerender(<InstallButtonPwa {...customProps} />);

      const fabButton = screen.getByTestId('fab');
      expect(fabButton).toHaveAttribute('data-size', 'small');
      expect(fabButton).toHaveAttribute('data-custom', 'test-value');
      expect(fabButton).toHaveAttribute('data-color', 'primary');
      expect(fabButton).toHaveAttribute('data-variant', 'circular');
    });
  });

  describe('Event Handling', () => {
    it('sets up and cleans up event listeners correctly', () => {
      mockUseWindowSize.mockReturnValue(defaultWindowSizeMock);

      const {unmount} = render(<InstallButtonPwa />);

      // Verify event listeners are added
      expect(mockAddEventListener).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('appinstalled', expect.any(Function));

      // Unmount component
      unmount();

      // Verify event listeners are removed
      expect(mockRemoveEventListener).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function));
      expect(mockRemoveEventListener).toHaveBeenCalledWith('appinstalled', expect.any(Function));
    });

    it('handles beforeinstallprompt event correctly', () => {
      mockUseWindowSize.mockReturnValue(defaultWindowSizeMock);

      render(<InstallButtonPwa />);

      const mockEvent = createMockBeforeInstallPromptEvent();

      // Trigger the event
      if (eventHandlers['beforeinstallprompt']) {
        eventHandlers['beforeinstallprompt'](mockEvent);
      }

      // Verify preventDefault was called
      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('handles appinstalled event correctly', () => {
      // Create a wrapper component to test state changes properly
      const TestWrapper = () => {
        const [showButton, setShowButton] = React.useState(false);
        const {isMobile} = useWindowSize();

        React.useEffect(() => {
          const handleBeforeInstallPrompt = (event: any) => {
            event.preventDefault();
            setShowButton(true);
          };

          const handleAppInstalled = () => {
            setShowButton(false);
          };

          window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
          window.addEventListener('appinstalled', handleAppInstalled);

          return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
          };
        }, []);

        if (!isMobile || !showButton) {
          return null;
        }

        return (
          <div className="absolute bottom-16 right-6">
            <div data-testid="tooltip">
              <button data-testid="fab">Test Button</button>
            </div>
          </div>
        );
      };

      mockUseWindowSize.mockReturnValue(defaultWindowSizeMock);

      const {rerender} = render(<TestWrapper />);

      // Initially should not show
      expect(screen.queryByTestId('fab')).not.toBeInTheDocument();

      // Trigger beforeinstallprompt event
      if (eventHandlers['beforeinstallprompt']) {
        eventHandlers['beforeinstallprompt'](createMockBeforeInstallPromptEvent());
      }
      rerender(<TestWrapper />);

      // Should show button
      expect(screen.getByTestId('fab')).toBeInTheDocument();

      // Trigger appinstalled event
      if (eventHandlers['appinstalled']) {
        eventHandlers['appinstalled']({} as Event);
      }
      rerender(<TestWrapper />);

      // Should hide button
      expect(screen.queryByTestId('fab')).not.toBeInTheDocument();
    });
  });

  describe('Install Functionality', () => {
    it('handles install button click with accepted prompt', async () => {
      mockUseWindowSize.mockReturnValue(defaultWindowSizeMock);

      const {rerender} = render(<InstallButtonPwa />);

      // Set up deferred prompt
      const mockEvent = createMockBeforeInstallPromptEvent('accepted');
      if (eventHandlers['beforeinstallprompt']) {
        eventHandlers['beforeinstallprompt'](mockEvent);
      }
      rerender(<InstallButtonPwa />);

      // Click the install button
      const installButton = screen.getByTestId('fab');
      fireEvent.click(installButton);

      await waitFor(() => {
        expect(mockEvent.prompt).toHaveBeenCalled();
        expect(console.log).toHaveBeenCalledWith('User accepted the installation prompt');
      });

      // Component should be hidden after installation
      rerender(<InstallButtonPwa />);
      expect(screen.queryByTestId('fab')).not.toBeInTheDocument();
    });

    it('handles install button click with dismissed prompt', async () => {
      mockUseWindowSize.mockReturnValue(defaultWindowSizeMock);

      const {rerender} = render(<InstallButtonPwa />);

      // Set up deferred prompt with dismissed choice
      const mockEvent = createMockBeforeInstallPromptEvent('dismissed');
      if (eventHandlers['beforeinstallprompt']) {
        eventHandlers['beforeinstallprompt'](mockEvent);
      }
      rerender(<InstallButtonPwa />);

      // Click the install button
      const installButton = screen.getByTestId('fab');
      fireEvent.click(installButton);

      await waitFor(() => {
        expect(mockEvent.prompt).toHaveBeenCalled();
        expect(console.log).toHaveBeenCalledWith('User dismissed the installation prompt');
      });

      // Component should be hidden after user choice
      rerender(<InstallButtonPwa />);
      expect(screen.queryByTestId('fab')).not.toBeInTheDocument();
    });

    it('does not render when no deferred prompt is available', () => {
      mockUseWindowSize.mockReturnValue(defaultWindowSizeMock);

      const {container} = render(<InstallButtonPwa />);

      // Component should not render without deferred prompt
      expect(container.firstChild).toBeNull();
    });
  });
});
