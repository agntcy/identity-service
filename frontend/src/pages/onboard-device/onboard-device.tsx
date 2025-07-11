/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {PublicHeader} from '@/components/layout/public-header';
import { Footer } from '@/components/layout/footer';
import { useParams } from 'react-router-dom';

const OnBoardDevice = () => {
  const {id} = useParams<{id: string}>();

  console.log('OnBoardDevice ID:', id);

  return (
    <div className="h-screen w-screen fixed top-0 left-0 z-50 no-doc-scroll relative">
      <div className='flex flex-col justify-between h-full'>
        <PublicHeader />
        <div>

        </div>
        <Footer />
      </div>
    </div>
  );
};

export default OnBoardDevice;
