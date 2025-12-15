# 📅 Social Media Scheduler

A full‑stack **Social Media Scheduling & Management Platform** that allows users (clients) to connect their **Instagram, Facebook, and LinkedIn** accounts, create posts with text and images, schedule them for future publishing, and manage all social accounts from a single dashboard.

This project follows **industry‑standard OAuth authentication**, secure token storage, and a scalable architecture similar to tools like **Hootsuite, Buffer, and Later**.

---

## 🚀 Features

### 🔐 Social Account Connection (OAuth)

* Connect **Instagram**, **Facebook**, and **LinkedIn** accounts
* Secure OAuth‑based authentication (no passwords stored)
* Store access tokens safely in the database

### 📝 Post Creation & Scheduling

* Create posts with text and images
* Select platform(s) to publish on
* Schedule posts for a future date & time
* Cron‑based background job publishes posts automatically

### 📊 Dashboard & UI

* View connected social accounts
* Preview posts for each platform
* Notification system for actions (success, error, info)
* Fully responsive modern UI

### 🧠 Scalable Architecture

* Clean separation of **routes, controllers, services, and models**
* Easy to extend with analytics, reels, stories, or more platforms

---

## 🛠 Tech Stack

### Frontend

* **React** (Vite)
* **React Router DOM**
* **Context API** (global state)
* **Tailwind CSS** (UI styling)

### Backend

* **Node.js**
* **Express.js**
* **MongoDB Atlas**
* **Mongoose**
* **Multer** (image uploads)
* **Cron Jobs** (scheduled posting)
* **JWT Authentication**

---

## 📂 Project Structure

### Backend (`/backend`)

```
backend
├── config        # DB & OAuth configs
├── controllers   # Request logic
├── routes        # API routes
├── models        # MongoDB schemas
├── services      # Platform API logic
├── cron          # Post scheduler
├── uploads       # Uploaded images
├── utils         # JWT & middleware
└── server.js     # App entry point
```

### Frontend (`/src`)

```
src
├── api           # Axios API calls
├── components    # Reusable UI components
├── context       # Global state
├── pages         # App pages
├── utils         # Helper functions
├── App.jsx
└── main.jsx
```

---

## ⚙️ Environment Variables

Create a `.env` file in the **backend** directory:

```env
PORT=4000
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret

FACEBOOK_CLIENT_ID=your_facebook_app_id
FACEBOOK_CLIENT_SECRET=your_facebook_secret
INSTAGRAM_CLIENT_ID=your_instagram_app_id
INSTAGRAM_CLIENT_SECRET=your_instagram_secret
LINKEDIN_CLIENT_ID=your_linkedin_app_id
LINKEDIN_CLIENT_SECRET=your_linkedin_secret
```

---

## ▶️ Running the Project

### Backend

```bash
cd backend
npm install
npm run dev
```

Server runs on: **[http://localhost:4000](http://localhost:4000)**

### Frontend

```bash
cd src
npm install
npm run dev
```

App runs on: **[http://localhost:5173](http://localhost:5173)**

---

## 🔄 How Social Account Connection Works

1. User clicks **Connect Instagram / Facebook / LinkedIn**
2. Redirected to platform login (OAuth)
3. User approves access
4. Platform returns an **access token**
5. Token is stored securely in MongoDB
6. Account appears in dashboard

---

## ⏱ How Scheduling Works

* Posts are saved with a scheduled date & time
* Cron job checks pending posts every minute
* When time matches, post is published via platform API
* Status is updated in the database

---

## 🔒 Security

* OAuth authentication only (no passwords stored)
* Tokens never exposed to frontend
* JWT‑based protected routes
* Environment variables for secrets

---

## 🧩 Future Enhancements

* Analytics (likes, comments, reach)
* Real‑time updates with Socket.IO
* Role‑based access (Admin / Client)
* Media library
* Post drafts
* Story & Reel scheduling

---

## 👨‍💻 Author

**Stanzin Paldan**
Computer Science Engineering Student
Full‑Stack Developer

---

## 📄 License

This project is for **educational and portfolio purposes**. API usage must comply with Meta and LinkedIn platform policies.

---

⭐ If you find this project helpful, feel free to star it and extend it further!
