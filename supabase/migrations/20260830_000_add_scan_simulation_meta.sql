-- Persists the coverage explanation generated with a skin simulation
-- (routine_conditioned, concerns_simulated, concerns_uncovered,
-- coverage_reasoning) so the chips survive a page reload instead of only
-- showing right after a fresh generation.
alter table public.scans
  add column simulation_meta jsonb;
