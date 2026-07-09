# 🔐 SecureVault: Zero-Knowledge Password Manager

[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker&logoColor=white)](#)
[![React](https://img.shields.io/badge/Frontend-React.js-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](#)
[![Flask](https://img.shields.io/badge/Backend-Flask_REST-000000?style=for-the-badge&logo=flask&logoColor=white)](#)
[![Security](https://img.shields.io/badge/Architecture-Zero--Knowledge-059669?style=for-the-badge&logo=shield&logoColor=white)](#)

> An enterprise-grade, containerized Identity and Access Management (IAM) storage platform. SecureVault is built on a strict **Zero-Knowledge Architecture**, ensuring that plaintext data never leaves the client device. The backend operates purely as a stateless, zero-trust locker for cryptographic blobs.

---

## ✨ System Highlights

* **Zero-Knowledge Proofs:** The server never receives, processes, or stores your master password or plaintext credentials. It is mathematically impossible for the server to read your data.
* **Client-Side Cryptography:** AES-GCM encryption and decryption are executed entirely within the browser's local memory.
* **Proactive Security Audit:** An automated local analysis engine scans decrypted data to flag low-entropy strings and cross-platform password reuse, calculating a real-time "Vault Health Score."
* **Memory Protection:** In-memory session keys are automatically purged after 5 minutes of inactivity to prevent physical session hijacking.
* **DDoS & Brute-Force Mitigation:** Multi-layered backend rate limiting intercepts high-frequency authentication attempts.

---

## 🧠 The Cryptographic Data Flow

SecureVault is designed to withstand a total backend infrastructure compromise. If an attacker breaches the server and exfiltrates the SQLite database, they obtain nothing but mathematically useless ciphertext.

1. **Key Derivation:** The user's `masterPassword` locally derives a strong cryptographic session key.
2. **Client-Side Ciphering:** Upon credential creation, the React frontend uses the derived key to encrypt the plaintext password.
3. **Encrypted Transport:** Only the resulting `ciphertext` and `iv` (Initialization Vector) are transmitted over the network.
4. **Local Decryption:** Upon retrieval, the frontend applies the volatile, in-memory session key to decrypt the payload milliseconds before rendering the UI.

---

## 🛠️ Technology Stack

| Frontend (Client Node) | Backend (API Gateway) | Infrastructure |
| :--- | :--- | :--- |
| React.js (Context API) | Python 3.11 / Flask | Docker & Docker Compose |
| Tailwind CSS (Glassmorphism) | Gunicorn (WSGI Server) | Nginx (Reverse Proxy) |
| Axios (CSRF Interceptors) | Flask-JWT-Extended | SQLite (Docker Volumes) |
| Web Crypto API | Flask-Limiter | Containerized Networking |

---

## 📁 Repository Structure

```text
SecureVault/
├── backend/                  # Python/Flask API Gateway
│   ├── instance/             # Docker-mounted SQLite Database volume
│   ├── routes/               # Modular REST API endpoints (Auth, Vault)
│   ├── app.py                # Application factory & Rate Limiting
│   ├── encryption.py         # Backend cryptographic utilities
│   └── Dockerfile            # Python WSGI Container Blueprint
├── frontend/                 # React.js SPA
│   ├── src/                  # React Components & Context Providers
│   ├── nginx.conf            # Reverse Proxy traffic routing rules
│   └── Dockerfile.prod       # Multi-stage Nginx build blueprint
├── fuzzer.py                 # Automated security testing script
├── docker-compose.yml        # Development Orchestrator
└── docker-compose.prod.yml   # Production Orchestrator
```

---

## 🚀 Getting Started

### Prerequisites
- **Docker** and **Docker Compose** installed on your machine.
- Ports `80` (Frontend) and `5000` (Backend API) must be available.

### Installation & Boot
To spin up the entire microservices architecture locally:

1. Clone the repository to your local machine.
2. Open a terminal in the root directory.
3. Run the development orchestrator:
```bash
docker-compose up --build
```
4. Access the web interface at `http://localhost`.

---

## 🛡️ Automated Security Testing
SecureVault comes with an automated API fuzzer (`fuzzer.py`) to validate backend rate-limiting and test for common injection vulnerabilities.

To run the fuzzer against your local instance:
```bash
python fuzzer.py
```
*Note: This will intentionally trigger rate-limit blocks (HTTP 429) to verify DDoS mitigation.*

---

## 📝 License

This project is licensed under the **MIT License**. You are free to use, modify, and distribute this software for educational or commercial purposes. See the `LICENSE` file for more details.

---

## 👨‍💻 Developed By

**Darshan B.**  
*Cybersecurity & Software Engineering Portfolio Project*
