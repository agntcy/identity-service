/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {BookIcon, DiameterIcon, ExternalLinkIcon, MoreHorizontalIcon, RefreshCcwIcon, TrashIcon} from 'lucide-react';
import {generatePath, useNavigate} from 'react-router-dom';
import {PATHS} from '@/router/paths';
import {useCallback} from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {Button} from '@/components/ui/button';

interface DropMenuActionsProps {
  application?: any;
  handleOnDelete?: (application?: any) => void;
}

export const DropMenuActions = ({application, handleOnDelete}: DropMenuActionsProps) => {
  const navigate = useNavigate();

  // const handleExplore = useCallback(() => {
  //   const path = generatePath(PATHS.configurationsDetails, {id: air?.id});
  //   navigate(path, {replace: true});
  // }, [air?.id, navigate]);

  // const handleViewCatalog = useCallback(() => {
  //   const path = generatePath(PATHS.catalogsDetails, {id: air?.catalogId});
  //   navigate(path, {replace: true});
  // }, [air?.catalogId, navigate]);

  // const handleUpdateBindings = useCallback(() => {
  //   const path = generatePath(PATHS.configurationsBindings, {id: air?.id});
  //   navigate(path, {replace: true});
  // }, [air?.id, navigate]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="transition-all flex h-8 w-8 p-0 data-[state=open]:bg-muted">
          <MoreHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* <DropdownMenuItem className="cursor-pointer group dark:focus:focus:bg-accent" onClick={handleExplore}>
          <p>Details</p>
          <DropdownMenuShortcut className="invisible group-hover:visible">
            <ExternalLinkIcon className="h-3 w-3 stroke-white" />
          </DropdownMenuShortcut>
        </DropdownMenuItem> */}
        {/* <DropdownMenuItem className="cursor-pointer group dark:focus:focus:bg-accent" onClick={handleUpdateBindings}>
          <p>Bindings</p>
          <DropdownMenuShortcut className="invisible group-hover:visible">
            <DiameterIcon className="h-3 w-3 stroke-white" />
          </DropdownMenuShortcut>
        </DropdownMenuItem> */}
        {/* <DropdownMenuItem className="cursor-pointer group dark:focus:focus:bg-accent" onClick={handleViewCatalog}>
          <p>Catalog</p>
          <DropdownMenuShortcut className="invisible group-hover:visible">
            <BookIcon className="h-3 w-3 stroke-white" />
          </DropdownMenuShortcut>
        </DropdownMenuItem> */}
        {/* <DropdownMenuItem className="cursor-pointer group dark:focus:focus:bg-accent" onClick={() => {}} disabled>
          <p>Update</p>
          <DropdownMenuShortcut className="invisible group-hover:visible">
            <RefreshCcwIcon className="h-3 w-3 stroke-white" />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer group focus:bg-red-50 dark:focus:focus:bg-accent"
          onClick={() => {
            handleOnDelete?.(air);
          }}
        >
          <p className="group-hover:text-red-500">Delete</p>
          <DropdownMenuShortcut className="invisible group-hover:visible">
            <TrashIcon className="stroke-red-500 h-3 w-3" />
          </DropdownMenuShortcut>
        </DropdownMenuItem> */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
