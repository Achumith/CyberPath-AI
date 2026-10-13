"""
Pre-seeded "CyberTech Demo" Organization for CyberPath AI.
Includes a complete simulated corporate network topology with realistic CVEs,
privilege mappings, services, and attack paths ready on first launch.
"""
from typing import Dict, Any, List

CYBERTECH_DEMO_DATA: Dict[str, Any] = {
    "org_id": "demo-cybertech-01",
    "name": "CyberTech Enterprise Demo",
    "industry": "Financial Technology & Cloud Services",
    "description": "Pre-configured synthetic enterprise infrastructure modeling external perimeter, DMZ web services, internal app tier, Active Directory management, and encrypted database vault.",
    "assets": [
        {
            "id": "asset-internet",
            "name": "Internet (External Threat Actor)",
            "type": "Internet",
            "os": "External Network",
            "criticality": "Low",
            "internet_exposed": True,
            "privilege_level": "None",
            "zone": "External",
            "ip_address": "0.0.0.0/0",
            "services": ["BGP", "DNS"],
            "vulnerabilities": [],
            "security_controls": []
        },
        {
            "id": "asset-edge-fw",
            "name": "Perimeter Next-Gen Firewall",
            "type": "Firewall",
            "os": "Palo Alto PAN-OS 11",
            "criticality": "High",
            "internet_exposed": True,
            "privilege_level": "Admin",
            "zone": "DMZ",
            "ip_address": "198.51.100.1",
            "services": ["HTTPS (443)", "IPsec Gateway", "Stateful Inspection"],
            "vulnerabilities": [
                {
                    "id": "vuln-fw-01",
                    "identifier": "CVE-2023-4966",
                    "title": "Citrix Bleed Sensitive Info Leak",
                    "severity": "Critical",
                    "cvss": 9.4,
                    "cwe": "CWE-119",
                    "description": "Session token leakage allowing unauthenticated perimeter bypass.",
                    "exploitability": 0.95
                }
            ],
            "security_controls": ["WAF", "Stateful Firewall", "IPS"]
        },
        {
            "id": "asset-web-01",
            "name": "Customer-Portal-Web-01",
            "type": "Web Server",
            "os": "Ubuntu Linux 22.04 LTS",
            "criticality": "Medium",
            "internet_exposed": True,
            "privilege_level": "User",
            "zone": "DMZ",
            "ip_address": "198.51.100.10",
            "services": ["HTTPS (443)", "HTTP (80)", "Nginx/1.24", "Node.js App"],
            "vulnerabilities": [
                {
                    "id": "vuln-web-01",
                    "identifier": "CVE-2021-44228",
                    "title": "Apache Log4j RCE (Log4Shell)",
                    "severity": "Critical",
                    "cvss": 10.0,
                    "cwe": "CWE-502",
                    "description": "Unauthenticated remote code execution via JNDI lookup string injection in user headers.",
                    "exploitability": 0.98
                }
            ],
            "security_controls": ["WAF", "TLS 1.3"]
        },
        {
            "id": "asset-app-01",
            "name": "Payments-Core-AppServer-01",
            "type": "Application Server",
            "os": "Red Hat Enterprise Linux 9",
            "criticality": "High",
            "internet_exposed": False,
            "privilege_level": "Elevated",
            "zone": "Internal App Tier",
            "ip_address": "10.0.10.20",
            "services": ["Spring Boot API (8080)", "gRPC (50051)", "SSH (22)"],
            "vulnerabilities": [
                {
                    "id": "vuln-app-01",
                    "identifier": "CVE-2022-22965",
                    "title": "Spring Framework RCE (Spring4Shell)",
                    "severity": "Critical",
                    "cvss": 9.8,
                    "cwe": "CWE-94",
                    "description": "DataBinder class loader manipulation allowing arbitrary payload deployment.",
                    "exploitability": 0.85
                }
            ],
            "security_controls": ["EDR Agent"]
        },
        {
            "id": "asset-db-01",
            "name": "Production-PostgreSQL-Cluster-01",
            "type": "Database",
            "os": "Oracle Enterprise Linux 8.8",
            "criticality": "Critical",
            "internet_exposed": False,
            "privilege_level": "Admin",
            "zone": "Secure Data Zone",
            "ip_address": "10.0.20.15",
            "services": ["PostgreSQL (5432)", "pg_stat_statements", "SSL TLS Encrypted"],
            "vulnerabilities": [
                {
                    "id": "vuln-db-01",
                    "identifier": "CVE-2023-38606",
                    "title": "Local Privilege Escalation in DB Daemon",
                    "severity": "High",
                    "cvss": 7.8,
                    "cwe": "CWE-269",
                    "description": "Improper sanitization allows authenticated low-privilege users to escalate to db superuser.",
                    "exploitability": 0.70
                }
            ],
            "security_controls": ["Database Activity Monitoring", "MFA Admin", "Network Segmentation"]
        },
        {
            "id": "asset-sensitive-data",
            "name": "Customer Financial & PII Vault",
            "type": "Sensitive Data",
            "os": "Encrypted Data Warehouse",
            "criticality": "Critical",
            "internet_exposed": False,
            "privilege_level": "SYSTEM/Root",
            "zone": "Secure Data Zone",
            "ip_address": "10.0.20.99",
            "services": ["PCI-DSS Enclave", "HSM Encryption Key Store"],
            "vulnerabilities": [],
            "security_controls": ["HSM Hardware Security Module", "Zero Trust Isolation"]
        },
        {
            "id": "asset-pc-01",
            "name": "Finance-Officer-Workstation-01",
            "type": "Workstation",
            "os": "Windows 11 Enterprise",
            "criticality": "Low",
            "internet_exposed": False,
            "privilege_level": "User",
            "zone": "Internal LAN",
            "ip_address": "10.0.100.12",
            "services": ["RDP (3389)", "SMB (445)", "WinRM (5985)"],
            "vulnerabilities": [
                {
                    "id": "vuln-pc-01",
                    "identifier": "CVE-2024-21413",
                    "title": "Microsoft Outlook RCE Moniker Vulnerability",
                    "severity": "Critical",
                    "cvss": 9.8,
                    "cwe": "CWE-94",
                    "description": "Phishing-delivered malicious hyperlink bypasses Protected View to leak NTLM hashes and execute code.",
                    "exploitability": 0.90
                }
            ],
            "security_controls": ["EDR Agent", "BitLocker"]
        },
        {
            "id": "asset-pc-02",
            "name": "Support-Staff-Workstation-02",
            "type": "Workstation",
            "os": "Windows 11 Enterprise",
            "criticality": "Low",
            "internet_exposed": False,
            "privilege_level": "User",
            "zone": "Internal LAN",
            "ip_address": "10.0.100.14",
            "services": ["RDP (3389)", "SMB (445)"],
            "vulnerabilities": [],
            "security_controls": ["EDR Agent"]
        },
        {
            "id": "asset-fileserver",
            "name": "Internal-File-Server-01",
            "type": "Server",
            "os": "Windows Server 2022",
            "criticality": "Medium",
            "internet_exposed": False,
            "privilege_level": "Elevated",
            "zone": "Internal LAN",
            "ip_address": "10.0.100.5",
            "services": ["SMB/CIFS (445)", "NFS (2049)"],
            "vulnerabilities": [
                {
                    "id": "vuln-fs-01",
                    "identifier": "CVE-2020-1472",
                    "title": "Unauthenticated Credential Forwarding in SMB Session",
                    "severity": "High",
                    "cvss": 8.5,
                    "cwe": "CWE-287",
                    "description": "Allows relaying captured NTLM hashes to internal management services.",
                    "exploitability": 0.80
                }
            ],
            "security_controls": ["EDR Agent"]
        },
        {
            "id": "asset-admin-01",
            "name": "SecOps-Admin-Privileged-Workstation",
            "type": "Admin PC",
            "os": "Windows 11 Enterprise",
            "criticality": "High",
            "internet_exposed": False,
            "privilege_level": "Admin",
            "zone": "Management Zone",
            "ip_address": "10.0.50.10",
            "services": ["SSH", "RDP (3389)", "Active Directory RSAT Tools"],
            "vulnerabilities": [
                {
                    "id": "vuln-admin-01",
                    "identifier": "CVE-2023-28252",
                    "title": "Windows CLFS Elevation of Privilege",
                    "severity": "High",
                    "cvss": 7.8,
                    "cwe": "CWE-787",
                    "description": "Local privilege escalation to SYSTEM via manipulated base log files.",
                    "exploitability": 0.75
                }
            ],
            "security_controls": ["EDR Agent", "MFA", "Privileged Access Management"]
        },
        {
            "id": "asset-dc-01",
            "name": "Primary-Domain-Controller-AD",
            "type": "Domain Controller",
            "os": "Windows Server 2022 Active Directory",
            "criticality": "Critical",
            "internet_exposed": False,
            "privilege_level": "SYSTEM/Root",
            "zone": "Management Zone",
            "ip_address": "10.0.50.20",
            "services": ["Kerberos (88)", "LDAP (389)", "RPC (135)", "DNS (53)"],
            "vulnerabilities": [
                {
                    "id": "vuln-dc-01",
                    "identifier": "CVE-2020-1472",
                    "title": "Zerologon Netlogon Cryptographic Flaw",
                    "severity": "Critical",
                    "cvss": 10.0,
                    "cwe": "CWE-330",
                    "description": "Allows an unauthenticated attacker to set domain controller computer password to empty string.",
                    "exploitability": 0.95
                }
            ],
            "security_controls": ["EDR Agent", "Active Directory Security Auditing"]
        }
    ],
    "connections": [
        {"source": "asset-internet", "target": "asset-edge-fw", "connection_type": "Network", "port": 443, "protocol": "HTTPS", "authentication_required": False},
        {"source": "asset-internet", "target": "asset-web-01", "connection_type": "Network", "port": 443, "protocol": "HTTPS", "authentication_required": False},
        {"source": "asset-edge-fw", "target": "asset-web-01", "connection_type": "Network", "port": 443, "protocol": "HTTPS", "authentication_required": False},
        {"source": "asset-web-01", "target": "asset-app-01", "connection_type": "API", "port": 8080, "protocol": "HTTP/REST", "authentication_required": False},
        {"source": "asset-app-01", "target": "asset-db-01", "connection_type": "HasAccessTo", "port": 5432, "protocol": "PostgreSQL", "authentication_required": True, "privilege_required": "User"},
        {"source": "asset-db-01", "target": "asset-sensitive-data", "connection_type": "HasAccessTo", "port": 0, "protocol": "Internal Storage", "authentication_required": True, "privilege_required": "Admin"},
        {"source": "asset-pc-01", "target": "asset-fileserver", "connection_type": "Network", "port": 445, "protocol": "SMB", "authentication_required": True},
        {"source": "asset-pc-02", "target": "asset-fileserver", "connection_type": "Network", "port": 445, "protocol": "SMB", "authentication_required": True},
        {"source": "asset-fileserver", "target": "asset-admin-01", "connection_type": "AdminAccess", "port": 3389, "protocol": "RDP", "authentication_required": True, "privilege_required": "Admin"},
        {"source": "asset-admin-01", "target": "asset-dc-01", "connection_type": "AdminAccess", "port": 88, "protocol": "Kerberos", "authentication_required": True, "privilege_required": "Admin"},
        {"source": "asset-dc-01", "target": "asset-app-01", "connection_type": "Communicates", "port": 389, "protocol": "LDAP", "authentication_required": True},
        {"source": "asset-app-01", "target": "asset-sensitive-data", "connection_type": "HasAccessTo", "port": 443, "protocol": "Internal API", "authentication_required": True, "privilege_required": "Elevated"}
    ]
}
