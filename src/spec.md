# Specification

## Summary
**Goal:** Add per-set target weight (kg) to workouts so trainers can define weights per set and both trainers and clients can view them, while keeping existing workout logging unchanged.

**Planned changes:**
- Extend the workout data model to store a target weight value per set (kg) for each exercise, and update the existing workout create/retrieval canister methods to accept/return this data with backward compatibility for older workouts.
- Update the trainer Workout Builder UI to render weight inputs for Set 1..Set N, validate that each per-set weight is a non-negative number, and include these values in the existing create workout submission flow.
- Update the client assigned workout card UI to display per-set target weights per exercise in a readable set-by-set format, with a fallback to the legacy single target weight when per-set weights are not present.
- Update trainer workout viewing components (list/detail) to display per-set target weights when available, with a sensible fallback for older workouts.

**User-visible outcome:** Trainers can enter a target weight (kg) for each set when building workouts, and both trainers and clients can see per-set target weights on assigned/viewed workouts; older workouts continue to display using the existing single target weight without errors.
