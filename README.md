# EduAI Assistant 🎓🤖
### Your Intelligent AI Learning Companion

EduAI Assistant is a production-ready, full-stack, AI-powered conversational learning application. It is designed to assist students, software developers, and professionals in mastering programming concepts, exploring cybersecurity fundamentals, creating resumes, and preparing for job interviews.

---

## 🌟 Features

- **Modern Landing Page**: Clean UI featuring an Apple-inspired layout, glassmorphism card panels, animated mesh gradient backgrounds, and responsive mobile navigation.
- **Secure JWT Authentication**: Sign up and login forms with cryptographically secured passwords using bcrypt and sessions verified via JSON Web Tokens.
- **ChatGPT-Style Workspace**: Left sidebar conversation list history (collapsible on mobile), conversation search filter, deletion triggers, and a unified settings overlay.
- **SSE Streaming Responses**: Real-time token-by-token server-side event (SSE) responses, complete with an interactive typing indicator.
- **Markdown & Highlighted Code Blocks**: Full markdown parsing alongside clean, copy-friendly syntax-highlighted code panels.
- **Generation Controls**: Interruption capabilities ("Stop Generation") and instant response retries ("Regenerate").
- **Flexible AI Config**: Live model and temperature updates through a user-friendly system settings overlay.
- **Persistent Chat History**: Secure SQLite database storage ensuring conversations are saved and easy to retrieve.
- **Single-Container Architecture**: Clean multi-stage build that compiles the React app and serves it directly through FastAPI for ease of deployment.

---

## 🛠️ Technologies Used

### Frontend
- **React** (v18) & **Vite** (Build Tool)
- **Tailwind CSS** (Styling / Themes)
- **Framer Motion** (Buttery-smooth animations)
- **Lucide React** (Premium SVG icons)
- **React Markdown** & **React Syntax Highlighter** (Content presentation)
- **Axios** (REST API client)

### Backend
- **Python 3.11**
- **FastAPI** (High-performance API engine)
- **SQLAlchemy** (Object-Relational Mapping)
- **SQLite** (Persistent relational storage)
- **Uvicorn** (Asynchronous Server Gateway Interface)
- **sse-starlette** (Server-Sent Events controller)
- **Passlib & Python-Jose** (Password cryptography and JWT validation)

---

## 📂 Folder Structure

```text
eduai-assistant/
├── backend/
│   ├── api/                 # API configuration files
│   ├── auth/                # Hashing and JWT token verification
│   ├── database/            # SQLite connection setup
│   ├── models/              # SQLAlchemy model definitions
│   ├── routers/             # API routing (Auth, Chat, Health)
│   ├── services/            # OpenAI service calls & mock stream fallback
│   ├── utils/               # Dependencies & custom middleware
│   ├── main.py              # Entry point and static file router
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── context/         # Auth contexts
│   │   ├── pages/           # Landing, Login, Register, Dashboard Pages
│   │   ├── services/        # Axios API client
│   │   ├── App.jsx          # Routes definition
│   │   ├── index.css        # Stylesheet
│   │   └── main.jsx         # React mounting
│   ├── package.json         # Node dependencies
│   ├── tailwind.config.js   # Tailwind theme configurations
│   └── vite.config.js       # Vite configuration
├── Dockerfile               # Multi-stage production build script
├── docker-compose.yml       # Docker orchestrator
├── .env.example             # Template for variables
├── .dockerignore            # Docker copy exclusions
└── README.md                # System documentation
```

---

## 🔑 Environment Variables

To run the application, create a `.env` file at the root of the project with the following properties:

```env
# OpenAI API Key (Leave blank to use the high-fidelity mock streaming fallback)
OPENAI_API_KEY=your_openai_api_key_here

# JWT Signing Secret (Create a strong random string in production)
JWT_SECRET=super-secret-key-eduai-assistant-2026

# SQLite database file path
DATABASE_URL=sqlite:///./eduai.db
```

---

## 💻 Local Setup

### Prerequisite Checklist
- Node.js (v18 or higher)
- Python (v3.9 or higher)

