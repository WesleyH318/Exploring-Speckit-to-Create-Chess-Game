<!--
=== Sync Impact Report ===
Version change: 0.0.0 → 1.0.0
Bump rationale: MAJOR - Initial constitution ratification (first version)

Modified principles: N/A (initial creation)
Added sections:
  - Core Principles (5 principles)
  - Technical Standards
  - Development Workflow
  - Governance

Removed sections: None

Templates requiring updates:
  - .specify/templates/plan-template.md ✅ No changes needed (Constitution Check section is generic)
  - .specify/templates/spec-template.md ✅ No changes needed (requirements structure compatible)
  - .specify/templates/tasks-template.md ✅ No changes needed (phase structure compatible)

Follow-up TODOs: None
=== End Sync Impact Report ===
-->

# Chess Game Constitution

## Core Principles

### I. Quality & Testing

All features MUST include automated tests before merging.
Test-Driven Development (TDD) is the standard workflow:
tests are written first, verified to fail, then implementation
follows to make them pass.

- Unit tests MUST cover all game logic (move validation,
  check/checkmate detection, special moves).
- Integration tests MUST verify frontend-backend communication.
- No pull request may be merged with failing tests.
- Code coverage MUST not decrease with any change.

**Rationale**: A chess game has complex, rule-driven logic where
bugs produce incorrect gameplay. Automated testing is the only
reliable way to ensure correctness across all board states.

### II. Simplicity

Every implementation MUST use the simplest approach that
satisfies the current requirements. Premature abstraction,
speculative features, and over-engineering are prohibited.

- YAGNI: Do not build features until they are needed.
- Three similar lines of code are preferred over a premature
  abstraction.
- No design patterns unless they solve a concrete, present
  problem.
- Configuration and extensibility points MUST be justified
  by an existing use case.

**Rationale**: Chess has well-defined rules. Complexity MUST
come from the problem domain (game logic), not from
unnecessary architectural layers.

### III. Separation of Concerns

The codebase MUST maintain clear boundaries between game
logic, UI rendering, and network/API communication.

- Game rules and board state management MUST be independent
  of any UI framework or transport layer.
- Frontend components MUST NOT contain game logic; they
  render state and dispatch user actions.
- Backend API MUST act as a thin coordination layer between
  clients and the game engine.
- Each layer MUST be independently testable.

**Rationale**: Isolating game logic from presentation enables
independent testing of chess rules, allows UI changes without
risking game correctness, and supports future platform targets.

### IV. Correctness

The game engine MUST produce deterministic, rules-compliant
behavior for every possible board state and move sequence.

- All standard chess rules MUST be implemented: castling,
  en passant, pawn promotion, stalemate, fifty-move rule,
  and threefold repetition.
- Move validation MUST reject illegal moves and provide
  clear feedback.
- Game state transitions MUST be deterministic: the same
  sequence of moves MUST always produce the same board state.
- Edge cases (e.g., simultaneous check and pin) MUST be
  explicitly handled and tested.

**Rationale**: A chess game that allows illegal moves or
produces non-deterministic results is fundamentally broken.
Correctness is a non-negotiable baseline.

### V. Maintainability

Code MUST be written for readability and long-term
maintenance over clever optimization.

- Functions and variables MUST use descriptive names that
  reflect chess domain concepts (e.g., `isKingInCheck`,
  `getValidMoves`, not `chk` or `gvm`).
- Complex algorithms (e.g., move generation, check detection)
  MUST include inline comments explaining the approach.
- Public APIs MUST have clear contracts: expected inputs,
  outputs, and error conditions.
- Dead code MUST be removed, not commented out.

**Rationale**: Chess logic is inherently complex. Clear,
well-named code reduces the cognitive load required to
understand and safely modify the game engine.

## Technical Standards

- The frontend and backend MUST be clearly separated in
  the repository structure (e.g., `frontend/` and `backend/`).
- Dependencies MUST be explicitly declared and version-pinned.
- All user input (moves, game actions) MUST be validated on
  the server side; client-side validation is supplementary.
- The application MUST handle network errors and disconnections
  gracefully without corrupting game state.
- Environment-specific configuration (API URLs, ports) MUST
  be managed through environment variables, not hardcoded.

## Development Workflow

- All changes MUST be made on feature branches and merged
  via pull request.
- Each pull request MUST pass all automated tests before
  merge.
- Commits MUST be atomic and describe the "why" of the change.
- Breaking changes to the game engine API MUST be documented
  in the pull request description.
- Code review MUST verify compliance with this constitution's
  principles before approval.

## Governance

This constitution is the authoritative source of project
standards. All development decisions, code reviews, and
architectural choices MUST align with the principles defined
above.

- **Amendments**: Any change to this constitution MUST be
  documented with a rationale, reviewed by the project owner,
  and accompanied by a version increment.
- **Versioning**: Constitution versions follow semantic
  versioning. MAJOR for principle removals or redefinitions,
  MINOR for new principles or material expansions, PATCH for
  clarifications and wording fixes.
- **Compliance**: Every pull request review MUST include a
  check against these principles. Violations MUST be resolved
  before merge or explicitly justified in the Complexity
  Tracking section of the implementation plan.

**Version**: 1.0.0 | **Ratified**: 2026-02-16 | **Last Amended**: 2026-02-16
