const container = document.querySelector(".container");
const chatsContainer = document.querySelector(".chats-container");
const promptForm = document.querySelector(".prompt-form");
const promptInput = promptForm.querySelector(".prompt-input");
const fileInput = promptForm.querySelector("#file-input");
const fileUploadWrapper = promptForm.querySelector(".file-upload-wrapper");
const themeToggleBtn = document.querySelector("#theme-toggle-btn");

// Fetch API Key from backend before making requests
let API_KEY = "";
fetch("/api/config")
    .then(response => response.json())
    .then(data => {
        API_KEY = data.googleApiKey;
       // console.log("API Key loaded successfully"); // Debugging
    })
    .catch(error => console.error("Error fetching API key:", error));

// Function to dynamically construct API URL
const getApiUrl = () => `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

let controller, typingInterval;
const chatHistory = [];
const userData = { message: "", file: {} };

// Set initial theme from local storage
const isLightTheme = localStorage.getItem("themeColor") === "light_mode";
document.body.classList.toggle("light-theme", isLightTheme);
themeToggleBtn.textContent = isLightTheme ? "dark_mode" : "light_mode";

// Function to create message elements
const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
};

// Scroll to the bottom of the container
const scrollToBottom = () => container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });

// Simulate typing effect for bot responses
const typingEffect = (text, textElement, botMsgDiv) => {
    textElement.textContent = "";
    const words = text.split(" ");
    let wordIndex = 0;
    typingInterval = setInterval(() => {
        if (wordIndex < words.length) {
            textElement.textContent += (wordIndex === 0 ? "" : " ") + words[wordIndex++];
            scrollToBottom();
        } else {
            clearInterval(typingInterval);
            botMsgDiv.classList.remove("loading");
            document.body.classList.remove("bot-responding");
        }
    }, 40); // 40 ms delay
};

const responseFilter = (text) => {
    const replacements = {
        "Google": "Adivish",
        "Gemini": "Adivish",
        "I am developed by Google": "I am an AI created using advanced language models and based on Google's Gemini",
        "I was made by Google": "I was built using Gemini's Api",
        "I am a product of Google": "I am a custom-built chatbot",
    };

    // Replace words using regular expressions
    for (const [key, value] of Object.entries(replacements)) {
        const regex = new RegExp(`\\b${key}\\b`, "gi"); // Match whole words, case insensitive
        text = text.replace(regex, value);
    }
    return text;
};

// Make the API call and generate the bot's response
const generateResponse = async (botMsgDiv) => {
    const textElement = botMsgDiv.querySelector(".message-text");
    controller = new AbortController();

    chatHistory.push({
        role: "user",
        parts: [{ text: userData.message }, ...(userData.file.data ? [{ inline_data: (({ fileName, isImage, ...rest }) => rest)(userData.file) }] : [])],
    });

    try {
        if (!API_KEY) {
            throw new Error("API Key not loaded. Please refresh the page.");
        }

        // Send request to API
        const response = await fetch(getApiUrl(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: chatHistory }),
            signal: controller.signal,
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error.message);

        // Process response text and apply filtering
        let responseText = data.candidates[0].content.parts[0].text.replace(/\*\*([^*]+)\*\*/g, "$1").trim();
        responseText = responseFilter(responseText);

        // Add Lottie Gemini logo before response text
        botMsgDiv.innerHTML = `
            <dotlottie-player 
                src="https://lottie.host/38202b3d-5184-43bf-b09d-bf12040760ff/tTM7lKQEcq.lottie" 
                background="transparent" 
                speed="1" 
                style="width: 50px; height: 50px; margin-right: 10px;" 
                loop autoplay></dotlottie-player>
            <p class="message-text">${responseText}</p>
        `;

        chatHistory.push({ role: "model", parts: [{ text: responseText }] });

    } catch (error) {
        textElement.textContent = error.message;
        textElement.style.color = "#d62939";
    } finally {
        document.body.classList.remove("bot-responding"); // ✅ Enable new message input
        botMsgDiv.classList.remove("loading"); // ✅ Ensure message is fully displayed
        userData.file = {};
        scrollToBottom();
    }
};



const customResponses = {
    "who made you": "I was built using AI technologies to assist users like you!",
    "who are you": "I am your personal AI assistant, designed to provide helpful responses.",
    "what is your purpose": "I am here to assist with any questions you have!"
};
// Handle the form submission
const handleFormSubmit = (e) => {
    e.preventDefault();
    const userMessage = promptInput.value.trim();
    if (!userMessage || document.body.classList.contains("bot-responding")) return;

    userData.message = userMessage;
    promptInput.value = "";
    document.body.classList.add("chats-active", "bot-responding"); // ✅ Prevent multiple submits while responding

    fileUploadWrapper.classList.remove("file-attached", "img-attached", "active");

    // Display user message
    const userMsgHTML = `<p class="message-text">${userData.message}</p>`;
    const userMsgDiv = createMessageElement(userMsgHTML, "user-message");
    chatsContainer.appendChild(userMsgDiv);
    scrollToBottom();

    setTimeout(() => {
        const botMsgDiv = createMessageElement(`
            <dotlottie-player 
                src="https://lottie.host/38202b3d-5184-43bf-b09d-bf12040760ff/tTM7lKQEcq.lottie" 
                background="transparent" 
                speed="1" 
                style="width: 50px; height: 50px; margin-right: 10px;" 
                loop autoplay></dotlottie-player>
            <p class="message-text">Just a sec...</p>
        `, "bot-message", "loading");

        chatsContainer.appendChild(botMsgDiv);
        scrollToBottom();

        generateResponse(botMsgDiv);
    }, 600);
};

// ✅ Reset UI after bot response
document.querySelector("#stop-response-btn").addEventListener("click", () => {
    controller?.abort();
    document.body.classList.remove("bot-responding"); // ✅ Allow new messages
    chatsContainer.querySelector(".bot-message.loading")?.classList.remove("loading");
});



// Attach event listeners
promptForm.addEventListener("submit", handleFormSubmit);
themeToggleBtn.addEventListener("click", () => {
    const isLightTheme = document.body.classList.toggle("light-theme");
    localStorage.setItem("themeColor", isLightTheme ? "light_mode" : "dark_mode");
    themeToggleBtn.textContent = isLightTheme ? "dark_mode" : "light_mode";
});

document.addEventListener("DOMContentLoaded", () => {
    // Show popup only on page refresh
    const popup = document.getElementById("info-popup");
    const closePopup = document.getElementById("close-popup");

    if (!localStorage.getItem("popupShown")) {
        popup.style.display = "flex"; // Show popup
    }

    closePopup.addEventListener("click", () => {
        popup.style.display = "none"; // Hide popup when clicked
        localStorage.setItem("popupShown", "true"); // Store in localStorage
    });
});
