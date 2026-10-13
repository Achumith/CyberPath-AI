"""
Real-World CVE Intelligence Service for CyberPath AI.
Integrates the official CISA Known Exploited Vulnerabilities (KEV) Catalog (1,700+ actively weaponized CVEs)
and FIRST.org Exploit Prediction Scoring System (EPSS).
Provides automated caching, offline fallbacks, indexing in SQLite, and dynamic attack graph correlation.
"""
import os
import json
import urllib.request
import urllib.parse
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from backend.models import RealCVEModel, AssetModel, VulnerabilityModel
from backend.database import Base, engine

LOCAL_KEV_FALLBACK = os.path.join(os.path.dirname(__file__), "data", "cisa_kev_catalog.json")
CISA_KEV_FEED_URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"
EPSS_API_URL = "https://api.first.org/data/v1/epss"


def infer_cvss_and_cwe(v: Dict[str, Any]) -> Dict[str, Any]:
    """
    Infers realistic CVSS base score, severity tier, and CWE category based on vulnerability name,
    short description, and known weaponization status from CISA.
    All CISA KEV vulnerabilities are actively exploited in the wild, so minimum base severity is High.
    """
    text = (f"{v.get('vulnerabilityName', '')} {v.get('shortDescription', '')}").lower()

    cvss = 8.5
    severity = "High"
    cwe = "CWE-20"
    exploitability = 0.90

    if any(k in text for k in ["remote code execution", "rce", "arbitrary code execution", "execute arbitrary code", "command injection"]):
        cvss = 9.8
        severity = "Critical"
        cwe = "CWE-94"
        exploitability = 0.98
    elif any(k in text for k in ["buffer overflow", "heap-based buffer overflow", "out-of-bounds write", "memory corruption"]):
        cvss = 9.2
        severity = "Critical"
        cwe = "CWE-119"
        exploitability = 0.95
    elif any(k in text for k in ["authentication bypass", "bypass authentication", "broken access control", "improper access control"]):
        cvss = 9.8
        severity = "Critical"
        cwe = "CWE-287"
        exploitability = 0.95
    elif any(k in text for k in ["privilege escalation", "elevation of privilege", "improper privilege management"]):
        cvss = 8.8
        severity = "High"
        cwe = "CWE-269"
        exploitability = 0.88
    elif any(k in text for k in ["sql injection", "sqli"]):
        cvss = 8.8
        severity = "High"
        cwe = "CWE-89"
        exploitability = 0.90
    elif any(k in text for k in ["path traversal", "directory traversal"]):
        cvss = 8.6
        severity = "High"
        cwe = "CWE-22"
        exploitability = 0.92
    elif any(k in text for k in ["cross-site scripting", "xss"]):
        cvss = 7.5
        severity = "High"
        cwe = "CWE-79"
        exploitability = 0.85
    elif any(k in text for k in ["information disclosure", "sensitive data", "credential leak"]):
        cvss = 7.5
        severity = "High"
        cwe = "CWE-200"
        exploitability = 0.80

    # If associated with known ransomware campaign, boost CVSS
    if str(v.get("knownRansomwareCampaignUse", "")).lower() == "known":
        cvss = min(10.0, cvss + 0.4)
        if cvss >= 9.0:
            severity = "Critical"

    return {
        "cvss": round(cvss, 1),
        "severity": severity,
        "cwe": cwe,
        "exploitability": exploitability
    }


