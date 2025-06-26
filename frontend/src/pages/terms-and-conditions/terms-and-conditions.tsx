/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {BasePage} from '@/components/layout/base-page';
import {PATHS} from '@/router/paths';
import {Typography} from '@mui/material';
import {Link} from 'react-router-dom';

const TermsAndConditions: React.FC = () => {
  return (
    <BasePage
      title="Terms and Conditions"
      breadcrumbs={[
        {text: 'Dashboard', link: PATHS.dashboard},
        {text: 'Terms and Conditions', link: PATHS.termsAndConditions}
      ]}
      useBorder
    >
      <Typography variant="body1">
        This site is operated by Outshift by Cisco (“Outshift”). Outshift is Cisco&apos;s in-house incubation engine.{' '}
        <Link to="https://www.cisco.com/c/en/us/about/legal/terms-conditions.html" target="_blank" className="inline-link">
          Cisco Web Site Terms of Use
        </Link>{' '}
        govern your use of this website as well as any other websites that Outshift by Cisco may control. By accessing, visiting, or otherwise using
        this website, you agree to be bound by Cisco Web Site Terms of Use.
      </Typography>
    </BasePage>
  );
};

export default TermsAndConditions;
