# CyberPath AI — System Architecture & Technical Design

## 1. Executive Architecture Overview

**CyberPath AI** is architected as a modular, full-stack cybersecurity analysis and defensive simulation platform. The system separates graph topology modeling, graph traversal algorithms, machine learning risk estimation, dynamic adversary simulation, and interactive front-end visualization into distinct, decoupled subsystems.

```
+-------------------------------------------------------------------------------+
|                       FRONTEND TIER (React 19 + TypeScript)                   |
|  +----------------+  +----------------+  +----------------+  +-------------+  |
|  |  SOC Dashboard |  |  Attack Graph  |  |  Adversary Sim |  |  What-If    |  |
|  |   (Recharts)   |  |  (React Flow)  |  | (MITRE ATT&CK) |  | Simulation  |  |
|  +----------------+  +----------------+  +----------------+  +-------------+  |
|  +----------------+  +----------------+  +----------------+  +-------------+  |
|  |  AI Analyst    |  |  Graph AI Lab  |  |  Asset Builder |  |  PDF Report |  |
|  |  (XAI Engine)  |  | (GNN Benchmark)|  | (Topology CRUD)|  |  Generator  |  |
|  +----------------+  +----------------+  +----------------+  +-------------+  |
+---------------------------------------+---------------------------------------+
                                        | REST API (HTTP / JSON)
                                        v
+-------------------------------------------------------------------------------+
|                       BACKEND TIER (FastAPI + Python 3.14)                    |
|  +--------------------+  +--------------------+  +-------------------------+  |
|  |   FastAPI Router   |  | Attack Graph Engine|  |   Dynamic Simulator     |  |
|  |    (main.py)       |  |   (NetworkX DiGraph|  |   (MITRE ATT&CK Engine) |  |
|  +--------------------+  +--------------------+  +-------------------------+  |
|  +--------------------+  +--------------------+  +-------------------------+  |
|  |  What-If Engine    |  |  AI Security       |  |   Graph AI Lab Engine   |  |
|  | (Delta Posture Calc|  |  Analyst Engine    |  |  (GCN Convolution Layer)|  |
|  +--------------------+  +--------------------+  +-------------------------+  |
+---------------------------------------+---------------------------------------+
                                        |
                 +----------------------+----------------------+
                 v                                             v
+-----------------------------------+         +----------------------------------+
|      MACHINE LEARNING PIPELINE    |         |        PERSISTENCE LAYER         |
|  +-----------------------------+  |         |  +----------------------------+  |
|  |  Risk Regressor (RF / GBDT) |  |         |  | SQLite / aiosqlite Engine  |  |
|  +-----------------------------+  |         |  | (cyberpath.db)             |  |
|  +-----------------------------+  |         |  +----------------------------+  |
|  |  Explainability (XAI / SHAP)|  |         |  +----------------------------+  |
|  +-----------------------------+  |         |  | SQLAlchemy ORM Schemas     |  |
|  +-----------------------------+  |         |  | (Assets, Conns, Sims, Orgs)|  |
|  |  Next-Step Movement Predict |  |         |  +----------------------------+  |
|  +-----------------------------+  |         +----------------------------------+
+-----------------------------------+
```

---

## 2. Core Subsystems

### 2.1 Graph Modeling & Traversal Engine (`backend/graph_engine.py`)
- Represents IT infrastructure as a directed graph $G = (V, E)$.
- **Nodes ($V$)** model assets: Internet Ingress, Perimeter Firewalls, DMZ Web Servers, Internal Application Servers, Database Clusters, Domain Controllers, Admin Workstations, and Sensitive Data Vaults.
- **Edges ($E$)** model network reachability, protocol ports (HTTPS, SMB, RDP, Kerberos, SQL), authentication requirements, and privilege levels.
- **Traversal Engine**: Employs bounded Depth-First Search (`nx.all_simple_paths`) up to cutoff depth $k=6$ to extract all candidate attack paths.
- **Traversal Constraints**: Enforces perimeter boundary rules (e.g. Internet can only reach nodes tagged `internet_exposed=True` or edge firewalls).

### 2.2 Machine Learning & XAI Subsystem (`backend/ml/`)
- Extracts 15 structural and contextual features per discovered path:
  1. `path_length`
  2. `number_of_hops`
  3. `internet_exposed`
  4. `avg_cvss`
  5. `max_cvss`
  6. `vulnerability_count`
  7. `high_severity_vulnerabilities`
  8. `privilege_escalation`
  9. `authentication_required`
  10. `critical_asset_reached`
  11. `sensitive_data_reached`
  12. `asset_criticality_score`
  13. `avg_criticality_score`
  14. `security_controls_bypassed`
  15. `network_exposure_score`
- **Models**: Trained using Scikit-Learn `RandomForestRegressor` and `RandomForestClassifier` with serialized `.joblib` artifacts.
- **Explainability (XAI)**: Calculates local feature attributions and percentage contributions towards the path risk score.

### 2.3 Dynamic Simulation Engine (`backend/attack_simulation.py`)
- Simulates step-by-step adversary lateral movement.
- Maps individual pivot steps to MITRE ATT&CK Tactics and Techniques (T1190 Initial Access, T1068 Privilege Escalation, T1021 Lateral Movement, T1048 Exfiltration).
- Computes real-time posture impact and telemetry logs.

### 2.4 What-If Security Engine (`backend/what_if_engine.py`)
- Clones graph state in memory.
- Applies hypothetical security controls (patching CVEs, adding firewall ACL rules, enforcing MFA, isolating compromised machines).
- Recomputes the entire attack graph and calculates before/after posture deltas ($\Delta \text{Posture Score}$, $\Delta \text{High-Risk Paths}$, list of eliminated attack vectors).

### 2.5 Graph AI Lab (`backend/gnn_engine.py`)
- Implements a 2-Layer Graph Convolutional Network (GCN) forward pass:
  $$H^{(l+1)} = \sigma\left(\tilde{D}^{-\frac{1}{2}} \tilde{A} \tilde{D}^{-\frac{1}{2}} H^{(l)} W^{(l)}\right)$$
- Benchmarks GNN against Random Forest, Gradient Boosting, and Logistic Regression across Precision, Recall, F1-Score, and Latency.
