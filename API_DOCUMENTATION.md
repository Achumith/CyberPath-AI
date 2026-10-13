# CyberPath AI — REST API Documentation

Base URL: `http://localhost:8000/api`

## Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Server status and loaded graph node count |
| `GET` | `/dashboard/metrics` | Aggregated SOC posture metrics, risk distributions, top attack paths |
| `GET` | `/assets` | List all modeled infrastructure assets |
| `POST` | `/assets` | Create a new asset with CVEs and properties |
| `DELETE` | `/assets/{id}` | Delete an asset and associated connections |
| `POST` | `/connections` | Establish directed network edge between two assets |
| `GET` | `/graph` | React Flow formatted nodes and edges payload |
| `GET` | `/attack-paths` | Discovered attack paths ranked by ML risk score |
| `POST` | `/attack-paths/generate` | Trigger bounded DFS search for attack paths |
| `POST` | `/simulation/start` | Launch dynamic adversary movement simulation |
| `POST` | `/ml/predict-risk` | Predict continuous risk score and class for path feature vector |
| `POST` | `/ml/next-step` | Forecast adversary next-hop softmax probability distribution |
| `GET` | `/ml/metrics` | Retrieve model evaluation metrics (ROC-AUC, F1, Confusion Matrix) |
| `POST` | `/ml/train` | Retrain and serialize ML models |
| `POST` | `/ai/explain` | Generate AI Security Analyst narrative and SOC questions |
| `POST` | `/what-if` | Evaluate hypothetical defensive mitigations & posture deltas |
| `GET` | `/gnn/benchmark` | Benchmark Graph Convolutional Network against traditional ML |
| `POST` | `/synthetic/generate` | Scaffold synthetic Small, Medium, or Large organization |
| `POST` | `/reset-demo` | Reset environment to preloaded CyberTech Demo |
| `POST` | `/infrastructure/clear` | Clear all nodes and connections, leaving a clean blank canvas |
| `POST` | `/reports/generate` | Generate structured executive report JSON |
| `GET` | `/reports/download-pdf` | Download formatted executive audit PDF document |
| `GET` | `/scanner/catalog` | Get Cisco-style device templates and running service definitions |
| `POST` | `/scanner/run` | Run hop-by-hop packet sweep, port probing & CVE vulnerability audit |
| `POST` | `/scanner/provision` | 1-Click provision devices (Packet Tracer shelf) and wire to graph |
| `POST` | `/scanner/apply` | Commit discovered vulnerabilities to database and update ML pipeline |
| `GET` | `/cve/stats` | High-level statistics for the 1,734+ real CISA KEV vulnerability database |
| `GET` | `/cve/search` | Paginated search across real weaponized CVEs (vendor, product, ransomware) |
| `POST` | `/cve/sync` | Live sync feed from official CISA KEV endpoint or reload local catalog |
| `POST` | `/cve/attach` | 1-Click deploy a real CISA CVE to any asset in the attack graph |
| `GET` | `/cve/{cve_id}/epss` | Real-time exploit prediction probability (EPSS) from FIRST.org API |

---

## Interactive Swagger Docs
Interactive OpenAPI documentation is automatically available at:
`http://localhost:8000/docs`
