# Owner-approved V3 role exports (read-only)

Each folder here is one owner-approved complete role export, copied byte for byte from the source
archive the owner supplied, under `design/v3-refined-b/roles/<ROLE>-<revision>/`. Never edit,
normalise, reformat, regenerate or re-export a file under a role folder. Each folder carries the
export's own `SHA256SUMS.txt`; check it with `shasum -a 256 -c SHA256SUMS.txt` from inside the
folder. The `.dc.html` sample records, preview state machines and preview-only classes in an export
are not domain logic and never product UI (`ROLE-INTAKE-REQUIREMENTS.md` in `v2/docs/v3/`).

| Folder  | Workstream                    | Export                                                                                                                                                             | Integrity            | Approval                                                 |
| ------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------- | -------------------------------------------------------- |
| `XS-v6` | XS · Entry & shared (7 ids)   | `XR-V3-XS-Entry-Shared-Source.zip` (also supplied as `…_1.zip`, byte-identical), 196,830 bytes, SHA-256 `1da3c72b8b931ffb5bd9bcf30548ad4556dafa96b1c16dfb51e69ce6efdc9d20`; canvas Version 6, shared contract 1.0.0, foundation `XR-V3-RB-1.0`, package date 18 Oct 2026 | 125 OK (126 files)   | Owner, in the integration conversation of 19 Oct 2026    |

Screenshots are not copied: the XS evidence archive `XR-V3-XS-Entry-Shared-Screenshots.zip`
(9,098,404 bytes, SHA-256 `3c1c4d0fa8fe5b2afe240b8a1cce2a09227334040cec2dcc97ba714cf64d5cdc`, 121
renders of canvas Version 6) stays with the owner; `v2/docs/v3/V3-COMPARISON-MAP.json` names the
renders each migrated screen state was compared with.

The export's own status files still read "OWNER APPROVAL PENDING": they were written before the
owner accepted the design. The approval is the owner's instruction in the integration conversation.
