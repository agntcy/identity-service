/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {ReactNode} from 'react';
import {Card, CardContent} from './card';
import {cn} from '@/lib/utils';
import {Typography} from '@mui/material';
import {OverflowTooltip} from '@outshift/spark-design';

const keyValueStyles = 'flex flex-col gap-4 w-full p-0';

const KeyValue: React.FC<KeyValueProps> = ({pairs, className, useCard = true, orientation = 'horizontal'}) => {
  if (pairs.length === 0) {
    return null;
  }

  const maxKeyLength = pairs.reduce((max, pair) => {
    if (typeof pair.keyProp === 'string') {
      return Math.max(max, pair.keyProp.length);
    }
    return max;
  }, 0);

  const calculatedMinWidth = `${Math.max(100, maxKeyLength * 8)}px`;

  const ContainerComponent = useCard ? Card : 'div';

  return (
    <ContainerComponent className="p-0 w-full">
      <CardContent className={cn(keyValueStyles, className)}>
        {pairs.map((pair, i) => (
          <KeyValueDisplay
            key={i}
            keyProp={pair.keyProp}
            value={pair.value}
            description={pair.description}
            orientation={orientation}
            minWidth={calculatedMinWidth}
          />
        ))}
      </CardContent>
    </ContainerComponent>
  );
};

export const KeyValueDisplay: React.FC<KeyValuePair> = ({keyProp, value, description, orientation, minWidth}) => {
  return (
    <div className={orientation === 'horizontal' ? 'flex items-center gap-[24px]' : 'flex flex-col gap-2'}>
      {orientation === 'horizontal' ? (
        <>
          <Typography style={{minWidth}} variant="body2Semibold">
            {keyProp}
          </Typography>
          <Typography variant="body2" sx={{width: '100%'}}>
            {value}
          </Typography>
        </>
      ) : (
        <>
          <Typography variant="body2Semibold">{keyProp}</Typography>
          <Typography variant="body2">{value}</Typography>
        </>
      )}
      {description && <div className="text-sm text-muted-foreground">{description}</div>}
    </div>
  );
};

export interface KeyValuePair {
  keyProp: ReactNode;
  value: ReactNode;
  description?: ReactNode;
  orientation?: 'horizontal' | 'vertical';
  minWidth?: string;
}

interface KeyValueProps {
  useCard?: boolean;
  className?: string;
  pairs: KeyValuePair[];
  orientation?: 'horizontal' | 'vertical';
}

export default KeyValue;
