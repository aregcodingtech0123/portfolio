# Applied-throttling observer (en, 3 runs)

Slow 4G + 4x CPU for mobile, 10 Mbps + 40 ms for desktop, via CDP. Medians.

| config (en) | n | FCP ms | LCP ms (range) | LCP element | CLS | long tasks: sum / longest ms | skin switch ms | open modal ms |
|---|---|---|---|---|---|---|---|---|
| mobile-en-terminal-dark | 3 | 1348 | 4932 (4908-4936) | img | 0.0006 | 596 / 361 | 272 | 48 |
| mobile-en-terminal-light | 3 | 1324 | 4920 (4888-4928) | img | 0.0007 | 567 / 361 | 272 | 48 |
| mobile-en-minimal-dark | 3 | 1268 | 4924 (4904-4932) | img | 0.0001 | 557 / 309 | 328 | 24 |
| mobile-en-minimal-light | 3 | 1260 | 4912 (4900-4928) | img | 0.0001 | 511 / 291 | 320 | 24 |
| desktop-en-terminal-dark | 3 | 364 | 364 (360-384) | h2 | 0.0002 | 55 / 55 | 56 | 16 |
| desktop-en-terminal-light | 3 | 364 | 364 (364-368) | h2 | 0.0002 | 57 / 57 | 48 | 16 |
| desktop-en-minimal-dark | 3 | 368 | 1248 (1248-1264) | img | 0.0167 | 51 / 51 | 88 | 16 |
| desktop-en-minimal-light | 3 | 352 | 1252 (1232-1256) | img | 0.0030 | 51 / 51 | 88 | 16 |
