"""
Executive and Technical Security Report Generation Engine for CyberPath AI
Generates comprehensive PDF and structured JSON reports containing environment audits,
attack path analysis, ML explainability, simulation telemetry, and What-If posture deltas.
"""
import os
import io
import json
from datetime import datetime
from typing import Dict, Any, List
from fpdf import FPDF

class CyberPathPDFReport(FPDF):
    def header(self):
        self.set_fill_color(15, 23, 42)  # Dark slate header
        self.rect(0, 0, 210, 24, "F")
        self.set_font("Helvetica", "B", 14)
        self.set_text_color(56, 189, 248)  # Cyan
        self.set_xy(10, 6)
        self.cell(0, 10, "CYBERPATH AI - ATTACK GRAPH & RISK PREDICTION REPORT", ln=False)
        self.set_font("Helvetica", "", 9)
        self.set_text_color(148, 163, 184)
        self.set_xy(145, 6)
        self.cell(55, 10, datetime.now().strftime("%Y-%m-%d %H:%M UTC"), align="R")
        self.ln(18)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(148, 163, 184)
        self.cell(0, 10, f"Page {self.page_no()} | Confidential Cybersecurity Assessment | CyberPath AI Defensive Simulator", align="C")

def generate_pdf_report(report_data: Dict[str, Any]) -> bytes:
    """Generates a professional PDF audit report and returns raw PDF bytes."""
    pdf = CyberPathPDFReport()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_text_color(15, 23, 42)

    # 1. Executive Summary Title
    pdf.set_font("Helvetica", "B", 16)
    pdf.set_text_color(14, 116, 144)
    pdf.cell(0, 10, "1. Executive Security Summary", ln=True)
    pdf.ln(2)

    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(51, 65, 85)
    exec_summary = report_data.get("executive_summary", "Automated threat surface assessment executed by CyberPath AI.")
    pdf.multi_cell(0, 6, exec_summary)
    pdf.ln(4)

    # Key Metrics Table / Grid
    pdf.set_fill_color(241, 245, 249)
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(15, 23, 42)
    
    metrics = report_data.get("metrics", {})
    pdf.cell(45, 8, "Total Assets", border=1, fill=True)
    pdf.cell(45, 8, str(metrics.get("total_assets", 0)), border=1)
    pdf.cell(45, 8, "Security Posture", border=1, fill=True)
    pdf.cell(45, 8, f"{metrics.get('security_posture_score', 75)}/100", border=1, ln=True)

    pdf.cell(45, 8, "Attack Paths Found", border=1, fill=True)
    pdf.cell(45, 8, str(metrics.get("total_attack_paths", 0)), border=1)
    pdf.cell(45, 8, "High-Risk Paths", border=1, fill=True)
    pdf.cell(45, 8, str(metrics.get("high_risk_paths_count", 0)), border=1, ln=True)

    pdf.cell(45, 8, "Critical Assets", border=1, fill=True)
    pdf.cell(45, 8, str(metrics.get("critical_assets_count", 0)), border=1)
    pdf.cell(45, 8, "Avg Path Risk", border=1, fill=True)
    pdf.cell(45, 8, f"{metrics.get('average_path_risk', 0.0)}/100", border=1, ln=True)
    pdf.ln(6)

    # 2. Critical Attack Paths Section
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(14, 116, 144)
    pdf.cell(0, 8, "2. Prioritized High-Risk Attack Trajectories", ln=True)
    pdf.ln(2)

    top_paths = report_data.get("top_paths", [])[:5]
    if top_paths:
        for idx, p in enumerate(top_paths, 1):
            nodes_str = " -> ".join(p.get("nodes", []))
            pdf.set_font("Helvetica", "B", 10)
            risk_cls = p.get("risk_class", "High")
            if risk_cls == "Critical":
                pdf.set_text_color(185, 28, 28)
            elif risk_cls == "High":
                pdf.set_text_color(194, 65, 12)
            else:
                pdf.set_text_color(30, 41, 59)

            pdf.cell(0, 6, f"Path #{idx}: [{risk_cls.upper()}] Risk Score: {p.get('risk_score')}/100", ln=True)
            pdf.set_font("Courier", "", 8)
            pdf.set_text_color(71, 85, 105)
            pdf.multi_cell(0, 5, f"Trajectory: {nodes_str}")
            
            # Top contributing factors
            factors = p.get("top_factors", [])
            if factors:
                pdf.set_font("Helvetica", "I", 8)
                pdf.set_text_color(100, 116, 139)
                fact_str = "Contributing Drivers: " + ", ".join(f"{f.get('label', '')} ({f.get('contribution_percentage', 0)}%)" for f in factors[:3])
                pdf.multi_cell(0, 5, fact_str)
            pdf.ln(3)
    else:
        pdf.set_font("Helvetica", "I", 9)
        pdf.cell(0, 6, "No high-risk attack paths identified under current security controls.", ln=True)
    pdf.ln(4)

    # 3. Dynamic Simulation Telemetry
    sim_data = report_data.get("simulation", {})
    if sim_data:
        pdf.set_font("Helvetica", "B", 14)
        pdf.set_text_color(14, 116, 144)
        pdf.cell(0, 8, "3. Dynamic Adversary Simulation Telemetry", ln=True)
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(51, 65, 85)
        pdf.multi_cell(0, 5, sim_data.get("summary", "Simulation telemetry executed."))
        pdf.ln(3)

    # 4. Defensive Playbook & What-If Mitigations
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(14, 116, 144)
    pdf.cell(0, 8, "4. Recommended Defensive Playbook", ln=True)
    pdf.ln(2)

    recs = report_data.get("recommendations", [])
    if recs:
        for r in recs:
            pdf.set_font("Helvetica", "B", 9)
            pdf.set_text_color(15, 23, 42)
            pdf.cell(0, 5, f"• [{r.get('priority', 'P1')}] {r.get('control', 'Control')}", ln=True)
            pdf.set_font("Helvetica", "", 9)
            pdf.set_text_color(71, 85, 105)
            pdf.multi_cell(0, 5, f"  Action: {r.get('details', '')}")
            pdf.ln(1)

    # Academic Disclaimer (Section 30 of prompt)
    pdf.ln(6)
    pdf.set_fill_color(248, 250, 252)
    pdf.rect(10, pdf.get_y(), 190, 18, "F")
    pdf.set_font("Helvetica", "I", 8)
    pdf.set_text_color(100, 116, 139)
    pdf.set_xy(12, pdf.get_y() + 2)
    pdf.multi_cell(186, 4, "Notice: This report is generated by CyberPath AI defensive simulation platform based entirely on synthetic environment models and simulated risk estimates. Real-world cyber threats possess distinct operational complexities.")

    return pdf.output()
