-- handle_new_user is meant to fire only from the on_auth_user_created
-- trigger, not as a PostgREST RPC. Revoke execute from anon/authenticated
-- so the function isn't reachable at /rest/v1/rpc/handle_new_user.

revoke execute on function public.handle_new_user() from public, anon, authenticated;
