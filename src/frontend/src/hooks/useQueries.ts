import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { WorkoutProgress, ClientProfile, BodyWeightEntry, ExercisePerformance, Exercise, Workout, WorkoutLog } from '../backend';

export function useGetClientProgress(username: string) {
  const { actor, isFetching } = useActor();

  return useQuery<WorkoutProgress[]>({
    queryKey: ['clientProgress', username],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getClientProgress(username);
    },
    enabled: !!actor && !isFetching && !!username,
  });
}

export function useAddWorkoutProgress() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ username, progress }: { username: string; progress: WorkoutProgress }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.addWorkoutProgress(username, progress);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clientProgress', variables.username] });
    },
  });
}

export function useGetClientInfo(username: string) {
  const { actor, isFetching } = useActor();

  return useQuery<[string, string, string | null]>({
    queryKey: ['clientInfo', username],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getClientInfo(username);
    },
    enabled: !!actor && !isFetching && !!username,
  });
}

export function useGetTrainerPtCode() {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['trainerPtCode'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getTrainerPtCode();
    },
    enabled: !!actor && !isFetching,
    retry: false,
  });
}

export function useGetClientsForTrainer() {
  const { actor, isFetching } = useActor();

  return useQuery<ClientProfile[]>({
    queryKey: ['trainerClients'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getClientsForTrainer();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetClientProfile(username: string) {
  const { actor, isFetching } = useActor();

  return useQuery<ClientProfile>({
    queryKey: ['clientProfile', username],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getClientProfile(username);
    },
    enabled: !!actor && !isFetching && !!username,
  });
}

export function useUpdateClientEmail() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ username, newEmail }: { username: string; newEmail: string }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateClientEmail(username, newEmail);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clientProfile', variables.username] });
      queryClient.invalidateQueries({ queryKey: ['trainerClients'] });
    },
  });
}

// New hooks for bodyweight, height, exercise performance, and workouts

export function useSetClientHeight() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ username, height }: { username: string; height: number }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.setClientHeight(username, BigInt(height));
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clientHeight', variables.username] });
    },
  });
}

export function useAddBodyWeightEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ username, weight, date }: { username: string; weight: number; date: string }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.addBodyWeightEntry(username, BigInt(weight), date);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clientBodyweightHistory', variables.username] });
    },
  });
}

export function useGetBodyWeightHistory(username: string) {
  const { actor, isFetching } = useActor();

  return useQuery<BodyWeightEntry[]>({
    queryKey: ['clientBodyweightHistory', username],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getBodyWeightHistory(username);
    },
    enabled: !!actor && !isFetching && !!username,
  });
}

export function useAddExercisePerformance() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ username, exercise, date }: { username: string; exercise: Exercise; date: string }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.addExercisePerformance(username, exercise, date);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clientExercisePerformanceHistory', variables.username] });
    },
  });
}

export function useGetExercisePerformanceHistory(username: string) {
  const { actor, isFetching } = useActor();

  return useQuery<ExercisePerformance[]>({
    queryKey: ['clientExercisePerformanceHistory', username],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getExercisePerformanceHistory(username);
    },
    enabled: !!actor && !isFetching && !!username,
  });
}

export function useCreateWorkout() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clientUsername, name, exercises, comments }: { clientUsername: string; name: string; exercises: Exercise[]; comments: string }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.createWorkout(clientUsername, name, exercises, comments);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clientWorkouts', variables.clientUsername] });
    },
  });
}

export function useGetWorkoutsForClient(clientUsername: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Workout[]>({
    queryKey: ['clientWorkouts', clientUsername],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getWorkoutsForClient(clientUsername);
    },
    enabled: !!actor && !isFetching && !!clientUsername,
  });
}

export function useLogWorkoutCompletion() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ log, workoutId }: { log: WorkoutLog; workoutId: string }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.logWorkoutCompletion(log, workoutId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workoutLogs', variables.log.clientUsername] });
      queryClient.invalidateQueries({ queryKey: ['clientExercisePerformanceHistory', variables.log.clientUsername] });
    },
  });
}

export function useGetWorkoutLogsForClient(username: string) {
  const { actor, isFetching } = useActor();

  return useQuery<WorkoutLog[]>({
    queryKey: ['workoutLogs', username],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getWorkoutLogsForClient(username);
    },
    enabled: !!actor && !isFetching && !!username,
  });
}
