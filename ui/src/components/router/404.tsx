/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {useNavigate} from 'react-router-dom';
import {Card, EmptyState} from '@outshift/spark-design';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    void navigate(-1);
  };

  return (
    <Card className="mt-4 mx-4 p-4">
      <EmptyState
        variant="warning"
        title="404: Page Not Found"
        description="Sorry, we can't find the page you're looking for. It might have been removed or renamed, or maybe it never existed."
        actionTitle="Go Back"
        actionCallback={() => handleClick()}
      />
    </Card>
  );
};

export default NotFound;
