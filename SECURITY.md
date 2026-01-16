# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.1.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Recent Security Updates

### January 2026 - Dependency Vulnerabilities Fixed

**Critical vulnerabilities patched:**

1. **Gunicorn 21.2.0 → 22.0.0**
   - CVE: HTTP Request/Response Smuggling vulnerability
   - CVE: Request smuggling leading to endpoint restriction bypass
   - Impact: HIGH - Could allow attackers to bypass security controls
   - Resolution: Updated to gunicorn 22.0.0

2. **python-multipart 0.0.6 → 0.0.18**
   - CVE: Denial of service (DoS) via malformed multipart/form-data boundary
   - CVE: Content-Type Header ReDoS vulnerability
   - Impact: HIGH - Could cause service disruption
   - Resolution: Updated to python-multipart 0.0.18

**Action Required:** Update dependencies immediately:
```bash
cd backend
pip install -r requirements-prod.txt --upgrade
```

## Reporting a Vulnerability

If you discover a security vulnerability in SimTS, please report it responsibly:

**Email:** trabajo.social@uaysen.cl

**Response Time:** We aim to respond within 48 hours.

### What to Include

Please include the following information in your report:

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Suggested fix (if any)

### What to Expect

1. **Acknowledgment:** We will acknowledge receipt of your vulnerability report within 48 hours.
2. **Investigation:** We will investigate the issue and determine its severity.
3. **Fix:** We will work on a fix and keep you updated on progress.
4. **Disclosure:** Once fixed, we will coordinate disclosure timing with you.

## Security Best Practices

### For Developers

1. **Never commit secrets** to the repository (API keys, passwords, etc.)
2. **Use environment variables** for sensitive configuration
3. **Keep dependencies updated** - run `npm audit` and `pip-audit` regularly
4. **Follow secure coding practices** - input validation, output encoding, proper error handling

### For Deployment

1. **Use HTTPS** in production
2. **Set strong CORS policies** - restrict allowed origins
3. **Enable rate limiting** - already configured in the application
4. **Use strong passwords** - especially for database and admin accounts
5. **Keep backups** - regular database backups are essential
6. **Monitor logs** - review application logs for suspicious activity

### Environment Variables

Required environment variables for secure deployment:

**Backend:**
- `OPENAI_API_KEY` - Your OpenAI API key
- `ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins
- `SIMTS_DB_PATH` - Path to SQLite database
- `ENVIRONMENT` - Set to 'production' in production

**Frontend:**
- `VITE_API_URL` - Backend API URL (must be HTTPS in production)

## Security Features

SimTS includes the following security features:

### Backend Security

- ✅ **Password Hashing:** bcrypt for secure password storage
- ✅ **Rate Limiting:** Protection against brute force attacks
  - Login endpoint: 5 requests/minute per IP
  - Simulate endpoint: 10 requests/minute per IP
- ✅ **Input Validation:** Pydantic models with validators
- ✅ **Output Sanitization:** Sanitization of OpenAI responses
- ✅ **Security Headers:** HSTS, CSP, X-Frame-Options, etc.
- ✅ **CORS Configuration:** Allowlist-based CORS policy
- ✅ **SQL Injection Prevention:** Parameterized queries
- ✅ **Database Indexes:** Performance and security optimization

### Frontend Security

- ✅ **Secure Storage:** Encrypted localStorage for sensitive data
- ✅ **Input Sanitization:** XSS prevention
- ✅ **Session Management:** Auto-logout after 30 minutes of inactivity
- ✅ **Request Timeout:** 30-second default timeout
- ✅ **Retry Logic:** Exponential backoff for failed requests
- ✅ **Error Handling:** Specific handling for 429 (rate limit) and 503 (unavailable)

## Known Security Considerations

### Database

- SQLite is used for simplicity but consider PostgreSQL for larger deployments
- Database file should have restricted permissions (600 or 640)
- Regular backups are recommended

### API Keys

- OpenAI API key should be kept secure
- Consider using API key rotation policies
- Monitor API usage for anomalies

### Session Management

- Basic token-based authentication is implemented
- Consider implementing JWT with refresh tokens for production
- Sessions expire after 30 minutes of inactivity

## Security Checklist for Production

- [ ] HTTPS enabled with valid SSL certificate
- [ ] ALLOWED_ORIGINS set to specific domains (not *)
- [ ] Strong passwords for all accounts
- [ ] Database file has restricted permissions
- [ ] Regular security updates applied
- [ ] Logs monitored regularly
- [ ] Backup strategy in place
- [ ] Rate limiting tested and working
- [ ] Security headers verified
- [ ] OpenAI API key secured
- [ ] Environment variables properly set
- [ ] npm audit and pip-audit run and issues resolved

## Updates and Maintenance

We regularly update dependencies and address security vulnerabilities. To stay secure:

1. Watch this repository for security updates
2. Subscribe to security advisories
3. Update dependencies regularly
4. Review and test security patches

## Compliance

SimTS is designed with security best practices in mind, but deployers are responsible for:

- Ensuring compliance with local data protection regulations
- Implementing appropriate access controls
- Maintaining audit logs
- Conducting regular security assessments

## Contact

For security-related questions or concerns:

**Email:** trabajo.social@uaysen.cl
**Repository:** https://github.com/estebancofre-coy/simts

---

**Last Updated:** January 2026
**Version:** 1.1.0
