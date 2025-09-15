'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

import { NoSsr } from '@/components/core/no-ssr';

const HEIGHT = 60;
const WIDTH = 60;

type Color = 'dark' | 'light';

export interface LogoProps {
  color?: Color;
  emblem?: boolean;
  height?: number;
  width?: number;
}

export function Logo({
  color = 'dark',
  emblem,
  height = HEIGHT,
  width = WIDTH,
}: LogoProps): React.JSX.Element {
  let url: string;

  if (emblem) {
    url =
      color === 'light'
        ? '/assets/logo-emblem.svg'
        : '/assets/logo-emblem--dark.svg';
  } else {
    url = color === 'light' ? '/assets/logo.svg' : '/assets/logo--dark.svg';
  }

  return (
    <Box
      alt="logo"
      component="img"
      height={height}
      src={url}
      width={width}
      sx={{ display: 'block' }}
    />
  );
}

export interface DynamicLogoProps {
  /** which logo variant to use when theme = dark */
  colorDark?: Color;
  /** which logo variant to use when theme = light */
  colorLight?: Color;
  emblem?: boolean;
  height?: number;
  width?: number;
}

/**
 * Picks the right logo based on theme.palette.mode.
 */
export function DynamicLogo({
  colorDark = 'light',
  colorLight = 'dark',
  height = HEIGHT,
  width = WIDTH,
  ...props
}: DynamicLogoProps): React.JSX.Element {
  const theme = useTheme();
  const mode = theme.palette.mode; // "light" | "dark"
  const color = mode === 'dark' ? colorDark : colorLight;

  return (
    <NoSsr fallback={<Box sx={{ height: `${height}px`, width: `${width}px` }} />}>
      <Logo color={color} height={height} width={width} {...props} />
    </NoSsr>
  );
}
