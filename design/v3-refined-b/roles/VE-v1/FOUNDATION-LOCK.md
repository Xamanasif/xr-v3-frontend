# Foundation lock · Vendor (final)

> **FINAL DESIGN · AWAITING OWNER ACCEPTANCE.**

This file is the authoritative foundation record. `FOUNDATION-LOCK.json` is generated from the same data in the same build.

| | |
| --- | --- |
| Foundation | `XR-V3-RB-1.0` |
| Generated | 2026-10-19T18:25:03Z |
| Shared base files | byte-identical to the foundation (below) |
| Token changes | none |
| Independent role theme | none |
| Locked landing screens (PU-01, PU-14) touched | no |
| Other roles touched | no |
| Extensions allowed | additive namespaced role components; shared base patches require central version update |

## Shared files shipped

| File | sha256 | Same as | Byte-identical |
| --- | --- | --- | --- |
| `project/core.css` | `6b2be461041569e2ee4c083f6e5b29f73313363ef2568f7a0a4775400011a42b` | `references/v3/project/core.css` | yes |
| `project/rb.css` | `d2390e1e7bf2db081ec09d9b0b744832391a553f9346d7891eab31e30e5abaf2` | `references/v3/project/rb.css` | yes |
| `project/rb-kit.css` | `812daa6c8f4a02b505a417fe0b4f54206f513051f8a5caed06d3d05d080cd704` | `references/v3/project/rb-kit.css` | yes |

## Foundation reference hashes (from the pack lock)

Every pack reference file was re-hashed in this build and still matches the pack lock, so no protected design source was modified.

| Reference file | sha256 |
| --- | --- |
| `references/v3/HANDOFF-original.md` | `3598572e00da8148a47f5abda743eb868c3020d8405ac8f4530581f8e49cae67` |
| `references/v3/design-tokens.json` | `98b94673f7363b4bf64f7e9dde24fd29ecde9eb0cc3889e230caf4c497b1d5a3` |
| `references/v3/project/IA01.dc.html` | `f06c6e3e2fd8900a2a9f34360e11363f6ab506fb1d5676e4d4e0b0265a524b92` |
| `references/v3/project/IA02.dc.html` | `71280219faa1f3910cff66ed65b9b2a7ee3664afc97398dc630bb5614c98a54f` |
| `references/v3/project/SA01.dc.html` | `3cdd6a194b3441d628b335d254782009bc8cecea92dda48667474ccf258e91fc` |
| `references/v3/project/SA02.dc.html` | `4d88600e819c3b89b14efdfaf37914e23c57414e23fb947f1386ff5cda1d0496` |
| `references/v3/project/canvas.json` | `2131cfa9fcd0fb2a1889ed30ec943ada2c31638cca9f13cb17a91447233ff030` |
| `references/v3/project/core.css` | `6b2be461041569e2ee4c083f6e5b29f73313363ef2568f7a0a4775400011a42b` |
| `references/v3/project/rb-kit.css` | `812daa6c8f4a02b505a417fe0b4f54206f513051f8a5caed06d3d05d080cd704` |
| `references/v3/project/rb.css` | `d2390e1e7bf2db081ec09d9b0b744832391a553f9346d7891eab31e30e5abaf2` |

## Local additions (role-owned, listed separately)

| Kind | Count |
| --- | --- |
| live role preview root | 1 |
| inspection wrappers | 69 |
| role stylesheet | 1 |
| canvas index | 1 |
| **total** | **72** |

