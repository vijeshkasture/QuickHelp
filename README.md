# QuickHelp 2.0 (KaamSetu)

Hyperlocal workforce matching and fair pricing platform for neighborhood services.

## 📁 Repository Structure

```
QuickHelp 2.0/
├── frontend/             # React + Vite + Tailwind frontend application
│   ├── src/              # Application components, pages, services, types
│   ├── index.html        # HTML entry point
│   ├── package.json      # Frontend dependencies & scripts
│   └── vite.config.ts    # Vite configuration
├── backend/              # FastAPI Python backend application
│   ├── app/              # API routers, models, schemas, services
│   ├── requirements.txt  # Python backend dependencies
│   └── main.py           # FastAPI entry point
└── README.md
```

## 🚀 Running Locally

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Access the application at `http://localhost:3000`.

### Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Access the API documentation at `http://localhost:8000/docs`.
