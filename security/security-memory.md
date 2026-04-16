# Security Memory

## Storage buckets
- **contribution-files** is intentionally public with broad SELECT on storage.objects. It hosts user-shared community attachments (Help Us Grow feature). Listing files is acceptable because all uploaded content is meant to be shared with all signed-in users. Linter warning 0025 (public_bucket_allows_listing) on this bucket is expected — do not flag.

## Profiles
- `profiles` table is readable by all authenticated users (policy "Public profile fields readable by authenticated"). This is intentional to let community contributors display nickname/links on their cards. Sensitive fields should not be added to this table.
