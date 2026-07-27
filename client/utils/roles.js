export const ROLES = {
  EMPLOYEE: 'employee',
  MANAGER: 'manager',
  GM: 'gm',
  OWNER: 'owner',
};

export const ROLE_LABELS = {
  employee: 'Employee',
  manager: 'Manager',
  gm: 'General Manager',
  owner: 'Owner',
};

export const ROLE_COLORS = {
  employee: { badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  manager: { badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  gm: { badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  owner: { badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
};

export const ROLE_NAV = {
  employee: [
    { label: 'Dashboard', href: '/dashboard', icon: 'home' },
    { label: 'Clock In/Out', href: '/attendance', icon: 'clock' },
    { label: 'My Schedule', href: '/schedule', icon: 'calendar' },
    { label: 'Leave Requests', href: '/leave', icon: 'umbrella' },
    { label: 'Settings', href: '/settings', icon: 'settings' },
  ],
  manager: [
    { label: 'Dashboard', href: '/dashboard', icon: 'home' },
    { label: 'Team Attendance', href: '/attendance', icon: 'users' },
    { label: 'Schedule', href: '/schedule', icon: 'calendar' },
    { label: 'Leave Requests', href: '/leave', icon: 'inbox' },
    { label: 'Tasks', href: '/task', icon: 'check-square' },
    { label: 'Analytics', href: '/analytics', icon: 'bar-chart' },
    { label: 'Settings', href: '/settings', icon: 'settings' },
  ],
  gm: [
    { label: 'Dashboard', href: '/dashboard', icon: 'home' },
    { label: 'Departments', href: '/employees', icon: 'building' },
    { label: 'Attendance', href: '/attendance', icon: 'users' },
    { label: 'Analytics', href: '/analytics', icon: 'bar-chart' },
    { label: 'Leave Approvals', href: '/leave', icon: 'inbox' },
    { label: 'Settings', href: '/settings', icon: 'settings' },
  ],
  owner: [
    { label: 'Overview', href: '/dashboard', icon: 'home' },
    { label: 'All Departments', href: '/employees', icon: 'building' },
    { label: 'Analytics', href: '/analytics', icon: 'bar-chart' },
    { label: 'Attendance', href: '/attendance', icon: 'users' },
    { label: 'Leave Management', href: '/leave', icon: 'inbox' },
    { label: 'Settings', href: '/settings', icon: 'settings' },
  ],
};
