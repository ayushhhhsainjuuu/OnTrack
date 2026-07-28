'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { useSequentialShortcut } from '@/hooks/useSequentialShortcut';

/**
 * Role-gated command palette.
 *
 * `role` should be whatever your current source of truth is —
 * e.g. session.user.user_metadata.role (raw_user_meta_data) or
 * a fetched profiles.role value. Pass it in from a parent that
 * already has the session/profile loaded, so this component stays
 * agnostic to where the role actually comes from.
 */

const ALL_ROLES = [
  'Owner',
  'General Manager',
  'Project Manager',
  'Accountant Supervisor',
  'Foreman',
  'Lead',
  'Cleaner',
];

// Roles allowed to see each action. Adjust to match real permission rules.
const ACTIONS = [
  {
    id: 'dashboard',
    label: 'Go to Dashboard',
    shortcut: 'G D',
    href: 'app/(app)/dashboard',
    roles: ALL_ROLES,
  },
  {
    id: 'schedules',
    label: 'Go to Schedules',
    shortcut: 'G S',
    href: 'app/(app)/schedules',
    roles: ALL_ROLES,
  },
  {
    id: 'leave',
    label: 'Go to Leave Requests',
    shortcut: 'G L',
    href: 'app/(app)/leave',
    roles: ALL_ROLES,
  },
  {
    id: 'clock',
    label: 'Clock In / Out',
    shortcut: 'G C',
    href: '/clock',
    roles: ['Foreman', 'Lead', 'Cleaner'],
  },
  {
    id: 'team',
    label: 'Go to Team / Roster',
    shortcut: 'G T',
    href: '/team',
    roles: ['Owner', 'General Manager', 'Project Manager', 'Foreman'],
  },
  {
    id: 'ai-summary',
    label: 'AI Summary',
    shortcut: 'G A',
    href: '../backend/ai-service/index.js',
    roles: ['Owner', 'General Manager', 'Project Manager'],
  },
  {
    id: 'settings',
    label: 'Go to Settings',
    shortcut: 'G ,',
    href: '/settings',
    roles: ALL_ROLES,
  },
];

export default function CommandPalette({ role }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const visibleActions = useMemo(
    () => ACTIONS.filter((a) => !role || a.roles.includes(role)),
    [role]
  );

  // Ctrl/Cmd+K opens the palette from anywhere.
  useSequentialShortcut({
    'ctrl+k': () => setOpen((v) => !v),
  });

  // Direct "g x" navigation shortcuts, active even when the palette is closed.
  useSequentialShortcut(
    Object.fromEntries(
      visibleActions.map((a) => [
        a.shortcut.toLowerCase().replace(/\s+/g, ' '),
        () => router.push(a.href),
      ])
    )
  );

  useEffect(() => {
    if (!open) return;
    function onEsc(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [open]);

  function go(href) {
    setOpen(false);
    router.push(href);
  }

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/50"
    >
      <div className="w-full max-w-lg rounded-lg border border-neutral-800 bg-neutral-900 shadow-xl overflow-hidden">
        <Command.Input
          autoFocus
          placeholder="Jump to... (type to search)"
          className="w-full px-4 py-3 bg-transparent text-neutral-100 placeholder-neutral-500 outline-none border-b border-neutral-800"
        />
        <Command.List className="max-h-80 overflow-y-auto p-2">
          <Command.Empty className="px-3 py-6 text-sm text-neutral-500 text-center">
            No matching actions.
          </Command.Empty>
          {visibleActions.map((a) => (
            <Command.Item
              key={a.id}
              onSelect={() => go(a.href)}
              className="flex items-center justify-between px-3 py-2 rounded-md text-sm text-neutral-200 cursor-pointer aria-selected:bg-neutral-800"
            >
              <span>{a.label}</span>
              <kbd className="text-xs text-neutral-500 font-mono">
                {a.shortcut}
              </kbd>
            </Command.Item>
          ))}
        </Command.List>
        <div className="px-3 py-2 border-t border-neutral-800 text-xs text-neutral-500 flex justify-between">
          <span>Enter to select</span>
          <span>Esc to close</span>
        </div>
      </div>
    </Command.Dialog>
  );
}