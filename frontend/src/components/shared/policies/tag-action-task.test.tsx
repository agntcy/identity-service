/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {render, screen} from '@testing-library/react';
import {vi, describe, it, expect, beforeEach} from 'vitest';
import {TagActionTask} from './tag-action-task';
import {RuleAction} from '@/types/api/policy';

// Mock dependencies
vi.mock('@outshift/spark-design', () => ({
  Tag: ({children, size, status, ...props}: any) => (
    <div data-testid="tag" data-size={size} data-status={status} {...props}>
      {children}
    </div>
  ),
  Typography: ({children, variant}: any) => (
    <span data-testid="typography" data-variant={variant}>
      {children}
    </span>
  ),
  GeneralSize: {
    Medium: 'medium'
  },
  TagStatus: {
    Allow: 'allow',
    Deny: 'deny'
  }
}));

vi.mock('@/types/api/policy', () => ({
  RuleAction: {
    RULE_ACTION_ALLOW: 'RULE_ACTION_ALLOW',
    RULE_ACTION_DENY: 'RULE_ACTION_DENY'
  }
}));

describe('TagActionTask', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering with RULE_ACTION_ALLOW', () => {
    it('renders with allow status and medium size', () => {
      render(<TagActionTask action={RuleAction.RULE_ACTION_ALLOW} text="Allow Action" />);

      const tag = screen.getByTestId('tag');
      expect(tag).toBeInTheDocument();
      expect(tag).toHaveAttribute('data-size', 'medium');
      expect(tag).toHaveAttribute('data-status', 'allow');

      const typography = screen.getByTestId('typography');
      expect(typography).toBeInTheDocument();
      expect(typography).toHaveAttribute('data-variant', 'captionSemibold');
      expect(typography).toHaveTextContent('Allow Action');
    });

    it('renders with React node as text', () => {
      const textNode = <span>Complex Allow Text</span>;
      render(<TagActionTask action={RuleAction.RULE_ACTION_ALLOW} text={textNode} />);

      const typography = screen.getByTestId('typography');
      expect(typography).toContainHTML('<span>Complex Allow Text</span>');
    });

    it('passes through additional props to Tag component', () => {
      const customProps = {
        'data-custom': 'allow-test',
        className: 'custom-class',
        id: 'allow-tag'
      };

      render(<TagActionTask action={RuleAction.RULE_ACTION_ALLOW} text="Allow with props" {...customProps} />);

      const tag = screen.getByTestId('tag');
      expect(tag).toHaveAttribute('data-custom', 'allow-test');
      expect(tag).toHaveAttribute('class', 'custom-class');
      expect(tag).toHaveAttribute('id', 'allow-tag');
    });
  });

  describe('Rendering with RULE_ACTION_DENY', () => {
    it('renders with deny status and medium size', () => {
      render(<TagActionTask action={RuleAction.RULE_ACTION_DENY} text="Deny Action" />);

      const tag = screen.getByTestId('tag');
      expect(tag).toBeInTheDocument();
      expect(tag).toHaveAttribute('data-size', 'medium');
      expect(tag).toHaveAttribute('data-status', 'deny');

      const typography = screen.getByTestId('typography');
      expect(typography).toBeInTheDocument();
      expect(typography).toHaveAttribute('data-variant', 'captionSemibold');
      expect(typography).toHaveTextContent('Deny Action');
    });

    it('renders with React node as text', () => {
      const textNode = <div>Complex Deny Text</div>;
      render(<TagActionTask action={RuleAction.RULE_ACTION_DENY} text={textNode} />);

      const typography = screen.getByTestId('typography');
      expect(typography).toContainHTML('<div>Complex Deny Text</div>');
    });

    it('passes through additional props to Tag component', () => {
      const customProps = {
        'data-testprop': 'deny-value',
        onClick: vi.fn(),
        style: {color: 'red'}
      };

      render(<TagActionTask action={RuleAction.RULE_ACTION_DENY} text="Deny with props" {...customProps} />);

      const tag = screen.getByTestId('tag');
      expect(tag).toHaveAttribute('data-testprop', 'deny-value');
      expect(tag).toHaveAttribute('style', 'color: red;');
    });
  });

  describe('Rendering with no action (default case)', () => {
    it('renders without status when action is undefined', () => {
      render(<TagActionTask text="Default Action" />);

      const tag = screen.getByTestId('tag');
      expect(tag).toBeInTheDocument();
      expect(tag).toHaveAttribute('data-size', 'medium');
      expect(tag).not.toHaveAttribute('data-status');

      // Should render text directly without Typography wrapper
      expect(tag).toHaveTextContent('Default Action');
      expect(screen.queryByTestId('typography')).not.toBeInTheDocument();
    });

    it('renders without status when action is null', () => {
      render(<TagActionTask action={null as any} text="Null Action" />);

      const tag = screen.getByTestId('tag');
      expect(tag).toHaveAttribute('data-size', 'medium');
      expect(tag).not.toHaveAttribute('data-status');
      expect(tag).toHaveTextContent('Null Action');
    });

    it('renders with React node as text in default case', () => {
      const textNode = <strong>Bold Default Text</strong>;
      render(<TagActionTask text={textNode} />);

      const tag = screen.getByTestId('tag');
      expect(tag).toContainHTML('<strong>Bold Default Text</strong>');
    });

    it('renders with unknown action value', () => {
      const unknownAction = 'UNKNOWN_ACTION' as any;
      render(<TagActionTask action={unknownAction} text="Unknown Action" />);

      const tag = screen.getByTestId('tag');
      expect(tag).toHaveAttribute('data-size', 'medium');
      expect(tag).not.toHaveAttribute('data-status');
      expect(tag).toHaveTextContent('Unknown Action');
    });

    it('passes through additional props in default case', () => {
      const customProps = {
        'data-default': 'test',
        className: 'default-class'
      };

      render(<TagActionTask text="Default with props" {...customProps} />);

      const tag = screen.getByTestId('tag');
      expect(tag).toHaveAttribute('data-default', 'test');
      expect(tag).toHaveAttribute('class', 'default-class');
    });
  });

  describe('Text handling', () => {
    it('renders with empty string text', () => {
      render(<TagActionTask action={RuleAction.RULE_ACTION_ALLOW} text="" />);

      const typography = screen.getByTestId('typography');
      expect(typography).toHaveTextContent('');
    });

    it('renders with number as text', () => {
      render(<TagActionTask action={RuleAction.RULE_ACTION_DENY} text={123 as any} />);

      const typography = screen.getByTestId('typography');
      expect(typography).toHaveTextContent('123');
    });

    it('renders without text prop', () => {
      render(<TagActionTask action={RuleAction.RULE_ACTION_ALLOW} />);

      const typography = screen.getByTestId('typography');
      expect(typography).toBeInTheDocument();
      expect(typography).toBeEmptyDOMElement();
    });

    it('renders with complex React node', () => {
      const complexText = (
        <div>
          <span>Part 1</span>
          <strong>Part 2</strong>
        </div>
      );

      render(<TagActionTask action={RuleAction.RULE_ACTION_ALLOW} text={complexText} />);

      const typography = screen.getByTestId('typography');
      expect(typography).toContainHTML('<div><span>Part 1</span><strong>Part 2</strong></div>');
    });
  });

  describe('Props handling', () => {
    it('allows custom props to override component defaults', () => {
      // Component spreads props after setting size and status,
      // so custom props will override the component's defaults
      const customProps = {
        action: RuleAction.RULE_ACTION_ALLOW,
        text: 'Test',
        size: 'large' as any,
        status: 'custom' as any
      };

      render(<TagActionTask {...customProps} />);

      const tag = screen.getByTestId('tag');
      // Custom props should override component defaults
      expect(tag).toHaveAttribute('data-size', 'large');
      expect(tag).toHaveAttribute('data-status', 'custom');
    });

    it('maintains component defaults when no custom props provided', () => {
      render(<TagActionTask action={RuleAction.RULE_ACTION_ALLOW} text="Test" />);

      const tag = screen.getByTestId('tag');
      expect(tag).toHaveAttribute('data-size', 'medium');
      expect(tag).toHaveAttribute('data-status', 'allow');
    });

    it('maintains component defaults for deny action', () => {
      render(<TagActionTask action={RuleAction.RULE_ACTION_DENY} text="Test" />);

      const tag = screen.getByTestId('tag');
      expect(tag).toHaveAttribute('data-size', 'medium');
      expect(tag).toHaveAttribute('data-status', 'deny');
    });

    it('maintains size default for default case', () => {
      render(<TagActionTask text="Test" />);

      const tag = screen.getByTestId('tag');
      expect(tag).toHaveAttribute('data-size', 'medium');
      expect(tag).not.toHaveAttribute('data-status');
    });
  });

  describe('Edge cases', () => {
    it('handles string representation of boolean values', () => {
      // React doesn't render boolean true, but string "true" will render
      render(<TagActionTask action={RuleAction.RULE_ACTION_ALLOW} text="true" />);

      const typography = screen.getByTestId('typography');
      expect(typography).toHaveTextContent('true');
    });

    it('handles boolean false (React ignores boolean values)', () => {
      render(<TagActionTask action={RuleAction.RULE_ACTION_ALLOW} text={false as any} />);

      const typography = screen.getByTestId('typography');
      // React ignores boolean false, so element should be empty
      expect(typography).toBeEmptyDOMElement();
    });

    it('handles boolean true (React ignores boolean values)', () => {
      render(<TagActionTask action={RuleAction.RULE_ACTION_ALLOW} text={true as any} />);

      const typography = screen.getByTestId('typography');
      // React ignores boolean true, so element should be empty
      expect(typography).toBeEmptyDOMElement();
    });

    it('handles array as text', () => {
      const arrayText = ['Item 1', 'Item 2'] as any;
      render(<TagActionTask action={RuleAction.RULE_ACTION_DENY} text={arrayText} />);

      const typography = screen.getByTestId('typography');
      // React will render array items concatenated
      expect(typography).toHaveTextContent('Item 1Item 2');
    });

    it('handles zero as text', () => {
      render(<TagActionTask text={0 as any} />);

      const tag = screen.getByTestId('tag');
      expect(tag).toHaveTextContent('0');
    });

    it('handles null text', () => {
      render(<TagActionTask action={RuleAction.RULE_ACTION_ALLOW} text={null} />);

      const typography = screen.getByTestId('typography');
      expect(typography).toBeEmptyDOMElement();
    });

    it('handles undefined text', () => {
      render(<TagActionTask action={RuleAction.RULE_ACTION_DENY} text={undefined} />);

      const typography = screen.getByTestId('typography');
      expect(typography).toBeEmptyDOMElement();
    });
  });

  describe('Accessibility and semantic structure', () => {
    it('maintains proper semantic structure for allow action', () => {
      render(<TagActionTask action={RuleAction.RULE_ACTION_ALLOW} text="Allow Test" />);

      const tag = screen.getByTestId('tag');
      const typography = screen.getByTestId('typography');

      expect(tag).toContainElement(typography);
      expect(typography.parentElement).toBe(tag);
    });

    it('maintains proper semantic structure for deny action', () => {
      render(<TagActionTask action={RuleAction.RULE_ACTION_DENY} text="Deny Test" />);

      const tag = screen.getByTestId('tag');
      const typography = screen.getByTestId('typography');

      expect(tag).toContainElement(typography);
      expect(typography.parentElement).toBe(tag);
    });

    it('maintains proper structure for default case', () => {
      render(<TagActionTask text="Default Test" />);

      const tag = screen.getByTestId('tag');
      expect(tag).toHaveTextContent('Default Test');
    });
  });
});
