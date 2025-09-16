/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {describe, it, vi, beforeEach, expect, afterEach} from 'vitest';
import {screen, fireEvent, cleanup} from '@testing-library/react';
import {NotificationSettings} from './notification-settings';
import {useNotificationUtils} from '@/providers/notification-utils-provider/notification-utils-provider';
import {useLocalStore} from '@/store';
import {renderWithClient} from '@/utils/tests';
import React from 'react';
import {toast} from '@outshift/spark-design';

// Mock dependencies
vi.mock('@/providers/notification-utils-provider/notification-utils-provider', () => ({
  useNotificationUtils: vi.fn()
}));

vi.mock('@/store', () => ({
  useLocalStore: vi.fn()
}));

vi.mock('zustand/react/shallow', () => ({
  useShallow: vi.fn((selector) => selector)
}));

vi.mock('@outshift/spark-design', () => ({
  Modal: vi.fn(({children, maxWidth, fullWidth, ...props}) =>
    React.createElement(
      'div',
      {
        'data-testid': 'modal',
        'data-max-width': maxWidth,
        'data-full-width': fullWidth,
        ...props
      },
      children
    )
  ),
  ModalActions: vi.fn(({children, ...props}) =>
    React.createElement(
      'div',
      {
        'data-testid': 'modal-actions',
        ...props
      },
      children
    )
  ),
  ModalContent: vi.fn(({children, ...props}) =>
    React.createElement(
      'div',
      {
        'data-testid': 'modal-content',
        ...props
      },
      children
    )
  ),
  ModalTitle: vi.fn(({children, ...props}) =>
    React.createElement(
      'h2',
      {
        'data-testid': 'modal-title',
        ...props
      },
      children
    )
  ),
  toast: vi.fn(),
  GeneralSize: {
    Small: 'small',
    Medium: 'medium',
    Large: 'large'
  },
  Tag: vi.fn(({children, size, status, className, ...props}) =>
    React.createElement(
      'span',
      {
        'data-testid': 'tag',
        'data-size': size,
        'data-status': status,
        className,
        ...props
      },
      children
    )
  ),
  TagStatus: {
    Positive: 'positive',
    Negative: 'negative',
    Info: 'info',
    Warning: 'warning'
  }
}));

vi.mock('@mui/material', () => ({
  Button: vi.fn(({children, startIcon, onClick, fullWidth, variant, sx, loading, loadingPosition, disabled, ...props}) =>
    React.createElement(
      'button',
      {
        'data-testid': 'button',
        'data-variant': variant,
        'data-full-width': fullWidth,
        'data-loading': loading,
        'data-loading-position': loadingPosition,
        'data-sx': sx ? JSON.stringify(sx) : null,
        disabled,
        onClick,
        ...props
      },
      [
        startIcon && React.createElement('span', {key: 'icon', 'data-testid': 'button-icon'}, startIcon),
        React.createElement('span', {key: 'text'}, children)
      ]
    )
  ),
  Typography: vi.fn(({children, variant, ...props}) =>
    React.createElement(
      'span',
      {
        'data-testid': 'typography',
        'data-variant': variant,
        ...props
      },
      children
    )
  )
}));

vi.mock('lucide-react', () => ({
  BellIcon: vi.fn(({className, ...props}) =>
    React.createElement('svg', {
      'data-testid': 'bell-icon',
      className,
      ...props
    })
  ),
  BellOffIcon: vi.fn(({className, ...props}) =>
    React.createElement('svg', {
      'data-testid': 'bell-off-icon',
      className,
      ...props
    })
  ),
  RefreshCcwIcon: vi.fn(({className, ...props}) =>
    React.createElement('svg', {
      'data-testid': 'refresh-icon',
      className,
      ...props
    })
  )
}));

vi.mock('@/components/ui/card', () => ({
  Card: vi.fn(({children, variant, className, ...props}) =>
    React.createElement(
      'div',
      {
        'data-testid': 'card',
        'data-variant': variant,
        className,
        ...props
      },
      children
    )
  )
}));

// Mock implementations
const mockUseNotificationUtils = vi.mocked(useNotificationUtils);
const mockUseLocalStore = vi.mocked(useLocalStore);
const mockToast = vi.mocked(toast);

