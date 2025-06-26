/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Card, CardContent} from '@/components/ui/card';
import {ExternalLinkIcon} from 'lucide-react';
import {labels} from '@/constants/labels';
import {Link, Typography} from '@outshift/spark-design';
import {useMemo} from 'react';
import {IdpType, IssuerSettings} from '@/types/api/settings';
import KeyValue, {KeyValuePair} from '@/components/ui/key-value';
import {ProviderType} from '@/components/shared/provider-type';

export const InformationProvider = ({idpSettings}: {idpSettings?: IssuerSettings}) => {
  const provider = idpSettings?.idpType;

  const keyValuePairs = useMemo(() => {
    const temp: KeyValuePair[] = [];
    temp.push({
      keyProp: 'Provider Type',
      value: <ProviderType type={provider} />
    });
    return temp;
  }, [provider]);

  return (
    <Card className="text-start space-y-6" variant="secondary">
      <div className="flex justify-between items-center">
        <Typography variant="subtitle1" fontWeight={600}>
          About
        </Typography>
        <Link href="" openInNewTab>
          <div className="flex items-center gap-1">
            View documentation
            <ExternalLinkIcon className="w-4 h-4 ml-1" />
          </div>
        </Link>
      </div>
      <CardContent className="p-0 space-y-4">
        <KeyValue pairs={keyValuePairs} useCard={false} />
      </CardContent>
    </Card>
  );
};
