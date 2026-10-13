"""
Script to generate the CyberPath AI Project Synopsis PowerPoint presentation (.pptx)
Styled with dark SOC cybersecurity visual theme (Navy, Slate, Cyan, Emerald).
"""
import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

def create_presentation(output_filename="CyberPath_AI_Project_Synopsis.pptx"):
    prs = Presentation()
    prs.slide_width = Inches(13.333)  # 16:9 widescreen layout
    prs.slide_height = Inches(7.5)

    # Color Palette
    COLOR_BG = RGBColor(11, 15, 25)          # #0B0F19 Dark Navy/Slate
    COLOR_CARD = RGBColor(15, 23, 42)        # #0F172A Slate 900
    COLOR_CYAN = RGBColor(0, 240, 255)       # #00F0FF Neon Cyan
    COLOR_WHITE = RGBColor(241, 245, 249)    # #F1F5F9 Off-white
    COLOR_MUTED = RGBColor(148, 163, 184)    # #94A3B8 Slate 400
    COLOR_EMERALD = RGBColor(52, 211, 153)   # #34D399 Emerald
    COLOR_RED = RGBColor(248, 113, 113)      # #F87171 Red Accent

    def set_slide_background(slide):
        background = slide.background
        fill = background.fill
        fill.solid()
        fill.fore_color.rgb = COLOR_BG

    def add_header(slide, title_text, category_text="CYBERPATH AI • PROJECT SYNOPSIS"):
        # Category Tag
        cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.7), Inches(0.35))
        tf_cat = cat_box.text_frame
        tf_cat.word_wrap = True
        p_cat = tf_cat.paragraphs[0]
        p_cat.text = category_text.upper()
        p_cat.font.size = Pt(10)
        p_cat.font.bold = True
        p_cat.font.color.rgb = COLOR_CYAN
        p_cat.font.name = "Arial"

        # Main Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.7), Inches(11.7), Inches(0.7))
        tf_title = title_box.text_frame
        tf_title.word_wrap = True
        p_title = tf_title.paragraphs[0]
        p_title.text = title_text
        p_title.font.size = Pt(22)
        p_title.font.bold = True
        p_title.font.color.rgb = COLOR_WHITE
        p_title.font.name = "Arial"

    # ==================== SLIDE 1: Title Slide ====================
    slide_layout = prs.slide_layouts[6] # Blank
    slide1 = prs.slides.add_slide(slide_layout)
    set_slide_background(slide1)

    # Accent Card Container
    shape1 = slide1.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.2), Inches(1.2), Inches(10.9), Inches(5.1)
    )
    shape1.fill.solid()
    shape1.fill.fore_color.rgb = COLOR_CARD
    shape1.line.color.rgb = COLOR_CYAN
    shape1.line.width = Pt(1.5)

    tf1 = shape1.text_frame
    tf1.word_wrap = True
    tf1.margin_left = Inches(0.8)
    tf1.margin_right = Inches(0.8)
    tf1.margin_top = Inches(0.7)

    p = tf1.paragraphs[0]
    p.text = "PROJECT SYNOPSIS"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = COLOR_CYAN
    p.font.name = "Arial"

    p2 = tf1.add_paragraph()
    p2.text = "CyberPath AI"
    p2.font.size = Pt(36)
    p2.font.bold = True
    p2.font.color.rgb = COLOR_WHITE
    p2.font.name = "Arial"
    p2.space_before = Pt(8)

    p3 = tf1.add_paragraph()
    p3.text = "AI-Powered Dynamic Cyber Attack Graph & Attack Path Prediction System"
    p3.font.size = Pt(18)
    p3.font.color.rgb = COLOR_CYAN
    p3.font.name = "Arial"
    p3.space_before = Pt(4)

    p4 = tf1.add_paragraph()
    p4.text = "An educational and defensive cybersecurity platform that models IT infrastructure as a graph, predicts multi-hop attack path risks using Machine Learning, provides Explainable AI (XAI) root-cause attribution, and performs What-If defensive control simulations."
    p4.font.size = Pt(12)
    p4.font.color.rgb = COLOR_MUTED
    p4.font.name = "Arial"
    p4.space_before = Pt(16)

    p5 = tf1.add_paragraph()
    p5.text = "Domain: Cybersecurity • Graph Theory • Machine Learning • Explainable AI"
    p5.font.size = Pt(11)
    p5.font.bold = True
    p5.font.color.rgb = COLOR_EMERALD
    p5.font.name = "Arial"
    p5.space_before = Pt(18)

    # ==================== SLIDE 2: Project Overview & Abstract ====================
    slide2 = prs.slides.add_slide(slide_layout)
    set_slide_background(slide2)
    add_header(slide2, "1. Executive Overview & Abstract")

    cards_data_s2 = [
        ("The Core Concept", "Models an entire organization's IT infrastructure (servers, databases, users, firewalls, credentials) as a directed graph G = (V, E) to uncover hidden lateral pivot chains.", COLOR_CYAN),
        ("Intelligent Defense", "Replaces static spreadsheets and isolated CVSS ratings with dynamic graph traversal, multi-feature machine learning risk prediction, and MITRE ATT&CK mapping.", COLOR_EMERALD),
        ("Safe & Ethical Simulation", "Operates entirely on synthetic organizational data. Performs 0% intrusive scanning, 0% exploitation, and 100% mathematical graph modeling for defense.", COLOR_WHITE)
    ]

    for i, (title, desc, col) in enumerate(cards_data_s2):
        card = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8 + i * 3.9), Inches(1.8), Inches(3.7), Inches(4.8))
        card.fill.solid()
        card.fill.fore_color.rgb = COLOR_CARD
        card.line.color.rgb = col
        card.line.width = Pt(1)

        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.3)
        tf.margin_right = Inches(0.3)
        tf.margin_top = Inches(0.4)

        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(16)
        p.font.bold = True
        p.font.color.rgb = col

        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(12)
        p2.font.color.rgb = COLOR_WHITE
        p2.space_before = Pt(14)

    # ==================== SLIDE 3: Problem Statement ====================
    slide3 = prs.slides.add_slide(slide_layout)
    set_slide_background(slide3)
    add_header(slide3, "2. Problem Statement & Existing Gaps")

    problems = [
        ("Vulnerability In Silos", "Existing scanners (Nessus/Qualys) score CVEs in isolation. A CVSS 9.0 on an isolated backup server is flagged higher than a CVSS 7.0 on an internet gateway that bridges into a database.", COLOR_RED),
        ("Blindness to Lateral Movement", "Modern adversaries rarely attack critical databases directly; they breach an edge server, escalate privileges, and pivot laterally across multiple trust relationships.", COLOR_RED),
        ("Lack of Pre-Enforcement Testing", "SOC teams cannot easily test the mathematical effect of patching a specific vulnerability or adding a firewall rule before deploying it to production.", COLOR_RED)
    ]

    for i, (title, desc, col) in enumerate(problems):
        card = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8 + i * 3.9), Inches(1.8), Inches(3.7), Inches(4.8))
        card.fill.solid()
        card.fill.fore_color.rgb = COLOR_CARD
        card.line.color.rgb = col
        card.line.width = Pt(1)

        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.3)
        tf.margin_right = Inches(0.3)
        tf.margin_top = Inches(0.4)

        p = tf.paragraphs[0]
        p.text = f"Gap #{i+1}: {title}"
        p.font.size = Pt(15)
        p.font.bold = True
        p.font.color.rgb = col

        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(12)
        p2.font.color.rgb = COLOR_WHITE
        p2.space_before = Pt(14)

    # ==================== SLIDE 4: System Architecture ====================
    slide4 = prs.slides.add_slide(slide_layout)
    set_slide_background(slide4)
    add_header(slide4, "3. System Architecture & Technical Stack")

    arch_layers = [
        ("Frontend Tier", "• Next.js / React 19 + TypeScript\n• Tailwind CSS (Dark SOC Theme)\n• React Flow (Interactive Graph Canvas)\n• Recharts (Telemetry Distributions)", COLOR_CYAN),
        ("Backend Services", "• Python 3.14 + FastAPI REST Engine\n• NetworkX (Graph Traversal & Pathfinding)\n• SQLite + SQLAlchemy ORM Persistence\n• fpdf2 (Automated Executive PDF Reports)", COLOR_EMERALD),
        ("ML & AI Engine", "• Scikit-Learn (Random Forest & GBDT)\n• 15-Feature Path Feature Extractor\n• Explainable AI (XAI) Attribution\n• Graph AI Lab (GCN Benchmarking)", COLOR_WHITE)
    ]

    for i, (layer, details, col) in enumerate(arch_layers):
        card = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8 + i * 3.9), Inches(1.8), Inches(3.7), Inches(4.8))
        card.fill.solid()
        card.fill.fore_color.rgb = COLOR_CARD
        card.line.color.rgb = col
        card.line.width = Pt(1)

        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.3)
        tf.margin_right = Inches(0.3)
        tf.margin_top = Inches(0.4)

        p = tf.paragraphs[0]
        p.text = layer
        p.font.size = Pt(16)
        p.font.bold = True
        p.font.color.rgb = col

        p2 = tf.add_paragraph()
        p2.text = details
        p2.font.size = Pt(12)
        p2.font.color.rgb = COLOR_WHITE
        p2.space_before = Pt(14)

    # ==================== SLIDE 5: Key Functionalities Overview ====================
    slide5 = prs.slides.add_slide(slide_layout)
    set_slide_background(slide5)
    add_header(slide5, "4. Core System Modules & Functionalities")

    feats = [
        ("1. SOC Dashboard", "Displays Posture Score (0-100), high-risk vectors, and asset breakdowns."),
        ("2. Interactive Builder", "Create simulated hosts, CVEs, firewalls, and network edges visually."),
        ("3. Attack Graph Canvas", "React Flow canvas with risk-colored nodes, zone columns, and telemetry drawer."),
        ("4. ML Risk Prediction", "Trained Random Forest evaluating path risk with R² = 0.97 accuracy."),
        ("5. Explainable AI (XAI)", "Calculates local feature contribution percentages (+32% Max CVSS)."),
        ("6. Adversary Simulation", "Dynamic step-by-step playback mapped to MITRE ATT&CK techniques."),
        ("7. Predictive Next-Hop", "Forecasts adversary's next pivot probability distribution with softmax."),
        ("8. What-If Security Engine", "Tests mitigations (patching, MFA) and computes before/after posture deltas."),
        ("9. CyberPath AI Analyst", "Generates structured SOC investigation questions and defensive playbooks."),
        ("10. Graph AI Lab", "Benchmarks 2-Layer Graph Convolutional Networks (GCN) against classical ML.")
    ]

    # Render as 2 columns of 5 items
    for i, (ftitle, fdesc) in enumerate(feats):
        col_idx = i // 5
        row_idx = i % 5
        
        box = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8 + col_idx * 5.9), Inches(1.8 + row_idx * 0.95), Inches(5.7), Inches(0.8))
        box.fill.solid()
        box.fill.fore_color.rgb = COLOR_CARD
        box.line.color.rgb = COLOR_CYAN if col_idx == 0 else COLOR_EMERALD
        box.line.width = Pt(1)

        tf = box.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.2)
        tf.margin_right = Inches(0.2)
        tf.margin_top = Inches(0.1)

        p = tf.paragraphs[0]
        p.text = ftitle
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = COLOR_CYAN if col_idx == 0 else COLOR_EMERALD

        p2 = tf.add_paragraph()
        p2.text = fdesc
        p2.font.size = Pt(10)
        p2.font.color.rgb = COLOR_WHITE

    # ==================== SLIDE 6: Machine Learning Methodology ====================
    slide6 = prs.slides.add_slide(slide_layout)
    set_slide_background(slide6)
    add_header(slide6, "5. Machine Learning & XAI Methodology")

    ml_cards = [
        ("Feature Extraction", "15 contextual features extracted per candidate path:\n• Path length & hops\n• Internet exposure rating\n• Peak CVSS & average CVSS\n• High-severity CVE count\n• Privilege escalation jumps\n• Target asset criticality weight\n• Security controls bypassed", COLOR_CYAN),
        ("Model Performance", "Trained on 6,000 synthetic attack paths with 80/20 train/test split:\n\n• Random Forest: R² = 0.9726\n• Classifier ROC-AUC: 0.9697\n• Gradient Boosting ROC-AUC: 0.9749\n• Logistic Regression ROC-AUC: 0.9935\n• Low RMSE: 3.53 risk points", COLOR_EMERALD),
        ("Explainable AI (XAI)", "Translates black-box ML predictions into human-readable factor attributions:\n\n• +32% Peak Vulnerability CVSS\n• +24% External Internet Ingress\n• +21% Sensitive Database Reached\n• +15% Privilege Escalation Jump\n• +8% Hop Traversal Efficiency", COLOR_WHITE)
    ]

    for i, (title, text, col) in enumerate(ml_cards):
        card = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8 + i * 3.9), Inches(1.8), Inches(3.7), Inches(4.8))
        card.fill.solid()
        card.fill.fore_color.rgb = COLOR_CARD
        card.line.color.rgb = col
        card.line.width = Pt(1)

        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.3)
        tf.margin_right = Inches(0.3)
        tf.margin_top = Inches(0.4)

        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(15)
        p.font.bold = True
        p.font.color.rgb = col

        p2 = tf.add_paragraph()
        p2.text = text
        p2.font.size = Pt(11)
        p2.font.color.rgb = COLOR_WHITE
        p2.space_before = Pt(12)

    # ==================== SLIDE 7: Dynamic Simulation & What-If ====================
    slide7 = prs.slides.add_slide(slide_layout)
    set_slide_background(slide7)
    add_header(slide7, "6. Dynamic Simulation & What-If Analysis")

    sim_cards = [
        ("Adversary Simulation", "• Simulates multi-stage lateral pivoting step-by-step.\n• Maps every jump to MITRE ATT&CK techniques (T1190 Ingress, T1068 Privilege Escalation, T1021 SMB/RDP, T1048 Exfiltration).\n• Live SOC telemetry terminal log output.", COLOR_CYAN),
        ("Predictive Next-Hop Model", "• Given current attacker node, computes softmax probability distribution over accessible neighbors.\n• Factors adversary utility = Criticality + Exploitability - Friction.\n• Flags highest-risk pivot routes before they happen.", COLOR_EMERALD),
        ("What-If Control Validation", "• Test hypothetical mitigations in software simulation.\n• Example: Patching Log4j on Web Server + blocking DMZ-to-DB reduces high-risk paths from 8 down to 2.\n• Posture score improves from 42/100 to 82/100 (+40 pts gain).", COLOR_WHITE)
    ]

    for i, (title, text, col) in enumerate(sim_cards):
        card = slide7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8 + i * 3.9), Inches(1.8), Inches(3.7), Inches(4.8))
        card.fill.solid()
        card.fill.fore_color.rgb = COLOR_CARD
        card.line.color.rgb = col
        card.line.width = Pt(1)

        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.3)
        tf.margin_right = Inches(0.3)
        tf.margin_top = Inches(0.4)

        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(15)
        p.font.bold = True
        p.font.color.rgb = col

        p2 = tf.add_paragraph()
        p2.text = text
        p2.font.size = Pt(11)
        p2.font.color.rgb = COLOR_WHITE
        p2.space_before = Pt(12)

    # ==================== SLIDE 8: Future Developments ====================
    slide8 = prs.slides.add_slide(slide_layout)
    set_slide_background(slide8)
    add_header(slide8, "7. Future Development Roadmap & Enhancements")

    future_points = [
        ("1. Reinforcement Learning for Autonomous Response", "Integrate Deep Q-Learning (DQN) or PPO to train an autonomous defensive agent that discovers optimal security control placements with minimal operational disruption.", COLOR_CYAN),
        ("2. Live STIX / TAXII Threat Intel Feeds", "Ingest real-time cyber threat intelligence feeds (CISA KEV, AlienVault OTX, MITRE ATT&CK) to dynamically weight CVE exploitability against active campaigns in the wild.", COLOR_EMERALD),
        ("3. Cloud & Kubernetes Graph Connectors", "Add automated topology discovery plugins for AWS VPCs, Azure Resource Manager, and Kubernetes clusters to model cloud-native attack graphs directly from Terraform/K8s manifests.", COLOR_WHITE),
        ("4. Zero-Trust Continuous Verification Engine", "Incorporate identity-centric trust scores and dynamic conditional access simulation (e.g. Okta / Microsoft Entra ID token lifecycles) into graph edge evaluation.", COLOR_CYAN),
        ("5. Multi-Agent Red Team vs. Blue Team War Gaming", "Simulate competitive multi-agent game-theoretic simulations where red agents attempt multi-path data exfiltration while blue agents dynamically deploy micro-honeypots and ACLs.", COLOR_EMERALD)
    ]

    for i, (title, desc, col) in enumerate(future_points):
        box = slide8.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.7 + i * 1.0), Inches(11.7), Inches(0.85))
        box.fill.solid()
        box.fill.fore_color.rgb = COLOR_CARD
        box.line.color.rgb = col
        box.line.width = Pt(1)

        tf = box.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.3)
        tf.margin_right = Inches(0.3)
        tf.margin_top = Inches(0.12)

        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = col

        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(11)
        p2.font.color.rgb = COLOR_WHITE

    # ==================== SLIDE 9: Conclusion & Q&A ====================
    slide9 = prs.slides.add_slide(slide_layout)
    set_slide_background(slide9)

    shape9 = slide9.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.2), Inches(1.2), Inches(10.9), Inches(5.1)
    )
    shape9.fill.solid()
    shape9.fill.fore_color.rgb = COLOR_CARD
    shape9.line.color.rgb = COLOR_CYAN
    shape9.line.width = Pt(1.5)

    tf9 = shape9.text_frame
    tf9.word_wrap = True
    tf9.margin_left = Inches(0.8)
    tf9.margin_right = Inches(0.8)
    tf9.margin_top = Inches(0.7)

    p = tf9.paragraphs[0]
    p.text = "CONCLUSION & SUMMARY"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = COLOR_CYAN

    p2 = tf9.add_paragraph()
    p2.text = "CyberPath AI"
    p2.font.size = Pt(32)
    p2.font.bold = True
    p2.font.color.rgb = COLOR_WHITE
    p2.space_before = Pt(6)

    p3 = tf9.add_paragraph()
    p3.text = "• Successfully bridges graph analytics, machine learning, and defensive cybersecurity.\n• Enables proactive threat path discovery, explainable risk scoring, and What-If mitigation pre-validation.\n• Completely functional full-stack architecture (FastAPI + React + Scikit-Learn).\n• Ready for academic presentation, research extension, and portfolio demonstration."
    p3.font.size = Pt(13)
    p3.font.color.rgb = COLOR_WHITE
    p3.space_before = Pt(14)

    p4 = tf9.add_paragraph()
    p4.text = "Thank You! Questions & Discussion"
    p4.font.size = Pt(16)
    p4.font.bold = True
    p4.font.color.rgb = COLOR_EMERALD
    p4.space_before = Pt(20)

    prs.save(output_filename)
    print(f"Presentation saved to: {output_filename}")
    return output_filename

if __name__ == "__main__":
    create_presentation()