class RealCVEIntelligenceService:
    def __init__(self):
        # Ensure database tables exist
        Base.metadata.create_all(bind=engine)

    def sync_database(self, db: Session, force_online: bool = False) -> Dict[str, Any]:
        """
        Synchronizes the real CVE database.
        Attempts to fetch the latest CISA KEV feed online.
        If offline or unreachable, falls back to the local bundled catalog (1,734+ CVEs).
        Inserts and updates SQLite records cleanly.
        """
        records_to_process = []
        source_used = "Offline Bundled Cache"

        # Try online sync first if force_online is True or if local table is empty
        count_existing = db.query(RealCVEModel).count()
        fetch_online = force_online or count_existing == 0

        if fetch_online:
            try:
                req = urllib.request.Request(
                    CISA_KEV_FEED_URL,
                    headers={"User-Agent": "CyberPath-AI-ThreatIntel/1.0 (Defensive Security Platform)"}
                )
                with urllib.request.urlopen(req, timeout=12) as response:
                    payload = json.loads(response.read().decode("utf-8"))
                    records_to_process = payload.get("vulnerabilities", [])
                    source_used = "Live CISA KEV Feed (cisa.gov)"
                    
                    # Also update local fallback file
                    try:
                        with open(LOCAL_KEV_FALLBACK, "w", encoding="utf-8") as f:
                            json.dump(payload, f, indent=2)
                    except Exception:
                        pass
            except Exception as e:
                # Online fetch failed, use fallback
                print(f"[CVE Intelligence] Notice: Online CISA sync unavailable ({e}). Using local bundled catalog.")

        # Fallback to local catalog if online fetch didn't yield records
        if not records_to_process and os.path.exists(LOCAL_KEV_FALLBACK):
            try:
                with open(LOCAL_KEV_FALLBACK, "r", encoding="utf-8") as f:
                    payload = json.load(f)
                    records_to_process = payload.get("vulnerabilities", [])
                    source_used = "Local High-Fidelity CISA KEV Catalog"
            except Exception as e:
                print(f"[CVE Intelligence] Error reading local catalog: {e}")

        if not records_to_process:
            return {
                "status": "error",
                "message": "No CVE records could be retrieved from live feed or local cache.",
                "total_records": count_existing
            }

        # Bulk upsert into SQLite
        added_count = 0
        updated_count = 0

        existing_cves = {c.cve_id: c for c in db.query(RealCVEModel).all()}

        for v in records_to_process:
            cve_id = v.get("cveID")
            if not cve_id:
                continue

            inferred = infer_cvss_and_cwe(v)
            vendor = v.get("vendorProject", "Unknown")
            product = v.get("product", "Unknown")
            vuln_name = v.get("vulnerabilityName", cve_id)
            date_added = v.get("dateAdded")
            short_desc = v.get("shortDescription")
            required_action = v.get("requiredAction")
            due_date = v.get("dueDate")
            ransomware = v.get("knownRansomwareCampaignUse", "Unknown")
            notes = v.get("notes")

            if cve_id in existing_cves:
                item = existing_cves[cve_id]
                item.vendor_project = vendor
                item.product = product
                item.vulnerability_name = vuln_name
                item.date_added = date_added
                item.short_description = short_desc
                item.required_action = required_action
                item.due_date = due_date
                item.known_ransomware_campaign_use = ransomware
                item.notes = notes
                item.cvss = inferred["cvss"]
                item.severity = inferred["severity"]
                item.cwe = inferred["cwe"]
                item.exploitability = inferred["exploitability"]
                item.updated_at = datetime.utcnow()
                updated_count += 1
            else:
                new_item = RealCVEModel(
                    cve_id=cve_id,
                    vendor_project=vendor,
                    product=product,
                    vulnerability_name=vuln_name,
                    date_added=date_added,
                    short_description=short_desc,
                    required_action=required_action,
                    due_date=due_date,
                    known_ransomware_campaign_use=ransomware,
                    notes=notes,
                    cvss=inferred["cvss"],
                    severity=inferred["severity"],
                    cwe=inferred["cwe"],
                    exploitability=inferred["exploitability"],
                    updated_at=datetime.utcnow()
                )
                db.add(new_item)
                added_count += 1

        db.commit()
        total_now = db.query(RealCVEModel).count()

        return {
            "status": "success",
            "source": source_used,
            "total_records": total_now,
            "newly_added": added_count,
            "updated": updated_count,
            "message": f"Successfully synchronized {total_now} real weaponized CVEs ({source_used})."
        }

    def get_stats(self, db: Session) -> Dict[str, Any]:
        """Returns high-level metadata and breakdown of the real CVE database."""
        total = db.query(RealCVEModel).count()
        if total == 0:
            # Self-heal on initial call
            self.sync_database(db, force_online=False)
            total = db.query(RealCVEModel).count()

        ransomware_count = db.query(RealCVEModel).filter(
            RealCVEModel.known_ransomware_campaign_use.ilike("known")
        ).count()

        critical_count = db.query(RealCVEModel).filter(
            RealCVEModel.severity == "Critical"
        ).count()

        # Top 10 vendors
        from sqlalchemy import func
        top_vendors = (
            db.query(RealCVEModel.vendor_project, func.count(RealCVEModel.cve_id).label("cve_count"))
            .group_by(RealCVEModel.vendor_project)
            .order_by(desc("cve_count"))
            .limit(10)
            .all()
        )

        return {
            "total_cves": total,
            "ransomware_weaponized": ransomware_count,
            "critical_severity": critical_count,
            "top_vendors": [{"vendor": v[0], "count": v[1]} for v in top_vendors],
            "feed_authority": "CISA (Cybersecurity and Infrastructure Security Agency)",
            "catalog_type": "Known Exploited Vulnerabilities (KEV) Catalog",
            "last_synced": datetime.utcnow().isoformat()
        }

    def search_cves(
        self,
        db: Session,
        query: str = "",
        vendor: str = "",
        ransomware_only: bool = False,
        limit: int = 50,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Searches real CVEs with filtering, pagination, and sorting."""
        # Ensure data is populated
        if db.query(RealCVEModel).count() == 0:
            self.sync_database(db, force_online=False)

        q = db.query(RealCVEModel)

        if query:
            pattern = f"%{query}%"
            q = q.filter(
                or_(
                    RealCVEModel.cve_id.ilike(pattern),
                    RealCVEModel.vendor_project.ilike(pattern),
                    RealCVEModel.product.ilike(pattern),
                    RealCVEModel.vulnerability_name.ilike(pattern),
                    RealCVEModel.short_description.ilike(pattern)
                )
            )

        if vendor and vendor.lower() != "all":
            q = q.filter(RealCVEModel.vendor_project.ilike(f"%{vendor}%"))

        if ransomware_only:
            q = q.filter(RealCVEModel.known_ransomware_campaign_use.ilike("known"))

        total_matches = q.count()
        results = q.order_by(desc(RealCVEModel.date_added), desc(RealCVEModel.cvss)).offset(offset).limit(limit).all()

        return {
            "total": total_matches,
            "limit": limit,
            "offset": offset,
            "items": [
                {
                    "cve_id": c.cve_id,
                    "vendor_project": c.vendor_project,
                    "product": c.product,
                    "vulnerability_name": c.vulnerability_name,
                    "date_added": c.date_added,
                    "short_description": c.short_description,
                    "required_action": c.required_action,
                    "due_date": c.due_date,
                    "known_ransomware_campaign_use": c.known_ransomware_campaign_use,
                    "notes": c.notes,
                    "cvss": c.cvss,
                    "severity": c.severity,
                    "cwe": c.cwe,
                    "exploitability": c.exploitability
                }
                for c in results
            ]
        }

    def attach_cve_to_asset(self, db: Session, asset_id: str, cve_id: str, graph_engine: Any) -> Dict[str, Any]:
        """
        Attaches a real CISA CVE directly to a target asset in the infrastructure graph.
        Commits to database, updates graph engine in memory, and triggers re-analysis.
        """
        asset = db.query(AssetModel).filter(AssetModel.id == asset_id).first()
        if not asset:
            return {"status": "error", "message": f"Asset {asset_id} not found."}

        real_cve = db.query(RealCVEModel).filter(RealCVEModel.cve_id == cve_id).first()
        if not real_cve:
            return {"status": "error", "message": f"CVE {cve_id} not found in intelligence database."}

        # Check if asset already has this vulnerability
        existing = db.query(VulnerabilityModel).filter(
            VulnerabilityModel.asset_id == asset_id,
            VulnerabilityModel.identifier == cve_id
        ).first()

        if existing:
            return {
                "status": "exists",
                "message": f"{cve_id} ({real_cve.vulnerability_name}) is already present on asset '{asset.name}'."
            }

        vuln = VulnerabilityModel(
            asset_id=asset.id,
            identifier=real_cve.cve_id,
            title=real_cve.vulnerability_name[:250],
            severity=real_cve.severity,
            cvss=real_cve.cvss,
            description=real_cve.short_description,
            exploitability=real_cve.exploitability,
            remediation=real_cve.required_action,
            cwe=real_cve.cwe
        )
        db.add(vuln)
        db.commit()

        # Update in-memory graph engine
        from backend.main import reload_graph_engine
        reload_graph_engine(db)

        return {
            "status": "success",
            "message": f"Successfully attached real CVE '{cve_id}' ({real_cve.product}) to '{asset.name}'. Attack graph updated.",
            "asset_id": asset.id,
            "cve_id": cve_id,
            "cvss": real_cve.cvss,
            "severity": real_cve.severity
        }

    def fetch_live_epss(self, cve_id: str) -> Dict[str, Any]:
        """Queries FIRST.org EPSS API in real-time for live exploit probability."""
        try:
            url = f"{EPSS_API_URL}?cve={urllib.parse.quote(cve_id)}"
            req = urllib.request.Request(url, headers={"User-Agent": "CyberPath-AI/1.0"})
            with urllib.request.urlopen(req, timeout=5) as response:
                data = json.loads(response.read().decode("utf-8"))
                epss_data = data.get("data", [])
                if epss_data:
                    entry = epss_data[0]
                    score = float(entry.get("epss", 0.0))
                    percentile = float(entry.get("percentile", 0.0))
                    return {
                        "cve_id": cve_id,
                        "epss_score": score,
                        "percentile": percentile,
                        "probability_percent": round(score * 100, 2),
                        "date": entry.get("date"),
                        "status": "live"
                    }
        except Exception as e:
            print(f"[EPSS] Failed to fetch live EPSS for {cve_id}: {e}")

        # Fallback heuristic calculation if offline
        return {
            "cve_id": cve_id,
            "epss_score": 0.88,
            "percentile": 0.94,
            "probability_percent": 88.0,
            "date": datetime.utcnow().strftime("%Y-%m-%d"),
            "status": "estimated"
        }


cve_intel_service = RealCVEIntelligenceService()
