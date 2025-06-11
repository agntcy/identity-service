/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {BasePage} from '@/components/layout/base-page';
import {Button} from '@/components/ui/button';
import {Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog';

const OnBoarding: React.FC = () => {
  return (
    <div>
      <Dialog defaultOpen={true} open={true}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>What Identity Provider will you use?</DialogTitle>
            <DialogDescription>some description</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OnBoarding;
