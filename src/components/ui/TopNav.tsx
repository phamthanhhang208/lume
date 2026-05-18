import { Link, useLocation } from "react-router";

import LumeMark from "@/components/ui/LumeMark";

const NAV = [
  { label: "Today", to: "/dashboard" },
  { label: "Skin", to: "/scan" },
  { label: "Verdict", to: "/verdict" },
  { label: "Looks", to: "/look" },
];

export default function TopNav() {
  const { pathname } = useLocation();

  const isActive = (to: string) => {
    if (to === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(to);
  };

  return (
    <nav
      className="sticky top-0 z-40 hidden h-[60px] items-center justify-between border-b border-black/[0.08] bg-white px-8 lg:flex"
    >
      <div className="flex items-center gap-8">
        <LumeMark size={30} />
        <div className="flex gap-5">
          {NAV.map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              className="pb-1 font-mono text-[11.5px] uppercase tracking-[0.12em] transition-colors"
              style={{
                color: isActive(to) ? "#E37B8C" : "#6B6B70",
                fontWeight: isActive(to) ? 700 : 400,
                borderBottom: isActive(to) ? "2px solid #E37B8C" : "2px solid transparent",
              }}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link
          to="/products/new"
          className="flex items-center gap-1.5 rounded-full px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-white"
          style={{ background: "#E37B8C" }}
        >
          + add product
        </Link>
        <Link
          to="/profile"
          className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-rose"
          style={{ boxShadow: "0 0 0 2px rgba(227,123,140,.25)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E37B8C" strokeWidth="1.6" strokeLinecap="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c1-5 6-7 8-7s7 2 8 7" />
          </svg>
        </Link>
      </div>
    </nav>
  );
}
