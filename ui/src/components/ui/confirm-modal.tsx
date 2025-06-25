import React from 'react';
import {Modal, ModalTitle, ModalContent, ModalActions, Button, Typography} from '@outshift/spark-design';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmButtonText?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({open, title, description, confirmButtonText, onCancel, onConfirm}) => {
  return (
    <Modal open={open} onClose={onCancel} aria-labelledby="dialog-title" aria-describedby="dialog-description" maxWidth="md">
      <ModalTitle>{title}</ModalTitle>
      <ModalContent>
        <Typography variant="body2">{description}</Typography>
      </ModalContent>
      <ModalActions>
        <Button onClick={onCancel} variant="tertariary">
          Cancel
        </Button>
        <Button color="negative" onClick={onConfirm}>
          {confirmButtonText || 'Continue'}
        </Button>
      </ModalActions>
    </Modal>
  );
};
