"""
Synthetic Organization & Infrastructure Generator for CyberPath AI
Generates realistic, configurable simulated IT environments (Small, Medium, Large)
with realistic asset topologies, services, CVEs, privileges, zones, and network connections.
"""
import random
import uuid
from typing import Dict, Any, List, Tuple

REALISTIC_CVES = [
    {"identifier": "CVE-2021-44228", "title": "Apache Log4j RCE (Log4Shell)", "severity": "Critical", "cvss": 10.0, "cwe": "CWE-502", "description": "Remote code execution in Log4j JNDI lookup parser."},
    {"identifier": "CVE-2023-38606", "title": "OpenSSH Privilege Escalation", "severity": "High", "cvss": 8.1, "cwe": "CWE-269", "description": "Improper privilege management allowing standard user escalation."},
    {"identifier": "CVE-2024-21413", "title": "Microsoft Outlook Remote Code Execution", "severity": "Critical", "cvss": 9.8, "cwe": "CWE-94", "description": "Moniker Link validation bypass leading to credential leakage and RCE."},
    {"identifier": "CVE-2022-22965", "title": "Spring Framework RCE (Spring4Shell)", "severity": "Critical", "cvss": 9.8, "cwe": "CWE-94", "description": "Class loader manipulation via DataBinder on JDK 9+."},
    {"identifier": "CVE-2023-4966", "title": "Citrix Bleed Buffer Overflow", "severity": "Critical", "cvss": 9.4, "cwe": "CWE-119", "description": "Sensitive session token leakage allowing authentication bypass."},
    {"identifier": "CVE-2020-1472", "title": "Zerologon Netlogon Privilege Escalation", "severity": "Critical", "cvss": 10.0, "cwe": "CWE-330", "description": "Flaw in Netlogon cryptographic authentication to compromise Active Directory."},
    {"identifier": "CVE-2023-28252", "title": "Windows CLFS Elevation of Privilege", "severity": "High", "cvss": 7.8, "cwe": "CWE-787", "description": "Common Log File System driver vulnerability exploited for local SYSTEM escalation."},
    {"identifier": "CVE-2022-0847", "title": "Linux Dirty Pipe Privilege Escalation", "severity": "High", "cvss": 7.8, "cwe": "CWE-269", "description": "Arbitrary file overwrite leading to root privilege acquisition."},
    {"identifier": "CVE-2024-3094", "title": "XZ Utils Backdoor", "severity": "Critical", "cvss": 10.0, "cwe": "CWE-506", "description": "Malicious upstream injection into liblzma impacting SSH daemon auth."},
    {"identifier": "CVE-2023-22515", "title": "Atlassian Confluence Privilege Escalation", "severity": "Critical", "cvss": 9.8, "cwe": "CWE-287", "description": "Broken access control enabling unauthorized administrator creation."},
    {"identifier": "CVE-2024-1709", "title": "ConnectWise ScreenConnect Auth Bypass", "severity": "Critical", "cvss": 10.0, "cwe": "CWE-287", "description": "Path traversal in setup wizard enabling full administrative takeover."},
    {"identifier": "CVE-2022-41040", "title": "Microsoft Exchange Server SSRF (ProxyNotShell)", "severity": "High", "cvss": 8.8, "cwe": "CWE-918", "description": "Server-side request forgery enabling authenticated remote code execution."}
]

