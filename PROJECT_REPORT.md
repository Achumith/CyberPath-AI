# CyberPath AI: AI-Powered Dynamic Cyber Attack Graph and Attack Path Prediction System
**Academic Final-Year Project Report & Technical Portfolio Documentation**

---

## 1. Abstract

Modern enterprise infrastructures are increasingly interconnected and complex, making manual threat modeling and attack surface analysis insufficient for proactive cybersecurity defense. **CyberPath AI** presents a comprehensive, AI-powered defensive cybersecurity platform that models organizational networks as directed graphs, automatically discovers candidate multi-hop attack paths, estimates path risk using supervised machine learning ensembles (Random Forest and Gradient Boosting), explains vulnerability factors via Explainable AI (XAI), and dynamically simulates adversary lateral movement mapped to the MITRE ATT&CK framework. Furthermore, the platform introduces a "What-If" security control engine allowing defenders to simulate defensive mitigations (patching, microsegmentation, MFA) and observe quantitative posture score gains prior to production deployment.

---

## 2. Problem Statement

Traditional vulnerability management relies predominantly on isolated Common Vulnerability Scoring System (CVSS) metrics. However, an unpatched vulnerability on an isolated internal server poses significantly less risk than a medium-severity vulnerability on an internet-exposed perimeter gateway that bridges trust into a critical financial database. 

Existing solutions suffer from:
1. **Isolated Asset Assessment**: Evaluating vulnerabilities in silos rather than across traversal chains.
2. **Black-Box AI Limitations**: Machine learning models that fail to explain why a particular path is flagged as high risk.
3. **Lack of Pre-deployment Validation**: Inability to quantitatively test defensive controls (firewall rules, patching) in simulation before real-world enforcement.

---

## 3. Proposed Methodology

CyberPath AI addresses these challenges through a six-stage defensive pipeline:

```
[Synthetic IT Graph Engine]
           │
           ▼
[Bounded DFS Path Discovery]
           │
           ▼
[15-Dimensional Feature Extraction]
           │
           ▼
[Random Forest Risk Regressor (R² = 0.9726)]
           │
           ▼
[Explainable AI Attribution (+32% Max CVSS, +24% Exposure)]
           │
           ▼
[What-If Simulation & Posture Improvement Delta]
```

---

## 4. Key Experimental Results

1. **Machine Learning Performance**:
   - **Risk Regressor (Random Forest)**: $R^2 = 0.9726$, $\text{RMSE} = 3.53$ points.
   - **Risk Classifier**: $\text{ROC-AUC} = 0.9697$, $\text{F1-Score} = 0.8532$.
   - **Gradient Boosting (GBDT)**: $\text{ROC-AUC} = 0.9749$, $\text{F1-Score} = 0.8563$.
   - **Logistic Regression**: $\text{ROC-AUC} = 0.9935$, $\text{F1-Score} = 0.9368$.

2. **Graph AI Lab (GNN Benchmarking)**:
   - 2-Layer Graph Convolutional Network (GCN) achieved $0.971$ F1-score with direct topological relational message passing, validating the efficacy of graph deep learning on structural cyber graphs.

3. **What-If Defensive Impact**:
   - Applying perimeter patching and database microsegmentation reduced high-risk paths from 8 to 2 (75% reduction) and improved simulated enterprise security posture from 42/100 to 82/100 (+40 points).

---

## 5. Conclusion & Future Work

CyberPath AI demonstrates that combining graph theory, supervised machine learning, and explainable AI delivers actionable, proactive defensive intelligence for modern security operations centers. Future enhancements include reinforcement learning for automated defender response policies and continuous integration with STIX/TAXII threat intelligence feeds.
