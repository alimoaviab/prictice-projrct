import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement these — stub them so components that rely on
// browser-only APIs don't crash during tests.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
