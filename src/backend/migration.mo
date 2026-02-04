import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Array "mo:core/Array";

module {
  // Old types with weight as single set weight
  type OldWorkoutProgress = {
    date : Text;
    exercises : [OldExercise];
    comments : Text;
  };

  type OldExercise = {
    name : Text;
    sets : Nat;
    repetitions : Nat;
    weight : Nat;
  };

  type OldExercisePerformance = {
    date : Text;
    exercise : OldExercise;
  };

  type OldWorkout = {
    name : Text;
    exercises : [OldExercise];
    comments : Text;
    creator : Text;
    clientUsername : Text;
  };

  type OldBodyWeightEntry = {
    date : Text;
    weight : Nat;
  };

  type OldClient = {
    username : Text;
    codicePT : Text;
    emailOrNickname : ?Text;
    progressData : [OldWorkoutProgress];
    principal : ?Principal.Principal;
    bodyWeightHistory : [OldBodyWeightEntry];
    exercisePerformanceHistory : [OldExercisePerformance];
    trainerCode : Text;
    height : ?Nat;
  };

  type OldClientProfile = {
    username : Text;
    emailOrNickname : ?Text;
  };

  type OldUserProfile = {
    username : Text;
    role : Text;
    codicePT : ?Text;
    emailOrNickname : ?Text;
  };

  type OldExerciseLog = {
    name : Text;
    sets : Nat;
    repetitions : Nat;
    weight : Nat;
    actualSets : Nat;
    actualRepetitions : Nat;
    actualWeight : Nat;
  };

  type OldWorkoutLog = {
    workoutName : Text;
    clientUsername : Text;
    exercises : [OldExerciseLog];
    comments : Text;
    completed : Bool;
    date : Text;
    clientNotes : ?Text;
  };

  // New types with set-weight arrays
  type NewWorkoutProgress = {
    date : Text;
    exercises : [NewExercise];
    comments : Text;
  };

  type NewExercise = {
    name : Text;
    sets : Nat;
    repetitions : Nat;
    setWeights : [Nat];
  };

  type NewExercisePerformance = {
    date : Text;
    exercise : NewExercise;
  };

  type NewWorkout = {
    name : Text;
    exercises : [NewExercise];
    comments : Text;
    creator : Text;
    clientUsername : Text;
  };

  type NewBodyWeightEntry = {
    date : Text;
    weight : Nat;
  };

  type NewClient = {
    username : Text;
    codicePT : Text;
    emailOrNickname : ?Text;
    progressData : [NewWorkoutProgress];
    principal : ?Principal.Principal;
    bodyWeightHistory : [NewBodyWeightEntry];
    exercisePerformanceHistory : [NewExercisePerformance];
    trainerCode : Text;
    height : ?Nat;
  };

  type NewClientProfile = {
    username : Text;
    emailOrNickname : ?Text;
  };

  type NewUserProfile = {
    username : Text;
    role : Text;
    codicePT : ?Text;
    emailOrNickname : ?Text;
  };

  type NewExerciseLog = {
    name : Text;
    sets : Nat;
    repetitions : Nat;
    setWeights : [Nat];
    actualSets : Nat;
    actualRepetitions : Nat;
    actualSetWeights : [Nat];
  };

  type NewWorkoutLog = {
    workoutName : Text;
    clientUsername : Text;
    exercises : [NewExerciseLog];
    comments : Text;
    completed : Bool;
    date : Text;
    clientNotes : ?Text;
  };

  type OldActor = {
    clients : Map.Map<Text, OldClient>;
    userProfiles : Map.Map<Principal.Principal, OldUserProfile>;
    principalToUsername : Map.Map<Principal.Principal, Text>;
    trainerTokens : Map.Map<Principal.Principal, Bool>;
    trainerCodes : Map.Map<Principal.Principal, Nat>;
    workouts : Map.Map<Text, OldWorkout>;
    workoutLogs : Map.Map<Text, OldWorkoutLog>;
    correctTrainerPassword : Text;
  };

  type NewActor = {
    clients : Map.Map<Text, NewClient>;
    userProfiles : Map.Map<Principal.Principal, NewUserProfile>;
    principalToUsername : Map.Map<Principal.Principal, Text>;
    trainerTokens : Map.Map<Principal.Principal, Bool>;
    trainerCodes : Map.Map<Principal.Principal, Nat>;
    workouts : Map.Map<Text, NewWorkout>;
    workoutLogs : Map.Map<Text, NewWorkoutLog>;
    correctTrainerPassword : Text;
  };

  // Migration function called by the main actor via the with-clause
  public func run(old : OldActor) : NewActor {
    // Transform OldExercise to NewExercise
    let transformExercise = func(oldEx : OldExercise) : NewExercise {
      {
        oldEx with
        setWeights = Array.tabulate<Nat>(oldEx.sets, func(_) { oldEx.weight });
      };
    };

    // Transform OldExerciseLog to NewExerciseLog
    let transformExerciseLog = func(oldLog : OldExerciseLog) : NewExerciseLog {
      {
        name = oldLog.name;
        sets = oldLog.sets;
        repetitions = oldLog.repetitions;
        setWeights = Array.tabulate<Nat>(oldLog.sets, func(_) { oldLog.weight });
        actualSets = oldLog.actualSets;
        actualRepetitions = oldLog.actualRepetitions;
        actualSetWeights = Array.tabulate<Nat>(oldLog.actualSets, func(_) { oldLog.actualWeight });
      };
    };

    // Transform OldWorkout (contains [OldExercise] to NewWorkout ([NewExercise])
    let transformWorkout = func(oldWorkout : OldWorkout) : NewWorkout {
      {
        oldWorkout with
        exercises = oldWorkout.exercises.map<OldExercise, NewExercise>(transformExercise);
      };
    };

    // Transform OldWorkoutLog (contains [OldExerciseLog] to NewWorkoutLog ([NewExerciseLog])
    let transformWorkoutLog = func(oldLog : OldWorkoutLog) : NewWorkoutLog {
      {
        oldLog with
        exercises = oldLog.exercises.map<OldExerciseLog, NewExerciseLog>(transformExerciseLog);
      };
    };

    // Transform clients data
    let newClients = old.clients.map<Text, OldClient, NewClient>(
      func(_id, oldClient) {
        {
          oldClient with
          progressData = oldClient.progressData.map<OldWorkoutProgress, NewWorkoutProgress>(
            func(oldProgress) {
              {
                oldProgress with
                exercises = oldProgress.exercises.map<OldExercise, NewExercise>(transformExercise);
              };
            }
          );
          exercisePerformanceHistory = oldClient.exercisePerformanceHistory.map<OldExercisePerformance, NewExercisePerformance>(
            func(oldPerf) {
              {
                oldPerf with
                exercise = transformExercise(oldPerf.exercise);
              };
            }
          );
        };
      }
    );

    // Transform workouts data
    let newWorkouts = old.workouts.map<Text, OldWorkout, NewWorkout>(
      func(_id, oldWorkout) { transformWorkout(oldWorkout) }
    );

    // Transform workout logs data
    let newWorkoutLogs = old.workoutLogs.map<Text, OldWorkoutLog, NewWorkoutLog>(
      func(_id, oldLog) { transformWorkoutLog(oldLog) }
    );

    {
      old with
      clients = newClients;
      workouts = newWorkouts;
      workoutLogs = newWorkoutLogs;
    };
  };
};