| File | Kind | Bytes | sha256 |
| --- | --- | --- | --- |
| `project/Main.dc.html` | live role preview root | 170,777 | `b72cc14fdc31744f89086bdcd57945f7a3dcc5333249e0e69c6fe5f7c8442034` |
| `project/VE-01-1024.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,070 | `61f7c1492bb95390360b09a95a97fb6f9a4cfadfb06fd9bc62f024c16cd55dfe` |
| `project/VE-01-1440.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,068 | `6809a1238d66fe9d4c5fd4116f8869026a655871c89b632ba76f93f1a7b56232` |
| `project/VE-01-375.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,068 | `97ab4a5d14707de642736c0afa2164e72ded14b5a6f20ce3e56edc39bf37588c` |
| `project/VE-01-768.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,068 | `45b775ddf72c0197d3dfd67ee72a9900f14bb81ae1de408da264ed47c17e4470` |
| `project/VE-01-calm.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,090 | `663004ca915391164d204c3fb88686413aadf773f980b85e56d9adc28c55f172` |
| `project/VE-01-first-visit.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,092 | `f9b50ce4040cac11061c738d8b8001cb86260737331fb39f04d42f51002037bf` |
| `project/VE-02-1024.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,076 | `74a37554ab1fd25598973cabfa1c3ec86c8648b7f0cabdcb7e9ad08661b35808` |
| `project/VE-02-1440.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,074 | `7db14ae45dd996f49288f833cb55049b6f7ae4809c5334a30b107cdadeddf017` |
| `project/VE-02-375.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,074 | `f7551c12599fe7c3f27386081b82cba07f4136d98bfc8c42446bbdb022405c2e` |
| `project/VE-02-768.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,074 | `ed96596a3dd6e1b853315daf8ba9092a971023424a1d638b4d3a3350b4bb8071` |
| `project/VE-02-empty.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,098 | `8ee091f228c46c7a51e0d7997bb40683dc24bc76e1025c8e09c634069cefa58e` |
| `project/VE-02-failed.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,113 | `b15588d61637ff07f42c5dadf5ef3aceb2a541335f60cfb9e50935e5de73c547` |
| `project/VE-02-loading.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,107 | `49b19882c87543cc5042158ece633f907d9a07ba82b5711e35ae831c4623ca62` |
| `project/VE-02-nomatch.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,108 | `fa64ceea61fd5fafe2cd6669734914f0f1a6ed0bdfc0d11cb9d42baf638b9325` |
| `project/VE-02-returned.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,113 | `86375663f77251428a9d89038538bc1dfc5538a11904b9a5103e5dc86327641f` |
| `project/VE-03-1440.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,094 | `63dfd8eaf9f42ef0f4a1b9f5b108963ee2e5c601f795e602b99b8bbeb9a9996a` |
| `project/VE-03-375.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,092 | `99ee589d1bc20f31a87509d1ad6bd3975455de88f67e21170d45d060c28b75df` |
| `project/VE-03-course-withdrawn.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,131 | `be1c7627f93f4b22cd6d466d69a964653df52c352f0b438728c80101b62f3fd4` |
| `project/VE-03-draft-saved.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,106 | `47bf3c916f0d5b16ca16eed566413e790acb8c81d6632908e933d64bbf049de3` |
| `project/VE-03-name-taken.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,133 | `14efb6765bddd65fdddc2043ea6b6d585c8c76a560cc13d6322dca43a6bff1ae` |
| `project/VE-03-validation.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,111 | `a0c1afa154ddd299b3998bc4d38fd8bf7bc59e141b078fe074677ae3d947f2b9` |
| `project/VE-04-1024.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,123 | `66c4773e1663aa1030e88ef7b394992ff67c5b332dba780b5dee6e62a5459dd0` |
| `project/VE-04-1440.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,112 | `9f7146b970dccc1428e9a9e120229d1360b549f65d81c91bcaff9067235284b9` |
| `project/VE-04-375.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,110 | `ed871c4da1d7c2e3d58b20737a86723985afcdd8c5336760f1b6733f65ed5715` |
| `project/VE-04-768.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,121 | `a38490a90755d20bf75506e4d79c22ee1b2d884d84f88db671163c72797700d7` |
| `project/VE-04-leave-guard.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,104 | `7805163ad976baa857104d5b3608f75a8823ab2ec63500f544ce57e23198e2f2` |
| `project/VE-04-two-formats.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,117 | `9c8fb2c63a4611b6777607343defa5a9c7976ccff0478ce2b11fe7b571341343` |
| `project/VE-04-validation.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,111 | `e685c8480ca877087013c240b99d401b4ac65928b66b9d6f8a37ee8f7cd2c61c` |
| `project/VE-05-1440.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,111 | `93ef014a9e5aa2b55a7c26c0ac4b5f812da71fb75152be1b52e248ebaf2937df` |
| `project/VE-05-375.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,111 | `d768f88a098da1e532078501ee0e4fd94334d2659f48e33310d96477ee893532` |
| `project/VE-05-preview-error.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,117 | `5c4341b2cb4b0d366ef6e3e4877fb2aedff212396471c34e704de1a8e0f11ebe` |
| `project/VE-06-1440.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,102 | `f5ce7ea635da68262376ca2230678ae6a60f65c4469f3cf68ea225bc244e5530` |
| `project/VE-06-375.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,100 | `59c5658041f93522215fd61e889893a18b3731882e6b673bcbf195135dd9bf1a` |
| `project/VE-06-confirm.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,102 | `220db55b0ef29ae373ab7d8f57c746ba8c2925835d7d057ab76b0ab0b6a4e484` |
| `project/VE-06-missing.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,114 | `a8750acb7ed3683ee3ca9925a64b5f7bef54e3e918f300895bcc4d0913bca89a` |
| `project/VE-06-submitted.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,114 | `adc6fb912336959ae252618dbf53869a7df963d48c1a2e8b4e0283c8c0a0dafd` |
| `project/VE-07-1024.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,106 | `6394884bdf425bed6a56396583300ef5353deae11785b1c9cec91d6cdf2306ec` |
| `project/VE-07-1440.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,106 | `acd2fbe63fb55fc7085d818a374e0bee19aafc87ab57b99c0d6a0221ed19cde0` |
| `project/VE-07-375.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,104 | `703b7c96563fc8974fef3d78041c822544f66f61fc0209ee31e2b84caeab178d` |
| `project/VE-07-768.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,104 | `ddd33ae00148369e8fd0b8464c8ff3a9d4dd2cdbb0ba9ae170cd7f15c380f43e` |
| `project/VE-07-draft.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,107 | `6856afbcf8247d1b8a2ed1944b52dcacab6c58f69c9c38c7d1f1e99b21d08310` |
| `project/VE-07-private-revision.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,115 | `6b049688fbbb3de3456ee2fa6441dffc49749bae6fc8f03d3c1c5edcacc68faa` |
| `project/VE-07-published.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,102 | `24a6f474fa86f993d612d5be113362078e7ac9dac8959a205e898fe88f4c38c5` |
| `project/VE-07-read-only.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,118 | `cd65134c4f92b45c31dde9e7491f2839fb77800f7d0be06d6f95cf07f3ef8154` |
| `project/VE-07-recheck.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,119 | `7f409d08ca2121a42608d47da68a1ed330a68ab403a2687fbfbd5582aaabf7c8` |
| `project/VE-07-returned-by-cm.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,107 | `7d1979cd07a2cb286fe8afffe2409f24c0ab86ca2f2cf9dcc15087d5dbbc4aff` |
| `project/VE-07-submitted.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,146 | `89a92e759b6bec498797fb9b9c485da917a0226fb92b15a8cdea55e784d63e9f` |
| `project/VE-07-with-content-manager.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,110 | `8d79140bf9f0fc6b7c66a7c3ef575a0b293d55b86b73887d9b3ebf04e8e8cdfb` |
| `project/VE-07-with-reviewer.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,128 | `0371aac06c9128243dd7983dbbf18992a41b699d4021b9d7dec21186e19e7562` |
| `project/VE-08-1440.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,097 | `3c6029c6ccd2b3235dac2fb599ebdda90bc655e4a7f2ba3e0745441aba51ed73` |
| `project/VE-08-375.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,095 | `32d98124ee6ac17a908906db20a7f00388ae43b72ae577e5ada2a15c53203db8` |
| `project/VE-08-already-decided.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,094 | `9cc5f45eebca3bbcbe7d02baba8aab90b9c1feff8565f71aa65c32c698704f8e` |
| `project/VE-08-already-submitted.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,101 | `532ea6812d2215719197209e375a89dd76b70c820a2a110d2dd12e612c210e24` |
| `project/VE-08-changes-saved.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,113 | `c8f4dff1bc5bc68a061eac80d7864590e3f72e8ed49391e05a5d6867e5d37b91` |
| `project/VE-08-confirm.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,104 | `dcf0aeb7602e6313123775aba9a019d7f37b0df7f8768bb2db648bf18bf6aadb` |
| `project/VE-08-reason-first.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,100 | `1b45a35e6a260f22c84edf211b5e6961fee8545ce1cc4a65c7a691f09b2b8a94` |
| `project/VE-08-submitted.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,097 | `9a2bdd6835716da3448ab5de78a361e0a431cf0645652c645399d05ca05a2802` |
| `project/VE-09-1440.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,087 | `f234440ce5a0498ed10b4aeb125e15ab31b91770b5b63c057e319512f7fa5920` |
| `project/VE-09-375.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,085 | `3cfac5f9f3da11110d17b99fd6f7ac069e9006cb2f8dbc644feb722329b469c8` |
| `project/VE-09-read-only.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,103 | `606b7e265b309ad40308bc3febde2912f9147b094607406c3e7baadf72d06003` |
| `project/VE-13-1440.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,105 | `70f8387420bdbcbac9f67e8d13c8ae3cd6596082bc907ff6eedd3491c1feadde` |
| `project/VE-13-375.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,105 | `afe5464fbc2a1f5fc7cf87e5b1cf6ebd2998c703786da436e132e5b17c736d58` |
| `project/VE-13-published.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,111 | `01f8b65e82d45822ed00066e74989949ea5439c7bae82a9d340261738ade9f98` |
| `project/XS-05-account-menu.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,080 | `d09fa2d86424cfa18886919e35b191768085d901b33a16af4502ef40695ead0c` |
| `project/XS-06-not-your-workspace.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,080 | `c775877ddc86accba41def7d660ed1fc05aa5a339050d37048f019f632572b21` |
| `project/XS-07-help.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,084 | `626a08f91fa1dcee3f7f60dea2d7441451719f0637caaaaa280d856a049373c9` |
| `project/XS-07-report-error.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,120 | `5a7fe679de5a6b07d885e33c38251207d69468b9ee95d3fd6fcb28c0b8d92cb7` |
| `project/XS-07-report-sent.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,104 | `e481b9f8e9223f63aacb5a3828ba1094e2e4eff79c1a640b2616d5a124c820f3` |
| `project/canvas.json` | canvas index (one page, 70 boards, 21 notes) | 22,626 | `233601a890949586736563d76816d1c5d48b3545e1c8b2a6948d372c1369c098` |
| `project/menu-375.dc.html` | inspection wrapper (imports Main.dc.html with a start state) | 1,077 | `759b3637a56388f26f5f6ef158fd00090835c98f5e222bfc50773e9fc4adc19e` |
| `project/v3-vendor.css` | role stylesheet (additive; ve- and vr- prefixes; no new tokens) | 35,043 | `f00db0765a3b40f9111e62c237057a2c877d07f8e23e9a75339dc241b6e93b89` |

## Not shipped

- **support.js**: design runtime supplied by the Design host; never ship it in the React app
- **fonts**: Public Sans via Google Fonts on the host; no font binaries
- **logo**: reserved slot; no WILP binary supplied
- **screenshots**: in the separate screenshots archive, not in this source package

## Rules followed

- References are immutable. The shared base files are shipped unchanged, and a shared base patch would need a central version update.
- Role additions are additive and namespaced (`ve-`, `vr-`). Shared classes are adjusted only under a role parent (`COMPONENT-EXTENSIONS.md`).
- No new tokens or colours. Every `var(--…)` and every literal colour in `v3-vendor.css` already exists in the shared files (checked by script).
- The original Public Landing, the other roles and the protected design sources were not modified.
