# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in QuestCoin smart contracts or the web application, please report it responsibly.

### Do NOT
- Open a public GitHub issue
- Disclose the vulnerability publicly before it's fixed
- Exploit the vulnerability

### DO
- Email details to the maintainers privately
- Include steps to reproduce
- Allow reasonable time for a fix

## Smart Contract Security

### Audits
- Contracts use battle-tested OpenZeppelin libraries
- Manual security review completed

### Security Features
- ReentrancyGuard on all state-changing functions
- Pausable contracts for emergency response
- Owner-only admin functions
- Max supply cap prevents inflation
- Minter whitelist restricts token creation

## Bug Bounty

We appreciate responsible disclosure. Significant vulnerabilities may be eligible for rewards based on severity and impact.
