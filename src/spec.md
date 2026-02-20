# Specification

## Summary
**Goal:** Display user profile names as forum message authors instead of principals or anonymous labels.

**Planned changes:**
- Update backend to include author profile names when fetching forum messages
- Update Candid interface to support author name field in message data structure
- Modify frontend SectionDetailPage to display author profile names from message data
- Implement fallback to show "Anonymous" or "User" when profile name is not set

**User-visible outcome:** Forum messages now show the author's chosen profile name, making it easier to identify who posted each message.
