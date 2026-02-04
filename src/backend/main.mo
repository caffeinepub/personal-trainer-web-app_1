import Runtime "mo:core/Runtime";
import Array "mo:core/Array";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Migration "migration";

// Apply migration
(with migration = Migration.run)
actor {
  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Types
  type WorkoutProgress = {
    date : Text;
    exercises : [Exercise];
    comments : Text;
  };

  type Exercise = {
    name : Text;
    sets : Nat;
    repetitions : Nat;
    setWeights : [Nat]; // Set-weights - array in kg per set
  };

  // Exercise performance (per exercise, per workout/measurement)
  type ExercisePerformance = {
    date : Text;
    exercise : Exercise;
  };

  type Workout = {
    name : Text;
    exercises : [Exercise];
    comments : Text;
    creator : Text; // Trainer username
    clientUsername : Text;
  };

  // Bodyweight entry with date
  type BodyWeightEntry = {
    date : Text;
    weight : Nat;
  };

  type Client = {
    username : Text;
    codicePT : Text;
    emailOrNickname : ?Text;
    progressData : [WorkoutProgress]; // Retain
    principal : ?Principal;
    bodyWeightHistory : [BodyWeightEntry];
    exercisePerformanceHistory : [ExercisePerformance];
    trainerCode : Text; // To link client to trainer's PT code
    height : ?Nat;
  };

  type ClientProfile = {
    username : Text;
    emailOrNickname : ?Text;
  };

  public type UserProfile = {
    username : Text;
    role : Text; // "trainer" or "client"
    codicePT : ?Text;
    emailOrNickname : ?Text;
  };

  public type ExerciseLog = {
    name : Text;
    sets : Nat;
    repetitions : Nat;
    setWeights : [Nat]; // Set-weights - array in kg per set
    actualSets : Nat;
    actualRepetitions : Nat;
    actualSetWeights : [Nat]; // Actual set weights used
  };

  public type WorkoutLog = {
    workoutName : Text;
    clientUsername : Text;
    exercises : [ExerciseLog];
    comments : Text;
    completed : Bool;
    date : Text;
    clientNotes : ?Text;
  };

  let clients = Map.empty<Text, Client>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let principalToUsername = Map.empty<Principal, Text>();
  let trainerTokens = Map.empty<Principal, Bool>();
  let trainerCodes = Map.empty<Principal, Nat>();
  let workouts = Map.empty<Text, Workout>();
  let workoutLogs = Map.empty<Text, WorkoutLog>();

  let correctTrainerPassword = "12345";

  // Utility functions
  func isTrainerPasswordCorrect(password : Text) : Bool {
    password == correctTrainerPassword;
  };

  func isTrainer(caller : Principal) : Bool {
    trainerTokens.containsKey(caller);
  };

  func getTrainerCodeForCaller(caller : Principal) : ?Nat {
    trainerCodes.get(caller);
  };

  func isClientOwnedByTrainer(client : Client, trainerCode : Nat) : Bool {
    client.trainerCode == trainerCode.toText();
  };

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view profiles");
    };
    
    if (caller != user and not isTrainer(caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    
    // If trainer is viewing a client profile, verify the client belongs to them
    if (caller != user and isTrainer(caller)) {
      let trainerCode = switch (trainerCodes.get(caller)) {
        case (?code) { code };
        case (null) {
          Runtime.trap("No PT code for this trainer.");
        };
      };
      
      // Get the username for the user principal
      switch (principalToUsername.get(user)) {
        case (?username) {
          switch (clients.get(username)) {
            case (?client) {
              if (not isClientOwnedByTrainer(client, trainerCode)) {
                Runtime.trap("Unauthorized: You can only view your own clients' profiles");
              };
            };
            case (null) { /* User is not a client, allow trainer to view */ };
          };
        };
        case (null) { /* User has no username mapping, allow */ };
      };
    };
    
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Trainer Code Management
  func generateUnique5DigitCode() : Nat {
    let randomNat64 : Nat64 = 12345;
    let randomNat : Nat = Nat64.toNat(randomNat64);
    10000 + (randomNat % 90000);
  };

  public shared ({ caller }) func authenticateTrainer(password : Text) : async Nat {
    if (not isTrainerPasswordCorrect(password)) {
      Runtime.trap("La password inserita non è corretta!");
    };
    
    // Add caller to trainerTokens
    trainerTokens.add(caller, true);
    
    // Assign user role via AccessControl
    AccessControl.assignRole(accessControlState, caller, caller, #user);

    // Save trainer profile
    let trainerProfile : UserProfile = {
      username = "Trainer";
      role = "trainer";
      codicePT = null;
      emailOrNickname = null;
    };
    userProfiles.add(caller, trainerProfile);

    // Assign or retrieve unique PT code
    let ptCode = switch (trainerCodes.get(caller)) {
      case (?code) { code };
      case (null) {
        let newCode = generateUnique5DigitCode();
        trainerCodes.add(caller, newCode);
        newCode;
      };
    };
    ptCode;
  };

  public query ({ caller }) func getTrainerPtCode() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can fetch PT code");
    };
    
    if (not isTrainer(caller)) {
      Runtime.trap("Unauthorized: Only valid trainers can fetch PT code");
    };
    
    switch (trainerCodes.get(caller)) {
      case (?code) {
        code;
      };
      case (null) {
        Runtime.trap("No PT code found. Please authenticate first.");
      };
    };
  };

  // Client Registration - No authentication required for registration
  public shared ({ caller }) func registerClient(
    username : Text,
    codicePT : Text,
    emailOrNickname : ?Text,
    trainerCode : Nat,
  ) : async () {
    if (clients.containsKey(username)) {
      Runtime.trap("Nome utente già esistente. Scegli un altro nome.");
    };

    if (username.size() < 4 or username.size() > 20) {
      Runtime.trap("Il nome utente deve essere tra 4 e 20 caratteri");
    };

    // Validate trainer code is 5 digits
    if (trainerCode < 10000 or trainerCode >= 100000) {
      Runtime.trap("Codice trainer non valido.");
    };

    // Find trainer with this code
    let associatedTrainer = trainerCodes.entries().find(func(entry) { entry.1 == trainerCode });
    switch (associatedTrainer) {
      case (null) {
        Runtime.trap("Questo PT non esiste.");
      };
      case (?trainerEntry) {
        let newClient : Client = {
          username;
          codicePT;
          emailOrNickname;
          progressData = [];
          bodyWeightHistory = [];
          exercisePerformanceHistory = [];
          principal = null;
          trainerCode = trainerCode.toText();
          height = null;
        };
        clients.add(username, newClient);
      };
    };
  };

  // Client Authentication
  public shared ({ caller }) func authenticateClient(username : Text, codicePT : Text) : async () {
    switch (clients.get(username)) {
      case (null) {
        Runtime.trap("Utente non trovato. Controlla il nome utente o registrati.");
      };
      case (?client) {
        if (client.codicePT != codicePT) {
          Runtime.trap("Codice PT non valido. Ricontrolla i dati inseriti.");
        };

        // Link principal to username
        principalToUsername.add(caller, username);
        
        // Assign user role via AccessControl
        AccessControl.assignRole(accessControlState, caller, caller, #user);

        // Update client with principal
        let updatedClient = {
          client with
          principal = ?caller;
        };
        clients.add(username, updatedClient);

        // Save client profile
        let clientProfile : UserProfile = {
          username = username;
          role = "client";
          codicePT = ?codicePT;
          emailOrNickname = client.emailOrNickname;
        };
        userProfiles.add(caller, clientProfile);
      };
    };
  };

  // Trainer-facing Client Management
  public query ({ caller }) func getClientsForTrainer() : async [ClientProfile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can fetch clients list");
    };
    
    if (not isTrainer(caller)) {
      Runtime.trap("Unauthorized: Only trainers can fetch clients list");
    };
    
    let trainerCode = switch (trainerCodes.get(caller)) {
      case (?code) { code };
      case (null) {
        Runtime.trap("No PT code for this trainer.");
      };
    };

    let trainerClients = clients.values().toArray().filter(
      func(client) { client.trainerCode == trainerCode.toText() }
    );

    // Map to ClientProfile to avoid exposing codicePT
    trainerClients.map<Client, ClientProfile>(
      func(client) {
        {
          username = client.username;
          emailOrNickname = client.emailOrNickname;
        };
      }
    );
  };

  public query ({ caller }) func getClientProfile(username : Text) : async ClientProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can fetch client profiles");
    };
    
    if (not isTrainer(caller)) {
      Runtime.trap("Unauthorized: Only trainers can fetch client profiles");
    };

    let trainerCode = switch (trainerCodes.get(caller)) {
      case (?code) { code };
      case (null) {
        Runtime.trap("No PT code for this trainer.");
      };
    };

    switch (clients.get(username)) {
      case (null) {
        Runtime.trap("Utente non trovato.");
      };
      case (?client) {
        if (not isClientOwnedByTrainer(client, trainerCode)) {
          Runtime.trap("Unauthorized: You can only view your own clients");
        };
        {
          username = client.username;
          emailOrNickname = client.emailOrNickname;
        };
      };
    };
  };

  public shared ({ caller }) func updateClientEmail(username : Text, newEmail : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update client emails");
    };
    
    if (not isTrainer(caller)) {
      Runtime.trap("Unauthorized: Only trainers can update client emails");
    };

    let trainerCode = switch (trainerCodes.get(caller)) {
      case (?code) { code };
      case (null) {
        Runtime.trap("No PT code for this trainer.");
      };
    };

    switch (clients.get(username)) {
      case (null) {
        Runtime.trap("Utente non trovato. Impossibile aggiornare l'email.");
      };
      case (?client) {
        if (not isClientOwnedByTrainer(client, trainerCode)) {
          Runtime.trap("Unauthorized: You can only update your own clients");
        };

        let updatedClient = {
          client with
          emailOrNickname = ?newEmail;
        };
        clients.add(username, updatedClient);

        // Update UserProfile if client has a principal
        switch (client.principal) {
          case (?clientPrincipal) {
            switch (userProfiles.get(clientPrincipal)) {
              case (?profile) {
                let updatedProfile = {
                  profile with
                  emailOrNickname = ?newEmail;
                };
                userProfiles.add(clientPrincipal, updatedProfile);
              };
              case (null) { /* No profile to update */ };
            };
          };
          case (null) { /* Client not linked to principal yet */ };
        };
      };
    };
  };

  // Progress and Info Management
  public shared ({ caller }) func addWorkoutProgress(
    username : Text,
    progress : WorkoutProgress,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can add progress");
    };
    
    let hasTrainerToken = trainerTokens.containsKey(caller);
    let callerUsername = principalToUsername.get(caller);

    if (not hasTrainerToken) {
      switch (callerUsername) {
        case (null) {
          Runtime.trap("Unauthorized: You must be authenticated to add progress");
        };
        case (?uname) {
          if (uname != username) {
            Runtime.trap("Unauthorized: You can only update your own progress");
          };
        };
      };
    } else {
      let trainerCode = switch (trainerCodes.get(caller)) {
        case (?code) { code };
        case (null) {
          Runtime.trap("No PT code for this trainer.");
        };
      };

      switch (clients.get(username)) {
        case (null) {
          Runtime.trap("Utente non trovato.");
        };
        case (?client) {
          if (not isClientOwnedByTrainer(client, trainerCode)) {
            Runtime.trap("Unauthorized: You can only add progress for your own clients");
          };
        };
      };
    };

    switch (clients.get(username)) {
      case (null) {
        Runtime.trap("Utente non trovato. Impossibile aggiornare i progressi.");
      };
      case (?client) {
        let updatedClient = {
          client with
          progressData = client.progressData.concat([progress]);
        };
        clients.add(username, updatedClient);
      };
    };
  };

  public query ({ caller }) func getClientProgress(username : Text) : async [WorkoutProgress] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view progress");
    };
    
    let hasTrainerToken = trainerTokens.containsKey(caller);
    let callerUsername = principalToUsername.get(caller);

    if (not hasTrainerToken) {
      switch (callerUsername) {
        case (null) {
          Runtime.trap("Unauthorized: You must be authenticated to view progress");
        };
        case (?uname) {
          if (uname != username) {
            Runtime.trap("Unauthorized: You can only view your own progress");
          };
        };
      };
    } else {
      // Trainer is viewing progress - verify client belongs to trainer
      let trainerCode = switch (trainerCodes.get(caller)) {
        case (?code) { code };
        case (null) {
          Runtime.trap("No PT code for this trainer.");
        };
      };

      switch (clients.get(username)) {
        case (null) {
          Runtime.trap("Utente non trovato.");
        };
        case (?client) {
          if (not isClientOwnedByTrainer(client, trainerCode)) {
            Runtime.trap("Unauthorized: You can only view progress for your own clients");
          };
        };
      };
    };

    switch (clients.get(username)) {
      case (null) {
        Runtime.trap("Utente non trovato. Impossibile recuperare i progressi.");
      };
      case (?client) {
        client.progressData;
      };
    };
  };

  public query ({ caller }) func getClientInfo(username : Text) : async (Text, Text, ?Text) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view client info");
    };
    
    let hasTrainerToken = trainerTokens.containsKey(caller);
    let callerUsername = principalToUsername.get(caller);

    if (not hasTrainerToken) {
      switch (callerUsername) {
        case (null) {
          Runtime.trap("Unauthorized: You must be authenticated to view client info");
        };
        case (?uname) {
          if (uname != username) {
            Runtime.trap("Unauthorized: You can only view your own information");
          };
        };
      };
    } else {
      // Trainer is viewing info - verify client belongs to trainer
      let trainerCode = switch (trainerCodes.get(caller)) {
        case (?code) { code };
        case (null) {
          Runtime.trap("No PT code for this trainer.");
        };
      };

      switch (clients.get(username)) {
        case (null) {
          Runtime.trap("Utente non trovato.");
        };
        case (?client) {
          if (not isClientOwnedByTrainer(client, trainerCode)) {
            Runtime.trap("Unauthorized: You can only view your own clients");
          };
        };
      };
    };

    switch (clients.get(username)) {
      case (null) {
        Runtime.trap("Utente non trovato. Impossibile recuperare le informazioni.");
      };
      case (?client) {
        (client.username, client.codicePT, client.emailOrNickname);
      };
    };
  };

  // New Endpoints for Bodyweight, Height, Exercise Performance, Workouts
  public shared ({ caller }) func setClientHeight(username : Text, height : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update height");
    };
    
    // Permission check: trainer or self
    let hasTrainerToken = trainerTokens.containsKey(caller);
    let callerUsername = principalToUsername.get(caller);

    if (not hasTrainerToken) {
      switch (callerUsername) {
        case (null) {
          Runtime.trap("Unauthorized: You must be authenticated to update height");
        };
        case (?uname) {
          if (uname != username) {
            Runtime.trap("Unauthorized: You can only update your own height");
          };
        };
      };
    } else {
      let trainerCode = switch (trainerCodes.get(caller)) {
        case (?code) { code };
        case (null) { Runtime.trap("No PT code for this trainer.") };
      };

      switch (clients.get(username)) {
        case (null) { Runtime.trap("Utente non trovato.") };
        case (?client) {
          if (not isClientOwnedByTrainer(client, trainerCode)) {
            Runtime.trap("Unauthorized: You can only update your own clients");
          };
        };
      };
    };

    switch (clients.get(username)) {
      case (null) {
        Runtime.trap("Utente non trovato.");
      };
      case (?client) {
        let updatedClient = { client with height = ?height };
        clients.add(username, updatedClient);
      };
    };
  };

  public shared ({ caller }) func addBodyWeightEntry(
    username : Text,
    weight : Nat,
    date : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update weight");
    };
    
    // Permission check: trainer or self
    let hasTrainerToken = trainerTokens.containsKey(caller);
    let callerUsername = principalToUsername.get(caller);

    if (not hasTrainerToken) {
      switch (callerUsername) {
        case (null) {
          Runtime.trap("Unauthorized: You must be authenticated to update weight");
        };
        case (?uname) {
          if (uname != username) {
            Runtime.trap("Unauthorized: You can only update your own weight");
          };
        };
      };
    } else {
      let trainerCode = switch (trainerCodes.get(caller)) {
        case (?code) { code };
        case (null) { Runtime.trap("No PT code for this trainer."); };
      };

      switch (clients.get(username)) {
        case (null) { Runtime.trap("Utente non trovato.") };
        case (?client) {
          if (not isClientOwnedByTrainer(client, trainerCode)) {
            Runtime.trap("Unauthorized: You can only update your own clients");
          };
        };
      };
    };

    switch (clients.get(username)) {
      case (null) {
        Runtime.trap("Utente non trovato.");
      };
      case (?client) {
        let newEntry : BodyWeightEntry = {
          date;
          weight;
        };
        let updatedClient = {
          client with
          bodyWeightHistory = client.bodyWeightHistory.concat([newEntry]);
        };
        clients.add(username, updatedClient);
      };
    };
  };

  public query ({ caller }) func getBodyWeightHistory(username : Text) : async [BodyWeightEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view weight history");
    };
    
    // Permission check: trainer or self
    let hasTrainerToken = trainerTokens.containsKey(caller);
    let callerUsername = principalToUsername.get(caller);

    if (not hasTrainerToken) {
      switch (callerUsername) {
        case (null) {
          Runtime.trap("Unauthorized: You must be authenticated to view weight history");
        };
        case (?uname) {
          if (uname != username) {
            Runtime.trap("Unauthorized: You can only view your own weight history");
          };
        };
      };
    } else {
      // Trainer is viewing - verify client belongs to trainer
      let trainerCode = switch (trainerCodes.get(caller)) {
        case (?code) { code };
        case (null) {
          Runtime.trap("No PT code for this trainer.");
        };
      };

      switch (clients.get(username)) {
        case (null) {
          Runtime.trap("Utente non trovato.");
        };
        case (?client) {
          if (not isClientOwnedByTrainer(client, trainerCode)) {
            Runtime.trap("Unauthorized: You can only view your own clients");
          };
        };
      };
    };

    switch (clients.get(username)) {
      case (null) { [] };
      case (?client) { client.bodyWeightHistory };
    };
  };

  public shared ({ caller }) func addExercisePerformance(
    username : Text,
    exercise : Exercise,
    date : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can add performance data");
    };
    
    // Permission check: trainer or self
    let hasTrainerToken = trainerTokens.containsKey(caller);
    let callerUsername = principalToUsername.get(caller);

    if (not hasTrainerToken) {
      switch (callerUsername) {
        case (null) {
          Runtime.trap("Unauthorized: You must be authenticated to add performance data");
        };
        case (?uname) {
          if (uname != username) {
            Runtime.trap("Unauthorized: You can only update your own data");
          };
        };
      };
    } else {
      let trainerCode = switch (trainerCodes.get(caller)) {
        case (?code) { code };
        case (null) { Runtime.trap("No PT code for this trainer."); };
      };

      switch (clients.get(username)) {
        case (null) { Runtime.trap("Utente non trovato."); };
        case (?client) {
          if (not isClientOwnedByTrainer(client, trainerCode)) {
            Runtime.trap("Unauthorized: You can only update your own clients");
          };
        };
      };
    };

    switch (clients.get(username)) {
      case (null) {
        Runtime.trap("Utente non trovato.");
      };
      case (?client) {
        let newPerformance : ExercisePerformance = {
          date;
          exercise;
        };
        let updatedClient = {
          client with
          exercisePerformanceHistory = client.exercisePerformanceHistory.concat([newPerformance]);
        };
        clients.add(username, updatedClient);
      };
    };
  };

  public query ({ caller }) func getExercisePerformanceHistory(
    username : Text,
  ) : async [ExercisePerformance] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view performance history");
    };
    
    // Permission check: trainer or self
    let hasTrainerToken = trainerTokens.containsKey(caller);
    let callerUsername = principalToUsername.get(caller);

    if (not hasTrainerToken) {
      switch (callerUsername) {
        case (null) {
          Runtime.trap("Unauthorized: You must be authenticated to view performance history");
        };
        case (?uname) {
          if (uname != username) {
            Runtime.trap("Unauthorized: You can only view your own performance history");
          };
        };
      };
    } else {
      // Trainer is viewing - verify client belongs to trainer
      let trainerCode = switch (trainerCodes.get(caller)) {
        case (?code) { code };
        case (null) {
          Runtime.trap("No PT code for this trainer.");
        };
      };

      switch (clients.get(username)) {
        case (null) {
          Runtime.trap("Utente non trovato.");
        };
        case (?client) {
          if (not isClientOwnedByTrainer(client, trainerCode)) {
            Runtime.trap("Unauthorized: You can only view your own clients");
          };
        };
      };
    };

    switch (clients.get(username)) {
      case (null) { [] };
      case (?client) { client.exercisePerformanceHistory };
    };
  };

  public shared ({ caller }) func createWorkout(
    clientUsername : Text,
    name : Text,
    exercises : [Exercise],
    comments : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can create workouts");
    };
    
    // Only trainers can create workouts
    if (not isTrainer(caller)) {
      Runtime.trap("Unauthorized: Only trainers can create workouts");
    };

    let trainerCode = switch (trainerCodes.get(caller)) {
      case (?code) { code };
      case (null) {
        Runtime.trap("No PT code for this trainer.");
      };
    };

    // Verify the client belongs to this trainer
    switch (clients.get(clientUsername)) {
      case (null) {
        Runtime.trap("Utente non trovato.");
      };
      case (?client) {
        if (not isClientOwnedByTrainer(client, trainerCode)) {
          Runtime.trap("Unauthorized: You can only create workouts for your own clients");
        };
      };
    };

    let newWorkout : Workout = {
      creator = clientUsername;
      clientUsername;
      name;
      exercises;
      comments;
    };

    workouts.add(name, newWorkout);
  };

  public query ({ caller }) func getWorkoutsForClient(clientUsername : Text) : async [Workout] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view workouts");
    };
    
    // Permission check: trainer or self
    let hasTrainerToken = trainerTokens.containsKey(caller);
    let callerUsername = principalToUsername.get(caller);

    if (not hasTrainerToken) {
      switch (callerUsername) {
        case (null) {
          Runtime.trap("Unauthorized: You must be authenticated to view workouts");
        };
        case (?uname) {
          if (uname != clientUsername) {
            Runtime.trap("Unauthorized: You can only view your own workouts");
          };
        };
      };
    } else {
      // Trainer is viewing - verify client belongs to trainer
      let trainerCode = switch (trainerCodes.get(caller)) {
        case (?code) { code };
        case (null) {
          Runtime.trap("No PT code for this trainer.");
        };
      };

      switch (clients.get(clientUsername)) {
        case (null) {
          Runtime.trap("Utente non trovato.");
        };
        case (?client) {
          if (not isClientOwnedByTrainer(client, trainerCode)) {
            Runtime.trap("Unauthorized: You can only view workouts for your own clients");
          };
        };
      };
    };

    workouts.values().toArray().filter(
      func(workout) { workout.clientUsername == clientUsername }
    );
  };

  public shared ({ caller }) func logWorkoutCompletion(
    log : WorkoutLog,
    workoutId : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can log workouts");
    };
    
    let hasTrainerToken = trainerTokens.containsKey(caller);
    let callerUsername = principalToUsername.get(caller);

    if (not hasTrainerToken) {
      // Client logging their own workout
      switch (callerUsername) {
        case (null) {
          Runtime.trap("Unauthorized: You must be authenticated to log a workout");
        };
        case (?uname) {
          if (uname != log.clientUsername) {
            Runtime.trap("Unauthorized: You can only log your own workouts");
          };
        };
      };
    } else {
      // Trainer logging a workout - verify client belongs to trainer
      let trainerCode = switch (trainerCodes.get(caller)) {
        case (?code) { code };
        case (null) {
          Runtime.trap("No PT code for this trainer.");
        };
      };

      switch (clients.get(log.clientUsername)) {
        case (null) {
          Runtime.trap("Utente non trovato.");
        };
        case (?client) {
          if (not isClientOwnedByTrainer(client, trainerCode)) {
            Runtime.trap("Unauthorized: You can only log workouts for your own clients");
          };
        };
      };
    };

    workoutLogs.add(workoutId, log);

    // Update exercise performance history for completed workouts
    let exercisePerformances = log.exercises.map(
      func(exerciseLog) {
        {
          date = log.date;
          exercise = {
            name = exerciseLog.name;
            sets = exerciseLog.actualSets;
            repetitions = exerciseLog.actualRepetitions;
            setWeights = exerciseLog.actualSetWeights;
          };
        };
      }
    );

    switch (clients.get(log.clientUsername)) {
      case (null) {
        Runtime.trap("Utente non trovato durante l'aggiornamento delle performance di allenamento.");
      };
      case (?client) {
        let updatedClient = {
          client with
          exercisePerformanceHistory = client.exercisePerformanceHistory.concat(exercisePerformances);
        };
        clients.add(log.clientUsername, updatedClient);
      };
    };
  };

  public query ({ caller }) func getWorkoutLogsForClient(username : Text) : async [WorkoutLog] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view workout logs");
    };
    
    let hasTrainerToken = trainerTokens.containsKey(caller);
    let callerUsername = principalToUsername.get(caller);

    if (not hasTrainerToken) {
      switch (callerUsername) {
        case (null) {
          Runtime.trap("Unauthorized: You must be authenticated to view workout logs");
        };
        case (?uname) {
          if (uname != username) {
            Runtime.trap("Unauthorized: You can only view your own workout logs");
          };
        };
      };
    } else {
      let trainerCode = switch (trainerCodes.get(caller)) {
        case (?code) { code };
        case (null) {
          Runtime.trap("No PT code for this trainer.");
        };
      };

      switch (clients.get(username)) {
        case (null) {
          Runtime.trap("Utente non trovato.");
        };
        case (?client) {
          if (not isClientOwnedByTrainer(client, trainerCode)) {
            Runtime.trap("Unauthorized: You can only view workout logs for your own clients");
          };
        };
      };
    };

    let logsArray = workoutLogs.values().toArray();
    logsArray.filter(func(log) { log.clientUsername == username });
  };
};
