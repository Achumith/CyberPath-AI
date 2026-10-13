"""
SQLAlchemy ORM models for persistent storage of organizations, assets, connections, simulations, and attack paths.
"""
import uuid
import json
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

def generate_uuid():
    return str(uuid.uuid4())

class OrganizationModel(Base):
    __tablename__ = "organizations"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False, default="CyberTech Enterprise")
    industry = Column(String(255), default="Technology / Cloud Infrastructure")
    description = Column(Text, default="Simulated IT Infrastructure Environment")
    created_at = Column(DateTime, default=datetime.utcnow)

    assets = relationship("AssetModel", back_populates="organization", cascade="all, delete-orphan")
    connections = relationship("ConnectionModel", back_populates="organization", cascade="all, delete-orphan")
    simulations = relationship("SimulationModel", back_populates="organization", cascade="all, delete-orphan")

class AssetModel(Base):
    __tablename__ = "assets"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    org_id = Column(String(64), ForeignKey("organizations.id"), nullable=False)
    name = Column(String(255), nullable=False)
    type = Column(String(100), nullable=False)  # Server, Database, Workstation, Router, etc.
    os = Column(String(100), default="Linux")
    criticality = Column(String(50), default="Medium")  # Low, Medium, High, Critical
    internet_exposed = Column(Boolean, default=False)
    privilege_level = Column(String(50), default="User")  # None, User, Admin, SYSTEM/Root
    zone = Column(String(100), default="DMZ")
    ip_address = Column(String(64), nullable=True)
    services_json = Column(Text, default="[]")  # JSON list of services
    security_controls_json = Column(Text, default="[]")  # JSON list of active security controls
    metadata_json = Column(Text, default="{}")  # JSON dict of extra metadata
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("OrganizationModel", back_populates="assets")
    vulnerabilities = relationship("VulnerabilityModel", back_populates="asset", cascade="all, delete-orphan")

class VulnerabilityModel(Base):
    __tablename__ = "vulnerabilities"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    asset_id = Column(String(64), ForeignKey("assets.id"), nullable=False)
    identifier = Column(String(100), nullable=False)  # e.g., CVE-2024-1234
    title = Column(String(255), nullable=False)
    severity = Column(String(50), default="Medium")
    cvss = Column(Float, default=5.0)
    description = Column(Text, nullable=True)
    exploitability = Column(Float, default=0.7)
    remediation = Column(Text, nullable=True)
    cwe = Column(String(50), default="CWE-20")

    asset = relationship("AssetModel", back_populates="vulnerabilities")

class ConnectionModel(Base):
    __tablename__ = "connections"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    org_id = Column(String(64), ForeignKey("organizations.id"), nullable=False)
    source = Column(String(64), nullable=False)
    target = Column(String(64), nullable=False)
    connection_type = Column(String(100), default="Network")
    port = Column(Integer, nullable=True)
    protocol = Column(String(50), default="TCP")
    authentication_required = Column(Boolean, default=False)
    privilege_required = Column(String(50), default="None")
    encrypted = Column(Boolean, default=True)
    bidirectional = Column(Boolean, default=False)

    organization = relationship("OrganizationModel", back_populates="connections")

class SimulationModel(Base):
    __tablename__ = "simulations"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    org_id = Column(String(64), ForeignKey("organizations.id"), nullable=False)
    start_node = Column(String(64), nullable=False)
    target_node = Column(String(64), nullable=True)
    strategy = Column(String(100), default="HighestRisk")
    target_reached = Column(Boolean, default=False)
    path_taken_json = Column(Text, default="[]")
    steps_json = Column(Text, default="[]")
    final_posture_impact = Column(Float, default=0.0)
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("OrganizationModel", back_populates="simulations")

class AttackPathRecordModel(Base):
    __tablename__ = "attack_paths"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    org_id = Column(String(64), nullable=False)
    nodes_json = Column(Text, nullable=False)  # list of node ids/names
    length = Column(Integer, default=0)
    risk_score = Column(Float, default=0.0)
    risk_class = Column(String(50), default="Medium")
    features_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=datetime.utcnow)

class RealCVEModel(Base):
    __tablename__ = "real_cves"

    cve_id = Column(String(50), primary_key=True, index=True)
    vendor_project = Column(String(150), nullable=False, index=True)
    product = Column(String(150), nullable=False, index=True)
    vulnerability_name = Column(String(350), nullable=False)
    date_added = Column(String(50), nullable=True)
    short_description = Column(Text, nullable=True)
    required_action = Column(Text, nullable=True)
    due_date = Column(String(50), nullable=True)
    known_ransomware_campaign_use = Column(String(50), default="Unknown")
    notes = Column(Text, nullable=True)
    cvss = Column(Float, default=8.5)
    severity = Column(String(50), default="High")
    cwe = Column(String(50), default="CWE-20")
    exploitability = Column(Float, default=0.85)
    updated_at = Column(DateTime, default=datetime.utcnow)

