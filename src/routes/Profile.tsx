import BottomNav from "@/components/ui/BottomNav";
import { useAuth } from "@/features/auth/api/useAuth";
import { useSignOutMutation } from "@/features/auth/api/useSignOutMutation";

export default function Profile() {
  const { user } = useAuth();
  const signOut = useSignOutMutation();

  const settings = [
    { label: "magic link sign-in", right: user?.email ?? "—" },
    {
      label: "sign out",
      right: "→",
      danger: true,
      action: () =>
        signOut.mutate(undefined, {
          onSuccess: () => {
            pendo.track("sign_out_completed");
          },
        }),
    },
  ];

  return (
    <main className="flex min-h-svh flex-col overflow-y-auto bg-cream pb-28 lg:pb-8">
      {/* Header */}
      <div className="px-5 pt-14 pb-3 lg:mx-auto lg:w-full lg:max-w-2xl lg:pt-8">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
          your file
        </div>
        <div className="flex items-baseline justify-between">
          <h1 className="mt-0.5 font-hand text-4xl font-bold leading-tight text-ink">profile</h1>
        </div>
        <svg width="56" height="8" viewBox="0 0 56 8" style={{ display: "block", marginTop: 2 }}>
          <path d="M2,5 Q11,2 22,4.5 T39,4 T54,5" fill="none" stroke="#FBC9A5" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      </div>

      <div className="px-4 lg:mx-auto lg:w-full lg:max-w-2xl lg:px-5">
        {/* Account card */}
        <div
          className="mb-4 flex items-center gap-4 rounded-2xl border border-black/[0.10] bg-white p-4"
          style={{ boxShadow: "0 1px 3px rgba(20,18,14,.06), 0 4px 14px rgba(20,18,14,.06)" }}
        >
          <div className="relative">
            <div className="flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-full bg-rose border-[3px] border-white" style={{ boxShadow: "0 0 0 2px rgba(227,123,140,.3)" }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#E37B8C" strokeWidth="1.4" strokeLinecap="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c1-5 6-7 8-7s7 2 8 7" />
              </svg>
            </div>
            <div
              className="absolute -bottom-1 -right-1 flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 border-white"
              style={{ background: "#E37B8C" }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round">
                <path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft">
              signed in
            </div>
            <div className="font-hand text-xl font-semibold leading-tight text-ink">
              {user?.email?.split("@")[0] ?? "you"}
            </div>
            <div className="mt-0.5 font-sans text-[11px] text-ink-soft truncate">
              {user?.email}
            </div>
          </div>
        </div>

        {/* Settings list */}
        <div
          className="overflow-hidden rounded-2xl border border-black/[0.10] bg-white"
          style={{ boxShadow: "0 1px 2px rgba(20,18,14,.05)" }}
        >
          {settings.map((row, i, arr) => (
            <button
              key={row.label}
              type="button"
              onClick={row.action}
              disabled={!row.action || (row.danger && signOut.isPending)}
              className="flex w-full items-center justify-between px-4 py-3 text-left disabled:opacity-50"
              style={{
                borderBottom: i < arr.length - 1 ? "1px solid rgba(40,35,28,.07)" : "none",
                cursor: row.action ? "pointer" : "default",
              }}
            >
              <span
                className="font-sans text-[13px] font-medium"
                style={{ color: row.danger ? "#E37B8C" : "#1A1A1A" }}
              >
                {row.danger && signOut.isPending ? "signing out…" : row.label}
              </span>
              <span className="font-mono text-[10.5px] tracking-[0.04em] text-ink-soft">
                {row.right}
              </span>
            </button>
          ))}
        </div>

        {signOut.error && (
          <p className="mt-3 font-sans text-xs text-rose-deep" role="alert">
            {signOut.error.message}
          </p>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
