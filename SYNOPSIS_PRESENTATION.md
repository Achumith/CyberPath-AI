# Project Synopsis: CyberPath AI
## AI-Powered Dynamic Cyber Attack Graph & Attack Path Prediction System

> **File generated**: [`CyberPath_AI_Project_Synopsis.pptx`](file:///c:/Users/USER/Desktop/CyberPath%20AI/CyberPath_AI_Project_Synopsis.pptx)  
> **Domain**: Cybersecurity, Graph Theory, Machine Learning, Explainable AI (XAI)  
> **Tech Stack**: Next.js / React 19, TypeScript, Tailwind CSS, Python 3.14, FastAPI, NetworkX, Scikit-Learn, SQLite

---

## Slide-by-Slide Synopsis & Speaker Script

---

### Slide 1: Title Slide
- **Title**: CyberPath AI
- **Subtitle**: AI-Powered Dynamic Cyber Attack Graph & Attack Path Prediction System
- **Focus**: Educational and defensive cybersecurity platform that models IT infrastructure as a graph, predicts multi-hop attack path risks using Machine Learning, provides Explainable AI (XAI) root-cause attribution, and performs What-If defensive control simulations.
- **Presenter**: MCA Final-Year Project Presentation / Portfolio

---

### Slide 2: Project Overview & Abstract
- **Core Concept**: Represents an organization's infrastructure as a directed graph $G = (V, E)$, where nodes represent assets (Firewalls, DMZ Web Servers, Application Servers, Database Vaults, Active Directory Domain Controllers) and edges represent communication, authentication trust, and network reachability.
- **Intelligent Defense**: Moves beyond static spreadsheets and isolated CVSS ratings by discovering multi-hop attack trajectories, evaluating risk via trained Machine Learning models, and simulating adversary movement.
- **Safe & Ethical Simulation**: Operates 100% on synthetic data with zero real-world exploitation or intrusive scanning.

---

### Slide 3: Problem Statement & Existing Gaps
- **Gap 1: Vulnerabilities Assessed in Silos**: Legacy vulnerability scanners score CVEs in isolation. A CVSS 9.0 on an isolated backup server is flagged higher than a CVSS 7.0 on an internet gateway bridging directly to a database.
- **Gap 2: Blindness to Lateral Movement**: Modern threat actors breach an edge server, escalate privileges, and pivot laterally across multiple trust relationships.
- **Gap 3: Lack of Pre-Enforcement Control Validation**: SOC defenders cannot quantitatively simulate the mathematical reduction in attack surface prior to deploying firewall ACLs or patches to production.

---

### Slide 4: System Architecture & Technical Stack
- **Frontend Layer**: React 19 + TypeScript, Tailwind CSS, React Flow (interactive graph canvas), Recharts (SOC analytics).
- **Backend REST Services**: Python 3.14 + FastAPI, NetworkX (graph traversal algorithms), SQLite + SQLAlchemy ORM persistence, fpdf2 (PDF report generation).
- **Machine Learning Subsystem**: Scikit-Learn (Random Forest Regressor $R^2 = 0.97$, Gradient Boosting, Logistic Regression), 15-dimensional path feature extraction, Explainable AI (XAI) engine, Graph AI Lab (GCN Benchmarking).

---

### Slide 5: Core System Functionalities
1. **SOC Dashboard**: Real-time security posture score (0–100), high-risk path counters, and topology breakdown charts.
2. **Infrastructure Builder**: Visual creation and connection of simulated assets with CVE assignments.
3. **Attack Graph Canvas**: Interactive React Flow graph with risk-colored nodes (Green, Yellow, Orange, Red) and asset telemetry drawer.
4. **ML Risk Prediction**: Evaluates candidate attack paths using a trained Random Forest Regressor ($R^2 = 0.9726$).
5. **Explainable AI (XAI)**: Quantifies local percentage contributions (+32% Peak CVSS, +24% Direct Ingress, +21% Database Reached).
6. **Dynamic Adversary Simulation**: Step-by-step playback mapped to MITRE ATT&CK techniques (T1190, T1068, T1021, T1048) with live terminal logs.
7. **Predictive Next-Step Model**: Softmax probability distribution over adjacent accessible network hops.
8. **What-If Security Simulation**: Validates defensive controls (patching, microsegmentation, MFA) with before/after posture deltas.
9. **CyberPath AI Analyst**: Contextual AI reasoning providing narrative attack chains, SOC investigation questions, and playbooks.
10. **Graph AI Lab**: Benchmarks 2-Layer Graph Convolutional Networks (GCN) against classical ML.

---

### Slide 6: Machine Learning Methodology & Evaluation
- **Dataset**: 6,000 synthetic attack path samples generated with stochastic parameters reflecting enterprise networks.
- **Features Extracted (15 features)**: Path length, hops, internet exposure, max CVSS, avg CVSS, vulnerability count, high-severity CVE count, privilege escalation, authentication required, critical asset reached, sensitive data reached, asset criticality, network exposure score, and security controls bypassed.
- **Model Evaluation**:
  - **Random Forest Continuous Risk $R^2$**: **0.9726** (RMSE: 3.53 pts)
  - **Random Forest Classification ROC-AUC**: **0.9697**
  - **Gradient Boosting ROC-AUC**: **0.9749**
  - **Logistic Regression ROC-AUC**: **0.9935**

---

### Slide 7: Dynamic Simulation & What-If Impact
- **Adversary Simulation**: Interactive playback showing attacker progression from external ingress to sensitive database vaults with privilege elevation tracking.
- **Predictive Next-Hop**: Softmax utility model forecasting the adversary's next move before it occurs.
- **What-If Defensive Impact**:
  - Applying perimeter patching and database microsegmentation reduced high-risk paths from 8 to 2 (75% reduction).
  - Posture score improved from 42/100 to 82/100 (+40 points improvement).

---

### Slide 8: Future Development Roadmap & Extensions
1. **Reinforcement Learning for Autonomous Defense**:
   - Integrate Deep Q-Learning (DQN) or Proximal Policy Optimization (PPO) to train an autonomous defensive agent that discovers optimal security control placements with minimal operational friction.
2. **Real-Time STIX / TAXII Threat Intelligence Feeds**:
   - Ingest live threat feeds (CISA Known Exploited Vulnerabilities - KEV, AlienVault OTX, MITRE ATT&CK) to dynamically weight CVE exploitability against active campaigns in the wild.
3. **Cloud & Kubernetes Graph Connectors**:
   - Develop automated topology ingestion plugins for AWS VPCs, Azure Resource Manager, and Kubernetes clusters from Terraform/K8s manifests.
4. **Zero-Trust Continuous Verification Engine**:
   - Incorporate identity-centric conditional access simulation (Okta / Microsoft Entra ID token lifecycles and device posture scores) directly into edge weights.
5. **Multi-Agent Red Team vs. Blue Team War Gaming**:
   - Simulate game-theoretic competitions where automated red agents attempt multi-path exfiltration while blue agents dynamically deploy micro-honeypots and isolation rules.

---

### Slide 9: Conclusion
- **Summary**: CyberPath AI successfully unifies graph theory, supervised machine learning, and explainable AI into an interactive, defensive cybersecurity platform.
- **Impact**: Enables proactive threat discovery, explains root causes, and pre-validates defensive interventions.
- **Deliverables**: Working full-stack application (FastAPI + React), trained ML pipeline, `.pptx` presentation deck, and comprehensive academic project documentation.