### 1. Running the Backend
1. Open a terminal and navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the development server:
   ```bash
   python main.py
   ```
   The backend will be running at `http://localhost:8000`.

### 2. Running the Frontend
1. Open a separate terminal and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your web browser.

---

## 🐳 Docker Setup

The application is containerized to compile Vite assets and bundle them with the Python backend server automatically.

To launch the entire application in a single container:
1. Make sure you have Docker and Docker Compose installed.
2. Build and launch:
   ```bash
   docker compose up --build
   ```
3. Access the complete application at `http://localhost:8000`.

---

## ☁️ AWS App Runner Deployment

AWS App Runner provides an automated, secure container runtime.

### Step-by-Step Deployment Instructions

#### 1. Build and Test Container Locally
Ensure your local Docker environment compiles correctly:
```bash
docker build -t eduai-assistant:latest .
```

#### 2. Create Amazon ECR Private Repository
1. Log in to the **AWS Management Console**.
2. Search for **Elastic Container Registry (ECR)**.
3. Click **Create Repository**.
4. Choose **Private**, name the repository `eduai-assistant`, and click **Create**.

#### 3. Push Image to Amazon ECR
Click **View push commands** in ECR for detailed commands tailored to your system. They generally follow:
1. Authenticate Docker with your AWS credentials:
   ```bash
   aws ecr get-login-password --region <your-region> | docker login --username AWS --password-stdin <aws-account-id>.dkr.ecr.<your-region>.amazonaws.com
   ```
2. Tag your built image:
   ```bash
   docker tag eduai-assistant:latest <aws-account-id>.dkr.ecr.<your-region>.amazonaws.com/eduai-assistant:latest
   ```
3. Push it to ECR:
   ```bash
   docker push <aws-account-id>.dkr.ecr.<your-region>.amazonaws.com/eduai-assistant:latest
   ```

#### 4. Configure App Runner Service
1. Navigate to **AWS App Runner** in the console.
2. Click **Create service**.
3. Under **Source**, choose **Container registry** & **Amazon ECR**.
4. Click **Browse** and select your `eduai-assistant:latest` image.
5. Set deployment trigger to **Manual** or **Automatic** (CI/CD on push).
6. Under **Service configuration**:
   - Port: Set to `8000`.
   - Add environment variables:
     - `OPENAI_API_KEY`: `<your-openai-api-key>`
     - `JWT_SECRET`: `<your-jwt-secret-key>`
     - `DATABASE_URL`: `sqlite:///./data/eduai.db` (Ensure a directory `/app/data` is writable by the app).
7. Review settings, then click **Create & deploy**.
8. App Runner will provision the environment, pull the image, and serve the application under a public secure **HTTPS** URL.

---

## 📌 API Endpoints Reference

| Method | Endpoint | Description | Protected | Request Body (JSON) |
|--------|----------|-------------|-----------|--------------------|
| `POST` | `/register` | Register a new user account | No | `{"name": "...", "email": "...", "password": "..."}` |
| `POST` | `/login` | Log in and receive JWT | No | `{"email": "...", "password": "..."}` |
| `GET` | `/me` | Get current user's profile | Yes | None |
| `POST` | `/new-chat` | Start a new chat session | Yes | `{"title": "..."}` |
| `GET` | `/history` | Fetch all chat logs for user | Yes | None |
| `DELETE`| `/history/{id}` | Delete a chat log by ID | Yes | None |
| `POST` | `/chat` | Stream SSE conversation token-by-token | Yes | `{"chat_id": 1, "message": "...", "model": "...", "temperature": 0.7}` |
| `GET` | `/health` | Server health check | No | None |

---

## 🔮 Future Enhancements

- **Social OAuth Integration**: Add Google and GitHub Single-Sign-On (SSO).
- **Voice Mode**: Real-time educational assistance using TTS (Text-to-Speech) and STT (Speech-to-Text).
- **Document RAG (Retrieval-Augmented Generation)**: Support uploading PDF notes or programming textbooks to chat directly with documents.
- **Code Execution Sandbox**: Safe execution runtime to compile code suggestions directly in the browser chat bubble.
