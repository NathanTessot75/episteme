# Supabase setup

SQL scripts to run in the Supabase SQL editor, in this order:

| Script | What it does |
|--------|--------------|
| `01_storage_security.sql` | Makes the `pdfs` storage bucket private, adds the `is_premium` flag to profiles, and restricts PDF downloads to their owner or premium users (RLS policies). |
| `02_verification_requests.sql` | Creates the `verification_requests` table used to link a researcher account (ResearchGate, university…), with row-level security, and a demo trigger that auto-approves ResearchGate links. |
| `03_admin.sql` | Removes the demo auto-approval, adds the `is_admin` flag and lets admins review and approve verification requests manually. |

The base tables (`profiles`, articles, playlists…) are assumed to exist in the project already.
