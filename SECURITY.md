# Security Policy

## Supported Versions

Currently supported versions of the Vélib Big Data Pipeline:

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please follow these steps:

### 1. **Do NOT** open a public issue

Security vulnerabilities should be reported privately to avoid exploitation.

### 2. Contact the maintainers

Please report security issues via:
- **Email**: Open an issue with title "SECURITY: [Brief Description]" (we'll contact you privately)
- **GitHub Security Advisories**: Use GitHub's "Report a vulnerability" feature (if available)

### 3. Provide details

Include in your report:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### 4. Response timeline

- **Initial response**: Within 48 hours
- **Fix timeline**: Within 7-14 days (depending on severity)
- **Public disclosure**: After fix is released (coordinated disclosure)

## Security Best Practices

### For Users

1. **Never commit `.env` files** with real API keys
2. **Use `.env.example`** as a template
3. **Rotate API keys** regularly
4. **Keep Docker images updated**: `docker-compose pull && docker-compose up -d`
5. **Review `docker-compose.yml`** for exposed ports

### For Contributors

1. **No hardcoded secrets** in code
2. **Use environment variables** for sensitive data
3. **Validate all user inputs** in API endpoints
4. **Sanitize MongoDB queries** to prevent NoSQL injection
5. **Keep dependencies updated**: `npm audit fix`

## Known Security Considerations

### Development Environment

This project is designed for **development/educational purposes**. For production deployment:

- [ ] Enable MongoDB authentication (currently disabled in Docker Compose)
- [ ] Use HTTPS for frontend/backend
- [ ] Implement rate limiting on API endpoints
- [ ] Add authentication/authorization (JWT)
- [ ] Use Docker secrets for sensitive data
- [ ] Enable Spark security features
- [ ] Restrict HDFS permissions

### API Keys

- **JCDecaux API Key**: Free tier with rate limits (60 requests/minute)
- Store in `.env` file (never commit to Git)
- `.gitignore` already excludes `.env` files

## Acknowledgments

We thank the security researchers who help keep this project safe!
