# Specification

## Summary
**Goal:** Display user profile names instead of "Anonymous" for forum message authors who have saved profile information.

**Planned changes:**
- Update the message author display in SectionDetailPage.tsx to show the `authorName` field when available
- Fall back to "Anonymous" only when `authorName` is null or empty
- Ensure principal IDs are never displayed to end users

**User-visible outcome:** Forum messages will show the author's profile name (if they have one saved) instead of always displaying "Anonymous", making it easier to identify who posted each message.
