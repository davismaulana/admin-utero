import * as React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import GlobalStyles from '@mui/material/GlobalStyles';

import { AuthGuard } from '@/components/auth/auth-guard';
import { MainNav } from '@/components/dashboard/layout/main-nav';
import { SideNav } from '@/components/dashboard/layout/side-nav';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps): React.JSX.Element {
  return (
    <AuthGuard>
      <GlobalStyles
        styles={{
          'html, body, #__next': { height: '100%' },
          body: {
            '--MainNav-height': '56px',
            '--MainNav-zIndex': 1000,
            '--SideNav-width': '280px',
            '--SideNav-zIndex': 1100,
            '--MobileNav-width': '320px',
            '--MobileNav-zIndex': 1100,
            /* Prevent accidental horizontal scroll from wide children */
            overflowX: 'hidden',
          },
          /* Ensure images/iframes don’t blow the layout */
          'img, svg, video, canvas': { maxWidth: '100%' },
        }}
      />

      {/* Root */}
      <Box
        sx={{
          bgcolor: 'var(--mui-palette-background-default)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          minHeight: '100vh',
          width: '100%',
          /* clip is nicer than hidden for perf when animating */
          overflowX: 'clip',
        }}
      >
        {/* Fixed/absolute SideNav handles its own positioning */}
        <SideNav />

        {/* App shell */}
        <Box
          sx={{
            display: 'flex',
            flex: '1 1 auto',
            flexDirection: 'column',
            /* reserve space for side nav on large screens */
            pl: { lg: 'var(--SideNav-width)' },
            /* Important so child flex items can shrink without causing x-scroll */
            minWidth: 0,
            width: '100%',
          }}
        >
          <MainNav />

          {/* Content area */}
          <Box
            component="main"
            sx={{
              flex: 1,
              width: '100%',
              minWidth: 0, // <-- key for preventing overflow in flex
              pt: 'var(--MainNav-height)',
              /* If MainNav is not overlaying, you can remove the pt line */
            }}
          >
            <Container
              maxWidth="xl"
              disableGutters
              sx={{
                /* Standard page paddings */
                px: { xs: 2, sm: 3 },
                py: { xs: 4, md: 6 },
                /* Keep container from forcing overflow on tiny screens */
                width: '100%',
                minWidth: 0,
              }}
            >
              <Box sx={{ minWidth: 0 }}>{children}</Box>
            </Container>
          </Box>
        </Box>
      </Box>
    </AuthGuard>
  );
}
