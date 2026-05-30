## 2025-05-30 - [XSS] Fix dangerouslySetInnerHTML usage without sanitization
**Vulnerability:** Several React components use `dangerouslySetInnerHTML` to render user-provided question HTML without sanitizing it first. This exposes the application to Cross-Site Scripting (XSS) attacks.
**Learning:** Raw user input (like question text) needs to be sanitized before being rendered as HTML in React. DOMPurify is the recommended library for this.
**Prevention:** Use DOMPurify (`DOMPurify.sanitize()`) whenever rendering raw HTML strings in React, especially from untrusted sources like question banks.
