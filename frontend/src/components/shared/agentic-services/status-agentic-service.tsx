/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {AppStatus} from '@/types/api/app';
import {Badge, Typography} from '@cisco-eti/spark-design';

export const StatusAgenticService = ({status}: {status?: AppStatus}) => {
  if (status === AppStatus.APP_STATUS_ACTIVE) {
    return (
      <div className="flex items-center gap-2">
        <Badge content={null} type="success" styleBadge={{width: '6px', height: '6px', padding: '0'}} />
        <Typography color="#272E37" fontSize={14}>
          Active
        </Typography>
      </div>
    );
  } else if (status === AppStatus.APP_STATUS_REVOKED) {
    return (
      <div className="flex items-center gap-2">
        <Badge content={null} type="error" styleBadge={{width: '6px', height: '6px', padding: '0'}} />
        <Typography color="#272E37" fontSize={14}>
          Inactive
        </Typography>
      </div>
    );
  } else if (status === AppStatus.APP_STATUS_PENDING) {
    return (
      <div className="flex items-center gap-2">
        <Badge content={null} type="warning" styleBadge={{width: '6px', height: '6px', padding: '0'}} />
        <Typography color="#272E37" fontSize={14}>
          Pending
        </Typography>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <Badge content={null} type="warning" styleBadge={{width: '6px', height: '6px', padding: '0'}} />
      <Typography color="#272E37" fontSize={14}>
        Pending
      </Typography>
    </div>
  );
};
