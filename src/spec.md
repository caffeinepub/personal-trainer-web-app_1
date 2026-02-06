# Specification

## Summary
**Goal:** Make trainer access-code login reliably accept code "12345" and enter the trainer dashboard, with deterministic actor initialization and clearer English UI messaging.

**Planned changes:**
- Fix trainer authentication flow so access code "12345" consistently succeeds and navigates to the trainer dashboard without showing the generic authentication error.
- Gate login submission on backend actor readiness (disable/block submit until initialized), and show a specific actionable error when the actor/agent is unavailable.
- Improve error categorization so the UI distinguishes wrong-code vs service-unavailable vs other authorization/authentication errors, using the generic message only as a fallback.
- Update all trainer login page user-facing copy (labels, placeholders, buttons, loading/helper text) to English.

**User-visible outcome:** Trainers can enter access code "12345" and reliably log in to the Personal area; wrong codes show an incorrect-code message, service issues show a service-unavailable message, and the entire login page reads in English.
