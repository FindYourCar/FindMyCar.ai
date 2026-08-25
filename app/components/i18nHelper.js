// Tiny translation helper for the standalone home-page sections, which are not
// wired into the main TRANSLATIONS dictionary. Pass the active language code and
// get a `tr(uk, en)` picker. Ukrainian is the demo language; every other
// language falls back to the existing English copy, so nothing breaks.
export function mkTr(lang) {
  return (uk, en) => (lang === "UK" ? uk : en);
}
