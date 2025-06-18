/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import AgntcyLogo from '@/assets/agntcy-logo.svg';
import useAuth from '@/providers/auth-provider/use-auth';
import {Button, Divider, Typography} from '@outshift/spark-design';
import '@/styles/welcome.css';

const Welcome = () => {
  const {login, register} = useAuth();
  return (
    <div className="flex h-screen">
      <div className="hidden bg-[#00142B] lg:flex flex-col w-1/2 basis-1/2 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 space-y-2 w-[80%]">
          <img src={AgntcyLogo} alt="Agntcy Logo" />
          <Typography variant="h2" paddingTop={2} color="#FBFCFE">
            Identity
          </Typography>
          <Typography variant="h4" paddingTop={6} color="#FBAB2C">
            Create, verify, and manage A2A, agents, and MCP servers with secure access control policies
          </Typography>
        </div>
        <div className="relative z-20 flex flex-col justify-between	text-lg font-medium h-full">
          <div />
          <div className="relative z-20 bg-red-500 h-[26px] w-full striped-bar" />
        </div>
      </div>
      <div className="flex flex-col items-center justify-between w-full lg:w-1/2 md:basis-1/2 relative">
        <div className="h-fit flex items-center justify-center min-w-[600px] p-10 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 space-y-2">
          <div className="max-w-[30rem] flex flex-col gap-8">
            <div className="min-w-[350px]">
              <Typography variant="h3" component="h1" paddingTop={2} textAlign="center" sx={(theme) => ({color: theme.palette.vars.baseTextStrong})}>
                Identity
              </Typography>
              <div className="text-center">
                <Typography variant="headingSubSection">Secure and Verifiable Agent Identification</Typography>
                <Typography variant="body2" paddingTop={2}>
                  AGNTCY Identity provides a secure and verifiable method to uniquely identify agents using open and decentralized techniques.
                </Typography>
              </div>
              <div className="my-4">
                <Divider />
              </div>
              <div className="w-full">
                <Button size="large" onClick={() => login?.()} sx={() => ({fontWeight: '600 !important'})} className="w-full">
                  Sign In
                </Button>
                <div className="text-center">
                  <Typography variant="captionMedium">
                    {"Don't have an account? "}
                    <span className="hover:underline font-bold italic hover:cursor-pointer" onClick={() => register?.()}>
                      {'Sign Up'}
                    </span>
                  </Typography>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div />
      </div>
    </div>
  );
};

export default Welcome;
