/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Card, CardContent, CardHeader} from '@/components/ui/card';
import {Link} from 'react-router-dom';
import {ExternalLinkIcon} from 'lucide-react';
import TextMd from '@/components/ui/text-md';
import {CopyButton} from '@/components/ui/copy-button';

export const RegisterProvider = ({isLoading = false}: {isLoading?: boolean}) => {
  const cmdShow = `
  \`\`\`bash
  identity issuer register -o "My Organization" \\
      -c "$OKTA_OAUTH2_CLIENT_ID" -s "$OKTA_OAUTH2_CLIENT_SECRET" -u "$OKTA_OAUTH2_ISSUER"
  \`\`\`
  `;

  const cmdCopy = `identity issuer register -o "My Organization" \\
-c "$OKTA_OAUTH2_CLIENT_ID" -s "$OKTA_OAUTH2_CLIENT_SECRET" -u "$OKTA_OAUTH2_ISSUER"`;

  return (
    <Card className="text-start py-4" variant="secondary">
      <CardHeader className="flex justify-between items-center">
        <p className="text-[#3C4551] font-[500]">Register Identity Provider using the CLI</p>
        <Link
          to={'https://github.com/agntcy/identity?tab=readme-ov-file#step-3-register-as-an-issuer'}
          className="button-link flex gap-2 items-center"
          target="_blank"
        >
          View Documentation
          <ExternalLinkIcon className="w-4 h-4" />
        </Link>
      </CardHeader>
      <CardContent className="px-6 pt-4 space-y-4">
        <div className="code-block flex justify-between items-center">
          <TextMd text={cmdShow} />
          <CopyButton text={cmdCopy} />
        </div>
      </CardContent>
    </Card>
  );
};
