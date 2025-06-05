/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {FingerprintIcon, PlusIcon} from 'lucide-react';
import {Button} from '../ui/button';
import {Card} from '../ui/card';
import {useCallback} from 'react';
import {useNavigate} from 'react-router-dom';
import {PATHS} from '@/router/paths';

export const EmptyProvider = () => {
  const navigate = useNavigate();

  const onClick = useCallback(() => {
    void navigate(PATHS.settingsIdentityProvider, {replace: true});
  }, [navigate]);

  return (
    <Card>
      <div className="w-full h-full flex items-center	justify-center flex-col gap-6">
        <FingerprintIcon />
        <p className="italic text-[14px]">Get started by adding a identity provider</p>
        <Button size={'sm'} onClick={onClick} className="flex items-center justify-center gap-2">
          <PlusIcon className="h-4 w-4" />
          <p>Connect a Identity Provider</p>
        </Button>
      </div>
    </Card>
  );
};
