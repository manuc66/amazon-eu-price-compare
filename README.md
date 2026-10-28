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

**amazon.com is optional.** It can be enabled in the options page, but it is off
by default: its prices are in USD, exclude European VAT and international
shipping, and many items are not shipped to Europe at all. When it is enabled,
the row is marked "excl. VAT & shipping" and its euro price is indicative only.

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

## 4 Credits and License

The original program was written by **Tiexin Guo** (2017–2024) and is licensed
under the GNU General Public License, version 3. The licence text is kept
verbatim in [LICENSE](./LICENSE).

That licence is not a formality: it is what gives everyone — this fork
included — the right to reuse, modify and redistribute the code, and it has to
stay attached to every copy. The GPL also asks modified versions to say that
they were modified and when; the changelog in section 7 does exactly that.

This fork keeps the same licence, GPL-3.0, and the same copyright notice. It is
not affiliated with, endorsed by or supported by Amazon, nor by the original
author.

## 5 FAQ

See [FAQ](./faq.md). It's highly recommended that you have a look first.

## 6 DEV Info

Chrome/Firefox extension written in TypeScript with React and Redux.

npm, babel, webpack and the TypeScript compiler are needed for building.

### 6.1 Build

```
npm i
npm run build      # both browsers, in dist/chrome and dist/firefox
npm run release    # tests, both builds, the two store zips and the add-on lint
```

| command | what it does |
| --- | --- |
| `npm run build` | `tsc --noEmit`, then both browsers |
| `npm run build:chrome` / `build:firefox` | a single target |
| `npm run typecheck` | types only (Babel strips them, it does not check them) |
| `npm test` | vitest, single run (`test:watch` to iterate) |
| `npm run zip` | `dist/amazon-eu-price-compare-chrome.zip` and `-firefox.zip` |
| `npm run lint:firefox` | `web-ext lint` on the Firefox build |
| `npm run sign:firefox` | build + sign the Firefox package for self-distribution (AMO credentials needed, see 6.5) |
| `npm run release` | everything above, in the order a release needs |

`npm run release` stops at the first failing step, so a red test, a type error
or a lint error never produces a zip.

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
npm test                                       # vitest + jsdom, single run
npm run test:watch                             # watch mode
FIREFOX_BIN=/path/to/firefox npm run test:e2e:firefox
```

`test:e2e:firefox` installs the built `dist/firefox` as a temporary add-on in a
real (headless) Firefox, through Marionette directly — no geckodriver, no extra
dependency. It checks that the add-on installs, that Firefox itself resolves the
content script patterns for an `amazon.de` url, that the script is injected at
`document_start`, and that `storage`/`activeTab` are granted.

Firefox refuses to navigate to `moz-extension://` urls over Marionette, so the
popup UI is not driven by that test. To check it by hand:

```
npm run start:firefox -- --firefox /path/to/firefox   # builds, then web-ext run
npm run start:chrome                                  # same for Chromium
```

Covered by vitest: the Amazon page parsing rules (`src/util/AmazonUtils.ts`), the
market table and the store selection, the price list rendering, the reducers,
the content script message handling, the options page, and the consistency
between `src/markets.ts` and the two manifests.

The price fixtures use both the German (`1.234,56 €`) and British (`£1,234.56`)
formats on purpose: the Amazon markets disagree on decimal and thousands
separators.

### 6.5 Install on another computer, without a store

Publishing is not required to install the extension elsewhere: both browsers
accept a local build, but Firefox only accepts a package signed by Mozilla.

**Firefox — signed, permanent.** The AMO `unlisted` channel signs an add-on
without listing it publicly. Create API credentials at
<https://addons.mozilla.org/developers/addon/api/key/>, then:

```
export WEB_EXT_API_KEY='user:12345:67'
export WEB_EXT_API_SECRET='...'
npm run sign:firefox          # builds, signs, writes dist/signed/*.xpi
```

Send the `.xpi` over, then `about:addons` → gear icon → "Install Add-on From
File". It survives restarts, unlike the temporary add-on of section 6.3.

