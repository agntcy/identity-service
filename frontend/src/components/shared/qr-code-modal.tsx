/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Button,
  Link,
  Modal,
  ModalActions,
  ModalContent,
  ModalProps,
  ModalSubtitle,
  ModalTitle,
  Typography
} from '@outshift/spark-design';
import QRCode from 'react-qr-code';

interface QRCodeModalProps extends Omit<ModalProps, 'title' | 'subtitle'> {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  link?: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({title, subtitle, link, onClose, ...props}) => {
  return (
    <Modal maxWidth="lg" fullWidth {...props}>
      <ModalTitle>{title}</ModalTitle>
      {subtitle && <ModalSubtitle>{subtitle}</ModalSubtitle>}
      <ModalContent>
        <div
          style={{
            height: 'auto',
            margin: '0 auto',
            maxWidth: '200px',
            width: '100%'
          }}
          className="pt-4"
        >
          <QRCode
            size={256}
            style={{
              height: 'auto',
              maxWidth: '100%',
              width: '100%'
            }}
            viewBox="0 0 256 256"
            bgColor="#fbfcfe"
            value={link || '#'}
          />
        </div>
        <div className="mt-4 flex justify-center gap-1">
          <Typography variant="body2Semibold">or</Typography>
          <Link href={link} openInNewTab sx={{ml: 1}}>
            click here
          </Link>
        </div>
      </ModalContent>
      <ModalActions>
        <Button
          variant="tertariary"
          sx={{fontWeight: '600 !important'}}
          onClick={() => onClose && onClose({}, 'backdropClick')}
        >
          Cancel
        </Button>
        <Button onClick={() => onClose && onClose({}, 'backdropClick')} sx={{fontWeight: '600 !important'}}>
          Done
        </Button>
      </ModalActions>
    </Modal>
  );
};
