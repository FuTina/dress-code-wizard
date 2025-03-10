
# Dress-Code-Wizard 🎩✨

**Dress-Code-Wizard** is a web application that allows users to create and share events with unique dress codes. The app integrates OpenAI to generate creative dress code suggestions.

## 🚀 Features
- 📆 **Create & Schedule Events with Dress Codes**
- 🎭 **AI-Generated Dress Code Suggestions**
- 📲 **Responsive & Mobile-Optimized UI with Tailwind CSS**
- 🔒 **User Authentication with Supabase**
- 📅 **Apple Calendar Integration**
- 🌐 **Deployed on Render (Backend) & Vercel (Frontend)**

## 🛠️ Technologies Used
| Technology  | Purpose |
|-------------|---------|
| **Go (Fiber)** | Backend API |
| **Vue.js** | Frontend Framework |
| **Tailwind CSS** | Styling |
| **Supabase** | Database & Authentication |
| **OpenAI API** | AI-Powered Dress Code Suggestions |

## 📦 Installation

### 1️⃣ **Backend Setup (Go + Fiber)**
---
---
```sh
git clone https://github.com/FuTina/dress-code-wizard.git
cd dress-code-wizard/backend
go mod tidy
go run main.go
```
---
### 2️⃣ **Frontend Setup (Vue.js + Tailwind CSS)**
---
---
```sh
cd frontend
npm install
npm run dev
```
---

## 🔑 Environment Variables

Before running the project, create a `.env` file in the `/frontend` directory and add your own Supabase & OpenAI API keys:

```ini
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_OPENAI_API_KEY=your-openai-api-key
```

## 🔌 API Endpoints

The backend is built with **Go (Fiber)** and provides the following REST API endpoints:

| Method | Endpoint        | Description |
|--------|---------------|--------------|
| `POST`  | `/events`       | Creates a new event |
| `GET`   | `/events`       | Retrieves all events |
| `GET`   | `/events/:id`   | Fetches a specific event by ID |
| `DELETE` | `/events/:id`  | Deletes an event |
| `POST`  | `/events/:id/invite` | Sends an invitation to a user |
| `POST`  | `/events/:id/accept` | Accepts an event invitation |

### **📌 Example API Request: Create an Event**
To create an event, send a `POST` request to `/events` with the following JSON body:

---
```json
{
  "name": "Casual Friday",
  "date": "2024-05-10T19:00:00Z",
  "dress_code": "Smart Casual",
  "use_ai": false
}
```
---
### **Response**
---
---
```json

{
  "id": "abc123",
  "name": "Casual Friday",
  "date": "2024-05-10T19:00:00Z",
  "dress_code": "Smart Casual",
  "created_at": "2024-04-20T14:30:00Z"
}
```
---
