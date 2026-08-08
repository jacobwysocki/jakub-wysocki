---
status: proposed
implementation: provider-disabled release candidate
---

# Ask Jakub is a grounded portfolio guide

The working tree implements the provider-neutral foundation for Ask Jakub: curated bilingual Portfolio Knowledge, owned Evidence Links, ephemeral client state, a server-only model port, strict output validation, and a provider-disabled route composition. This avoids an AI impersonation, persistent visitor profiling, and provider lock-in while preserving a conversational way to explore the portfolio.

The core design is implemented provisionally, but this ADR remains proposed because the acceptable boundary for broader professional-perspective questions has not been approved. Provider, deployment, telemetry, retention, rate/spend, and public-launch decisions belong to later records rather than being inferred here.

## Considered options

- A general-purpose assistant would answer more questions, but its answers would be less relevant, harder to verify, easier to abuse, and more expensive to operate.
- A static FAQ would be deterministic and cheap, but would not deliver the conversational discovery experience or show applied AI product judgment.
- A retrieval-heavy stack with embeddings and a vector database would add infrastructure before the current, small knowledge set justifies it.

## Consequences

Every factual answer about Jakub needs valid Portfolio Knowledge and at least one Evidence Link. Until the broader-scope decision is accepted, questions outside documented experience receive a concise scope boundary. Application code does not intentionally persist raw questions, and a future provider may be replaced without changing the Desktop App Interface.
