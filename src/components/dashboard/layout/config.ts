import type { NavItemConfig } from '@/types/nav';
import { paths } from '@/paths';

export const navItems = [
  { key: 'overview', title: 'Overview', href: paths.dashboard.overview, icon: 'chart-pie', allowed: ['ADMIN', 'SELLER', 'BUYER'] },
  {
    key: 'users', title: 'Users', href: paths.dashboard.users, icon: 'users', allowed: ['ADMIN']
  },
  {
    key: 'sellers', title: 'Sellers', href: paths.dashboard.sellers, icon: 'users', allowed: ['ADMIN']
  },
  {
    key: 'categories', title: 'Categories', href: paths.dashboard.categories, icon: 'tag', allowed: ['ADMIN']
  },
  {
    key: 'designs', title: 'Designs', href: paths.dashboard.designs, icon: 'paint-brush', allowed: ['ADMIN']
  },
  {
    key: "billboards", title: "Billboards", href: paths.dashboard.billboards, icon: "signpost", allowed: ['SELLER', 'ADMIN']
  },
  {
    key: 'recommendations', title: 'Recommendations', href: paths.dashboard.recommendations, icon: 'sparkles', allowed: ['ADMIN']
  },
  {
    key: "locations", title: "Locations", href: paths.dashboard.locations, icon: "map-pin", allowed: ['ADMIN']
  },
  {
    key: 'transactions', title: 'Transactions', href: paths.dashboard.transactions, icon: 'file-text', allowed: ['ADMIN', 'SELLER']
  },

  {
    key: 'recycleBin', title: 'Recycle Bin', href: paths.dashboard.recycleBin, icon: 'recycle-bin', allowed: ['ADMIN']
  },
  {
    key: 'gelleries', title: 'Galleries', href: paths.dashboard.galleries, icon: 'galleries', allowed: ['ADMIN']
  },
] satisfies NavItemConfig[];
