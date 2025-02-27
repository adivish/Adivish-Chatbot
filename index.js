const express = require("express");
const path = require("path");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Serve static files from "public" folder
app.use(express.static(path.join(__dirname, "public")));

// API route to send API key to frontend
app.get("/api/config", (req, res) => {
    res.json({ googleApiKey: process.env.GOOGLE_API_KEY });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});































// // const { GoogleGenerativeAI } = require("@google/generative-ai");

// // // Replace with your actual API key
// // const genAI = new GoogleGenerativeAI("AIzaSyCOd5P5SWOx3-Xaw50gIZttcO-PvpjWuuU");

// // async function run() {
// //     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// //     const prompt = "Who are you and who made you?";

// //     try {
// //         const result = await model.generateContent(prompt);
// //         console.log(result.response.text());
// //     } catch (error) {
// //         console.error("Error:", error);
// //     }
// // }

// // // Execute the function
// // run();

// const express = require("express");
// const cors = require("cors");
// const bodyParser = require("body-parser");
// const dotenv = require("dotenv");
// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 5000;

// app.use(cors());
// app.use(bodyParser.json());

// const API_KEY = process.env.GEMINI_API_KEY;

// app.post("/chat", async (req, res) => {
//     const { message } = req.body;
//     if (!message) return res.status(400).json({ error: "Message is required" });

//     try {
//         const fetch = await import("node-fetch"); // Dynamic Import
//         const response = await fetch.default(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: message }] }] }),
//         });

//         const data = await response.json();
//         const botReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't understand.";

//         res.json({ reply: botReply });
//     } catch (error) {
//         console.error("Error:", error);
//         res.status(500).json({ error: "Something went wrong!" });
//     }
// });

// app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
