# 🚀 AI Student Engagement & Attention Tracker

A cutting-edge dashboard designed to monitor, analyze, and improve student engagement in real-time. By leveraging **Mistral AI (Hugging Face)** and **Google Sheets**, our platform transforms raw feedback into actionable insights for educators.

---

## ✨ Key Features

- **🧠 AI-Driven EQ Calculation**: Uses Mistral-7B-Instruct to calculate an "Engagement Quotient" (EQ) based on classroom doubts, resolution rates, interest levels, and qualitative feedback.
- **🔄 Real-Time Google Sheets Sync**: Automatically polls and syncs data from linked Google Forms/Sheets every 30 seconds to the Firebase backend.
- **📊 Intuitive Dashboard**: Visualizes student participation, quiz trends, and sentiment history through high-performance charts.
- **⚠️ Automated Intervention System**: Identifies "at-risk" students (low EQ score) and provides AI-generated suggestions for pedagogical interventions.
- **🛡️ Data Integrity**: Maintains a robust history of sentiment and weekly engagement scores for longitudinal analysis.

---

## 🛠️ Technology Stack

- **Frontend**: React (Vite), Tailwind CSS, Framer Motion
- **Backend/Database**: Firebase Firestore
- **AI/ML**: Hugging Face Inference API (Mistral-7B-Instruct-v0.2)
- **Data Integration**: PapaParse (Google Sheets CSV Export)
- **Charts**: Chart.js / Recharts

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18 or higher)
- Firebase Account (for Firestore)
- Hugging Face API Token

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/shivanshx7/AI-Student-Engagement-Attention-Tracker.git

# Navigate to the project directory
cd AI-Student-Engagement-Attention-Tracker

# Install dependencies
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory and add your credentials:
```env
# Hugging Face Configuration
VITE_HF_TOKEN=your_huggingface_token_here

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Running the App
```bash
npm run dev
```

---

## 📊 Engagement Score Logic

The `Engagement Quotient (EQ)` is calculated using the following weighted parameters via AI analysis:

| Parameter | Weight | Description |
| :--- | :--- | :--- |
| **Doubt** | 1.5 | Did the student ask doubts? (Yes=1, No=0) |
| **Resolved** | 2.0 | Was the doubt resolved? (Score 1-5 maps to 2.0-10.0) |
| **Interest** | 2.0 | Interest level in attending class (Score 1-5) |
| **Engagement** | 3.0 | Self-rated engagement scale (1-10) |
| **Feedback** | 1.5 | AI-analyzed sentiment from student's text feedback |

---

## 📁 Project Structure

```bash
src/
├── components/      # UI Components (Sidebar, Navbar, Charts)
├── functionalities/ # Core Logic (Firebase, Google Sheets Sync, AI Query)
├── pages/           # High-level views (Dashboard, Student Details)
├── assets/          # Static files and icons
└── App.jsx          # Root application entry and polling logic
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

Developed with ❤️ for Academic Excellence.
