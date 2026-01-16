# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of SimTS seriously. If you believe you have found a security vulnerability, please report it to us as described below.

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to the project maintainers. You should receive a response within 48 hours.

Please include the following information in your report:

- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit the issue

## Security Updates Implemented

### Authentication & Authorization
- ✅ **Password Hashing**: All passwords are hashed using bcrypt with automatic salt generation
- ✅ **JWT Tokens**: Secure token-based authentication with configurable expiration (default: 30 minutes)
- ✅ **Rate Limiting**: Login endpoint limited to 5 requests per minute to prevent brute force attacks
- ✅ **Input Validation**: Pydantic validators enforce username and password requirements

### CORS Configuration
- ✅ **Restricted Origins**: CORS configured to allow only specific origins via `ALLOWED_ORIGINS` environment variable
- ✅ **Credential Control**: Explicit allow_credentials setting for cookie-based authentication
- ✅ **Method Restrictions**: Only necessary HTTP methods are allowed

### Database Security
- ✅ **Indexed Queries**: Database indexes on sensitive tables improve query performance and reduce DoS risk
- ✅ **Connection Management**: Proper connection handling with context managers prevents resource leaks
- ✅ **Backward Compatibility**: Legacy SHA256 hashes supported during migration period

### API Security
- ✅ **Rate Limiting**: OpenAI API endpoints limited to 10 requests per minute
- ✅ **Error Handling**: Proper exception handling prevents information leakage
- ✅ **Monitoring**: Prometheus metrics exposed for security monitoring

### Session Management
- ⚠️ **Session Storage**: Currently using sessionStorage (client-side) - Consider implementing HttpOnly cookies for production
- ✅ **Token Expiration**: JWT tokens expire after 30 minutes

## Security Best Practices for Deployment

### Environment Variables
Always set the following environment variables in production:

```bash
# REQUIRED: Generate a strong secret key
JWT_SECRET_KEY=$(python -c "import secrets; print(secrets.token_urlsafe(32))")

# REQUIRED: Set specific allowed origins
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# REQUIRED: Set your OpenAI API key
OPENAI_API_KEY=your_actual_api_key_here
```

### Database
- Keep database backups secure and encrypted
- Use file system permissions to protect the database file
- Consider using PostgreSQL or MySQL for production instead of SQLite

### Docker
- Run containers with least privilege
- Use secrets management for sensitive environment variables
- Keep base images updated

### Monitoring
- Monitor the `/metrics` endpoint for unusual activity
- Set up alerts for rate limit violations
- Review logs regularly for security incidents

## Known Limitations

1. **SQLite**: Using SQLite for production may have performance and concurrency limitations. Consider PostgreSQL for production.
2. **Client-side storage**: Tokens stored in sessionStorage - consider HttpOnly cookies for enhanced security
3. **Rate limiting by IP**: Current rate limiting uses IP address which may not work correctly behind proxies

## Security Checklist for Production

- [ ] Change `JWT_SECRET_KEY` from default value
- [ ] Configure `ALLOWED_ORIGINS` with specific domains
- [ ] Enable HTTPS/TLS
- [ ] Set up proper logging and monitoring
- [ ] Configure backup strategy
- [ ] Review and update dependencies regularly
- [ ] Run security scans (bandit, npm audit) before deployment
- [ ] Implement proper error handling and logging
- [ ] Set up rate limiting at reverse proxy level
- [ ] Use environment-specific configurations

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [bcrypt Documentation](https://github.com/pyca/bcrypt/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
