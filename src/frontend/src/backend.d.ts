import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface ExercisePerformance {
    date: string;
    exercise: Exercise;
}
export interface Exercise {
    name: string;
    sets: bigint;
    setWeights: Array<bigint>;
    repetitions: bigint;
}
export interface WorkoutLog {
    date: string;
    exercises: Array<ExerciseLog>;
    completed: boolean;
    clientNotes?: string;
    clientUsername: string;
    comments: string;
    workoutName: string;
}
export interface BodyWeightEntry {
    weight: bigint;
    date: string;
}
export interface ClientProfile {
    username: string;
    emailOrNickname?: string;
}
export interface Workout {
    creator: string;
    name: string;
    exercises: Array<Exercise>;
    clientUsername: string;
    comments: string;
}
export interface WorkoutProgress {
    date: string;
    exercises: Array<Exercise>;
    comments: string;
}
export interface UserProfile {
    username: string;
    role: string;
    emailOrNickname?: string;
    codicePT?: string;
}
export interface ExerciseLog {
    actualRepetitions: bigint;
    actualSetWeights: Array<bigint>;
    name: string;
    sets: bigint;
    actualSets: bigint;
    setWeights: Array<bigint>;
    repetitions: bigint;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addBodyWeightEntry(username: string, weight: bigint, date: string): Promise<void>;
    addExercisePerformance(username: string, exercise: Exercise, date: string): Promise<void>;
    addWorkoutProgress(username: string, progress: WorkoutProgress): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    authenticateClient(username: string, codicePT: string): Promise<void>;
    authenticateTrainer(password: string): Promise<bigint>;
    createWorkout(clientUsername: string, name: string, exercises: Array<Exercise>, comments: string): Promise<void>;
    getBodyWeightHistory(username: string): Promise<Array<BodyWeightEntry>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getClientInfo(username: string): Promise<[string, string, string | null]>;
    getClientProfile(username: string): Promise<ClientProfile>;
    getClientProgress(username: string): Promise<Array<WorkoutProgress>>;
    getClientsForTrainer(): Promise<Array<ClientProfile>>;
    getExercisePerformanceHistory(username: string): Promise<Array<ExercisePerformance>>;
    getTrainerPtCode(): Promise<bigint>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWorkoutLogsForClient(username: string): Promise<Array<WorkoutLog>>;
    getWorkoutsForClient(clientUsername: string): Promise<Array<Workout>>;
    isCallerAdmin(): Promise<boolean>;
    logWorkoutCompletion(log: WorkoutLog, workoutId: string): Promise<void>;
    registerClient(username: string, codicePT: string, emailOrNickname: string | null, trainerCode: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setClientHeight(username: string, height: bigint): Promise<void>;
    updateClientEmail(username: string, newEmail: string): Promise<void>;
}