// Test data
const mockNotificationUtils = {
  enabled: true,
  supported: true,
  handleToggleNotifications: vi.fn(),
  fixNotifications: vi.fn(),
  loading: false
};

const mockLocalStore = {
  idDevice: 'device-123'
};

describe('NotificationSettings', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // @ts-expect-error error
    mockUseNotificationUtils.mockReturnValue(mockNotificationUtils);
    mockUseLocalStore.mockReturnValue(mockLocalStore);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  describe('Rendering', () => {
    it('renders the modal with correct props', () => {
      renderWithClient(<NotificationSettings onClose={mockOnClose} open={true} />);

      const modal = screen.getByTestId('modal');
      expect(modal).toBeInTheDocument();
      expect(modal).toHaveAttribute('data-max-width', 'md');
      expect(modal).toHaveAttribute('data-full-width', 'true');
    });

    it('renders modal title', () => {
      renderWithClient(<NotificationSettings onClose={mockOnClose} open={true} />);

      const title = screen.getByTestId('modal-title');
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent('Notifications');
    });

    it('renders modal content and actions', () => {
      renderWithClient(<NotificationSettings onClose={mockOnClose} open={true} />);

      expect(screen.getByTestId('modal-content')).toBeInTheDocument();
      expect(screen.getByTestId('modal-actions')).toBeInTheDocument();
    });

    it('renders card with correct variant', () => {
      renderWithClient(<NotificationSettings onClose={mockOnClose} open={true} />);

      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveAttribute('data-variant', 'secondary');
    });
  });

  describe('Notification Status Display', () => {
    it('shows enabled status when notifications are enabled', () => {
      mockUseNotificationUtils.mockReturnValue({
        ...mockNotificationUtils,
        enabled: true,
        supported: true,
        enableNotifications: function (id?: string): Promise<void> {
          throw new Error('Function not implemented.');
        },
        disableNotifications: function (): Promise<void> {
          throw new Error('Function not implemented.');
        },
        init: function (): Promise<void> {
          throw new Error('Function not implemented.');
        }
      });

      renderWithClient(<NotificationSettings onClose={mockOnClose} open={true} />);

      const bellIcon = screen.getByTestId('bell-icon');
      expect(bellIcon).toBeInTheDocument();
      expect(bellIcon).toHaveClass('text-green-600');

      const tag = screen.getByTestId('tag');
      expect(tag).toHaveTextContent('Enabled');
      expect(tag).toHaveAttribute('data-status', 'positive');
    });

    it('shows disabled status when notifications are disabled', () => {
      mockUseNotificationUtils.mockReturnValue({
        ...mockNotificationUtils,
        enabled: false,
        supported: true,
        enableNotifications: function (id?: string): Promise<void> {
          throw new Error('Function not implemented.');
        },
        disableNotifications: function (): Promise<void> {
          throw new Error('Function not implemented.');
        },
        init: function (): Promise<void> {
          throw new Error('Function not implemented.');
        }
      });

      renderWithClient(<NotificationSettings onClose={mockOnClose} open={true} />);

      const bellOffIcon = screen.getByTestId('bell-off-icon');
      expect(bellOffIcon).toBeInTheDocument();
      expect(bellOffIcon).toHaveClass('text-gray-400');

      const tag = screen.getByTestId('tag');
      expect(tag).toHaveTextContent('Disabled');
      expect(tag).toHaveAttribute('data-status', 'info');
    });

    it('shows not supported status when notifications are not supported', () => {
      mockUseNotificationUtils.mockReturnValue({
        ...mockNotificationUtils,
        enabled: false,
        supported: false,
        enableNotifications: function (id?: string): Promise<void> {
          throw new Error('Function not implemented.');
        },
        disableNotifications: function (): Promise<void> {
          throw new Error('Function not implemented.');
        },
        init: function (): Promise<void> {
          throw new Error('Function not implemented.');
        }
      });

      renderWithClient(<NotificationSettings onClose={mockOnClose} open={true} />);

      const bellOffIcon = screen.getByTestId('bell-off-icon');
      expect(bellOffIcon).toBeInTheDocument();

      const tag = screen.getByTestId('tag');
      expect(tag).toHaveTextContent('Not Supported');
      expect(tag).toHaveAttribute('data-status', 'negative');
    });
  });

  describe('Toggle Button Behavior', () => {
    it('renders enable button when notifications are disabled', () => {
      mockUseNotificationUtils.mockReturnValue({
        ...mockNotificationUtils,
        enabled: false,
        supported: true,
        enableNotifications: function (id?: string): Promise<void> {
          throw new Error('Function not implemented.');
        },
        disableNotifications: function (): Promise<void> {
          throw new Error('Function not implemented.');
        },
        init: function (): Promise<void> {
          throw new Error('Function not implemented.');
        }
      });

      renderWithClient(<NotificationSettings onClose={mockOnClose} open={true} />);

      const buttons = screen.getAllByTestId('button');
      const toggleButton = buttons.find((button) => button.textContent?.includes('Enable Notifications'));

      expect(toggleButton).toBeInTheDocument();
      expect(toggleButton).toHaveAttribute('data-variant', 'primary');
      expect(toggleButton).not.toBeDisabled();
    });

    it('renders disable button when notifications are enabled', () => {
      mockUseNotificationUtils.mockReturnValue({
        ...mockNotificationUtils,
        enabled: true,
        supported: true,
        enableNotifications: function (id?: string): Promise<void> {
          throw new Error('Function not implemented.');
        },
        disableNotifications: function (): Promise<void> {
          throw new Error('Function not implemented.');
        },
        init: function (): Promise<void> {
          throw new Error('Function not implemented.');
        }
      });

      renderWithClient(<NotificationSettings onClose={mockOnClose} open={true} />);

      const buttons = screen.getAllByTestId('button');
      const toggleButton = buttons.find((button) => button.textContent?.includes('Disable Notifications'));

      expect(toggleButton).toBeInTheDocument();
      expect(toggleButton).toHaveAttribute('data-variant', 'outlined');
      expect(toggleButton).not.toBeDisabled();
    });

    it('disables toggle button when notifications are not supported', () => {
      mockUseNotificationUtils.mockReturnValue({
        ...mockNotificationUtils,
        enabled: false,
        supported: false,
        enableNotifications: function (id?: string): Promise<void> {
          throw new Error('Function not implemented.');
        },
        disableNotifications: function (): Promise<void> {
          throw new Error('Function not implemented.');
        },
        init: function (): Promise<void> {
          throw new Error('Function not implemented.');
        }
      });

      renderWithClient(<NotificationSettings onClose={mockOnClose} open={true} />);

      const buttons = screen.getAllByTestId('button');
      const toggleButton = buttons.find((button) => button.textContent?.includes('Enable Notifications'));

      expect(toggleButton).toBeDisabled();
    });

    it('shows loading state when loading', () => {
      mockUseNotificationUtils.mockReturnValue({
        ...mockNotificationUtils,
        loading: true,
        enableNotifications: function (id?: string): Promise<void> {
          throw new Error('Function not implemented.');
        },
        disableNotifications: function (): Promise<void> {
          throw new Error('Function not implemented.');
        },
        init: function (): Promise<void> {
          throw new Error('Function not implemented.');
        }
      });

      renderWithClient(<NotificationSettings onClose={mockOnClose} open={true} />);

      const buttons = screen.getAllByTestId('button');
      const toggleButton = buttons.find((button) => button.textContent?.includes('Disable Notifications'));

      expect(toggleButton).toHaveAttribute('data-loading', 'true');
    });
  });

  describe('Fix Notifications Button', () => {
    it('shows fix button when notifications are enabled and supported', () => {
      mockUseNotificationUtils.mockReturnValue({
        ...mockNotificationUtils,
        enabled: true,
        supported: true,
        enableNotifications: function (id?: string): Promise<void> {
          throw new Error('Function not implemented.');
        },
        disableNotifications: function (): Promise<void> {
          throw new Error('Function not implemented.');
        },
        init: function (): Promise<void> {
          throw new Error('Function not implemented.');
        }
      });

      renderWithClient(<NotificationSettings onClose={mockOnClose} open={true} />);

      const buttons = screen.getAllByTestId('button');
      const fixButton = buttons.find((button) => button.textContent?.includes('Fix Notification Issues'));

      expect(fixButton).toBeInTheDocument();
      expect(fixButton).toHaveAttribute('data-variant', 'secondary');
      expect(fixButton).not.toBeDisabled();
    });

    it('hides fix button when notifications are disabled', () => {
      mockUseNotificationUtils.mockReturnValue({
        ...mockNotificationUtils,
        enabled: false,
        supported: true,
        enableNotifications: function (id?: string): Promise<void> {
          throw new Error('Function not implemented.');
        },
        disableNotifications: function (): Promise<void> {
          throw new Error('Function not implemented.');
        },
        init: function (): Promise<void> {
          throw new Error('Function not implemented.');
        }
      });

      renderWithClient(<NotificationSettings onClose={mockOnClose} open={true} />);

      const buttons = screen.getAllByTestId('button');
      const fixButton = buttons.find((button) => button.textContent?.includes('Fix Notification Issues'));

      expect(fixButton).toBeUndefined();
    });

    it('hides fix button when notifications are not supported', () => {
      mockUseNotificationUtils.mockReturnValue({
        ...mockNotificationUtils,
        enabled: true,
        supported: false,
        enableNotifications: function (id?: string): Promise<void> {
          throw new Error('Function not implemented.');
        },
        disableNotifications: function (): Promise<void> {
          throw new Error('Function not implemented.');
        },
        init: function (): Promise<void> {
          throw new Error('Function not implemented.');
        }
      });

      renderWithClient(<NotificationSettings onClose={mockOnClose} open={true} />);

      const buttons = screen.getAllByTestId('button');
      const fixButton = buttons.find((button) => button.textContent?.includes('Fix Notification Issues'));

      expect(fixButton).toBeUndefined();
    });

    it('disables fix button when loading', () => {
      mockUseNotificationUtils.mockReturnValue({
        ...mockNotificationUtils,
        enabled: true,
        supported: true,
        loading: true,
        enableNotifications: function (id?: string): Promise<void> {
          throw new Error('Function not implemented.');
        },
        disableNotifications: function (): Promise<void> {
          throw new Error('Function not implemented.');
        },
        init: function (): Promise<void> {
          throw new Error('Function not implemented.');
        }
      });

      renderWithClient(<NotificationSettings onClose={mockOnClose} open={true} />);

      const buttons = screen.getAllByTestId('button');
      const fixButton = buttons.find((button) => button.textContent?.includes('Fix Notification Issues'));

      expect(fixButton).toBeDisabled();
    });
  });

  describe('Information Text Display', () => {
    it('shows enabled information text when notifications are enabled and supported', () => {
      mockUseNotificationUtils.mockReturnValue({
        ...mockNotificationUtils,
        enabled: true,
        supported: true,
        enableNotifications: function (id?: string): Promise<void> {
          throw new Error('Function not implemented.');
        },
        disableNotifications: function (): Promise<void> {
          throw new Error('Function not implemented.');
        },
        init: function (): Promise<void> {
          throw new Error('Function not implemented.');
        }
      });

      renderWithClient(<NotificationSettings onClose={mockOnClose} open={true} />);

      expect(
        screen.getByText("You'll receive notifications with Allow/Deny actions. Responses are tracked automatically.")
      ).toBeInTheDocument();
      expect(
        screen.getByText('If notifications show a 404 error when tapped, use "Fix Notification Issues" button above.')
      ).toBeInTheDocument();
    });

    it('hides information text when notifications are disabled', () => {
      mockUseNotificationUtils.mockReturnValue({
        ...mockNotificationUtils,
        enabled: false,
        supported: true,
        enableNotifications: function (id?: string): Promise<void> {
          throw new Error('Function not implemented.');
        },
        disableNotifications: function (): Promise<void> {
          throw new Error('Function not implemented.');
        },
        init: function (): Promise<void> {
          throw new Error('Function not implemented.');
        }
      });

      renderWithClient(<NotificationSettings onClose={mockOnClose} open={true} />);

      expect(
        screen.queryByText("You'll receive notifications with Allow/Deny actions. Responses are tracked automatically.")
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText('If notifications show a 404 error when tapped, use "Fix Notification Issues" button above.')
      ).not.toBeInTheDocument();
    });

    it('hides information text when notifications are not supported', () => {
      mockUseNotificationUtils.mockReturnValue({
        ...mockNotificationUtils,
        enabled: true,
        supported: false,
        enableNotifications: function (id?: string): Promise<void> {
          throw new Error('Function not implemented.');
        },
        disableNotifications: function (): Promise<void> {
          throw new Error('Function not implemented.');
        },
        init: function (): Promise<void> {
          throw new Error('Function not implemented.');
        }
      });

      renderWithClient(<NotificationSettings onClose={mockOnClose} open={true} />);

      expect(
        screen.queryByText("You'll receive notifications with Allow/Deny actions. Responses are tracked automatically.")
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText('If notifications show a 404 error when tapped, use "Fix Notification Issues" button above.')
      ).not.toBeInTheDocument();
    });
  });

  describe('Button Interactions', () => {
    it('calls handleToggleNotifications with device ID when toggle button is clicked', () => {
      const mockHandleToggle = vi.fn();
      mockUseNotificationUtils.mockReturnValue({
        ...mockNotificationUtils,
        handleToggleNotifications: mockHandleToggle,
        enableNotifications: function (id?: string): Promise<void> {
          throw new Error('Function not implemented.');
        },
        disableNotifications: function (): Promise<void> {
          throw new Error('Function not implemented.');
        },
        init: function (): Promise<void> {
          throw new Error('Function not implemented.');
        }
      });

      renderWithClient(<NotificationSettings onClose={mockOnClose} open={true} />);

      const buttons = screen.getAllByTestId('button');
      const toggleButton = buttons.find((button) => button.textContent?.includes('Disable Notifications'));

      fireEvent.click(toggleButton!);

      expect(mockHandleToggle).toHaveBeenCalledWith('device-123');
    });

    it('shows toast error when device ID is missing', () => {
      mockUseLocalStore.mockReturnValue({
        idDevice: null
      });

      renderWithClient(<NotificationSettings onClose={mockOnClose} open={true} />);

      const buttons = screen.getAllByTestId('button');
      console.log(
        'All button texts:',
        buttons.map((b) => b.textContent)
      );
      const toggleButton = buttons[0]; // Just use the first button (the toggle button)

      fireEvent.click(toggleButton);

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Device ID not found',
        description: 'Please onboard a device first to enable notifications.',
        type: 'error'
      });
    });

    it('calls fixNotifications when fix button is clicked', () => {
      const mockFixNotifications = vi.fn();
      mockUseNotificationUtils.mockReturnValue({
        ...mockNotificationUtils,
        enabled: true,
        supported: true,
        fixNotifications: mockFixNotifications,
        enableNotifications: function (id?: string): Promise<void> {
          throw new Error('Function not implemented.');
        },
        disableNotifications: function (): Promise<void> {
          throw new Error('Function not implemented.');
        },
        init: function (): Promise<void> {
          throw new Error('Function not implemented.');
        }
      });

      renderWithClient(<NotificationSettings onClose={mockOnClose} open={true} />);

      const buttons = screen.getAllByTestId('button');
      const fixButton = buttons.find((button) => button.textContent?.includes('Fix Notification Issues'));

      fireEvent.click(fixButton!);

      expect(mockFixNotifications).toHaveBeenCalled();
    });

    it('calls onClose when close button is clicked', () => {
      renderWithClient(<NotificationSettings onClose={mockOnClose} open={true} />);

      const buttons = screen.getAllByTestId('button');
      const closeButton = buttons.find((button) => button.textContent?.includes('Close'));

      fireEvent.click(closeButton!);

      expect(mockOnClose).toHaveBeenCalledWith(expect.any(Object), 'backdropClick');
    });
  });

  describe('Props Propagation', () => {
    it('passes through modal props correctly', () => {
      renderWithClient(<NotificationSettings onClose={mockOnClose} open={true} className="test-class" id="test-modal" />);

      const modal = screen.getByTestId('modal');
      expect(modal).toHaveClass('test-class');
      expect(modal).toHaveAttribute('id', 'test-modal');
    });
  });

  describe('Tag Configuration', () => {
    it('renders tag with correct size', () => {
      renderWithClient(<NotificationSettings onClose={mockOnClose} open={true} />);

      const tag = screen.getByTestId('tag');
      expect(tag).toHaveAttribute('data-size', 'small');
    });

    it('applies correct CSS classes to tag', () => {
      renderWithClient(<NotificationSettings onClose={mockOnClose} open={true} />);

      const tag = screen.getByTestId('tag');
      expect(tag).toHaveClass('text-xs');
    });
  });

  describe('Icon Display', () => {
    it('shows correct icons in buttons', () => {
      mockUseNotificationUtils.mockReturnValue({
        ...mockNotificationUtils,
        enabled: true,
        supported: true,
        enableNotifications: function (id?: string): Promise<void> {
          throw new Error('Function not implemented.');
        },
        disableNotifications: function (): Promise<void> {
          throw new Error('Function not implemented.');
        },
        init: function (): Promise<void> {
          throw new Error('Function not implemented.');
        }
      });

      renderWithClient(<NotificationSettings onClose={mockOnClose} open={true} />);

      // Check bell off icon in disable button
      const bellOffIcons = screen.getAllByTestId('bell-off-icon');
      expect(bellOffIcons.length).toBeGreaterThan(0);

      // The refresh icon IS rendered in the current component
      expect(screen.getByTestId('refresh-icon')).toBeInTheDocument();
    });

    it('shows bell icon in enable button when disabled', () => {
      mockUseNotificationUtils.mockReturnValue({
        ...mockNotificationUtils,
        enabled: false,
        supported: true,
        enableNotifications: function (id?: string): Promise<void> {
          throw new Error('Function not implemented.');
        },
        disableNotifications: function (): Promise<void> {
          throw new Error('Function not implemented.');
        },
        init: function (): Promise<void> {
          throw new Error('Function not implemented.');
        }
      });

      renderWithClient(<NotificationSettings onClose={mockOnClose} open={true} />);

      const bellIcons = screen.getAllByTestId('bell-icon');
      expect(bellIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('handles missing onClose prop gracefully', () => {
      renderWithClient(<NotificationSettings open={true} />);

      const buttons = screen.getAllByTestId('button');
      const closeButton = buttons.find((button) => button.textContent?.includes('Close'));

      expect(() => fireEvent.click(closeButton!)).not.toThrow();
    });

    it('handles undefined device ID', () => {
      mockUseLocalStore.mockReturnValue({
        idDevice: undefined
      });

      renderWithClient(<NotificationSettings onClose={mockOnClose} open={true} />);

      const buttons = screen.getAllByTestId('button');
      const toggleButton = buttons[0]; // Just use the first button

      fireEvent.click(toggleButton);

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Device ID not found',
        description: 'Please onboard a device first to enable notifications.',
        type: 'error'
      });
    });

    it('handles empty device ID string', () => {
      mockUseLocalStore.mockReturnValue({
        idDevice: ''
      });

      renderWithClient(<NotificationSettings onClose={mockOnClose} open={true} />);

      const buttons = screen.getAllByTestId('button');
      const toggleButton = buttons[0]; // Just use the first button

      fireEvent.click(toggleButton);

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Device ID not found',
        description: 'Please onboard a device first to enable notifications.',
        type: 'error'
      });
    });
  });

  describe('Accessibility', () => {
    it('renders proper semantic elements', () => {
      renderWithClient(<NotificationSettings onClose={mockOnClose} open={true} />);

      // Modal title should be an h2
      const title = screen.getByTestId('modal-title');
      expect(title.tagName.toLowerCase()).toBe('h2');
    });

    it('maintains button accessibility when disabled', () => {
      mockUseNotificationUtils.mockReturnValue({
        ...mockNotificationUtils,
        supported: false,
        enableNotifications: function (id?: string): Promise<void> {
          throw new Error('Function not implemented.');
        },
        disableNotifications: function (): Promise<void> {
          throw new Error('Function not implemented.');
        },
        init: function (): Promise<void> {
          throw new Error('Function not implemented.');
        }
      });

      renderWithClient(<NotificationSettings onClose={mockOnClose} open={true} />);

      const buttons = screen.getAllByTestId('button');
      const toggleButton = buttons[0]; // Just use the first button

      expect(toggleButton).toHaveAttribute('disabled');
    });
  });
});
