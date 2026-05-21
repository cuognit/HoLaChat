# HoLa Chat 💬

HoLa Chat is a modern, real-time messaging application built with a robust Spring Boot backend and a dynamic React frontend. It offers a seamless communication experience with features like instant messaging, user presence tracking, and secure authentication.

---

## 🚀 Features

- **Real-time Messaging**: Instant message delivery using WebSockets and STOMP protocol.
- **User Authentication**: Secure login, registration, and password recovery with JWT and OTP via email.
- **Deep Linking**: Direct access to specific chat rooms via unique URLs (`/c/:roomId`).
- **Presence Tracking**: Real-time online/offline status indicators for users.
- **Chat Management**: Private conversations and chat room management.
- **Modern UI/UX**: Sleek, responsive design built with TailwindCSS 4 and Lucide icons.
- **Performance**: Optimized message handling and presence tracking using Redis.
- **Security**: JWT-based authentication with refresh token support and secure WebSocket channels.

---

## 🛠️ Tech Stack

### Backend
- **Framework**: [Spring Boot 3.3.6](https://spring.io/projects/spring-boot)
- **Language**: Java 21
- **Database**: [PostgreSQL](https://www.postgresql.org/) (Supabase)
- **Caching & Real-time**: [Redis](https://redis.io/) (Redisson)
- **Security**: [Spring Security](https://spring.io/projects/spring-security) & [JWT](https://jwt.io/)
- **Messaging**: WebSockets with STOMP
- **Build Tool**: Maven

### Frontend
- **Framework**: [React 19](https://react.dev/) (Vite)
- **Styling**: [TailwindCSS 4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Real-time**: [StompJS](https://stomp-js.github.io/stomp-websocket/) & [SockJS](https://github.com/sockjs/sockjs-client)
- **State Management**: React Context API
- **Networking**: Axios

---

## 📦 Project Structure

```text
ChatPj/
├── HoLa/               # Spring Boot Backend
│   ├── src/
│   │   ├── main/java/com/hola/HoLa/
│   │   │   ├── config/      # WebSocket, Security, App configs
│   │   │   ├── controller/  # REST & Message Controllers
│   │   │   ├── dto/         # Data Transfer Objects
│   │   │   ├── model/       # JPA Entities
│   │   │   ├── repository/  # Spring Data JPA Repositories
│   │   │   └── service/     # Business logic & Redis services
│   │   └── resources/       # application.yaml & static templates
│   └── pom.xml
└── frontend/           # React Frontend
    ├── src/
    │   ├── components/      # UI Components (Auth, Chat, Dialogs)
    │   ├── context/         # Auth & Chat Contexts
    │   ├── hooks/           # Custom React Hooks (useChat, useChatSocket)
    │   ├── services/        # API & Socket Services
    │   ├── App.jsx          # Main App Component
    │   └── main.jsx         # Entry point
    └── package.json
```

---

## 🛠️ Getting Started

### Prerequisites
- **JDK 21**
- **Node.js** (v18 or higher)
- **Maven**
- **Redis Server** (running locally or remotely)
- **PostgreSQL Database**

### Backend Setup
1. Navigate to the `HoLa` directory:
   ```bash
   cd HoLa
   ```
2. Configure your database and Redis settings in `src/main/resources/application.yaml`.
3. Build the project:
   ```bash
   mvn clean install
   ```
4. Run the application:
   ```bash
   mvn spring-boot:run
   ```

### Frontend Setup
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

---

## 📝 License

This project is licensed under the MIT License.
