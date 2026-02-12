import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type {
  ClientProfile,
  WorkoutProgress,
  BodyWeightEntry,
  ExercisePerformance,
  Exercise,
  Workout,
  WorkoutLog,
  Booking,
  BookingUpdate,
  Time,
} from '../backend';

// Trainer Authentication
export function useAuthenticateTrainer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (password: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.authenticateTrainer(password);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainerPtCode'] });
    },
    retry: 1,
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
    retry: 1,
  });
}

export function useUpdateTrainerCode() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ currentCode, newCode }: { currentCode: string; newCode: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateTrainerCode(currentCode, newCode);
    },
    retry: 1,
  });
}

// Client Management
export function useGetClientsForTrainer() {
  const { actor, isFetching } = useActor();

  return useQuery<ClientProfile[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getClientsForTrainer();
    },
    enabled: !!actor && !isFetching,
    retry: 1,
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
    retry: 1,
  });
}

export function useUpdateClientEmail() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ username, newEmail }: { username: string; newEmail: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateClientEmail(username, newEmail);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clientProfile', variables.username] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    retry: 1,
  });
}

// Client Registration/Authentication
export function useRegisterClient() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({
      username,
      codicePT,
      emailOrNickname,
      trainerCode,
    }: {
      username: string;
      codicePT: string;
      emailOrNickname: string | null;
      trainerCode: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.registerClient(username, codicePT, emailOrNickname, trainerCode);
    },
    retry: 1,
  });
}

export function useAuthenticateClient() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ username, codicePT }: { username: string; codicePT: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.authenticateClient(username, codicePT);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
    retry: 1,
  });
}

// Progress and Info
export function useGetClientProgress(username: string) {
  const { actor, isFetching } = useActor();

  return useQuery<WorkoutProgress[]>({
    queryKey: ['clientProgress', username],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getClientProgress(username);
    },
    enabled: !!actor && !isFetching && !!username,
    retry: 1,
  });
}

export function useAddWorkoutProgress() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ username, progress }: { username: string; progress: WorkoutProgress }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addWorkoutProgress(username, progress);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clientProgress', variables.username] });
    },
    retry: 1,
  });
}

// Bodyweight
export function useGetBodyWeightHistory(username: string) {
  const { actor, isFetching } = useActor();

  return useQuery<BodyWeightEntry[]>({
    queryKey: ['bodyWeightHistory', username],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getBodyWeightHistory(username);
    },
    enabled: !!actor && !isFetching && !!username,
    retry: 1,
  });
}

export function useAddBodyWeightEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ username, weight, date }: { username: string; weight: bigint; date: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addBodyWeightEntry(username, weight, date);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bodyWeightHistory', variables.username] });
    },
    retry: 1,
  });
}

export function useSetClientHeight() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ username, height }: { username: string; height: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setClientHeight(username, height);
    },
    retry: 1,
  });
}

// Exercise Performance
export function useGetExercisePerformanceHistory(username: string) {
  const { actor, isFetching } = useActor();

  return useQuery<ExercisePerformance[]>({
    queryKey: ['exercisePerformanceHistory', username],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getExercisePerformanceHistory(username);
    },
    enabled: !!actor && !isFetching && !!username,
    retry: 1,
  });
}

export function useAddExercisePerformance() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ username, exercise, date }: { username: string; exercise: Exercise; date: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addExercisePerformance(username, exercise, date);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['exercisePerformanceHistory', variables.username] });
    },
    retry: 1,
  });
}

// Workouts
export function useGetWorkoutsForClient(clientUsername: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Workout[]>({
    queryKey: ['workouts', clientUsername],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getWorkoutsForClient(clientUsername);
    },
    enabled: !!actor && !isFetching && !!clientUsername,
    retry: 1,
  });
}

export function useCreateClientWorkout() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clientUsername,
      name,
      exercises,
      comments,
    }: {
      clientUsername: string;
      name: string;
      exercises: Exercise[];
      comments: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createClientWorkout(clientUsername, name, exercises, comments);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workouts', variables.clientUsername] });
    },
    retry: 1,
  });
}

export function useCreateOwnWorkout() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      exercises,
      comments,
      clientUsername,
    }: {
      name: string;
      exercises: Exercise[];
      comments: string;
      clientUsername: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createOwnWorkout(name, exercises, comments);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workouts', variables.clientUsername] });
    },
    retry: 1,
  });
}

export function useUpdateWorkout() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workoutId,
      exercises,
      comments,
      clientUsername,
    }: {
      workoutId: string;
      exercises: Exercise[];
      comments: string;
      clientUsername: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateWorkout(workoutId, exercises, comments);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workouts', variables.clientUsername] });
    },
    retry: 1,
  });
}

// Workout Logs
export function useGetWorkoutLogsForClient(username: string) {
  const { actor, isFetching } = useActor();

  return useQuery<WorkoutLog[]>({
    queryKey: ['workoutLogs', username],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getWorkoutLogsForClient(username);
    },
    enabled: !!actor && !isFetching && !!username,
    retry: 1,
  });
}

export function useLogWorkoutCompletion() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ log, workoutId }: { log: WorkoutLog; workoutId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.logWorkoutCompletion(log, workoutId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workoutLogs', variables.log.clientUsername] });
      queryClient.invalidateQueries({ queryKey: ['exercisePerformanceHistory', variables.log.clientUsername] });
    },
    retry: 1,
  });
}

// Bookings
export function useGetBookingsByDateRange(startTime: Time, endTime: Time) {
  const { actor, isFetching } = useActor();

  return useQuery<Booking[]>({
    queryKey: ['bookings', startTime.toString(), endTime.toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getBookingsByDateRange(startTime, endTime);
    },
    enabled: !!actor && !isFetching,
    retry: 1,
  });
}

export function useCreateBooking() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (booking: BookingUpdate) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createBooking(booking);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    retry: 1,
  });
}

export function useUpdateBooking() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, updatedBooking }: { bookingId: bigint; updatedBooking: BookingUpdate }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateBooking(bookingId, updatedBooking);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    retry: 1,
  });
}

export function useDeleteBooking() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteBooking(bookingId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    retry: 1,
  });
}

// Client Appointments
export function useRequestAppointment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clientName,
      clientEmail,
      dateTime,
      durationMinutes,
      notes,
    }: {
      clientName: string;
      clientEmail: string;
      dateTime: Time;
      durationMinutes: bigint;
      notes: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.requestAppointment(clientName, clientEmail, dateTime, durationMinutes, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['confirmedAppointments'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    retry: 1,
  });
}

export function useGetConfirmedAppointmentsForClient() {
  const { actor, isFetching } = useActor();

  return useQuery<Booking[]>({
    queryKey: ['confirmedAppointments'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getConfirmedAppointmentsForClient();
    },
    enabled: !!actor && !isFetching,
    retry: 1,
  });
}
