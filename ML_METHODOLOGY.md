# CyberPath AI — Machine Learning Methodology

## 1. Problem Formulation

In cyber attack graph analysis, graph traversal algorithms generate candidate attack trajectories through an organization's network topology. However, discovering paths does not inherently determine which paths represent the greatest threat.

**CyberPath AI** separates path discovery from risk modeling:
- **Graph Engine**: Discovers candidate paths via topological search ($G = (V, E)$).
- **ML Model**: Predicts the continuous risk score $R \in [0, 100]$ and categorical risk class $C \in \{\text{Low}, \text{Medium}, \text{High}, \text{Critical}\}$ for each discovered path.

---

## 2. Feature Engineering

For each path $P = (v_1, v_2, \dots, v_k)$, the system extracts 15 features:

| Feature Name | Description | Type | Range |
|--------------|-------------|------|-------|
| `path_length` | Total number of nodes in the trajectory | Integer | 2 – 7 |
| `number_of_hops` | Total edge hops ($k - 1$) | Integer | 1 – 6 |
| `internet_exposed` | Whether the ingress node $v_1$ has direct external exposure | Binary | 0 or 1 |
| `avg_cvss` | Average CVSS score of all CVEs across path assets | Float | 0.0 – 10.0 |
| `max_cvss` | Maximum CVSS score among all vulnerabilities on the path | Float | 0.0 – 10.0 |
| `vulnerability_count` | Total cumulative count of vulnerabilities across path | Integer | 0 – 15 |
| `high_severity_vulnerabilities` | Count of CVEs with $\text{CVSS} \ge 7.0$ | Integer | 0 – 8 |
| `privilege_escalation` | Total privilege elevation jumps required ($P_{\text{target}} - P_{\text{source}}$) | Integer | 0 – 4 |
| `authentication_required` | Count of edge hops requiring credentials | Integer | 0 – 5 |
| `critical_asset_reached` | Whether terminal node $v_k$ is classified as Critical | Binary | 0 or 1 |
| `sensitive_data_reached` | Whether terminal node is a database/vault | Binary | 0 or 1 |
| `asset_criticality_score` | Numerical weight of target node criticality | Float | 1.0 – 10.0 |
| `avg_criticality_score` | Mean criticality across all nodes in the path | Float | 1.0 – 10.0 |
| `security_controls_bypassed` | Number of active defensive controls (EDR, WAF, IPS) on path | Integer | 0 – 6 |
| `network_exposure_score` | Zone composite exposure rating | Float | 1.0 – 10.0 |

---

## 3. Model Training & Evaluation Metrics

We benchmarked three model families on 6,000 synthetic attack path instances with an 80/20 stratified train/test split:

1. **Random Forest Classifier & Regressor (Production Model)**:
   - $N_{\text{estimators}} = 100$, $\text{max\_depth} = 12$
   - **Continuous Risk $R^2$**: **0.9726** (RMSE: 3.53 pts)
   - **Classification ROC-AUC**: **0.9697**
   - **Weighted F1-Score**: **0.8532**
2. **Gradient Boosting Classifier (GBDT)**:
   - $N_{\text{estimators}} = 100$, $\text{learning\_rate} = 0.1$, $\text{max\_depth} = 5$
   - **Classification ROC-AUC**: **0.9749**
   - **Weighted F1-Score**: **0.8563**
3. **Logistic Regression (Linear Baseline)**:
   - Max Iterations = 1000, L2 Penalty
   - **Classification ROC-AUC**: **0.9935**
   - **Weighted F1-Score**: **0.9368**

---

## 4. Explainable AI (XAI) Architecture

Cybersecurity analysts cannot rely on "black-box" risk predictions. CyberPath AI computes local feature attribution impact for every predicted path:
$$\text{Impact}(f_i) = \frac{w_i \cdot (x_i - \bar{x}_i)}{\sum_j |w_j \cdot (x_j - \bar{x}_j)|} \times 100\%$$

This produces human-understandable factor contributions (e.g. "+32% Peak CVSS score", "+24% Direct Ingress Exposure", "+21% Sensitive Database Reached").
