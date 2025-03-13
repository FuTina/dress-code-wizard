# Dress-Code-Wizard 🎩✨

**Dress-Code-Wizard** is a web application that allows users to create and share events with unique dress codes. The app integrates OpenAI to generate creative dress code suggestions and provides seamless event management with calendar exports.

## 🚀 Features
- 📆 **Create & Schedule Events with Dress Codes**
- 🎭 **AI-Generated Dress Code Suggestions**
- 📲 **Responsive & Mobile-Optimized UI with Tailwind CSS**
- 🔒 **User Authentication with Supabase**
- 📅 **Google Calendar & iCal Export**
- 🌐 **Deployed on Render (Backend) & Vercel (Frontend)**
- 🔄 **Automatic Cleanup of Expired Events**

## 🛠️ Technologies Used
| Technology  | Purpose |
|-------------|---------|
| **Go (Fiber)** | Backend API |
| **Vue.js** | Frontend Framework |
| **Tailwind CSS** | Styling |
| **Supabase** | Database & Authentication |
| **OpenAI API** | AI-Powered Dress Code Suggestions |
| **Luxon** | Date & Time Handling |

## 🚰 Installation

### 1️⃣ **Backend Setup (Go + Fiber)**
```sh
git clone https://github.com/FuTina/dress-code-wizard.git
cd dress-code-wizard/backend
go mod tidy
go run main.go
```

### 2️⃣ **Frontend Setup (Vue.js + Tailwind CSS)**
```sh
cd frontend
npm install
npm run dev
```

## 🔑 Environment Variables

### **Frontend `.env` Configuration**
Before running the frontend project, create a `.env` file in the `/frontend` directory and add your own Supabase & OpenAI API keys:

```ini
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_OPENAI_API_KEY=your-openai-api-key
VITE_BACKEND_URL=http://localhost:8080 # Change this if deploying
```

### **Backend `.env` Configuration**
For the backend, create a `.env` file in the `/backend` directory and add the following environment variables:

```ini
SUPABASE_URL=https://your-supabase-url.supabase.co
SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=your-openai-api-key
PORT=8080
FRONTEND_URL=http://localhost:5173  # Change this if deploying
```

## 🔐 Backend API Endpoints

The backend is built with **Go (Fiber)** and provides the following REST API endpoints:

| Method | Endpoint        | Description |
|--------|---------------|--------------|
| `POST`  | `/api/events`       | Creates a new event |
| `GET`   | `/api/events`       | Retrieves all upcoming events |
| `GET`   | `/api/events/:id`   | Fetches a specific event by ID |
| `DELETE` | `/api/events/:id`  | Deletes an event |
| `POST`  | `/api/invitations` | Creates an event invitation |
| `GET`   | `/api/invitations` | Retrieves all invitations |
| `POST`  | `/api/invitations/:id/accept` | Accepts an event invitation |

### **📌 Example API Request: Create an Event**
To create an event, send a `POST` request to `/api/events` with the following JSON body:

```json
{
  "name": "Casual Friday",
  "date": "2024-05-10T19:00:00Z",
  "startTime": "19:00",
  "endTime": "21:00",
  "dressCode": "Smart Casual",
  "imageUrl": "https://example.com/image.jpg"
}
```

### **Response**
```json
{
  "id": "abc123",
  "name": "Casual Friday",
  "date": "2024-05-10T19:00:00Z",
  "startTime": "19:00",
  "endTime": "21:00",
  "dressCode": "Smart Casual",
  "imageUrl": "https://example.com/image.jpg",
  "createdAt": "2024-04-20T14:30:00Z"
}
```

## 💡 Additional Notes
- **Events Cleanup:** Expired events older than one day are automatically removed from the database.
- **Fallback Images:** If an event has no uploaded image, a predefined dress-code-specific fallback image is used.
- **Google Calendar & iCal Integration:** Users can seamlessly export events to their preferred calendar service.

## 📚 License
This project is licensed under the **MIT License**.
