## 2024-03-27 - Cross-Site Scripting (XSS) Vulnerability in ChatWidget
**Vulnerability:** Found an XSS vulnerability in the ChatWidget component where user input was rendered using dangerouslySetInnerHTML after some basic string replacement.
**Learning:** Basic string replacement is not sufficient to prevent XSS. It's crucial to use robust sanitization libraries or native React features to render user input.
**Prevention:** Avoid using dangerouslySetInnerHTML whenever possible. If it must be used, always sanitize the input thoroughly using a reliable library like DOMPurify.
