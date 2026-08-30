import { Link, useLocation } from "react-router";

const HomeIcon = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 11l9-7 9 7v9a2 2 0 0 1-2 2h-3v-7H8v7H5a2 2 0 0 1-2-2z" />
  </svg>
);

const VerdictIcon = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12l2 2 4-4" />
    <path d="M21 12c0 5-4 9-9 9s-9-4-9-9 4-9 9-9c2.4 0 4.6.9 6.2 2.5" />
  </svg>
);

const LooksIcon = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={color} stroke="none">
    <path d="M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z" />
  </svg>
);

const PlusIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const MeIcon = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1-5 6-7 8-7s7 2 8 7" />
  </svg>
);

export default function BottomNav() {
  const { pathname } = useLocation();

  const isActive = (to: string) => {
    if (to === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(to);
  };

  const activeColor = "#E37B8C";
  const inactiveColor = "#6B6B70";

  const items = [
    { to: "/dashboard", label: "Today", Icon: HomeIcon },
    { to: "/verdict", label: "Verdict", Icon: VerdictIcon },
    { to: "/look", label: "Looks", Icon: LooksIcon },
    { to: "/profile", label: "Me", Icon: MeIcon },
  ];

  return (
    <div className="fixed bottom-5 left-1/2 z-30 flex w-full max-w-sm -translate-x-1/2 items-center justify-between px-4 lg:hidden">
      <div
        className="flex w-full items-center justify-between rounded-full border border-black/[0.10] bg-white px-3 py-2"
        style={{ boxShadow: "0 1px 3px rgba(20,18,14,.08), 0 6px 20px rgba(20,18,14,.08)" }}
      >
        {items.slice(0, 2).map(({ to, label, Icon }) => {
          const active = isActive(to);
          return (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center gap-0.5 px-2 py-1"
            >
              <Icon color={active ? activeColor : inactiveColor} />
              <span
                className="font-mono text-[9px] uppercase tracking-[0.08em]"
                style={{ color: active ? activeColor : inactiveColor, fontWeight: active ? 700 : 400 }}
              >
                {label}
              </span>
            </Link>
          );
        })}

        <Link
          to="/products/new"
          className="-translate-y-3 -rotate-3 flex h-[52px] w-[52px] items-center justify-center rounded-full border-none"
          style={{
            background: activeColor,
            boxShadow: "0 4px 14px rgba(178,107,74,.45)",
          }}
        >
          <PlusIcon />
        </Link>

        {items.slice(2).map(({ to, label, Icon }) => {
          const active = isActive(to);
          return (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center gap-0.5 px-2 py-1"
            >
              <Icon color={active ? activeColor : inactiveColor} />
              <span
                className="font-mono text-[9px] uppercase tracking-[0.08em]"
                style={{ color: active ? activeColor : inactiveColor, fontWeight: active ? 700 : 400 }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
