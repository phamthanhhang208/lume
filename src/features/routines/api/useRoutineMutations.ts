// CRUD mutations for routines, kept in one file — each is a thin Supabase
// call plus a list invalidation, not worth a file apiece.

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { routineKeys } from "@/features/routines/api/routineKeys";
import type { Routine } from "@/types/database";

function useInvalidateRoutines() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: routineKeys.all });
}

export function useCreateRoutineMutation() {
  const invalidate = useInvalidateRoutines();
  return useMutation({
    mutationFn: async (input: {
      userId: string;
      name: string;
    }): Promise<Routine> => {
      const { data, error } = await supabase
        .from("routines")
        .insert({ user_id: input.userId, name: input.name })
        .select("*")
        .single();
      if (error) throw error;
      return data as Routine;
    },
    onSuccess: (routine) => {
      invalidate();
      pendo.track("routine_created", { routine_name: routine.name });
    },
  });
}

export function useDeleteRoutineMutation() {
  const invalidate = useInvalidateRoutines();
  return useMutation({
    mutationFn: async (routineId: string): Promise<void> => {
      const { error } = await supabase
        .from("routines")
        .delete()
        .eq("id", routineId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      pendo.track("routine_deleted");
    },
  });
}

export function useSetActiveRoutineMutation() {
  const invalidate = useInvalidateRoutines();
  return useMutation({
    // Deactivate all first — a partial unique index enforces one active
    // routine per user, so the two updates must run in this order.
    mutationFn: async (input: {
      userId: string;
      routineId: string | null;
    }): Promise<void> => {
      const { error: clearErr } = await supabase
        .from("routines")
        .update({ is_active: false })
        .eq("user_id", input.userId)
        .eq("is_active", true);
      if (clearErr) throw clearErr;
      if (input.routineId) {
        const { error: setErr } = await supabase
          .from("routines")
          .update({ is_active: true })
          .eq("id", input.routineId);
        if (setErr) throw setErr;
      }
    },
    onSuccess: (_data, { routineId }) => {
      invalidate();
      if (routineId) {
        pendo.track("routine_set_active", { routine_id: routineId });
      }
    },
  });
}

export function useToggleRoutineProductMutation() {
  const invalidate = useInvalidateRoutines();
  return useMutation({
    mutationFn: async (input: {
      routineId: string;
      productId: string;
      inRoutine: boolean;
    }): Promise<void> => {
      if (input.inRoutine) {
        const { error } = await supabase
          .from("routine_products")
          .delete()
          .eq("routine_id", input.routineId)
          .eq("product_id", input.productId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("routine_products")
          .insert({ routine_id: input.routineId, product_id: input.productId });
        if (error) throw error;
      }
    },
    onSuccess: invalidate,
  });
}
