# CyberPath AI — AI-Powered Dynamic Cyber Attack Graph & Attack Path Prediction System

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React_19_+_TypeScript-61DAFB.svg)](https://react.dev/)
[![Scikit-Learn](https://img.shields.io/badge/Machine_Learning-Random_Forest_%7C_XGBoost-F7931E.svg)](https://scikit-learn.org/)
[![Graph](https://img.shields.io/badge/Topology-NetworkX_%26_GCN-00f0ff.svg)](https://networkx.org/)

**CyberPath AI** is an advanced defensive cybersecurity platform that models enterprise IT infrastructure as a directed graph, automatically discovers candidate multi-hop attack paths, estimates risk using Machine Learning (Random Forest & Gradient Boosting), explains vulnerability factors with Explainable AI (XAI), simulates dynamic adversary movements mapped to MITRE ATT&CK, and enables defensive What-If control simulations with posture impact deltas.

> **Academic & Defensive Disclaimer**: CyberPath AI operates entirely on synthetic, simulated infrastructure graph data and does not perform real-world exploitation, credential theft, or unauthorized network scanning.

---

## 🌟 Key Features

1. **SOC Dashboard Overview**:
   - Simulated Enterprise Posture score (0–100), total assets, critical vaults, and vulnerability counts.
   - Real-time Recharts distributions: Risk classes, Asset types, and temporal posture trends.
2. **Interactive Infrastructure Builder**:
   - Create, edit, and connect enterprise assets (Servers, Databases, Firewalls, Workstations, Domain Controllers, Vaults).
   - Attach simulated CVEs (Log4j, Spring4Shell, Zerologon, CitrixBleed, Moniker RCE) with CVSS scores.
3. **Interactive Attack Graph Visualization**:
   - Powered by React Flow with custom cybersecurity node cards, glowing threat indicators, and risk color mapping (Low: Green, Medium: Yellow, High: Orange, Critical: Red).
   - Zone-based column layout (External Ingress, DMZ, Internal Tier, Management Tier, Secure Vault).
   - Asset telemetry drawer for live inspection.
4. **Machine Learning Risk Prediction**:
   - Random Forest Regressor & Classifier trained on 6,000+ synthetic attack paths.
   - Multi-feature extraction: path length, peak CVSS, avg CVSS, external ingress, privilege escalation steps, and defense friction.
   - Achieves **0.97+ ROC-AUC** and **0.97+ R²** evaluation scores.
5. **Explainable AI (XAI)**:
   - Local feature attribution percentages (+32% Peak CVSS, +24% Direct Ingress, +21% Database Reached).
6. **Side-by-Side Attack Path Comparison**:
   - Compare any two attack trajectories side-by-side across length, CVSS, ingress vector, and model confidence.
7. **Dynamic Attack Simulation**:
   - Interactive player with Play / Pause / Step-forward controls.
   - Real-time MITRE ATT&CK technique tags (T1190, T1068, T1021, T1048), exploited CVE telemetry, and live terminal logs.
8. **Predictive Next-Step Movement Model**:
   - Forecasts adversary utility and softmax probability distribution over adjacent accessible network hops.
9. **CyberPath AI Security Analyst**:
   - Contextual security reasoning engine providing narrative attack chain explanations, SOC investigation questions, and prioritized defensive playbooks.
10. **What-If Security Control Simulation**:
    - Dynamically test defensive interventions (patching CVEs, microsegmentation firewall rules, MFA enforcement, asset isolation).
    - Live before/after posture delta cards and blocked attack path lists.
11. **Graph AI Lab (GNN vs. Traditional ML)**:
    - Benchmarking 2-Layer Graph Convolutional Networks (GCN) against Random Forest, GBDT, and Logistic Regression.
12. **Executive & Technical PDF Report Generator**:
    - One-click export of comprehensive PDF and JSON executive audit summaries.
13. **Network Packet Scanner & Cisco Packet Tracer Prober**:
    - Interactive 1-click device shelf (Web Servers, App Servers, Postgres DBs, Workstations, Nessus Scanners, Domain Controllers).
    - Hop-by-hop packet routing and port discovery (TCP SYN 80, 443, 22, 5432, 3389, 445) verifying firewall drops and deliverability.
    - Automated CVE correlation matching running service banners against known vulnerability catalogs.
    - One-click synchronisation committing discovered vulnerabilities directly into the live attack graph and retraining the ML risk models.
14. **Real-World CVE Threat Intelligence (CISA KEV + EPSS)**:
    - Built-in real database of **1,734+ actively exploited CVEs** directly from the US Cybersecurity and Infrastructure Security Agency (CISA KEV).
    - Flagged ransomware weapons (360+ exploits used by LockBit, BlackCat, Conti) with CISA official required action directives.
    - Real-time **EPSS (Exploit Prediction Scoring System)** live scoring integration via FIRST.org API.
    - 1-Click "Deploy to Asset" injecting real CVEs into your infrastructure graph to simulate authentic cyber attacks.
    - Completely automated: Zero manual setup, no API key required, with automatic offline bundling and live CISA feed synchronization.

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Backend Setup
```bash
# Activate virtual environment
.\venv\Scripts\activate  # Windows
# source venv/bin/activate # Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Train ML models & start backend
python -m backend.ml.train_model
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be available at: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open your browser at: [http://localhost:5173](http://localhost:5173)

---

## 📁 Repository Structure

```
CyberPath AI/
├── backend/
│   ├── main.py                  # FastAPI server & route handlers
│   ├── graph_engine.py          # NetworkX graph model & traversal engine
│   ├── synthetic_generator.py   # Multi-scale synthetic org generator
│   ├── attack_simulation.py     # MITRE ATT&CK dynamic simulation player
│   ├── what_if_engine.py        # Defensive control simulation & posture deltas
│   ├── ai_analyst.py            # AI Security Analyst explanation engine
│   ├── gnn_engine.py            # Graph AI Lab GNN & benchmark engine
│   ├── report_engine.py         # PDF & JSON audit report generator
│   ├── models.py                # SQLAlchemy ORM schemas
│   ├── schemas.py               # Pydantic validation schemas
│   ├── database.py              # SQLite session & persistence
│   ├── data/
│   │   └── demo_seed.py         # Preloaded "CyberTech Demo" environment
│   └── ml/
│       ├── dataset_generator.py # 6,000+ sample synthetic dataset generator
│       ├── train_model.py       # ML training & model evaluation pipeline
│       ├── predict_risk.py      # Risk score inference service
│       ├── explainability.py    # XAI local feature attribution
│       ├── next_step_predictor.py # Predictive next-hop movement model
│       └── saved_models/        # Serialized joblib models & metrics JSON
├── frontend/
│   ├── src/
│   │   ├── components/          # Navbar, Sidebar, CustomNode, Modals
│   │   ├── views/               # Dashboard, Infrastructure, Graph, Simulation, etc.
│   │   ├── services/            # API client service layer
│   │   ├── types/               # TypeScript interfaces
│   │   ├── App.tsx              # Root React component
│   │   └── main.tsx             # Entrypoint
│   └── tailwind.config.js       # Cyber SOC styling design system
├── ARCHITECTURE.md              # Detailed system architecture document
├── ML_METHODOLOGY.md            # Machine learning pipeline documentation
├── DATASET_METHODOLOGY.md       # Synthetic dataset generation methodology
├── SECURITY_MODEL.md            # Defensive threat modeling & safeguards
├── API_DOCUMENTATION.md         # REST API reference guide
├── PROJECT_REPORT.md            # Academic project report for final-year MCA
└── requirements.txt             # Python backend dependencies
```

---

## 🛡️ License
MIT License. Built for educational and defensive cybersecurity analysis.