def generate_synthetic_organization(
    size: str = "Medium",
    seed: int = 42,
    org_name: str = "TechCorp Enterprise"
) -> Dict[str, Any]:
    """
    Generates a full synthetic organization graph with reproducible seed.
    Sizes:
    - Small: ~12-15 assets
    - Medium: ~25-35 assets
    - Large: ~60-80 assets
    """
    random.seed(seed)
    org_id = str(uuid.uuid4())

    assets: List[Dict[str, Any]] = []
    connections: List[Dict[str, Any]] = []

    # 1. Base Entry Point: Internet
    internet_node = {
        "id": "asset-internet",
        "name": "Internet (External Threat Surface)",
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
    }
    assets.append(internet_node)

    # 2. Perimeter Gateway / Edge Firewall
    firewall_node = {
        "id": "asset-edge-fw",
        "name": "Perimeter-NGFW-01",
        "type": "Firewall",
        "os": "PaloAlto PAN-OS",
        "criticality": "High",
        "internet_exposed": True,
        "privilege_level": "Admin",
        "zone": "DMZ",
        "ip_address": "198.51.100.1",
        "services": ["HTTPS", "BGP", "IPsec VPN"],
        "vulnerabilities": [random.choice(REALISTIC_CVES)],
        "security_controls": ["IPS", "Stateful Inspection"]
    }
    assets.append(firewall_node)
    connections.append({
        "source": internet_node["id"],
        "target": firewall_node["id"],
        "connection_type": "Network",
        "port": 443,
        "protocol": "HTTPS",
        "authentication_required": False
    })

    # Determine counts based on size
    if size.lower() == "small":
        web_count = 2
        app_count = 2
        db_count = 1
        workstation_count = 4
        admin_count = 1
        dc_count = 1
    elif size.lower() == "large":
        web_count = 6
        app_count = 8
        db_count = 4
        workstation_count = 25
        admin_count = 4
        dc_count = 2
    else:  # Medium
        web_count = 3
        app_count = 4
        db_count = 2
        workstation_count = 10
        admin_count = 2
        dc_count = 1

    # 3. Web DMZ Servers
    web_servers = []
    for i in range(1, web_count + 1):
        vuln_sample = random.sample(REALISTIC_CVES, k=random.randint(1, 2))
        web_asset = {
            "id": f"asset-web-{i:02d}",
            "name": f"DMZ-Web-Server-{i:02d}",
            "type": "Web Server",
            "os": "Ubuntu Linux 22.04",
            "criticality": "Medium",
            "internet_exposed": True,
            "privilege_level": "User",
            "zone": "DMZ",
            "ip_address": f"198.51.100.1{i}",
            "services": ["HTTPS (443)", "HTTP (80)", "Nginx/1.24"],
            "vulnerabilities": vuln_sample,
            "security_controls": ["WAF", "TLS 1.3"]
        }
        assets.append(web_asset)
        web_servers.append(web_asset)
        
        # Connect Firewall -> Web Server
        connections.append({
            "source": firewall_node["id"],
            "target": web_asset["id"],
            "connection_type": "Network",
            "port": 443,
            "protocol": "HTTPS",
            "authentication_required": False
        })
        # Connect Internet -> Web Server directly (via exposed NAT)
        connections.append({
            "source": internet_node["id"],
            "target": web_asset["id"],
            "connection_type": "Network",
            "port": 443,
            "protocol": "HTTPS",
            "authentication_required": False
        })

    # 4. Application Servers (Internal Zone)
    app_servers = []
    for i in range(1, app_count + 1):
        vuln_sample = random.sample(REALISTIC_CVES, k=random.randint(0, 2))
        app_asset = {
            "id": f"asset-app-{i:02d}",
            "name": f"Internal-App-Svc-{i:02d}",
            "type": "Application Server",
            "os": "Red Hat Enterprise Linux 9",
            "criticality": "High",
            "internet_exposed": False,
            "privilege_level": "Elevated",
            "zone": "Internal",
            "ip_address": f"10.0.10.2{i}",
            "services": ["gRPC (50051)", "Java/Spring API (8080)", "SSH (22)"],
            "vulnerabilities": vuln_sample,
            "security_controls": ["EDR"]
        }
        assets.append(app_asset)
        app_servers.append(app_asset)

        # Connect Web Servers to App Servers
        for web in web_servers:
            if random.random() < 0.75:
                connections.append({
                    "source": web["id"],
                    "target": app_asset["id"],
                    "connection_type": "API",
                    "port": 8080,
                    "protocol": "HTTP/REST",
                    "authentication_required": random.choice([True, False])
                })

    # 5. Database Cluster & Sensitive Data
    databases = []
    for i in range(1, db_count + 1):
        vuln_sample = random.sample(REALISTIC_CVES, k=random.randint(0, 1))
        db_asset = {
            "id": f"asset-db-{i:02d}",
            "name": f"Secure-Database-Cluster-{i:02d}",
            "type": "Database",
            "os": "Oracle Enterprise Linux",
            "criticality": "Critical",
            "internet_exposed": False,
            "privilege_level": "Admin",
            "zone": "Secure Zone",
            "ip_address": f"10.0.20.1{i}",
            "services": ["PostgreSQL (5432)", "MySQL (3306)", "Encrypted Storage"],
            "vulnerabilities": vuln_sample,
            "security_controls": ["Database Activity Monitoring", "MFA Admin", "Network Segmentation"]
        }
        assets.append(db_asset)
        databases.append(db_asset)

        # Connect App Servers to Database
        for app in app_servers:
            connections.append({
                "source": app["id"],
                "target": db_asset["id"],
                "connection_type": "HasAccessTo",
                "port": 5432,
                "protocol": "PostgreSQL",
                "authentication_required": True,
                "privilege_required": "User"
            })

    # 6. Sensitive Data Repository Asset
    sensitive_data = {
        "id": "asset-sensitive-data",
        "name": "Customer PII & Financial Vault",
        "type": "Sensitive Data",
        "os": "Data Warehouse",
        "criticality": "Critical",
        "internet_exposed": False,
        "privilege_level": "SYSTEM/Root",
        "zone": "Secure Zone",
        "ip_address": "10.0.20.99",
        "services": ["Encrypted Data Store", "PCI-DSS Enclave"],
        "vulnerabilities": [],
        "security_controls": ["HSM Encryption", "Zero Trust Access"]
    }
    assets.append(sensitive_data)
    for db in databases:
        connections.append({
            "source": db["id"],
            "target": sensitive_data["id"],
            "connection_type": "HasAccessTo",
            "port": 0,
            "protocol": "Internal Storage",
            "authentication_required": True,
            "privilege_required": "Admin"
        })

    # 7. Internal Workstations & Employees
    workstations = []
    for i in range(1, workstation_count + 1):
        vuln_sample = random.sample(REALISTIC_CVES, k=random.randint(0, 1)) if random.random() < 0.6 else []
        ws_asset = {
            "id": f"asset-pc-{i:02d}",
            "name": f"Corporate-Workstation-{i:02d}",
            "type": "Workstation",
            "os": "Windows 11 Enterprise",
            "criticality": "Low",
            "internet_exposed": False,
            "privilege_level": "User",
            "zone": "Internal LAN",
            "ip_address": f"10.0.100.{10+i}",
            "services": ["RDP (3389)", "SMB (445)", "WinRM (5985)"],
            "vulnerabilities": vuln_sample,
            "security_controls": ["EDR Agent", "BitLocker"]
        }
        assets.append(ws_asset)
        workstations.append(ws_asset)

    # 8. File Server
    file_server = {
        "id": "asset-fileserver",
        "name": "Corporate-File-Server-01",
        "type": "Server",
        "os": "Windows Server 2022",
        "criticality": "Medium",
        "internet_exposed": False,
        "privilege_level": "Elevated",
        "zone": "Internal LAN",
        "ip_address": "10.0.100.5",
        "services": ["SMB/CIFS (445)", "NFS (2049)"],
        "vulnerabilities": [random.choice(REALISTIC_CVES)],
        "security_controls": ["EDR"]
    }
    assets.append(file_server)
    for ws in workstations[:min(len(workstations), 6)]:
        connections.append({
            "source": ws["id"],
            "target": file_server["id"],
            "connection_type": "Network",
            "port": 445,
            "protocol": "SMB",
            "authentication_required": True
        })

    # 9. Admin PC & Domain Controller
    admin_pcs = []
    for i in range(1, admin_count + 1):
        admin_asset = {
            "id": f"asset-admin-{i:02d}",
            "name": f"SecOps-Admin-Workstation-{i:02d}",
            "type": "Admin PC",
            "os": "Windows 11 Enterprise",
            "criticality": "High",
            "internet_exposed": False,
            "privilege_level": "Admin",
            "zone": "Management Zone",
            "ip_address": f"10.0.50.{10+i}",
            "services": ["SSH", "RDP", "RSAT"],
            "vulnerabilities": [random.choice(REALISTIC_CVES)] if random.random() < 0.5 else [],
            "security_controls": ["EDR", "MFA", "Privileged Access Management"]
        }
        assets.append(admin_asset)
        admin_pcs.append(admin_asset)
        
        # Connect File Server or Workstation to Admin PC (simulated credential pivot / shared session)
        connections.append({
            "source": file_server["id"],
            "target": admin_asset["id"],
            "connection_type": "AdminAccess",
            "port": 3389,
            "protocol": "RDP",
            "authentication_required": True,
            "privilege_required": "Admin"
        })

    # 10. Domain Controllers
    for i in range(1, dc_count + 1):
        dc_asset = {
            "id": f"asset-dc-{i:02d}",
            "name": f"Core-ActiveDirectory-DC-{i:02d}",
            "type": "Domain Controller",
            "os": "Windows Server 2022 Active Directory",
            "criticality": "Critical",
            "internet_exposed": False,
            "privilege_level": "SYSTEM/Root",
            "zone": "Management Zone",
            "ip_address": f"10.0.50.2{i}",
            "services": ["Kerberos (88)", "LDAP (389)", "RPC (135)", "DNS (53)"],
            "vulnerabilities": [random.choice(REALISTIC_CVES)] if random.random() < 0.7 else [],
            "security_controls": ["EDR", "Domain Controller Audit Monitoring"]
        }
        assets.append(dc_asset)
        for admin in admin_pcs:
            connections.append({
                "source": admin["id"],
                "target": dc_asset["id"],
                "connection_type": "AdminAccess",
                "port": 88,
                "protocol": "Kerberos",
                "authentication_required": True,
                "privilege_required": "Admin"
            })
        for app in app_servers[:2]:
            connections.append({
                "source": dc_asset["id"],
                "target": app["id"],
                "connection_type": "Communicates",
                "port": 389,
                "protocol": "LDAP",
                "authentication_required": True
            })

    return {
        "org_id": org_id,
        "name": f"{org_name} ({size})",
        "industry": "Fintech / Cloud Infrastructure",
        "description": f"Simulated synthetic infrastructure with {len(assets)} assets and {len(connections)} connections.",
        "assets": assets,
        "connections": connections
    }
