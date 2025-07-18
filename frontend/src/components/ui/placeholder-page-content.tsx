/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {ExclamationTriangleIcon} from '@radix-ui/react-icons';
import {Card} from './card';

const PlaceholderPageContent: React.FC<{type?: 'placeholder' | 'mock'}> = ({type = 'placeholder'}) => {
  const title = type === 'placeholder' ? 'This page is a placeholder' : 'This page contains mock data';
  const description =
    type === 'placeholder'
      ? 'This page has not been implemented yet.'
      : 'This page contains mock data for development purposes.';

  return (
    <Card variant="secondary">
      <div className="flex items-center text-sm text-muted-foreground gap-4">
        <ExclamationTriangleIcon className="w-6 h-6" />
        <div>
          <h2 className="font-semibold pb-1">{title}</h2>
          <p>{description}</p>
        </div>
      </div>
    </Card>
  );
};

export default PlaceholderPageContent;
