# CyberPath AI — Defensive Security Model & Ethical Safeguards

## 1. Ethical Boundaries & Scope

**CyberPath AI** is an educational and defensive cybersecurity planning tool designed to empower Security Operations Center (SOC) analysts and infrastructure architects.

### Strict Defensive Restrictions:
- **No Real Exploitation**: The platform never launches real exploits, shell payloads, or memory corruption scripts.
- **No Network Scanning**: The platform does not scan external or local IP addresses (e.g. no Nmap, Masscan, or port probes).
- **No Credential Attacks**: No brute-forcing, password spraying, or hash cracking.
- **No Malware Deployment**: No actual malware, persistence hooks, or rootkits.
- **Graph-Only Manipulation**: All attacks are purely mathematical graph traversals over synthetic node attributes.

---

## 2. Model Limitations & Academic Disclaimers

1. **Synthetic Environment Simplification**:
   Real-world cyber defense involves asynchronous human behaviors, zero-day vulnerabilities, non-deterministic system configurations, and dynamic deception technologies (honeypots). CyberPath AI models a simplified topological abstraction.

2. **Probabilistic Nature of Risk**:
   Risk scores and predicted next-hop probabilities are model estimates based on simulated features, not definitive factual predictions about specific threat actors.

3. **No Unrestricted LLM Control**:
   The AI Security Analyst layer only receives sanitized, structured JSON telemetry and never has direct shell, socket, or OS execution capabilities.
