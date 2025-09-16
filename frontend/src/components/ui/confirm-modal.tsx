/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {ReactNode} from 'react';
import {Modal, ModalTitle, ModalContent, ModalActions, Button, Typography} from '@outshift/spark-design';
import {ButtonProps} from '@mui/material';

interface ConfirmModalProps {
  open: boolean;
  title: ReactNode;
  description: ReactNode;
  confirmButtonText?: string;
  buttonConfirmProps?: ButtonProps;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  description,
  buttonConfirmProps,
  confirmButtonText,
  onCancel,
  onConfirm
}) => {
  return (
    <Modal open={open} onClose={onCancel} aria-labelledby="dialog-title" aria-describedby="dialog-description" maxWidth="md">
      <ModalTitle>{title}</ModalTitle>
      <ModalContent>
        <Typography variant="body2">{description}</Typography>
      </ModalContent>
      <ModalActions>
        <Button onClick={onCancel} variant="tertariary" sx={{fontWeight: '600 !important'}}>
          Cancel
        </Button>
        <Button {...buttonConfirmProps} onClick={onConfirm} sx={{fontWeight: '600 !important'}}>
          {confirmButtonText || 'Continue'}
        </Button>
      </ModalActions>
    </Modal>
  );
};
