"""
Script to generate a presentation on 3 Project Topics:
1. Login Anomaly Detector
2. Crop Rotation Recommendation System
3. CyberPath AI

Each topic has 1 dedicated slide explaining basic working and functionality.
"""
import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def build_presentation(output_filename="Three_Project_Topics_Presentation.pptx"):
    prs = Presentation()
    prs.slide_width = Inches(13.333)  # 16:9 widescreen layout
    prs.slide_height = Inches(7.5)

    # Color Palette
    COLOR_BG = RGBColor(11, 17, 33)           # Deep Tech Navy
    COLOR_CARD = RGBColor(18, 27, 51)         # Card Dark Slate
    COLOR_CARD_ALT = RGBColor(23, 34, 64)     # Slightly lighter card
    COLOR_WHITE = RGBColor(245, 248, 252)     # Crisp Off-White
    COLOR_MUTED = RGBColor(156, 174, 198)     # Soft Slate Muted Text
    
    # Topic Accent Colors
    COLOR_CYAN = RGBColor(0, 229, 255)        # Topic 1 Accent (Cyber Blue/Cyan)
    COLOR_GREEN = RGBColor(46, 213, 115)      # Topic 2 Accent (Agri Emerald)
    COLOR_ORANGE = RGBColor(255, 121, 63)     # Topic 3 Accent (Path Alert Coral/Orange)
    COLOR_PURPLE = RGBColor(165, 94, 234)     # Accent / Tag Purple
    COLOR_AMBER = RGBColor(255, 184, 0)       # Amber Warning

    blank_layout = prs.slide_layouts[6]

    def set_background(slide):
        bg = slide.background
        fill = bg.fill
        fill.solid()
        fill.fore_color.rgb = COLOR_BG

    def add_slide_header(slide, topic_num_text, title_text, subtitle_text, accent_color):
        # Category / Topic Number Pill
        cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.733), Inches(0.35))
        tf_cat = cat_box.text_frame
        tf_cat.word_wrap = True
        tf_cat.margin_left = tf_cat.margin_top = tf_cat.margin_right = tf_cat.margin_bottom = 0
        p_cat = tf_cat.paragraphs[0]
        p_cat.text = topic_num_text.upper()
        p_cat.font.size = Pt(11)
        p_cat.font.bold = True
        p_cat.font.color.rgb = accent_color
        p_cat.font.name = "Arial"

        # Main Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.72), Inches(11.733), Inches(0.55))
        tf_title = title_box.text_frame
        tf_title.word_wrap = True
        tf_title.margin_left = tf_title.margin_top = tf_title.margin_right = tf_title.margin_bottom = 0
        p_title = tf_title.paragraphs[0]
        p_title.text = title_text
        p_title.font.size = Pt(24)
        p_title.font.bold = True
        p_title.font.color.rgb = COLOR_WHITE
        p_title.font.name = "Arial"

        # Subtitle / One-liner Summary
        sub_box = slide.shapes.add_textbox(Inches(0.8), Inches(1.3), Inches(11.733), Inches(0.35))
        tf_sub = sub_box.text_frame
        tf_sub.word_wrap = True
        tf_sub.margin_left = tf_sub.margin_top = tf_sub.margin_right = tf_sub.margin_bottom = 0
        p_sub = tf_sub.paragraphs[0]
        p_sub.text = subtitle_text
        p_sub.font.size = Pt(12)
        p_sub.font.color.rgb = COLOR_MUTED
        p_sub.font.name = "Arial"

    # =========================================================================
    # SLIDE 1: Title Slide & Project Overview
    # =========================================================================
    slide1 = prs.slides.add_slide(blank_layout)
    set_background(slide1)

    # Title Card container
    main_card = slide1.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.8), Inches(11.733), Inches(2.2)
    )
    main_card.fill.solid()
    main_card.fill.fore_color.rgb = COLOR_CARD
    main_card.line.color.rgb = COLOR_PURPLE
    main_card.line.width = Pt(1.5)

    tf_main = main_card.text_frame
    tf_main.word_wrap = True
    tf_main.margin_left = Inches(0.6)
    tf_main.margin_top = Inches(0.35)

    p0 = tf_main.paragraphs[0]
    p0.text = "PROJECT PROPOSAL & CONCEPT EVALUATION"
    p0.font.size = Pt(11)
    p0.font.bold = True
    p0.font.color.rgb = COLOR_PURPLE

    p1 = tf_main.add_paragraph()
    p1.text = "Three Innovative Project Concepts"
    p1.font.size = Pt(30)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_WHITE
    p1.space_before = Pt(4)

    p2 = tf_main.add_paragraph()
    p2.text = "A comparative overview of core architecture, basic working, and functionalities across three engineering project domains."
    p2.font.size = Pt(12)
    p2.font.color.rgb = COLOR_MUTED
    p2.space_before = Pt(6)

    # 3 Summary Cards for the 3 topics
    topics_summary = [
        {
            "num": "PROJECT 01",
            "title": "Login Anomaly Detector",
            "tag": "Cybersecurity / Identity & Access Management",
            "desc": "Real-time user behavior analytics (UBA) engine that flags credential stuffing, account takeover, and impossible travel using ML anomaly detection.",
            "color": COLOR_CYAN
        },
        {
            "num": "PROJECT 02",
            "title": "Crop Rotation Recommender",
            "tag": "AgriTech & Decision Intelligence",
            "desc": "Data-driven agricultural planner optimizing multi-season crop cycles based on soil NPK levels, pest cycle disruption, and yield/profit maximization.",
            "color": COLOR_GREEN
        },
        {
            "num": "PROJECT 03",
            "title": "CyberPath AI",
            "tag": "Network Security & Graph AI",
            "desc": "AI-powered attack graph modeling system that discovers multi-hop breach vectors, calculates ML path risk, and enables defensive What-If simulations.",
            "color": COLOR_ORANGE
        }
    ]

    for i, t in enumerate(topics_summary):
        card = slide1.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE,
            Inches(0.8 + i * 4.0), Inches(3.3), Inches(3.733), Inches(3.4)
        )
        card.fill.solid()
        card.fill.fore_color.rgb = COLOR_CARD
        card.line.color.rgb = t["color"]
        card.line.width = Pt(1.5)

        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.35)
        tf.margin_right = Inches(0.35)
        tf.margin_top = Inches(0.35)

        p_num = tf.paragraphs[0]
        p_num.text = t["num"]
        p_num.font.size = Pt(11)
        p_num.font.bold = True
        p_num.font.color.rgb = t["color"]

        p_t = tf.add_paragraph()
        p_t.text = t["title"]
        p_t.font.size = Pt(18)
        p_t.font.bold = True
        p_t.font.color.rgb = COLOR_WHITE
        p_t.space_before = Pt(6)

        p_tag = tf.add_paragraph()
        p_tag.text = t["tag"]
        p_tag.font.size = Pt(10)
        p_tag.font.color.rgb = t["color"]
        p_tag.space_before = Pt(4)

        p_d = tf.add_paragraph()
        p_d.text = t["desc"]
        p_d.font.size = Pt(11)
        p_d.font.color.rgb = COLOR_MUTED
        p_d.space_before = Pt(12)

    # =========================================================================
    # SLIDE 2: Topic 1 - Login Anomaly Detector
    # =========================================================================
    slide2 = prs.slides.add_slide(blank_layout)
    set_background(slide2)
    add_slide_header(
        slide2,
        topic_num_text="Project Topic 01 | Cybersecurity / Identity & Access Management (IAM)",
        title_text="Login Anomaly Detector",
        subtitle_text="AI-driven authentication risk scoring to proactively prevent unauthorized account takeovers and credential stuffing.",
        accent_color=COLOR_CYAN
    )

    # Column Left: Basic Working (Step-by-Step Flow)
    # Header label for Left Column
    lbl_left = slide2.shapes.add_textbox(Inches(0.8), Inches(1.72), Inches(5.6), Inches(0.35))
    tf_ll = lbl_left.text_frame
    p_ll = tf_ll.paragraphs[0]
    p_ll.text = "BASIC WORKING & DATA FLOW"
    p_ll.font.size = Pt(12)
    p_ll.font.bold = True
    p_ll.font.color.rgb = COLOR_CYAN

    steps_topic1 = [
        ("Step 1: Telemetry & Feature Ingestion",
         "Collects login context per attempt: Client IP, ASN, GeoIP coordinates, Device Fingerprint (User-Agent, Canvas ID), login timestamp, and recent failed attempt velocity."),
        ("Step 2: User Behavioral Baseline Modeling",
         "Constructs an individualized historical profile for each user (typical access hours, regular devices, common geographic bounding boxes, and typical session frequency)."),
        ("Step 3: Machine Learning & Heuristic Risk Engine",
         "Evaluates attempt against baselines using Isolation Forest / Autoencoders combined with rules: Impossible Travel (e.g. London to Tokyo in 20 min) and new device novelty."),
        ("Step 4: Adaptive Multi-Tier Response Action",
         "Computes dynamic risk score (0-100). Low: Allow seamlessly; Medium: Trigger Step-Up MFA / OTP verification; High: Block request, revoke active tokens, and alert SOC.")
    ]

    for i, (stitle, sdesc) in enumerate(steps_topic1):
        box = slide2.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE,
            Inches(0.8), Inches(2.15 + i * 1.15), Inches(5.6), Inches(1.05)
        )
        box.fill.solid()
        box.fill.fore_color.rgb = COLOR_CARD
        box.line.color.rgb = COLOR_CYAN
        box.line.width = Pt(1)

        tf = box.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.25)
        tf.margin_right = Inches(0.25)
        tf.margin_top = Inches(0.12)

        p = tf.paragraphs[0]
        p.text = stitle
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = COLOR_CYAN

        p2 = tf.add_paragraph()
        p2.text = sdesc
        p2.font.size = Pt(10)
        p2.font.color.rgb = COLOR_WHITE
        p2.space_before = Pt(3)

    # Column Right: Core Functionality & Features
    lbl_right = slide2.shapes.add_textbox(Inches(6.8), Inches(1.72), Inches(5.733), Inches(0.35))
    tf_lr = lbl_right.text_frame
    p_lr = tf_lr.paragraphs[0]
    p_lr.text = "CORE FUNCTIONALITIES & CAPABILITIES"
    p_lr.font.size = Pt(12)
    p_lr.font.bold = True
    p_lr.font.color.rgb = COLOR_CYAN

    features_topic1 = [
        ("Real-Time Risk Scoring (0–100)", "Instantaneous sub-50ms risk evaluation executed during authentication handshake before token issuance."),
        ("Impossible Travel & Geovelocity Detection", "Mathematical speed calculation flagging logins across distant geographic coordinates within impossible timeframes."),
        ("Device & Browser Fingerprinting", "Tracks hardware attributes, screen resolutions, and OS headers to detect session hijacking or automated headless bots."),
        ("Adaptive Step-Up MFA Challenge", "Minimizes user friction by asking for MFA only when behavioral anomalies are detected; seamless otherwise.")
    ]

    for i, (ftitle, fdesc) in enumerate(features_topic1):
        box = slide2.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE,
            Inches(6.8), Inches(2.15 + i * 0.85), Inches(5.733), Inches(0.77)
        )
        box.fill.solid()
        box.fill.fore_color.rgb = COLOR_CARD
        box.line.color.rgb = COLOR_CARD_ALT
        box.line.width = Pt(1)

        tf = box.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.25)
        tf.margin_right = Inches(0.25)
        tf.margin_top = Inches(0.1)

        p = tf.paragraphs[0]
        p.text = f"• {ftitle}: "
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = COLOR_WHITE
        
        # Add run for description
        run = p.add_run()
        run.text = fdesc
        run.font.bold = False
        run.font.size = Pt(10)
        run.font.color.rgb = COLOR_MUTED

    # Bottom Right Card: Tech Stack & Impact
    bot_card1 = slide2.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE,
        Inches(6.8), Inches(5.62), Inches(5.733), Inches(1.15)
    )
    bot_card1.fill.solid()
    bot_card1.fill.fore_color.rgb = COLOR_CARD
    bot_card1.line.color.rgb = COLOR_CYAN
    bot_card1.line.width = Pt(1)

    tf_bc1 = bot_card1.text_frame
    tf_bc1.word_wrap = True
    tf_bc1.margin_left = Inches(0.25)
    tf_bc1.margin_top = Inches(0.12)

    p_b1 = tf_bc1.paragraphs[0]
    p_b1.text = "TECH STACK & DEPLOYMENT VALUE"
    p_b1.font.size = Pt(11)
    p_b1.font.bold = True
    p_b1.font.color.rgb = COLOR_CYAN

    p_b2 = tf_bc1.add_paragraph()
    p_b2.text = "• Tech Stack: Python (FastAPI / Flask), Scikit-Learn (Isolation Forest, One-Class SVM), Redis (Velocity counters), MaxMind GeoIP2, React / Streamlit Dashboard.\n• Core Benefit: Eliminates account takeover (ATO) attacks while avoiding unnecessary MFA fatigue for legitimate users."
    p_b2.font.size = Pt(9.5)
    p_b2.font.color.rgb = COLOR_WHITE
    p_b2.space_before = Pt(4)

    # =========================================================================
    # SLIDE 3: Topic 2 - Crop Rotation Recommendation System
    # =========================================================================
    slide3 = prs.slides.add_slide(blank_layout)
    set_background(slide3)
    add_slide_header(
        slide3,
        topic_num_text="Project Topic 02 | AgriTech & Precision Farming (Data Science / ML)",
        title_text="Crop Rotation Recommendation System",
        subtitle_text="Intelligent agricultural decision support optimizing seasonal crop sequencing for soil replenishment and maximum farmer yield.",
        accent_color=COLOR_GREEN
    )

    # Column Left: Basic Working (Step-by-Step Flow)
    lbl_left2 = slide3.shapes.add_textbox(Inches(0.8), Inches(1.72), Inches(5.6), Inches(0.35))
    tf_ll2 = lbl_left2.text_frame
    p_ll2 = tf_ll2.paragraphs[0]
    p_ll2.text = "BASIC WORKING & DATA FLOW"
    p_ll2.font.size = Pt(12)
    p_ll2.font.bold = True
    p_ll2.font.color.rgb = COLOR_GREEN

    steps_topic2 = [
        ("Step 1: Field & Environmental Data Ingestion",
         "Captures soil telemetry (Nitrogen, Phosphorus, Potassium - NPK, pH), historical crops grown on the land, plot acreage, geographic zone, and seasonal weather forecasts."),
        ("Step 2: Agronomic Rules & Ecological Filtering",
         "Applies botanical constraint rules: avoids planting same botanical families consecutively (prevents disease cycles) and enforces legume integration to naturally replenish nitrogen."),
        ("Step 3: Machine Learning & Multi-Objective Ranking",
         "Runs Random Forest / XGBoost yield predictors alongside linear optimization algorithms to score candidate crops against nutrient balance, water requirement, and market profitability."),
        ("Step 4: Dynamic Crop Calendar & Advisory Output",
         "Generates a multi-season rotation roadmap (Kharif, Rabi, Zaid) detailing recommended crop varieties, expected soil restoration metrics, and customized organic fertilizer guidance.")
    ]

    for i, (stitle, sdesc) in enumerate(steps_topic2):
        box = slide3.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE,
            Inches(0.8), Inches(2.15 + i * 1.15), Inches(5.6), Inches(1.05)
        )
        box.fill.solid()
        box.fill.fore_color.rgb = COLOR_CARD
        box.line.color.rgb = COLOR_GREEN
        box.line.width = Pt(1)

        tf = box.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.25)
        tf.margin_right = Inches(0.25)
        tf.margin_top = Inches(0.12)

        p = tf.paragraphs[0]
        p.text = stitle
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = COLOR_GREEN

        p2 = tf.add_paragraph()
        p2.text = sdesc
        p2.font.size = Pt(10)
        p2.font.color.rgb = COLOR_WHITE
        p2.space_before = Pt(3)

    # Column Right: Core Functionality & Features
    lbl_right2 = slide3.shapes.add_textbox(Inches(6.8), Inches(1.72), Inches(5.733), Inches(0.35))
    tf_lr2 = lbl_right2.text_frame
    p_lr2 = tf_lr2.paragraphs[0]
    p_lr2.text = "CORE FUNCTIONALITIES & CAPABILITIES"
    p_lr2.font.size = Pt(12)
    p_lr2.font.bold = True
    p_lr2.font.color.rgb = COLOR_GREEN

    features_topic2 = [
        ("Soil Nutrient Balancing (NPK Management)", "Tracks nutrient depletion by heavy feeder crops and prescribes restorative crops (e.g. pulses) to reduce chemical fertilizer dependency."),
        ("Pest & Soil Pathogen Cycle Disruption", "Identifies vulnerable crop families (e.g. Solanaceae) and sequences non-host crops to starve soil-borne pests naturally."),
        ("Weather & Climate Risk Forecasting", "Integrates precipitation and temperature projections to ensure recommended crops match expected seasonal rainfall."),
        ("Economic Yield & Profit Forecasting", "Combines historical mandi/market price trends with yield estimation to recommend sequences that maximize net farmer revenue.")
    ]

    for i, (ftitle, fdesc) in enumerate(features_topic2):
        box = slide3.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE,
            Inches(6.8), Inches(2.15 + i * 0.85), Inches(5.733), Inches(0.77)
        )
        box.fill.solid()
        box.fill.fore_color.rgb = COLOR_CARD
        box.line.color.rgb = COLOR_CARD_ALT
        box.line.width = Pt(1)

        tf = box.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.25)
        tf.margin_right = Inches(0.25)
        tf.margin_top = Inches(0.1)

        p = tf.paragraphs[0]
        p.text = f"- {ftitle}: "
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = COLOR_WHITE
        
        run = p.add_run()
        run.text = fdesc
        run.font.bold = False
        run.font.size = Pt(10)
        run.font.color.rgb = COLOR_MUTED

    # Bottom Right Card: Tech Stack & Impact
    bot_card2 = slide3.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE,
        Inches(6.8), Inches(5.62), Inches(5.733), Inches(1.15)
    )
    bot_card2.fill.solid()
    bot_card2.fill.fore_color.rgb = COLOR_CARD
    bot_card2.line.color.rgb = COLOR_GREEN
    bot_card2.line.width = Pt(1)

    tf_bc2 = bot_card2.text_frame
    tf_bc2.word_wrap = True
    tf_bc2.margin_left = Inches(0.25)
    tf_bc2.margin_top = Inches(0.12)

    p_b2 = tf_bc2.paragraphs[0]
    p_b2.text = "TECH STACK & DEPLOYMENT VALUE"
    p_b2.font.size = Pt(11)
    p_b2.font.bold = True
    p_b2.font.color.rgb = COLOR_GREEN

    p_b2_desc = tf_bc2.add_paragraph()
    p_b2_desc.text = "• Tech Stack: Python, Scikit-Learn (Random Forest, XGBoost), PuLP / SciPy (Linear Optimization), OpenWeatherMap API, React / Streamlit, PostgreSQL.\n• Core Benefit: Promotes sustainable ecological farming, cuts fertilizer costs by up to 30%, and prevents catastrophic soil degradation."
    p_b2_desc.font.size = Pt(9.5)
    p_b2_desc.font.color.rgb = COLOR_WHITE
    p_b2_desc.space_before = Pt(4)

    # =========================================================================
    # SLIDE 4: Topic 3 - CyberPath AI
    # =========================================================================
    slide4 = prs.slides.add_slide(blank_layout)
    set_background(slide4)
    add_slide_header(
        slide4,
        topic_num_text="Project Topic 03 | Defensive Cybersecurity & Attack Graph AI",
        title_text="CyberPath AI",
        subtitle_text="AI-powered dynamic attack graph and attack path prediction platform modeling multi-hop adversary lateral movement.",
        accent_color=COLOR_ORANGE
    )

    # Column Left: Basic Working (Step-by-Step Flow)
    lbl_left3 = slide4.shapes.add_textbox(Inches(0.8), Inches(1.72), Inches(5.6), Inches(0.35))
    tf_ll3 = lbl_left3.text_frame
    p_ll3 = tf_ll3.paragraphs[0]
    p_ll3.text = "BASIC WORKING & DATA FLOW"
    p_ll3.font.size = Pt(12)
    p_ll3.font.bold = True
    p_ll3.font.color.rgb = COLOR_ORANGE

    steps_topic3 = [
        ("Step 1: Network Topology & CVE Mapping",
         "Ingests enterprise assets (Web Servers, Firewalls, DBs, Domain Controllers) and correlates discovered vulnerabilities with CVSS scores, CISA KEV feeds, and EPSS exploit data."),
        ("Step 2: Directed Attack Graph Generation",
         "Constructs a multi-tier directed network graph (NetworkX) and executes bounded traversal algorithms to discover all reachable multi-hop attack trajectories from internet to core vault."),
        ("Step 3: ML Risk Prediction & Explainability (XAI)",
         "Evaluates attack paths via trained Random Forest / GNN models (0.97+ ROC-AUC) on path length, peak CVSS, privilege hops, and provides percentage feature attribution (+32% Peak CVSS)."),
        ("Step 4: Dynamic Adversary Simulation & What-If Defense",
         "Simulates step-by-step attacker traversal mapped to MITRE ATT&CK techniques, and lets defenders test 'What-If' controls (patching, firewall microsegmentation) with live posture deltas.")
    ]

    for i, (stitle, sdesc) in enumerate(steps_topic3):
        box = slide4.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE,
            Inches(0.8), Inches(2.15 + i * 1.15), Inches(5.6), Inches(1.05)
        )
        box.fill.solid()
        box.fill.fore_color.rgb = COLOR_CARD
        box.line.color.rgb = COLOR_ORANGE
        box.line.width = Pt(1)

        tf = box.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.25)
        tf.margin_right = Inches(0.25)
        tf.margin_top = Inches(0.12)

        p = tf.paragraphs[0]
        p.text = stitle
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = COLOR_ORANGE

        p2 = tf.add_paragraph()
        p2.text = sdesc
        p2.font.size = Pt(10)
        p2.font.color.rgb = COLOR_WHITE
        p2.space_before = Pt(3)

    # Column Right: Core Functionality & Features
    lbl_right3 = slide4.shapes.add_textbox(Inches(6.8), Inches(1.72), Inches(5.733), Inches(0.35))
    tf_lr3 = lbl_right3.text_frame
    p_lr3 = tf_lr3.paragraphs[0]
    p_lr3.text = "CORE FUNCTIONALITIES & CAPABILITIES"
    p_lr3.font.size = Pt(12)
    p_lr3.font.bold = True
    p_lr3.font.color.rgb = COLOR_ORANGE

    features_topic3 = [
        ("Interactive Attack Graph Canvas", "Zone-based visualization (DMZ, Internal, Secure Vault) powered by React Flow with custom glowing threat cards and real-time node telemetry."),
        ("Multi-Hop Path Risk Scoring & Ranking", "Predicts end-to-end breach probability for all candidate chains, ranking them from Critical to Low risk for prioritized remediation."),
        ("Explainable AI (XAI) Attribution", "Unpacks the 'Black Box' of ML predictions, showing defenders the exact root-cause metrics driving high path criticality."),
        ("What-If Defensive Control Simulation", "Defenders toggle virtual patches or network isolation rules to instantly see blocked attack paths and post-mitigation posture deltas (e.g. +18 pts).")
    ]

    for i, (ftitle, fdesc) in enumerate(features_topic3):
        box = slide4.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE,
            Inches(6.8), Inches(2.15 + i * 0.85), Inches(5.733), Inches(0.77)
        )
        box.fill.solid()
        box.fill.fore_color.rgb = COLOR_CARD
        box.line.color.rgb = COLOR_CARD_ALT
        box.line.width = Pt(1)

        tf = box.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.25)
        tf.margin_right = Inches(0.25)
        tf.margin_top = Inches(0.1)

        p = tf.paragraphs[0]
        p.text = f"• {ftitle}: "
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = COLOR_WHITE
        
        run = p.add_run()
        run.text = fdesc
        run.font.bold = False
        run.font.size = Pt(10)
        run.font.color.rgb = COLOR_MUTED

    # Bottom Right Card: Tech Stack & Impact
    bot_card3 = slide4.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE,
        Inches(6.8), Inches(5.62), Inches(5.733), Inches(1.15)
    )
    bot_card3.fill.solid()
    bot_card3.fill.fore_color.rgb = COLOR_CARD
    bot_card3.line.color.rgb = COLOR_ORANGE
    bot_card3.line.width = Pt(1)

    tf_bc3 = bot_card3.text_frame
    tf_bc3.word_wrap = True
    tf_bc3.margin_left = Inches(0.25)
    tf_bc3.margin_top = Inches(0.12)

    p_b3 = tf_bc3.paragraphs[0]
    p_b3.text = "TECH STACK & DEPLOYMENT VALUE"
    p_b3.font.size = Pt(11)
    p_b3.font.bold = True
    p_b3.font.color.rgb = COLOR_ORANGE

    p_b3_desc = tf_bc3.add_paragraph()
    p_b3_desc.text = "• Tech Stack: FastAPI (Python), React 19 + TypeScript, NetworkX / GCN, Scikit-Learn (Random Forest & XGBoost), CISA KEV & EPSS APIs, Recharts.\n• Core Benefit: Shifts SOC teams from reactive alerts to proactive attack path disruption, stopping attackers before they reach critical assets."
    p_b3_desc.font.size = Pt(9.5)
    p_b3_desc.font.color.rgb = COLOR_WHITE
    p_b3_desc.space_before = Pt(4)

    # Save presentation
    prs.save(output_filename)
    print(f"[+] Presentation successfully generated: {output_filename}")

if __name__ == "__main__":
    build_presentation()
