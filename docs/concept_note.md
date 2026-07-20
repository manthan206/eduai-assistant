# EduAI Assistant: Project Concept Note
## Your Intelligent AI Learning Companion

---

### 1. Executive Summary
The **EduAI Assistant** is an advanced, full-stack learning application designed to bridge the gap between traditional learning tools and real-time interactive mentoring. By leveraging modern Large Language Models (LLMs) and containerized cloud hosting on AWS, EduAI Assistant offers students, software engineering boot camp participants, and cybersecurity students a personalized, token-by-token streaming chat companion. 

### 2. Objectives
- **Interactive Mentoring**: Provide students and coders with instant, beginner-friendly explanations in programming, cybersecurity, math, cloud computing, and career mapping.
- **Optimized Performance**: Deliver instant responses using Server-Sent Events (SSE) streaming, giving users a responsive, interactive typing environment.
- **Robust Security**: Implement secure account creations, password hashing using bcrypt, and stateless authorization via JSON Web Tokens.
- **Deployability**: Design a single-container architecture using multi-stage Docker builds to deploy simply on AWS App Runner with secure HTTPS endpoints.

### 3. Problem Statement
Self-directed learning in technical disciplines (like software development or cloud engineering) faces a major roadblock: the feedback loop. 
- Traditional forums (e.g. StackOverflow) can be intimidating or slow.
- Generic LLM interfaces lack guardrails and specific educational steering.
- Setting up locally deployed web apps with streaming responses and database history is highly complex for junior developers.

EduAI Assistant solves these challenges by providing a dedicated, guided companion that is securely containerized and accessible via a modern, glassmorphic, mobile-first dashboard.

### 4. Target Audience
- **Tech Students**: Learners seeking help in programming concepts, data structures, or code debugging.
- **Cybersecurity Aspiring Candidates**: Developers learning defensive techniques and core networking/encryption rules.
- **Career Changers & Job Seekers**: Professionals preparing for technical and behavioral interviews, requiring STAR method resume reviews.
- **Academic Educators**: Instructors looking for clean, containerized references to demonstrate web app construction.

### 5. Technical Architecture Overview
- **UI Client**: React, Vite, Tailwind CSS, Framer Motion, and Lucide React.
- **Backend API**: Python 3.11, FastAPI, SQLAlchemy, and sse-starlette.
- **Data Tier**: SQLite database for session history persistence.
- **LLM Integration**: OpenAI-compatible client, using gpt-4.1-mini as default, with a custom, offline mock streaming engine for demo capability.
- **DevOps**: Docker, Docker Compose, Amazon Elastic Container Registry (ECR), and AWS App Runner.

### 6. Key Educational Features
1. **Interactive Coding Sandbox Style Explainer**: Returns well-formatted code blocks with one-click copy actions.
2. **Mock Interview Practice**: Guided behavioral and technical question streams.
3. **Session-Bound Memory**: Remembers conversational context across successive prompts.
4. **Custom AI Controls**: Allows users to tweak the AI's creativity (temperature) and swap models.

### 7. Expected Outcomes
- **Reduced Learning Curvature**: Faster iteration for students debugging assignments.
- **Highly Scalable Container Setup**: Seamless hosting transition from local development to production.
- **Educational Web Engineering Reference**: A blueprint for building modern AI interfaces using lightweight frameworks (FastAPI + React).
