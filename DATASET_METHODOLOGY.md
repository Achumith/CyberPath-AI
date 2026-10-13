# CyberPath AI — Synthetic Dataset Generation Methodology

## 1. Objectives & Rationale

Training supervised machine learning models for cyber attack path risk prediction requires large quantities of diverse, multi-hop attack trajectories. Real-world corporate telemetry is proprietary and restricted; thus, CyberPath AI implements a synthetic dataset generator (`backend/ml/dataset_generator.py`) to generate realistic, mathematically sound training data.

---

## 2. Dataset Synthesis Algorithm

The generator creates simulated attack paths using stochastic parameters reflecting realistic enterprise IT configurations:

1. **Path Dimensions**: Path lengths randomly drawn between 2 and 7 nodes ($k \in [2, 7]$).
2. **Perimeter Exposure**: 55% of paths originate from internet-exposed assets; 45% represent internal pivot trajectories.
3. **Vulnerability Injection**: Assets are assigned between 0 and 8 vulnerabilities sampled from realistic CVE profiles (e.g., Log4Shell CVSS 10.0, Spring4Shell CVSS 9.8, Zerologon CVSS 10.0, OpenSSH CVSS 8.1).
4. **Defensive Friction**: Multi-factor authentication requirements, credential tiers, and active endpoint controls (EDR/WAF) are stochastically populated.

---

## 3. Ground Truth Risk Scoring Formulation

Ground-truth continuous risk scores $R \in [5, 99.5]$ are generated using a transparent, multi-factor domain formula:

$$R = R_{\text{base}} + \Delta R_{\text{ingress}} + \Delta R_{\text{target}} + \Delta R_{\text{vuln}} + \Delta R_{\text{priv}} - \Delta R_{\text{defense}} + \epsilon$$

Where:
- $R_{\text{base}} = 15.0$
- $\Delta R_{\text{ingress}} = 18.0 \cdot \mathbf{1}_{\text{internet\_exposed}} + 0.8 \cdot \text{network\_exposure}$
- $\Delta R_{\text{target}} = 15.0 \cdot \mathbf{1}_{\text{critical\_asset}} + 12.0 \cdot \mathbf{1}_{\text{sensitive\_data}} + \text{asset\_criticality}$
- $\Delta R_{\text{vuln}} = 1.5 \cdot \text{max\_cvss} + 0.8 \cdot \text{avg\_cvss} + 3.5 \cdot \text{high\_sev\_count}$
- $\Delta R_{\text{priv}} = 2.5 \cdot \text{privilege\_escalation}$
- $\Delta R_{\text{defense}} = 3.0 \cdot \text{auth\_required} + 2.5 \cdot \text{controls\_bypassed}$
- $\epsilon \sim \mathcal{N}(0, 1.8)$ represents natural environmental variance.

---

## 4. Class Label Distribution

Continuous risk scores map to 4 operational risk tiers:
- **Low**: $R < 38.0$
- **Medium**: $38.0 \le R < 60.0$
- **High**: $60.0 \le R < 80.0$
- **Critical**: $R \ge 80.0$

The dataset is saved to `backend/ml/attack_paths.csv` containing 6,000 structured rows.
