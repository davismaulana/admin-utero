import type { NavItemConfig } from '@/types/nav';
import { paths } from '@/paths';

export const navItems = [
  { key: 'overview', title: 'Overview', href: paths.dashboard.overview, icon: 'chart-pie' },
  {
    key: 'users', title: 'Users', href: paths.dashboard.users, icon: 'users'
  },
  {
    key: 'sellers', title: 'Sellers', href: paths.dashboard.sellers, icon: 'users'
  },
  { key: 'categories', title: 'Categories', href: paths.dashboard.categories, icon: 'tag' },
  { key: 'designs', title: 'Designs', href: paths.dashboard.designs, icon: 'paint-brush' },
  { key: "billboards", title: "Billboards", href: paths.dashboard.billboards, icon: "signpost" },
  { key: 'recommendations', title: 'Recommendations', href: paths.dashboard.recommendations, icon: 'sparkles' },
  { key: "locations", title: "Locations", href: paths.dashboard.locations, icon: "map-pin" },
  { key: 'transactions', title: 'Transactions', href: paths.dashboard.transactions, icon: 'file-text' },

  { key: 'recycleBin', title: 'Recycle Bin', href: paths.dashboard.recycleBin, icon: 'recycle-bin' },
  { key: 'gelleries', title: 'Galleries', href: paths.dashboard.galleries, icon: 'galleries' },

  // { key: 'customers', title: 'Customers', href: paths.dashboard.customers, icon: 'users' },
  // { key: 'integrations', title: 'Integrations', href: paths.dashboard.integrations, icon: 'plugs-connected' },
  // { key: 'settings', title: 'Settings', href: paths.dashboard.settings, icon: 'gear-six' },
  // { key: 'account', title: 'Account', href: paths.dashboard.account, icon: 'user' },
  // { key: 'error', title: 'Error', href: paths.errors.notFound, icon: 'x-square' },
] satisfies NavItemConfig[];
