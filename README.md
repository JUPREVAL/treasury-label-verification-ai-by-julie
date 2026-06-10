# 🏦 Treasury Label Verification AI

> An AI-powered prototype for automated OCR extraction and intelligent comparison of treasury instrument labels — built to reduce manual verification errors and accelerate audit workflows.

![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python&logoColor=white)
![Streamlit](https://img.shields.io/badge/Streamlit-App-red?logo=streamlit&logoColor=white)
![OpenCV](https://img.shields.io/badge/OpenCV-Image%20Processing-green?logo=opencv)
![Tesseract](https://img.shields.io/badge/Tesseract-OCR-orange)
![License](https://img.shields.io/badge/License-MIT-lightgrey)
![Status](https://img.shields.io/badge/Status-Prototype-yellow)

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Purpose & Problem Statement](#purpose--problem-statement)
- [Stakeholder Context](#stakeholder-context)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [How to Run Locally](#how-to-run-locally)
- [How OCR Works](#how-ocr-works)
- [How Comparison Logic Works](#how-comparison-logic-works)
- [Assumptions](#assumptions)
- [Known Limitations](#known-limitations)
- [Future Improvements](#future-improvements)
- [Author](#author)

---

## Project Overview

The **Treasury Label Verification AI** is a Python-based prototype that automates the verification of physical and digital treasury instrument labels. It ingests label images (scanned or photographed), extracts structured text data using Optical Character Recognition (OCR), and compares the extracted values against a reference dataset — surfacing mismatches, anomalies, and confidence scores in a clean, actionable report.

This tool was designed as an internal proof-of-concept to demonstrate how AI and computer vision can streamline treasury operations that are currently performed manually.

---

## Purpose & Problem Statement

Treasury teams routinely verify labels on financial instruments — such as bonds, notes, certificates of deposit, and custody receipts — to ensure that printed details (CUSIP numbers, maturity dates, face values, issuer names, interest rates, etc.) match the system of record.

**The manual process is:**
- ⏳ Time-consuming — a single batch of labels can take hours to verify
- ⚠️ Error-prone — transposition mistakes are common under deadline pressure
- 📂 Difficult to audit — no structured log of what was checked or when

**This prototype demonstrates that:**
- OCR can reliably extract structured fields from label images
- Rule-based and fuzzy comparison logic can flag discrepancies automatically
- A simple UI can make this accessible to non-technical treasury staff

---

## Stakeholder Context

| Stakeholder | Role | Interest |
|---|---|---|
| Treasury Operations Team | Primary users | Faster, more accurate label verification |
| Internal Audit | Reviewers | Structured verification logs and discrepancy reports |
| IT / Engineering | Maintainers | Clean, extensible codebase for future integration |
| Finance Leadership | Sponsors | Risk reduction and operational efficiency |

This prototype was built to serve as a demonstration for leadership and IT stakeholders, illustrating the feasibility of an AI-assisted verification workflow before committing to a full production build.

---

## Features

- 📷 **Image Upload** — Upload single or batch label images (PNG, JPG, PDF)
- 🔍 **OCR Extraction** — Automatically extracts key fields: CUSIP, issuer name, face value, maturity date, interest rate, and settlement date
- 📊 **Reference Comparison** — Compares extracted data against a loaded reference file (CSV or Excel)
- ✅ **Match Scoring** — Produces a field-level confidence score and overall match status (PASS / FAIL / REVIEW)
- 🚨 **Discrepancy Flagging** — Highlights mismatched or missing fields with color-coded indicators
- 📁 **Export Reports** — Exports verification results as a structured CSV or Excel report
- 🖥️ **Streamlit UI** — Clean, browser-based interface requiring no technical knowledge to operate
- 🔄 **Batch Processing** — Supports processing multiple label images in a single session

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Language | Python 3.10+ | Core application logic |
| UI Framework | Streamlit | Interactive web-based front end |
| OCR Engine | Tesseract OCR (via `pytesseract`) | Text extraction from images |
| Image Preprocessing | OpenCV (`cv2`) | Deskewing, thresholding, noise removal |
| Data Handling | Pandas | Reference data loading and comparison |
| Fuzzy Matching | `rapidfuzz` | Tolerant string comparison for names/issuers |
| File Parsing | Pillow (PIL) | Image format handling |
| Export | `openpyxl` / `xlsxwriter` | Excel report generation |
| Environment Mgmt | `python-dotenv` | Secrets and config management |

---

## Project Structure

