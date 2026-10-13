# Presentation Overview: Three Project Topics

**Presentation File:** [`Three_Project_Topics_Presentation.pptx`](file:///c:/Users/USER/Desktop/CyberPath%20AI/Three_Project_Topics_Presentation.pptx)  
**Layout:** 16:9 Widescreen (High-Definition)  
**Design:** Modern Dark Executive Theme with Color-Coded Domain Accents  

---

## Slide 1: Presentation Title & Project Overview

- **Title:** Three Innovative Project Concepts
- **Subtitle:** A comparative overview of core architecture, basic working, and functionalities across three engineering project domains.
- **Project Domains:**
  1. **Cybersecurity / IAM:** Login Anomaly Detector
  2. **AgriTech / Precision Farming:** Crop Rotation Recommendation System
  3. **Network Defense / Graph AI:** CyberPath AI

---

## Slide 2: Topic 1 — Login Anomaly Detector

> **Domain:** Cybersecurity • Identity & Access Management (IAM) • User Behavior Analytics (UBA)

### Concept Overview
An AI-driven real-time authentication risk scoring engine that flags unauthorized access, credential stuffing, and account takeover (ATO) attempts without overburdening legitimate users with excessive MFA requests.

### Basic Working & Data Flow
1. **Telemetry & Feature Ingestion:**
   - Ingests authentication context per attempt: Client IP, Autonomous System Number (ASN), GeoIP coordinates, Device Fingerprint (User-Agent, Canvas ID, OS/browser headers), timestamp, and recent failed attempt velocity.
2. **User Behavioral Baseline Modeling:**
   - Constructs an individualized historical profile for each user account (typical login hours, regular devices, common geographic bounding boxes, and typical session frequency).
3. **Machine Learning & Heuristic Risk Engine:**
   - Evaluates the incoming attempt against historical baselines using Isolation Forest / Autoencoders combined with deterministic security rules (e.g., Impossible Travel — logging in from London and Tokyo within 20 minutes).
4. **Adaptive Multi-Tier Response Action:**
   - Calculates a real-time risk score (0–100):
     - **Low Risk (0–39):** Grant seamless access (passwordless / standard login).
     - **Medium Risk (40–69):** Trigger Step-Up Challenge (SMS OTP, Authenticator app, or FIDO2 key).
     - **High Risk (70–100):** Block request, revoke active session tokens, and trigger a security incident alert.

### Core Functionality & Features
- **Real-Time Risk Scoring (0–100):** Instantaneous sub-50ms risk evaluation executed during authentication handshake before session token issuance.
- **Impossible Travel & Geovelocity Detection:** Mathematical speed calculation flagging logins across distant geographic coordinates within physically impossible timeframes.
- **Device & Browser Fingerprinting:** Tracks hardware attributes, screen resolutions, and OS headers to detect session hijacking or automated headless bots.
- **Adaptive Step-Up MFA Challenge:** Minimizes user friction by asking for MFA only when behavioral anomalies are detected; completely seamless otherwise.

### Tech Stack & Real-World Value
- **Tech Stack:** Python (FastAPI / Flask), Scikit-Learn (Isolation Forest, One-Class SVM), Redis (in-memory velocity counters), MaxMind GeoIP2, React / Streamlit Dashboard.
- **Deployment Value:** Proactively eliminates credential stuffing and account takeovers while reducing MFA fatigue for legitimate end-users.

---

## Slide 3: Topic 2 — Crop Rotation Recommendation System

> **Domain:** AgriTech • Precision Agriculture • Sustainable Farming • Decision Intelligence

### Concept Overview
An intelligent agricultural decision-support platform that recommends optimal multi-season crop sequences to preserve soil fertility, disrupt pest and disease cycles, optimize water usage, and maximize farmer profitability.

### Basic Working & Data Flow
1. **Field & Environmental Data Ingestion:**
   - Captures soil telemetry (Nitrogen, Phosphorus, Potassium - NPK, pH, electrical conductivity), historical crops grown on the land, plot acreage, geographic zone, and seasonal weather forecasts.
2. **Agronomic Rules & Ecological Filtering:**
   - Applies botanical constraint rules: avoids planting the same botanical families consecutively (to starve soil-borne pests/blight) and enforces legume integration to naturally replenish nitrogen.
3. **Machine Learning & Multi-Objective Ranking:**
   - Runs Random Forest / XGBoost yield predictors alongside linear optimization algorithms to score candidate crops against nutrient balance, water requirement, and market profitability.
4. **Dynamic Crop Calendar & Advisory Output:**
   - Generates a multi-season rotation roadmap (Kharif, Rabi, Zaid) detailing recommended crop varieties, expected soil restoration metrics, and customized organic fertilizer guidance.

### Core Functionality & Features
- **Soil Nutrient Balancing (NPK Management):** Tracks nutrient depletion by heavy feeder crops (e.g., corn/wheat) and prescribes restorative crops (e.g., pulses, legumes) to reduce chemical fertilizer dependency.
- **Pest & Soil Pathogen Cycle Disruption:** Identifies vulnerable crop families (e.g., Solanaceae) and sequences non-host crops to starve soil-borne pests and pathogens naturally.
- **Weather & Climate Risk Forecasting:** Integrates precipitation and temperature projections to ensure recommended crops match expected seasonal rainfall.
- **Economic Yield & Profit Forecasting:** Combines historical mandi/market price trends with yield estimation to recommend sequences that maximize net farmer revenue.

### Tech Stack & Real-World Value
- **Tech Stack:** Python, Scikit-Learn (Random Forest, XGBoost), PuLP / SciPy (Linear Optimization), OpenWeatherMap API, React / Streamlit, PostgreSQL.
- **Deployment Value:** Promotes sustainable ecological farming, cuts fertilizer costs by up to 30%, and prevents catastrophic soil degradation.

---

## Slide 4: Topic 3 — CyberPath AI

> **Domain:** Defensive Cybersecurity • Dynamic Attack Graphs • Predictive Threat Modeling

### Concept Overview
An advanced cybersecurity platform that models enterprise IT infrastructure as an interactive directed graph, discovers candidate multi-hop breach vectors, uses Machine Learning to predict high-risk paths, and enables defenders to simulate "What-If" security controls.

### Basic Working & Data Flow
1. **Network Topology & CVE Mapping:**
   - Ingests enterprise assets (Web Servers, Firewalls, DBs, Domain Controllers) and correlates discovered vulnerabilities with CVSS scores, CISA KEV feeds, and EPSS exploit data.
2. **Directed Attack Graph Generation:**
   - Constructs a multi-tier directed network graph (NetworkX) and executes bounded traversal algorithms to discover all reachable multi-hop attack trajectories from internet to core vault.
3. **ML Risk Prediction & Explainability (XAI):**
   - Evaluates attack paths via trained Random Forest / GNN models (0.97+ ROC-AUC) on path length, peak CVSS, privilege hops, and provides percentage feature attribution (+32% Peak CVSS).
4. **Dynamic Adversary Simulation & What-If Defense:**
   - Simulates step-by-step attacker traversal mapped to MITRE ATT&CK techniques, and lets defenders test "What-If" controls (patching, firewall microsegmentation) with live posture deltas.

### Core Functionality & Features
- **Interactive Attack Graph Canvas:** Zone-based visualization (DMZ, Internal, Secure Vault) powered by React Flow with custom glowing threat cards and real-time node telemetry.
- **Multi-Hop Path Risk Scoring & Ranking:** Predicts end-to-end breach probability for all candidate chains, ranking them from Critical to Low risk for prioritized remediation.
- **Explainable AI (XAI) Attribution:** Unpacks the "Black Box" of ML predictions, showing defenders the exact root-cause metrics driving high path criticality.
- **What-If Defensive Control Simulation:** Defenders toggle virtual patches or network isolation rules to instantly see blocked attack paths and post-mitigation posture deltas (e.g. +18 pts).

### Tech Stack & Real-World Value
- **Tech Stack:** FastAPI (Python), React 19 + TypeScript, NetworkX / GCN, Scikit-Learn (Random Forest & XGBoost), CISA KEV & EPSS APIs, Recharts.
- **Deployment Value:** Shifts SOC teams from reactive alerts to proactive attack path disruption, stopping attackers before they reach critical assets.

---

## Summary Comparison Matrix

| Metric / Dimension | 1. Login Anomaly Detector | 2. Crop Rotation Recommender | 3. CyberPath AI |
| :--- | :--- | :--- | :--- |
| **Primary Domain** | Identity Security / IAM | AgriTech & Precision Farming | Network Security / Graph AI |
| **Primary End User** | Enterprise Security & Web Admins | Farmers, Agronomists, Agri-startups | SOC Analysts & CISO Teams |
| **Core Input Data** | IP, User-Agent, Latency, Failed Logins | Soil NPK, pH, Crop History, Rain Forecast | Network Topology, CVEs, CVSS, EPSS |
| **Key AI / ML Techniques** | Isolation Forest, Autoencoders, Heuristics | Random Forest, XGBoost, Linear Optimization | Graph Traversal, Random Forest, GNN, XAI |
| **Primary Output** | Real-time Risk Score + Step-up MFA | Multi-season Planting & Rotation Plan | Attack Graph Canvas + Risk Ranked Paths |
| **Real-World Value** | Prevents Credential Stuffing & ATO | Restores Soil Health & Boosts Crop ROI | Eliminates Critical Multi-Hop Breach Paths |
