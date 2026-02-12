# Specification

## Summary
**Goal:** Allow admin login via code "9876" and show a personnel (trainers) list on the admin dashboard with each trainer’s first name, last name, and PT code.

**Planned changes:**
- Backend: Extend the admin-protected `getAdminOverview()` response to include each trainer’s PT code plus identity fields (first name, last name) sourced from stored trainer identity data, handling missing identity safely.
- Frontend: Update AdminDashboardPage to render a personnel list/table with English column labels (First name, Last name, PT code) using `getAdminOverview()` data and showing safe placeholders when identity is missing.
- Frontend/Backend: Keep admin access restricted to the code "9876" and show a clear English error message on the admin login page when an incorrect code is entered.

**User-visible outcome:** Admins can enter code "9876" to access the admin dashboard and view a personnel list showing each trainer’s first name, last name, and PT code; incorrect codes show an English error and do not grant access.
