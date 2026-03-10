# AI-Powered ANPR Web Platform

A high-performance Automatic Number Plate Recognition system designed for Indian vehicles, featuring real-time detection, high accuracy OCR, and a modern glassmorphism security dashboard.

## Features

- **Real-Time Camera Detection**: Connect WebRTC cameras and process streams with YOLOv8 via WebSocket.
- **Image & Video Upload**: Process static files frame-by-frame.
- **AI Pipeline**: YOLOv8 plate detection + OpenCV preprocessing (CLAHE, denoising) + EasyOCR extraction + Regex validation.
- **Indian Plate Validation**: Fully supports standard state codes and BH-series plates.
- **Analytics & Search**: Real-time traffic stats, frequency graphs, and history search.
- **Alerts System**: Blacklist vehicles and get immediate dashboard threat alerts.
- **Dark UI Dashboard**: Built with Next.js 14, Tailwind CSS, and Chart.js.

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS, Axios, WebRTC, WebSocket, Chart.js
- **Backend**: FastAPI, SQLAlchemy (Async), PostgreSQL, Redis, JWT Authentication
- **AI Core**: PyTorch, Ultralytics YOLOv8, OpenCV, EasyOCR

---

## Quickstart (Docker)

1. Rename `backend/.env.example` to `backend/.env`.
2. Run docker-compose from the root directory:

```bash
docker-compose up --build -d
```

3. Access the dashboard: `http://localhost:3000`
4. Access the API Docs: `http://localhost:8000/docs`

**Default Admin Logins:**  
- **Username**: `admin`
- **Password**: `admin123`

---

## Local Development (Without Docker)

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Set DATABASE_URL and REDIS_URL in .env to your local running DB/Redis
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## Architecture Flow

1. **Client**: Uploads image or streams WebRTC video via WebSocket.
2. **Backend**: Receives base64 frame.
3. **Preprocessor (OpenCV)**: Enhances contrast (CLAHE), denoises.
4. **Detector (YOLOv8)**: Crops bounding box.
5. **OCR (EasyOCR)**: Extracts raw text.
6. **Validator**: Cleans text, validates structure e.g. `KA01AB1234`.
7. **Database**: Saves detection event, checks against blacklist.
8. **Client**: Receives enriched JSON and renders on UI.
