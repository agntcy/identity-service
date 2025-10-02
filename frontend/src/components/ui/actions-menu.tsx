/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {IconButton, Menu, MenuItem, Tooltip, Typography} from '@mui/material';
import {EllipsisVerticalIcon} from 'lucide-react';
import {useState, useCallback, ReactNode} from 'react';

export interface ActionMenuItem {
  key: string;
  label: string;
  icon?: ReactNode;
  iconColor?: string;
  textColor?: string;
  onClick: () => void;
}

interface ActionsMenuProps {
  items: ActionMenuItem[];
  onMenuOpen?: () => void;
  onMenuClose?: () => void;
  tooltipTitle?: string;
  buttonSize?: string;
}

export const ActionsMenu = ({
  items,
  onMenuOpen,
  onMenuClose,
  tooltipTitle = 'Actions',
  buttonSize = '24px'
}: ActionsMenuProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(event.currentTarget);
      onMenuOpen?.();
    },
    [onMenuOpen]
  );

  const handleClose = useCallback(() => {
    setAnchorEl(null);
    onMenuClose?.();
  }, [onMenuClose]);

  const handleItemClick = useCallback(
    (item: ActionMenuItem) => {
      item.onClick();
      handleClose();
    },
    [handleClose]
  );

  return (
    <>
      <Tooltip title={tooltipTitle} arrow>
        <IconButton
          sx={(theme) => ({
            color: theme.palette.vars.baseTextDefault,
            width: buttonSize,
            height: buttonSize
          })}
          onClick={handleClick}
        >
          <EllipsisVerticalIcon className="h-4 w-4" />
        </IconButton>
      </Tooltip>
      <Menu
        transformOrigin={{horizontal: 'right', vertical: 'top'}}
        anchorOrigin={{horizontal: 'right', vertical: 'bottom'}}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
      >
        {items.map((item) => (
          <MenuItem
            key={item.key}
            sx={{display: 'flex', alignItems: 'center', gap: '8px'}}
            onClick={() => handleItemClick(item)}
          >
            {item.icon}
            <Typography variant="body2" color={item.textColor}>
              {item.label}
            </Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
