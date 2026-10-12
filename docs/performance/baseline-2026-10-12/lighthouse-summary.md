# Lighthouse baseline

80 successful runs (0 failed, 0 with an unverified skin/mode). Cells are `median (min-max)`. Lighthouse 13.5.0, Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/156.0.0.0 Safari/537.36.


## mobile

| locale | skin | mode | n | score | LCP ms | observed LCP ms | FCP ms | TBT ms | TTI ms | CLS | KB transferred | LCP element |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| en | terminal | dark | 5 | 75 (73-77) | 6149 (6066-6172) | 679 (539-928) | 904 (904-909) | 189 (108-247) | 6171 (6096-6194) | 0.0e+0 | 871 (871-871) | `img.object-contain x5` |
| en | terminal | light | 5 | 75 (72-77) | 6151 (6060-6176) | 873 (637-906) | 904 (904-907) | 187 (95-265) | 6173 (6090-6199) | 8.1e-5 | 871 (871-871) | `img.object-contain x5` |
| en | minimal | dark | 5 | 77 (74-80) | 6063 (5333-6149) | 568 (229-839) | 904 (904-907) | 121 (54-210) | 6093 (5368-6172) | 1.8e-5 | 871 (871-871) | `img.object-contain x3, span.whitespace-nowrap x2` |
| en | minimal | light | 5 | 77 (43-80) | 6082 (5265-6151) | 713 (254-2748) | 905 (904-905) | 117 (95-4477) | 6112 (5294-6173) | 1.2e-5 (0.0e+0-1.2e-5) | 871 (870-871) | `img.object-contain x4, span.whitespace-nowrap x1` |
| tr | terminal | dark | 5 | 76 (69-77) | 6144 (6138-6255) | 762 (745-889) | 905 (903-905) | 167 (116-382) | 6167 (6161-6277) | 0.0e+0 | 872 (871-872) | `img.object-contain x5` |
| tr | terminal | light | 5 | 76 (74-76) | 6142 (6075-6168) | 794 (749-823) | 905 (904-906) | 170 (152-234) | 6165 (6105-6191) | 0.0e+0 | 872 (871-872) | `img.object-contain x5` |
| tr | minimal | dark | 5 | 77 (75-77) | 6138 (6065-6157) | 712 (704-773) | 905 (904-906) | 133 (116-174) | 6161 (6095-6180) | 1.1e-4 | 872 (870-872) | `img.object-contain x5` |
| tr | minimal | light | 5 | 76 (75-77) | 6138 (6061-6142) | 724 (694-748) | 905 (904-906) | 176 (98-188) | 6161 (6091-6164) | 3.3e-4 | 872 (870-872) | `img.object-contain x5` |

## desktop

| locale | skin | mode | n | score | LCP ms | observed LCP ms | FCP ms | TBT ms | TTI ms | CLS | KB transferred | LCP element |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| en | terminal | dark | 5 | 97 | 1234 (1224-1237) | 372 (355-470) | 254 (253-259) | 0 | 1236 (1226-1239) | 0.0e+0 | 871 (870-871) | `h2.mt-4 x5` |
| en | terminal | light | 5 | 97 | 1230 (1223-1232) | 436 (402-470) | 254 (245-257) | 0 | 1232 (1225-1234) | 0.0e+0 | 871 (871-871) | `h2.mt-4 x5` |
| en | minimal | dark | 5 | 97 (97-99) | 1225 (987-1233) | 546 (225-859) | 250 (247-253) | 0 | 1227 (990-1235) | 0.0e+0 | 871 (871-871) | `img.object-contain x3, h2.mt-4 x2` |
| en | minimal | light | 5 | 97 | 1229 (1220-1235) | 805 (275-837) | 250 (246-253) | 0 | 1231 (1222-1237) | 0.0e+0 | 871 (871-871) | `img.object-contain x4, h2.mt-4 x1` |
| tr | terminal | dark | 5 | 99 | 956 (953-993) | 265 (261-288) | 260 (257-262) | 0 | 958 (956-995) | 0.0e+0 | 871 (870-871) | `h2.mt-4 x5` |
| tr | terminal | light | 5 | 97 (97-99) | 1229 (948-1232) | 341 (329-362) | 261 (244-265) | 0 | 1231 (950-1234) | 0.0e+0 | 871 (871-872) | `h2.mt-4 x5` |
| tr | minimal | dark | 5 | 97 (97-99) | 1224 (955-1244) | 702 (206-754) | 255 (245-255) | 0 | 1226 (958-1248) | 0.0e+0 | 871 (870-872) | `img.object-contain x4, h2.mt-4 x1` |
| tr | minimal | light | 5 | 97 (93-99) | 1225 (950-1240) | 727 (202-3766) | 254 (244-264) | 0 | 1227 (952-1244) | 0.0e+0 | 871 (871-872) | `img.object-contain x4, h2.mt-4 x1` |

Lighthouse CPU BenchmarkIndex on this machine: median 2678 (2424-2870). Lighthouse's own reference for a mid-tier phone is roughly 1000 or lower, so the fixed 4x slowdown used for mobile is optimistic on this machine.
