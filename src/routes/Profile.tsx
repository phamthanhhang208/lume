import { useAuth } from "@/features/auth/api/useAuth";
import { useSignOutMutation } from "@/features/auth/api/useSignOutMutation";

export default function Profile() {
  const { user } = useAuth();
  const signOut = useSignOutMutation();

  return (
    <main>
      <h1>profile</h1>
      <p>signed in as {user?.email}</p>
      <button onClick={() => signOut.mutate()} disabled={signOut.isPending}>
        {signOut.isPending ? "signing out..." : "sign out"}
      </button>
      {signOut.error && <p role="alert">error: {signOut.error.message}</p>}
    </main>
  );
}
