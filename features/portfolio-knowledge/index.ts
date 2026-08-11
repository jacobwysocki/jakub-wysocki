import { portfolioKnowledge } from "./catalog";
import { assertValidPortfolioKnowledge } from "./validation";

// Keep invalid public facts from reaching Spotlight, Ask Jakub, or a build.
assertValidPortfolioKnowledge(portfolioKnowledge);

export {
  findEvidence,
  findSuggestedQuestion,
  followUpSuggestedQuestions,
  initialSuggestedQuestions,
  knowledgeEntries,
  portfolioKnowledge,
  suggestedQuestions,
} from "./catalog";
export {
  expandSearchAliases,
  normalizeSearchText,
  retrieveKnowledge,
  type ExpandedQuery,
  type RetrievalOptions,
} from "./retrieval";
export {
  assertValidPortfolioKnowledge,
  nominatedConsistencyClaims,
  validatePortfolioKnowledge,
  volatileCountClaims,
  type KnowledgeValidationCode,
  type KnowledgeValidationIssue,
  type KnowledgeValidationOptions,
  type NominatedConsistencyClaim,
  type VolatileCountClaim,
} from "./validation";
export { canonicalKnowledgeSources } from "./sources";
export type {
  AskTopic,
  EvidenceId,
  EvidenceLink,
  KnowledgeEntry,
  KnowledgeId,
  PortfolioKnowledgeCatalog,
  RetrievalMatch,
  SuggestedQuestion,
  SuggestionId,
} from "./contract";
