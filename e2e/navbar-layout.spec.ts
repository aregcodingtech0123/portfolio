import { expect, seedTheme, test, type Skin } from "./fixtures";

// The desktop nav centres its section links in a horizontal scroll area.
// With plain justify-center, once the links overflow that area (the longer
// Turkish labels do so sooner) centring pushed both ends out of the
// scrollport and the hidden scrollbar made them unreachable -- the first
// and last items were clipped. These verify that at every common desktop
// width, in both skins and both locales, the whole set of links fits the
// scrollport (nothing is clipped) and the first and last are inside the
// viewport.
//
// "Fits" is not enough: the row once fitted on Windows with 1px to spare and
// overflowed by 23px on Linux, where Chromium rounds the 11px mono glyphs from
// 6.6 to 7px. So the row must leave spare room: none of it clipped at load
// (when the web fonts may not have arrived yet), and at least MIN_HEADROOM px
// free once they have.

const WIDTHS = [1024, 1280, 1366, 1440, 1536, 1920];
const HEIGHT = 900;
const MIN_HEADROOM = 8;

/** Free px in the scrollport: its width minus the link row's full width (negative = clipped). */
function headroom(el: Element): number {
  const scroller = el.closest<HTMLElement>('[class*="overflow-x-auto"]')!;
  const row = scroller.firstElementChild as HTMLElement;
  return scroller.clientWidth - row.scrollWidth;
}

for (const locale of ["en", "tr"] as const) {
  for (const skin of ["terminal", "minimal"] as const satisfies Skin[]) {
    test(`desktop nav links are never clipped across widths (${locale} ${skin})`, async ({
      page,
    }) => {
      await seedTheme(page, { skin });

      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: HEIGHT });
        await page.goto(`/${locale}`);

        // next-intl prefixes the locale, so the hrefs are like "/en#about".
        const links = page.locator('header nav a[href*="#"]:visible');
        const count = await links.count();
        expect(count, `${locale}/${skin} @${width}: expected desktop nav links`).toBeGreaterThan(
          3,
        );

        // The links sit in a horizontal scroll container. Nothing may be
        // clipped or hidden behind the (invisible) scrollbar, even before the
        // web fonts have loaded...
        const atLoad = await links.first().evaluate(headroom);
        expect(
          atLoad,
          `${locale}/${skin} @${width}: nav links clipped by ${-atLoad}px at load`,
        ).toBeGreaterThanOrEqual(0);

        // ...and once they have, the row keeps real spare room.
        await page.evaluate(() => document.fonts.ready);
        const settled = await links.first().evaluate(headroom);
        expect(
          settled,
          `${locale}/${skin} @${width}: only ${settled}px of headroom (need ${MIN_HEADROOM})`,
        ).toBeGreaterThanOrEqual(MIN_HEADROOM);

        // Belt and braces: the first and last are within the viewport, not
        // pushed off either edge (the old justify-center failure mode).
        const first = (await links.first().boundingBox())!;
        const last = (await links.last().boundingBox())!;
        expect(
          first.x,
          `${locale}/${skin} @${width}: first link off the left edge`,
        ).toBeGreaterThanOrEqual(0);
        expect(
          last.x + last.width,
          `${locale}/${skin} @${width}: last link off the right edge`,
        ).toBeLessThanOrEqual(width + 0.5);
      }
    });
  }
}
