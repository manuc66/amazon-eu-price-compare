# Find the Best Price in Amazon European Markets

This extension helps you to find the best price with just one click.

You just go to any Amazon EU store, search your item, click the icon of this extension(a black letter B, which stands for the "B"est price of course) and it shows you the prices in all the other Amazon European stores, including currency conversion (GBP/SEK).

## 1 Download and Install

Please go to [Chrome Webstore](https://chrome.google.com/webstore/detail/amazon-eu-price-compare/iaakgomiepekffchlipoegcgahfcdbad).

Install now and be part of the 1874 proud user base (as of Dec 26th, 2020).

## 2 Let Me Paint a Picture

OK. You live in Europe, and you want to buy something off Amazon. Of course, you want the best price.

If you are a frequent Amazon user living in Europe, chances are, you have already known the fact that among the European countries, Amazon has not only 1, but many different stores. The ten European marketplaces compared by the extension are:

- amazon.co.uk (GBP)
- amazon.de
- amazon.es
- amazon.fr
- amazon.it
- amazon.nl
- amazon.pl (PLN)
- amazon.se (SEK)
- amazon.com.be
- amazon.ie (EUR, launched in March 2025)

They are listed in `src/markets.ts`, which is the single place to edit to change
what the extension compares, and a test keeps the two manifests in sync with it.

If you are a frequent Amazon user living in Europe, chances are, you have also already figured out that most of the items are sold in all the markets above; they can be shipped within EU; but the prices differ, sometimes greatly.

So let me describe normally as a non-millionaire what you would do:

1. Open amazon.de (maybe uk, es, fr, it, se, nl; depending on where you live)
2. Search the product you want
3. Copy the name of the product
4. Open 6 other new tabs, for other amazon markets
5. Paste the name you copied in step 3, to the 6 tabs you just opened and click search
6. Switching back and forth between all the tabs for the lowest price

You probably see where I'm going with this, and yes, you are right: it is annoying to do the same thing 7 times every time you want to search something on Amazon, which probably you won't even buy in the end, and even if you do, it may be something only cost something ninety-nine so the effort really isn't worth it.

Well, now you are saved. Install this plugin, just a single click, and you get the best price. No fuss, no muss.

## 3 Known Issue

> For CD/books/DVD categories, some products have multiple format, like a movie can have multiple formats like DVD, blue-ray, etc; for some products can't parse price correctly.

## 4 Disclaimer

I worked at AWS professionally from Dec 1st 2020 to mid-June 2021.

Everything I said in that period about this plugin and this repo is only my personal idea, and does not represents Amazon/AWS's opinion, and the develolpment done in that period about this plugin is completely done in my spare time outside office hours.

## 5 FAQ

See [FAQ](./faq.md). It's highly recommended that you have a look first.

## 6 DEV Info

Chrome/Firefox extension written in TypeScript with React and Redux.

npm, babel, webpack and the TypeScript compiler are needed for building.

### 6.1 Build

```
npm i
npm run build
```

`npm run build` runs `tsc --noEmit` first (Babel only strips the types, it does
not check them), then builds both browsers. Use `npm run typecheck` to check the
types on their own.

### 6.2 Build output

`npm run build` produces one unpacked extension per browser:

- `dist/chrome` — Chromium based browsers (Chrome, Edge, Brave, Opera)
- `dist/firefox` — Firefox 140+

`npm run build:chrome` and `npm run build:firefox` build a single target.
`npm run zip` creates `dist/amazon-eu-price-compare-chrome.zip` and
`dist/amazon-eu-price-compare-firefox.zip`.

Each target gets its own manifest from `manifests/`, the files shared by both
browsers (html, icons) live in `extension/`.

### 6.3 Load the extension

- Chrome: `chrome://extensions` → enable Developer mode → "Load unpacked" →
  select `dist/chrome`.
- Firefox: `about:debugging#/runtime/this-firefox` → "Load Temporary Add-on" →
  select `dist/firefox/manifest.json`.
- Validate the Firefox package: `npm run lint:firefox`.

### 6.4 Tests

```
npm test          # vitest + jsdom, single run
npm run test:watch
```

Covered: the Amazon page parsing rules (`src/util/AmazonUtils.ts`), the market
table, the price list rendering, the reducers, the content script message
handling, and the consistency between `src/markets.ts` and the two manifests.

The price fixtures use both the German (`1.234,56 €`) and British (`£1,234.56`)
formats on purpose: the Amazon markets disagree on decimal and thousands
separators.

## 7 Changelog

### Unreleased

- Compare the two missing European marketplaces: **amazon.pl** (PLN) and
  **amazon.ie** (EUR), for ten stores in total.
- Replace the hardcoded country list, the per-country display branches and the
  currency-pair rates by a single market table (`src/markets.ts`): markets,
  domains and `EUR_PER_UNIT` rates in one place. The comparison always converts
  to EUR and shows the native price when the store does not use the euro.
- Add a test suite (vitest + jsdom) covering the price/rank parsing, the reducers
  and the content script.
- Fix the legacy price parsing: prices with a thousands separator were misread
  (`1.234,56 €` came out as `1.234`, `£1,234.56` as `1.234`).
- Fix an empty price whole part being reported as `0.56` instead of "can't parse".
- The root reducer returns the previous state object for unrelated actions again
  (regression introduced when replacing `combineReducers()` in the TypeScript
  migration).
- Migrate the sources to TypeScript (`strict`, `chromium` typings through
  `@types/chrome`), checked with `tsc --noEmit` before every build.
- Firefox support: `manifests/manifest.firefox.json` adds the
  `browser_specific_settings.gecko` block (id, `strict_min_version` 140 and the
  `data_collection_permissions` required by AMO).
- Split the build per browser: `npm run build` now outputs `dist/chrome` and
  `dist/firefox`, each with its own manifest.
- Add the Amazon EU host permissions to `host_permissions` (needed by the popup
  to fetch prices from the other stores).
- Update all dependencies (React 19, Redux 5, Babel 8, webpack 5).

### Version 2.0 Updates

- Upgrade to Chrome extension manifest V3.
- Currency exchange rate update:
  - GBP to EUR: 1.17
  - EUR to GBP: 0.85
  - GBP to SEK: 13.32
  - SEK to GBP: 0.075
  - EUR to SEK: 11.34
  - SEK to EUR: 0.088

### Version 1.9 Updates

- Add amazon.com.be, thanks to a few users who reminded me about this.

### Version 1.8 Updates

Since recently (c.a. Feb 2022), Amazon has changed some of its page style.

It seems not all pages are affected; although most pages are adjusted into the new style, there are indeed older style existing at the same time.

Thanks Maurice and kunder-terapi05 for reporting the bug.

### Version 1.7 Updates

1. AWS recently changed the page layout, so parsing the price must be adjusted accordingly.

2. Currency exchange API doesn't work any more, so now a fixed exchange rate is used. This is not ideal, but at least on the bright side, it's slightly faster than before.

The current exchange rate being used is:

- GBP to EUR: 1.18
- EUR to GBP: 0.84
- GBP to SEK: 11.77
- SEK to GBP: 0.085
- EUR to SEK: 9.93
- SEK to EUR: 0.10

### Version 1.6 Updates

- Add amazon.se, and add support for SEK currency conversion
- Add FAQ and Disclaimer

Price list logic changed:

- If current page country is UK: show only GBP price (previously showed both GBP and EUR price)
- If current page country is SE: show only SEK price (previously SE not supported)
- If current country is others (DE/IT/ES/FR/NL), show only EUR price (GBP converted to EUR, same as before, and SEK converted to EUR too)

### Version 1.5 Updates

I was informed by a user that Amazon opens amazon.nl for Netherland and Belgium, so this version is mainly about adding support for amazon.nl

Main feature:

- Adding support for amazon.nl

By the way, some minor non-functional changes:

- Update dependencies versions to fix vulnerabilites
- Update README about build info

### Version 1.4.1 Updates

- Update manifest description.

### Version 1.4.0 Updates

- Change currency exchange rate API URL
- Fix issues with most CD/books/DVD categories that may have multiple formats and different prices
- Update error message when can't parse price

### Version 1.3.2 Updates

- Fix bug about some amazon URL analyzing

### Version 1.3.1 Updates

- Fix bug when a product doesn't has main category rank

### Version 1.3.0 Updates

- Add options page
- Add product rank. By default it's not shown. Can be enabled in options page. Only main category rank is shown.

### Version 1.2.1 Updates

- If you are visiting Amazon UK, prices are shown in both EUR and GBP (Thanks to UK user Richard Burgess's suggestion).
- Minor bug fix, like if you're not visiting amazon product page, corresponding message is shown instead of a blank page.
- Code refactor, to use redux to separate model and view.