- Signing is not a private matter: AMO runs its validation (and sometimes a
  human review) on every submission, even unlisted. The add-on still has to
  follow the [add-on policies](https://extensionworkshop.com/documentation/publish/add-on-policies/).
- Keep the id in `manifests/manifest.firefox.json` stable: changing it makes
  AMO treat the package as a brand new add-on.
- AMO rejects a version it already signed, so bump `version` in both manifests
  before signing again. Installing the new `.xpi` updates the existing copy in
  place.
- Sign what `build:firefox` just produced; never sign a hand-edited
  `dist/firefox`.

**Chrome, Edge, Brave — unpacked.** Copy `dist/chrome` to the other machine,
open `chrome://extensions`, enable developer mode, "Load unpacked", pick the
folder. It survives restarts, but the developer-mode warning stays and the
folder must not be moved or deleted. Windows and macOS refuse `.crx` files from
outside the store; only Linux can pre-install one through a preferences file.

## 7 Security and privacy

What the extension asks for, and what it does with it.

- **Permissions.** `activeTab` (read the url of the page the user asked about)
  and `storage` (the two options and the price cache). Host permissions cover
  the eleven Amazon storefronts and nothing else: a test fails if a manifest
  asks for a host the market table does not contain.
- **No remote code, no eval.** The bundle is built from this repository. Adding
  eval or the `Function` constructor fails `npm run lint:bundle`, which runs in
  `npm run release`.
- **No third-party service, no telemetry, no analytics.** Prices are read from
  the Amazon pages themselves; exchange rates are constants in
  `src/markets.ts`.
- **The user's Amazon session is never used.** Store pages are fetched with
  `credentials: 'omit'` and `referrerPolicy: 'no-referrer'`, so the request
  carries neither cookies nor a referrer: the extension cannot see a logged-in
  price, and Amazon cannot tie the request to the browsing session.
- **Stored data.** `chrome.storage.sync` keeps `showRanks` and the list of
  compared stores. The last comparison of a product is kept per ASIN in
  `chrome.storage.session` (memory only, cleared when the browser exits, ten
  minutes maximum age) so reopening the popup does not refetch everything.
  Nothing is sent anywhere else.
- **Rendering.** Prices and ranks come from the page and are rendered as React
  text nodes, never as HTML; there is no `dangerouslySetInnerHTML`, and the
  links are built from a 10 character ASIN.
- **Accepted warnings.** `web-ext lint` reports two `UNSAFE_VAR_ASSIGNMENT`
  (innerHTML) warnings: they come from React DOM internals, not from this code.
- **Known limitation.** Ten page requests are made each time a product is
  opened for the first time (served from the cache for two minutes). That is
  ordinary browsing traffic, but it is still automated access to Amazon: if
  Amazon starts rate limiting, the popup will show `loading failed` rows.

## 8 Changelog


### Unreleased

- Move the sources to Codeberg (`https://codeberg.org/manuc66/amazon-eu-price-compare`).
- Replace the personal note in the README with a credits/licence section, and
  fix `package.json` (`license` said ISC while `LICENSE` has always been
  GPL-3.0). October 2026.

- Add `npm run sign:firefox`: build then sign the Firefox package through the
  AMO `unlisted` channel, so the extension can be installed on another computer
  without a store listing. Documented in 6.5, along with the unpacked Chrome
  route.
- Add price history links on each row: 🐪 for camelcamelcamel and **K** for
  Keepa. Both sites only cover some marketplaces (US, UK, DE, FR, IT, ES for our
  stores), so NL, SE, PL, BE and IE get no history link.
- Add an end-to-end smoke test against a real Firefox (`npm run test:e2e:firefox`,
  Marionette, headless) and `npm run start:firefox` / `start:chrome` to load the
  built extension in a browser.
- Choose the stores to compare in the options page: one checkbox per
  marketplace. All European stores are on by default, **amazon.com** is off
  (its prices exclude VAT and shipping, the row is marked as indicative).
- Loading feedback: a spinner while the first prices arrive, then a thin
  progress bar above the table, and a fixed popup width so the panel no longer
  resizes while rows are added.
- Cache the last comparison per ASIN (`chrome.storage.session`): reopening the
  popup on the same product shows the previous table immediately, and no
  request at all is made if it is less than two minutes old.
- Table alignment: prices right aligned with tabular figures, and the price
  history links in their own column on the right. `overflow: hidden` is gone
  from the cells: it was shrinking that last column to nothing.
- Security review fixes: drop the `https://ajax.googleapis.com/` host permission
  the extension no longer used (currency rates are constants), fetch the store
  pages with `credentials: 'omit'` and `referrerPolicy: 'no-referrer'`, and pin
  the version of the tooling run through `npx` (unpinned `npx --yes web-ext`
  ran whatever was latest that day). `npm run lint:bundle` guards the first two
  properties; `test/security.test.ts` the permissions and the pins.
- Stores that could not be compared are listed instead of disappearing:
  "not found" when the store answers without a parsable price (or 404),
  "loading failed" when the store cannot be reached at all. The reason is kept
  in the cache with the prices, and those rows keep their 🐪/K price history
  links: it is the only way to check the price there when our own fetch failed.
- A discreet ⟳ button below the table forces a refresh and bypasses the cache.
- Every link opens its tab and closes the popup, instead of leaving the panel
  open behind the new tab.
- redux-logger is only added in development builds, so the shipped popup no
  longer logs every action. The production build also aliases it to a no-op
  (`src/shims/redux-logger.ts`): the package is a UMD bundle referencing
  `global`, which made webpack emit a `new Function('return this')` helper that
  the Firefox linter reports as eval. The popup is 10 KiB lighter.
- `npm run lint:bundle` fails the release if a build ships `eval`, the
  `Function` constructor or redux-logger.
- Firefox manifest: `gecko_android.strict_min_version` 142, the first Android
  version that understands `data_collection_permissions`.

Known and accepted: `web-ext lint` still reports two `UNSAFE_VAR_ASSIGNMENT`
(innerHTML) warnings. They come from React DOM's internals (attribute
sanitization and `dangerouslySetInnerHTML` support), not from this code, and
are the usual false positives AMO reviewers accept.
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
