# auth — extension point

No authentication exists in Phase 0 and none is faked. `principal.ts` fixes the shape every
future authorization policy reads; `auth.module.ts` is the seam where OIDC bearer verification
and `Principal` resolution land (docs/ARCHITECTURE.md §9–§10, docs/OPEN_DECISIONS.md A-01).
