# Security Best Practices in Python

Security is critical for any backend application. This chapter covers secure coding, handling secrets, input validation, and common vulnerabilities in Python.

---

## Secure Coding Practices
- Always handle exceptions properly.
- Use the principle of least privilege.
- Avoid using `eval` or `exec` on untrusted input.

---

## Handling Secrets
- Never hardcode secrets in code.
- Use environment variables or secret managers (e.g., AWS Secrets Manager).

---

## Input Validation
- Always validate and sanitize user input.
- Use libraries like `pydantic` or `marshmallow` for validation.

---

## Common Vulnerabilities
- **SQL Injection:** Use parameterized queries.
- **XSS:** Escape output in templates.
- **CSRF:** Use CSRF tokens in web forms.
- **Directory Traversal:** Sanitize file paths.

---

## Dependency Security
- Keep dependencies up to date.
- Use `pip-audit` or `safety` to scan for vulnerabilities.

---

## Best Practices
- Regularly review code for security issues.
- Use static analysis tools (e.g., `bandit`).
- Educate your team on secure coding.

---

Security is an ongoing process—stay updated on best practices and new vulnerabilities.