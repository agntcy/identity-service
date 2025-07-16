/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Box,
  BoxProps,
  CircularProgress,
  circularProgressClasses,
  CircularProgressProps,
  Typography,
  TypographyProps
} from '@mui/material';
import {useEffect, useState, useMemo} from 'react';

const TIMER = 1000; // 1 second

interface CountDownTimerProps extends CircularProgressProps {
  boxProps?: BoxProps;
  duration: number;
  showText?: boolean;
  textProps?: TypographyProps;
  onComplete?: () => void;
}

export const CountDownTimer = ({
  duration,
  showText = true,
  onComplete,
  boxProps,
  textProps,
  ...props
}: CountDownTimerProps) => {
  const [timeDuration, setTimeDuration] = useState(duration);
  const [countdownPercentage, setCountdownPercentage] = useState(100);

  const text = useMemo(() => {
    if (timeDuration <= 0) {
      return 'Ended!';
    }
    const minutes = Math.floor(timeDuration / 60);
    const seconds = timeDuration % 60;
    return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  }, [timeDuration]);

  useEffect(() => {
    if (timeDuration <= 0) {
      onComplete?.();
      return;
    }
    const intervalId = setInterval(() => {
      setTimeDuration((prev) => {
        if (prev <= 1) {
          setCountdownPercentage(0);
          clearInterval(intervalId);
          onComplete?.();
          return 0;
        }
        const newTimeDuration = prev - 1;
        const percentage = Math.ceil((newTimeDuration / duration) * 100);
        setCountdownPercentage(percentage);
        return newTimeDuration;
      });
    }, TIMER);
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, onComplete]);

  return (
    <>
      <Box
        sx={{
          position: 'relative',
          width: props?.size,
          height: props?.size,
          ...boxProps?.sx
        }}
        {...boxProps}
      >
        <CircularProgress
          sx={{
            ...props.sx,
            opacity: 0.2
          }}
          size={80}
          {...props}
          value={100}
          variant="determinate"
        />
        <CircularProgress
          sx={{
            ...props.sx,
            animationDuration: '1s',
            position: 'absolute',
            left: 0,
            top: typeof props?.size === 'number' && props.size < 17 ? 2 : 0,
            [`& .${circularProgressClasses.circle}`]: {
              strokeLinecap: 'round',
              strokeDasharray: '31.4, 94.2'
            }
          }}
          size={80}
          {...props}
          style={{
            transform: 'scaleX(-1) rotate(-90deg)'
          }}
          disableShrink
          variant="determinate"
          value={countdownPercentage}
        />
        {showText && (
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography variant="body1Semibold" {...textProps}>
              {text}
            </Typography>
          </Box>
        )}
      </Box>
    </>
  );
};
