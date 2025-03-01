const container = document.querySelector(".container");
const chatsContainer = document.querySelector(".chats-container");
const promptForm = document.querySelector(".prompt-form");
const promptInput = promptForm.querySelector(".prompt-input");
const fileInput = promptForm.querySelector("#file-input");
const fileUploadWrapper = promptForm.querySelector(".file-upload-wrapper");
const themeToggleBtn = document.querySelector("#theme-toggle-btn");

const modelDropdown = document.querySelector(".model-dropdown");
const modelDropdownBtn = document.getElementById("model-dropdown-btn");
const modelOptions = document.querySelectorAll(".model-option");
const modelInfo = document.getElementById("model-info");
// Model descriptions
const modelDescriptions = {
    "gemini-1.5-flash": "Gemini 1.5 Flash is a fast and versatile multimodal model for scaling across diverse tasks.",
    "gemini-2.0-flash": "Gemini 2.0 Flash delivers next-gen features and improved capabilities, including superior speed, native tool use, multimodal generation, and a 1M token context window."
};
let selectedModel = localStorage.getItem("selectedModel") || "gemini-1.5-flash";
// Update button text on page load
updateDropdownText(selectedModel);
// Toggle dropdown visibility
modelDropdownBtn.addEventListener("click", () => {
    modelDropdown.classList.toggle("active");
});
// Handle model selection
modelOptions.forEach(option => {
    option.addEventListener("click", (event) => {
        selectedModel = event.currentTarget.dataset.model;
        localStorage.setItem("selectedModel", selectedModel); // Save to localStorage
        updateDropdownText(selectedModel);
        modelDropdown.classList.remove("active");
        console.log(`Switched to model: ${selectedModel}`);
    });
});
// Update dropdown button text based on selected model
function updateDropdownText(model) {
    let text = model === "gemini-1.5-flash" ? "Gemini 1.5 Flash" : "Gemini 2.0 Flash";
    modelDropdownBtn.innerHTML = text + ' <svg xmlns="http://www.w3.org/2000/svg" height="35px" viewBox="0 -960 960 960" width="35px" fill="#e3e3e3"><path d="M480-360 280-559h400L480-360Z"/></svg>';
    // Remove "selected" class from all options
    modelOptions.forEach(option => option.classList.remove("selected"));

    // Add "selected" class to the correct option
    document.querySelector(`.model-option[data-model="${model}"]`).classList.add("selected");
     // Update model description
     modelInfo.textContent = modelDescriptions[model];
}

// Fetch API Key from backend before making requests
let API_KEY = "";
fetch("/api/config")
    .then(response => response.json())
    .then(data => {
        API_KEY = data.googleApiKey;
        // console.log("API Key loaded successfully"); // Debugging
    })
    .catch(error => console.error("Error fetching API key:", error));
const getApiUrl = () => {
    return `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${API_KEY}`;
}
// Change model when user selects a different one


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

        // ✅ Apply structured formatting (headers, lists, code)
        responseText = formatStructuredResponse(responseText);

        // ✅ Wrap message properly
        botMsgDiv.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 10px;">
                <dotlottie-player 
                    src="https://lottie.host/38202b3d-5184-43bf-b09d-bf12040760ff/tTM7lKQEcq.lottie" 
                    background="transparent" 
                    speed="2.5" 
                    style="width: 40px; height: 40px;" 
                    loop autoplay>
                </dotlottie-player>
                <div style="max-width: 80%;">${responseText}</div>
            </div>
        `;

        chatHistory.push({ role: "model", parts: [{ text: responseText }] });

        // ✅ Highlight code blocks
        document.querySelectorAll("pre code").forEach((block) => {
            hljs.highlightElement(block);
        });

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




const formatCodeBlocks = (text) => {
    return text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
        return `<pre><code class="language-${language || 'plaintext'}">${escapeHtml(code)}</code></pre>`;
    });
};

// Escape HTML to prevent UI issues
const escapeHtml = (unsafe) => {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

const formatStructuredResponse = (text) => {
    // Convert headers (`**Title**`) to <strong> tags
    text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Convert bullet points (`* item`) to proper lists
    text = text.replace(/\n\* (.*?)\n/g, "<ul><li>$1</li></ul>");

    // Convert numbered lists (`1. item`) to ordered lists
    text = text.replace(/\n\d+\. (.*?)\n/g, "<ol><li>$1</li></ol>");

    // Convert code blocks (` ```code``` `) to <pre><code> blocks
    text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
        return `<pre><code class="language-${language || 'plaintext'}">${escapeHtml(code)}</code></pre>`;
    });

    return text;
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
    document.body.classList.add("chats-active", "bot-responding");

    fileUploadWrapper.classList.remove("file-attached", "img-attached", "active");

    // Display user message
    const userMsgHTML = `<p class="message-text">${userData.message}</p>`;
    const userMsgDiv = createMessageElement(userMsgHTML, "user-message");
    chatsContainer.appendChild(userMsgDiv);
    scrollToBottom();

    setTimeout(() => {
        // ✅ Ensure "Just a sec..." is left-aligned
        const botMsgDiv = createMessageElement(`
            <div style="display: flex; align-items: flex-start; gap: 10px;">
                <dotlottie-player 
                    src="https://lottie.host/38202b3d-5184-43bf-b09d-bf12040760ff/tTM7lKQEcq.lottie" 
                    background="transparent" 
                    speed="2.5" 
                    style="width: 40px; height: 40px;" 
                    loop autoplay>
                </dotlottie-player>
                <p class="message-text">Just a sec...</p>
            </div>
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
    // Show popup only on first visit
    const popup = document.getElementById("info-popup");
    const closePopup = document.getElementById("close-popup");

    if (!localStorage.getItem("popupShown")) {
        popup.style.display = "flex"; // Show popup
    }

    closePopup.addEventListener("click", () => {
        popup.style.display = "none"; // Hide popup when clicked
        localStorage.setItem("popupShown", "true"); // Store in localStorage
    });

    // Prevent background scrolling when popup is open
    popup.addEventListener("click", (event) => {
        if (event.target === popup) {
            popup.style.display = "none";
            localStorage.setItem("popupShown", "true");
        }
    });
});

