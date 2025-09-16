/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {PublicHeader} from '@/components/layout/public-header';
import {ExternalLinkIcon} from 'lucide-react';
import {docs} from '@/utils/docs';
import {Link} from '@outshift/spark-design';
import {ContentOnBoardDevice} from '@/components/onboard-device/content-onboard-device';
import {useSearchParams} from 'react-router-dom';
import {useLocalStore} from '@/store';
import {useShallow} from 'zustand/react/shallow';
import {useEffect} from 'react';
import {Footer} from '@/components/layout/footer';

const OnBoardDevice = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id') || undefined;

  const {setIdDevice, idDevice} = useLocalStore(
    useShallow((state) => ({
      setIdDevice: state.setIdDevice,
      idDevice: state.idDevice
    }))
  );

  useEffect(() => {
    if (id) {
      setIdDevice(id);
    }
  }, [id, setIdDevice]);

  return (
    <>
      <div className="h-screen w-screen fixed top-0 left-0 z-50 no-doc-scroll relative overflow-hidden h-dvh">
        <div className="flex flex-col justify-between h-full">
          <PublicHeader
            userSection={
              <Link href={docs()} openInNewTab>
                <div className="flex items-center gap-1">
                  <span className="hidden md:block">Explore</span>
                  <ExternalLinkIcon className="w-4 h-4 ml-1" />
                </div>
              </Link>
            }
          />
          <div className="flex flex-col justify-center h-full">
            <ContentOnBoardDevice id={idDevice} />
          </div>
          <Footer />
        </div>
      </div>
    </>
  );
};

export default OnBoardDevice;
