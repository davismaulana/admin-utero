export const paths = {
  home: '/',
  auth: { signIn: '/auth/sign-in', signUp: '/auth/sign-up', resetPassword: '/auth/reset-password' },
  dashboard: {
    overview: '/dashboard',
    users: '/dashboard/users',
    sellers: '/dashboard/sellers',
    categories: '/dashboard/categories',
    designs: '/dashboard/designs',
    billboards: "/dashboard/billboards",
    recommendations: '/dashboard/billboards/recommendations',
    account: '/dashboard/account',
    customers: '/dashboard/customers',
    integrations: '/dashboard/integrations',
    settings: '/dashboard/settings',
  },
  errors: { notFound: '/errors/not-found' },
} as const;
