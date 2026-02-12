import Runtime "mo:core/Runtime";
import Array "mo:core/Array";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type WorkoutProgress = {
    date : Text;
    exercises : [Exercise];
    comments : Text;
  };

  public type Exercise = {
    name : Text;
    sets : Nat;
    repetitions : Nat;
    setWeights : [Nat];
    restTime : Nat;
  };

  type ExercisePerformance = {
    date : Text;
    exercise : Exercise;
  };

  public type Workout = {
    name : Text;
    exercises : [Exercise];
    comments : Text;
    creator : Text;
    clientUsername : Text;
  };

  public type BodyWeightEntry = {
    date : Text;
    weight : Nat;
  };

  public type Client = {
    username : Text;
    codicePT : Text;
    emailOrNickname : ?Text;
    progressData : [WorkoutProgress];
    principal : ?Principal;
    bodyWeightHistory : [BodyWeightEntry];
    exercisePerformanceHistory : [ExercisePerformance];
    trainerCode : Text;
    height : ?Nat;
  };

  public type ClientProfile = {
    username : Text;
    emailOrNickname : ?Text;
  };

  public type UserProfile = {
    username : Text;
    role : Text;
    codicePT : ?Text;
    emailOrNickname : ?Text;
  };

  public type ExerciseLog = {
    name : Text;
    sets : Nat;
    repetitions : Nat;
    setWeights : [Nat];
    actualSets : Nat;
    actualRepetitions : Nat;
    actualSetWeights : [Nat];
    restTime : Nat;
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

  public type Booking = {
    id : Nat;
    trainerPrincipal : Principal;
    clientName : Text;
    clientEmail : Text;
    dateTime : Time.Time;
    durationMinutes : Nat;
    notes : Text;
    isConfirmed : Bool;
  };

  public type BookingUpdate = {
    clientName : Text;
    clientEmail : Text;
    dateTime : Time.Time;
    durationMinutes : Nat;
    notes : Text;
    isConfirmed : Bool;
  };

  public type TrainerIdentity = {
    firstName : Text;
    lastName : Text;
    ptCode : Nat;
  };

  public type TrainerDetails = {
    firstName : Text;
    lastName : Text;
    ptCode : Nat;
  };

  let clients = Map.empty<Text, Client>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let principalToUsername = Map.empty<Principal, Text>();
  let trainerTokens = Map.empty<Principal, Bool>();
  let trainerCodes = Map.empty<Principal, Nat>();
  let workouts = Map.empty<Text, Workout>();
  let workoutLogs = Map.empty<Text, WorkoutLog>();
  let trainerIdentities = Map.empty<Principal, TrainerIdentity>();

  let bookings = Map.empty<Nat, Booking>();
  var nextBookingId = 1;

  var correctTrainerPassword : Text = "12345";
  var correctAdminPassword : Text = "9876";

  func isTrainerPasswordCorrect(password : Text) : Bool {
    password == correctTrainerPassword;
  };

  func isAdminPasswordCorrect(password : Text) : Bool {
    password == correctAdminPassword;
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

  func isAuthenticatedUser(caller : Principal) : Bool {
    trainerTokens.containsKey(caller) or principalToUsername.containsKey(caller) or AccessControl.isAdmin(accessControlState, caller);
  };

  public shared ({ caller }) func authenticateAdmin(password : Text) : async () {
    if (not isAdminPasswordCorrect(password)) {
      Runtime.trap("Wrong admin access code. Please verify your credentials.");
    };

    AccessControl.assignRole(accessControlState, caller, caller, #admin);

    let adminProfile : UserProfile = {
      username = "Admin";
      role = "admin";
      codicePT = null;
      emailOrNickname = null;
    };
    userProfiles.add(caller, adminProfile);
  };

  public type AdminTrainerOverview = {
    trainerPrincipal : Principal;
    ptCode : Nat;
    clients : [Client];
  };

  public query ({ caller }) func getAdminOverview() : async [AdminTrainerOverview] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admin access required to fetch overview");
    };

    trainerCodes.toArray().map(
      func(entry) {
        let trainerPrincipal = entry.0;
        let ptCode = entry.1;

        let clientsForTrainer = clients.values().toArray().filter(
          func(client) { client.trainerCode == ptCode.toText() }
        );

        {
          trainerPrincipal;
          ptCode;
          clients = clientsForTrainer;
        };
      }
    );
  };

  public query ({ caller }) func getAllTrainers() : async [TrainerDetails] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access trainer list");
    };

    trainerIdentities.toArray().map(
      func((principal, identity)) {
        {
          firstName = identity.firstName;
          lastName = identity.lastName;
          ptCode = identity.ptCode;
        };
      }
    );
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not isAuthenticatedUser(caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not isAuthenticatedUser(caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can view profiles");
    };

    if (caller != user and not isTrainer(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };

    if (caller != user and isTrainer(caller)) {
      let trainerCode = switch (trainerCodes.get(caller)) {
        case (?code) { code };
        case (null) {
          Runtime.trap("No PT code for this trainer.");
        };
      };

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
    if (not isAuthenticatedUser(caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func updateTrainerCode(currentCode : Text, newCode : Text) : async () {
    if (not isTrainer(caller)) {
      Runtime.trap("Unauthorized: Only authenticated trainers can update their code");
    };

    if (not Text.equal(currentCode, correctTrainerPassword)) {
      Runtime.trap("The current code is incorrect.");
    };

    if (newCode.size() < 5 or newCode.size() > 20) {
      Runtime.trap("The new code should be at least 5 characters long and should not exceed 20 characters.");
    };

    correctTrainerPassword := newCode;
  };

  func generateUnique5DigitCode() : Nat {
    let randomNat64 : Nat64 = 12345;
    let randomNat : Nat = Nat64.toNat(randomNat64);
    10000 + (randomNat % 90000);
  };

  public shared ({ caller }) func authenticateTrainer(password : Text) : async Nat {
    if (not isTrainerPasswordCorrect(password)) {
      Runtime.trap("Wrong access code. Please verify your credentials. ");
    };

    trainerTokens.add(caller, true);

    let trainerProfile : UserProfile = {
      username = "Trainer";
      role = "trainer";
      codicePT = null;
      emailOrNickname = null;
    };
    userProfiles.add(caller, trainerProfile);

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

  public shared ({ caller }) func registerTrainerIdentity(
    firstName : Text,
    lastName : Text,
  ) : async () {
    if (not isTrainer(caller)) {
      Runtime.trap("Unauthorized: Only authenticated trainers can register identity");
    };

    let ptCode = switch (trainerCodes.get(caller)) {
      case (?code) { code };
      case (null) {
        Runtime.trap("No PT code found. Please authenticate first.");
      };
    };

    switch (trainerIdentities.get(caller)) {
      case (?_) {
        Runtime.trap("Trainer identity already exists. Use updateTrainerIdentity to change it.");
      };
      case (null) {
        let identity : TrainerIdentity = {
          firstName;
          lastName;
          ptCode;
        };
        trainerIdentities.add(caller, identity);
      };
    };
  };

  public query ({ caller }) func getTrainerPtCode() : async Nat {
    if (not isTrainer(caller)) {
      Runtime.trap("Unauthorized: Only authenticated trainers can fetch PT code");
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

  public shared ({ caller }) func registerClient(
    username : Text,
    codicePT : Text,
    emailOrNickname : ?Text,
    trainerCode : Nat,
  ) : async () {
    if (clients.containsKey(username)) {
      Runtime.trap("Nome utente gia esistente. Scegli un altro nome.");
    };

    if (username.size() < 4 or username.size() > 20) {
      Runtime.trap("Il nome utente deve essere tra 4 e 20 caratteri");
    };

    if (trainerCode < 10000 or trainerCode >= 100000) {
      Runtime.trap("Codice trainer non valido.");
    };

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

  public shared ({ caller }) func authenticateClient(username : Text, codicePT : Text) : async () {
    switch (clients.get(username)) {
      case (null) {
        Runtime.trap("Utente non trovato. Controlla il nome utente o registrati.");
      };
      case (?client) {
        if (client.codicePT != codicePT) {
          Runtime.trap("Codice PT non valido. Ricontrolla i dati inseriti.");
        };

        principalToUsername.add(caller, username);

        let updatedClient = {
          client with
          principal = ?caller;
        };
        clients.add(username, updatedClient);

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

  public query ({ caller }) func getClientsForTrainer() : async [ClientProfile] {
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

  public shared ({ caller }) func addWorkoutProgress(
    username : Text,
    progress : WorkoutProgress,
  ) : async () {
    let hasTrainerToken = trainerTokens.containsKey(caller);
    let callerUsername = principalToUsername.get(caller);

    if (not hasTrainerToken and callerUsername == null) {
      Runtime.trap("Unauthorized: You must be authenticated to add progress");
    };

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
    let hasTrainerToken = trainerTokens.containsKey(caller);
    let callerUsername = principalToUsername.get(caller);

    if (not hasTrainerToken and callerUsername == null) {
      Runtime.trap("Unauthorized: You must be authenticated to view progress");
    };

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
    let hasTrainerToken = trainerTokens.containsKey(caller);
    let callerUsername = principalToUsername.get(caller);

    if (not hasTrainerToken and callerUsername == null) {
      Runtime.trap("Unauthorized: You must be authenticated to view client info");
    };

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

  public shared ({ caller }) func setClientHeight(username : Text, height : Nat) : async () {
    let hasTrainerToken = trainerTokens.containsKey(caller);
    let callerUsername = principalToUsername.get(caller);

    if (not hasTrainerToken and callerUsername == null) {
      Runtime.trap("Unauthorized: You must be authenticated to update height");
    };

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
    let hasTrainerToken = trainerTokens.containsKey(caller);
    let callerUsername = principalToUsername.get(caller);

    if (not hasTrainerToken and callerUsername == null) {
      Runtime.trap("Unauthorized: You must be authenticated to update weight");
    };

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
    let hasTrainerToken = trainerTokens.containsKey(caller);
    let callerUsername = principalToUsername.get(caller);

    if (not hasTrainerToken and callerUsername == null) {
      Runtime.trap("Unauthorized: You must be authenticated to view weight history");
    };

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
    let hasTrainerToken = trainerTokens.containsKey(caller);
    let callerUsername = principalToUsername.get(caller);

    if (not hasTrainerToken and callerUsername == null) {
      Runtime.trap("Unauthorized: You must be authenticated to add performance data");
    };

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
    let hasTrainerToken = trainerTokens.containsKey(caller);
    let callerUsername = principalToUsername.get(caller);

    if (not hasTrainerToken and callerUsername == null) {
      Runtime.trap("Unauthorized: You must be authenticated to view performance history");
    };

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

  public shared ({ caller }) func createClientWorkout(
    clientUsername : Text,
    name : Text,
    exercises : [Exercise],
    comments : Text,
  ) : async () {
    if (not isTrainer(caller)) {
      Runtime.trap("Unauthorized: Only trainers can create client workouts");
    };

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

    workouts.add(clientUsername.concat("_").concat(name), newWorkout);
  };

  public shared ({ caller }) func createOwnWorkout(
    name : Text,
    exercises : [Exercise],
    comments : Text,
  ) : async () {
    let callerUsername = switch (principalToUsername.get(caller)) {
      case (?username) { username };
      case (null) {
        Runtime.trap("Unauthorized: You must be authenticated as a client to create your own workout");
      };
    };

    let newWorkout : Workout = {
      creator = "";
      clientUsername = callerUsername;
      name;
      exercises;
      comments;
    };

    workouts.add(callerUsername.concat("_").concat(name), newWorkout);
  };

  public shared ({ caller }) func updateWorkout(
    workoutId : Text,
    exercises : [Exercise],
    comments : Text,
  ) : async () {
    switch (workouts.get(workoutId)) {
      case (null) {
        Runtime.trap("Workout non trovato.");
      };
      case (?existingWorkout) {
        let hasTrainerToken = trainerTokens.containsKey(caller);
        let callerUsername = principalToUsername.get(caller);

        var authorized = false;

        if (not hasTrainerToken) {
          switch (callerUsername) {
            case (?uname) {
              if (uname == existingWorkout.clientUsername) {
                authorized := true;
              };
            };
            case (null) { /* Not authenticated as client */ };
          };
        } else {
          let trainerCode = switch (trainerCodes.get(caller)) {
            case (?code) { code };
            case (null) {
              Runtime.trap("No PT code for this trainer.");
            };
          };

          switch (clients.get(existingWorkout.clientUsername)) {
            case (?client) {
              if (isClientOwnedByTrainer(client, trainerCode)) {
                authorized := true;
              };
            };
            case (null) { /* Client not found */ };
          };
        };

        if (not authorized) {
          Runtime.trap("Unauthorized: You can only edit your own workouts or workouts for your clients");
        };

        let updatedWorkout : Workout = {
          existingWorkout with
          exercises;
          comments;
        };
        workouts.add(workoutId, updatedWorkout);
      };
    };
  };

  public query ({ caller }) func getWorkoutsForClient(clientUsername : Text) : async [Workout] {
    let hasTrainerToken = trainerTokens.containsKey(caller);
    let callerUsername = principalToUsername.get(caller);

    if (not hasTrainerToken and callerUsername == null) {
      Runtime.trap("Unauthorized: You must be authenticated to view workouts");
    };

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
    let hasTrainerToken = trainerTokens.containsKey(caller);
    let callerUsername = principalToUsername.get(caller);

    if (not hasTrainerToken and callerUsername == null) {
      Runtime.trap("Unauthorized: You must be authenticated to log a workout");
    };

    if (not hasTrainerToken) {
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

    let exercisePerformances = log.exercises.map(
      func(exerciseLog) {
        {
          date = log.date;
          exercise = {
            name = exerciseLog.name;
            sets = exerciseLog.actualSets;
            repetitions = exerciseLog.actualRepetitions;
            setWeights = exerciseLog.actualSetWeights;
            restTime = exerciseLog.restTime;
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
    let hasTrainerToken = trainerTokens.containsKey(caller);
    let callerUsername = principalToUsername.get(caller);

    if (not hasTrainerToken and callerUsername == null) {
      Runtime.trap("Unauthorized: You must be authenticated to view workout logs");
    };

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

  public shared ({ caller }) func createBooking(booking : BookingUpdate) : async Nat {
    if (not isTrainer(caller)) {
      Runtime.trap("Unauthorized: Only trainers can create bookings");
    };

    let newBooking : Booking = {
      id = nextBookingId;
      trainerPrincipal = caller;
      clientName = booking.clientName;
      clientEmail = booking.clientEmail;
      dateTime = booking.dateTime;
      durationMinutes = booking.durationMinutes;
      notes = booking.notes;
      isConfirmed = booking.isConfirmed;
    };

    bookings.add(nextBookingId, newBooking);
    let bookingId = nextBookingId;
    nextBookingId += 1;
    bookingId;
  };

  public query ({ caller }) func getBookingsByDateRange(
    startTime : Time.Time,
    endTime : Time.Time,
  ) : async [Booking] {
    if (not isTrainer(caller)) {
      Runtime.trap("Unauthorized: Only trainers can access bookings");
    };

    let filteredBookings = bookings.values().toArray().filter(
      func(booking) {
        booking.trainerPrincipal == caller and
        booking.dateTime >= startTime and booking.dateTime <= endTime
      }
    );

    filteredBookings;
  };

  public shared ({ caller }) func updateBooking(
    bookingId : Nat,
    updatedBooking : BookingUpdate,
  ) : async () {
    if (not isTrainer(caller)) {
      Runtime.trap("Unauthorized: Only trainers can update bookings");
    };

    switch (bookings.get(bookingId)) {
      case (?existingBooking) {
        if (existingBooking.trainerPrincipal != caller) {
          Runtime.trap("Unauthorized: You can only update your own bookings");
        };

        let newBooking : Booking = {
          id = bookingId;
          trainerPrincipal = caller;
          clientName = updatedBooking.clientName;
          clientEmail = updatedBooking.clientEmail;
          dateTime = updatedBooking.dateTime;
          durationMinutes = updatedBooking.durationMinutes;
          notes = updatedBooking.notes;
          isConfirmed = updatedBooking.isConfirmed;
        };
        bookings.add(bookingId, newBooking);
      };
      case (null) { Runtime.trap("Booking not found") };
    };
  };

  public shared ({ caller }) func deleteBooking(bookingId : Nat) : async () {
    if (not isTrainer(caller)) {
      Runtime.trap("Unauthorized: Only trainers can delete bookings");
    };

    switch (bookings.get(bookingId)) {
      case (?existingBooking) {
        if (existingBooking.trainerPrincipal != caller) {
          Runtime.trap("Unauthorized: You can only delete your own bookings");
        };
        bookings.remove(bookingId);
      };
      case (null) { Runtime.trap("Booking not found") };
    };
  };

  public shared ({ caller }) func requestAppointment(
    clientName : Text,
    clientEmail : Text,
    dateTime : Time.Time,
    durationMinutes : Nat,
    notes : Text,
  ) : async Nat {
    let callerUsername = switch (principalToUsername.get(caller)) {
      case (null) {
        Runtime.trap("Unauthorized: Only authenticated clients can request appointments");
      };
      case (?username) { username };
    };

    let clientData = switch (clients.get(callerUsername)) {
      case (null) {
        Runtime.trap("Client data not found for the authenticated client");
      };
      case (?data) { data };
    };

    let trainerPrincipalText = clientData.trainerCode;
    let trainerPrincipalNat = switch (Nat.fromText(trainerPrincipalText)) {
      case (null) {
        Runtime.trap("Invalid trainer code format");
      };
      case (?code) { code };
    };

    let trainerPrincipal = switch (trainerCodes.entries().find(func(entry) { entry.1 == trainerPrincipalNat })) {
      case (null) { Runtime.trap("Trainer not found for the given trainer code") };
      case (?entry) { entry.0 };
    };

    let newBooking : Booking = {
      id = nextBookingId;
      trainerPrincipal;
      clientName;
      clientEmail;
      dateTime;
      durationMinutes;
      notes;
      isConfirmed = false;
    };

    bookings.add(nextBookingId, newBooking);

    let bookingId = nextBookingId;
    nextBookingId += 1;
    bookingId;
  };

  public query ({ caller }) func getConfirmedAppointmentsForClient() : async [Booking] {
    let callerUsername = switch (principalToUsername.get(caller)) {
      case (null) {
        Runtime.trap("Unauthorized: Only authenticated clients can fetch confirmed appointments");
      };
      case (?username) { username };
    };

    let clientData = switch (clients.get(callerUsername)) {
      case (null) {
        Runtime.trap("Client data not found for the authenticated client");
      };
      case (?data) { data };
    };

    let trainerPrincipalText = clientData.trainerCode;
    let trainerPrincipalNat = switch (Nat.fromText(trainerPrincipalText)) {
      case (null) {
        Runtime.trap("Invalid trainer code format");
      };
      case (?code) { code };
    };

    let trainerPrincipal = switch (trainerCodes.entries().find(func(entry) { entry.1 == trainerPrincipalNat })) {
      case (null) { Runtime.trap("Trainer not found for the given trainer code") };
      case (?entry) { entry.0 };
    };

    bookings.values().toArray().filter(func(booking) {
      booking.clientName == callerUsername and booking.isConfirmed and booking.trainerPrincipal == trainerPrincipal
    });
  };
};
