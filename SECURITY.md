# Security

## Supported Versions

The current `main` branch is the supported development line.

## Reporting a Vulnerability

Please report security issues privately to the repository owner before public disclosure. Avoid posting secrets, live Foundry URLs, session recordings, or player personal data in public issues.

## Sensitive Data

Uncle Yev is designed to work near private campaign material and Foundry credentials. Keep these out of git:

- `.env` files
- Foundry admin passwords
- Coolify/API tokens
- player transcripts and recordings
- private campaign ledgers
- unrevealed campaign secrets

Use `.env.example` for configuration shape and `memory/uncle-yev-ledger.local.md` for private campaign memory.
