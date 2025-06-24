/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {useNavigate} from 'react-router-dom';
import {BasePage} from '../layout/base-page';
import {ExclamationTriangleIcon} from '@radix-ui/react-icons';
import {Button} from '../ui/button';
import {Card} from '../ui/card';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  const handleClick = (e: {preventDefault: () => void}) => {
    e.preventDefault();
    void navigate(-1);
  };

  return (
    <BasePage title={undefined} useBreadcrumbs={false}>
      <Card className="p-6 mt-6">
        <div className="mb-6">
          <div className="p-3 inline-flex items-center align-center rounded-full bg-primary">
            <ExclamationTriangleIcon className="w-10 h-10 text-muted" />
          </div>
        </div>
        <h1 className="text-lg font-bold">Something went wrong</h1>
        <p className="text-muted-foreground">An unexpected error has occurred. Sorry about that!</p>
        <div className="flex flex-col gap-2 text-left text-xs text-muted-foreground mt-2">
          <p>
            <b>Date of error:</b>
            {new Date().toLocaleString()}
          </p>
          <h1 className="font-bold">404: Page not found</h1>
          <p>Sorry, we can&apos;t find the page you&apos;re looking for. It might have been removed or renamed, or maybe it never existed.</p>
          <Button onClick={handleClick} className="mt-2 w-[100px]">
            Go Back
          </Button>
        </div>
      </Card>
    </BasePage>
  );
};

export default NotFound;
