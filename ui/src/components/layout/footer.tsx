/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import '@/styles/footer.css';
import {Link} from 'react-router-dom';
import {Button} from '../ui/button';
import {PATHS} from '@/router/paths';

export const Footer: React.FC = () => {
  return (
    <footer className="flex justify-between px-8 py-4 items-center max-w-screen overflow-hidden border-t sticky bottom-0 z-40 footer-container h-[48px]">
      <div>
        <p className="date-footer">© {new Date().getFullYear()} Agentcy Inc.</p>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        <a href="mailto:support@agentcy.com" target="_blank" rel="noopener noreferrer">
          <Button variant="link" className="p-0 link-text">
            support@agentcy.com
          </Button>
        </a>
        <Link to={PATHS.termsAndConditions}>
          <Button variant="link" className="p-0 link-text">
            Terms & Conditions
          </Button>
        </Link>
        <Link to="https://www.cisco.com/c/en/us/about/legal/privacy-full.html" target="_blank" rel="noopener noreferrer">
          <Button variant="link" className="p-0 link-text">
            Privacy Policy
          </Button>
        </Link>
        <Button variant="link" className="p-0 link-text">
          Cookies
        </Button>
      </div>
    </footer>
  );
};
