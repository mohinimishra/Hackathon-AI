// Insurance Chatbot - Premium Interactive Application
const chatContainer = document.getElementById('chatContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const clearChatBtn = document.getElementById('clearChatBtn');

const API_URL = 'http://localhost:4000/api/chat';

// Suggested questions for insurance (9 total for comprehensive demo)
const suggestedQuestions = [
    'What kind of claim can I file if I hit a deer?',
    'How much is my home insurance coverage?',
    'What does collision coverage include?',
    'What is the deductible for auto insurance?',
    'How do I file a claim for car damage?',
    'What policies do you offer?',
    'What is comprehensive coverage?',
    'Tell me about your health insurance plans',
    'What are the benefits of life insurance?'
];

// Get current time formatted
function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// Initialize chat with suggestions
function initializeChatWithSuggestions() {
    chatContainer.innerHTML = `
        <div class="empty-state">
            <h2>Welcome to InsureAssist!</h2>
            <p>Your intelligent insurance companion. Ask me anything about policies, claims, coverage, and more.</p>
            <div class="status-indicators">
                <div class="status-badge online">
                    <span class="status-dot"></span>
                    <span>Online</span>
                </div>
                <div class="status-badge response-time">
                    <span>⚡</span>
                    <span>Avg. Response: &lt;2s</span>
                </div>
                <div class="status-badge">
                    <span>🔒</span>
                    <span>Secure</span>
                </div>
            </div>
            <div class="suggested-questions">
                ${suggestedQuestions.map(q => `
                    <button class="suggestion-btn" onclick="setMessageAndSend(\`${q.replace(/`/g, '\\`')}\`)">
                        ${q}
                    </button>
                `).join('')}
            </div>
        </div>
    `;
}

// Set message and send
function setMessageAndSend(message) {
    messageInput.value = message;
    sendMessage();
}

// Send message with streaming support
function sendMessage() {
    const message = messageInput.value.trim();

    if (!message) {
        // Shake animation for empty input
        messageInput.style.animation = 'none';
        setTimeout(() => {
            messageInput.style.animation = 'shake 0.4s';
        }, 10);
        return;
    }

    // Disable input while sending
    messageInput.disabled = true;
    sendBtn.disabled = true;
    document.querySelector('.input-group').classList.add('loading');

    // Clear input
    messageInput.value = '';

    // Clear empty state if first message
    if (chatContainer.querySelector('.empty-state')) {
        chatContainer.innerHTML = '';
    }

    // Add user message with timestamp
    addMessage(message, 'user');

    // Show typing indicator
    const typingId = showTypingIndicator();

    // Send to backend with streaming
    fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Remove typing indicator
            removeTypingIndicator(typingId);

            // Create message container for streaming text
            const messageWrapper = document.createElement('div');
            messageWrapper.className = 'message assistant';

            const messageDiv = document.createElement('div');
            messageDiv.className = 'message-wrapper';

            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            contentDiv.innerHTML = '';

            const timeDiv = document.createElement('div');
            timeDiv.className = 'message-time';
            timeDiv.textContent = getCurrentTime();

            messageDiv.appendChild(contentDiv);
            messageDiv.appendChild(timeDiv);
            messageWrapper.appendChild(messageDiv);
            chatContainer.appendChild(messageWrapper);

            // Read stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let streamedText = '';
            let isFirstToken = true;

            function readStream() {
                reader.read().then(({ done, value }) => {
                    if (done) {
                        chatContainer.scrollTop = chatContainer.scrollHeight;
                        // Re-enable input
                        messageInput.disabled = false;
                        sendBtn.disabled = false;
                        document.querySelector('.input-group').classList.remove('loading');
                        messageInput.focus();
                        return;
                    }

                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.slice(6));

                                if (data.token && !data.done) {
                                    streamedText += data.token;
                                    contentDiv.innerHTML = formatMessage(streamedText);

                                    // Add typing effect on first token
                                    if (isFirstToken) {
                                        contentDiv.style.animation = 'smoothSlideIn 0.5s';
                                        isFirstToken = false;
                                    }

                                    // Smooth scroll
                                    chatContainer.scrollTop = chatContainer.scrollHeight;
                                }

                                if (data.done) {
                                    if (data.fullResponse) {
                                        contentDiv.innerHTML = formatMessage(data.fullResponse);
                                    }
                                    chatContainer.scrollTop = chatContainer.scrollHeight;
                                    // Re-enable input
                                    messageInput.disabled = false;
                                    sendBtn.disabled = false;
                                    document.querySelector('.input-group').classList.remove('loading');
                                    messageInput.focus();
                                    return;
                                }

                                if (data.error) {
                                    contentDiv.className = 'message-content error-message';
                                    contentDiv.innerHTML = `❌ Error: ${data.error}`;
                                    messageInput.disabled = false;
                                    sendBtn.disabled = false;
                                    document.querySelector('.input-group').classList.remove('loading');
                                    return;
                                }
                            } catch (e) {
                                console.error('Parse error:', e);
                            }
                        }
                    }

                    readStream();
                }).catch(error => {
                    console.error('Stream read error:', error);
                    contentDiv.className = 'message-content error-message';
                    contentDiv.innerHTML = `❌ Connection error: ${error.message}`;
                    messageInput.disabled = false;
                    sendBtn.disabled = false;
                    document.querySelector('.input-group').classList.remove('loading');
                });
            }

            readStream();
        })
        .catch(error => {
            removeTypingIndicator(typingId);
            console.error('Error:', error);
            addMessage(
                `❌ Unable to connect to the service.\n\n**Troubleshooting:**\n• Backend server should be running on port 4000\n• Ollama should be running on http://localhost:11434\n• Check your network connection\n\n**Error:** ${error.message}`,
                'assistant',
                true
            );
            messageInput.disabled = false;
            sendBtn.disabled = false;
            document.querySelector('.input-group').classList.remove('loading');
        });
}

// Add message to chat with timestamp
function addMessage(text, sender, isError = false) {
    const messageWrapper = document.createElement('div');
    messageWrapper.className = `message ${sender}`;

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message-wrapper';

    const contentDiv = document.createElement('div');
    contentDiv.className = `message-content${isError ? ' error-message' : ''}`;
    contentDiv.innerHTML = formatMessage(text);

    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = getCurrentTime();

    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timeDiv);
    messageWrapper.appendChild(messageDiv);
    chatContainer.appendChild(messageWrapper);

    // Scroll to bottom with smooth animation
    setTimeout(() => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 100);
}

// Format message text with better styling
function formatMessage(text) {
    // Replace newlines with <br>
    let formatted = text.replace(/\n/g, '<br>');

    // Convert markdown-style links to styled HTML links
    formatted = formatted.replace(/\[([^\]]+)\]\(#\)/g, '<a href="#" class="know-more-link" onclick="event.preventDefault()">$1</a>');

    // Bold key insurance terms
    const terms = [
        'Coverage', 'Deductible', 'Premium', 'Claim', 'Policy',
        'Comprehensive', 'Collision', 'Liability', 'Insurance',
        'Copay', 'Health', 'Auto', 'Home', 'Life', 'Benefit',
        'Medical', 'Dental', 'Vision', 'Protection'
    ];

    terms.forEach(term => {
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        formatted = formatted.replace(regex, match => `<strong>${match}</strong>`);
    });

    // Format bullet points
    formatted = formatted.replace(/^[•\-]\s/gm, '<br>• ');

    return formatted;
}

// Show typing indicator instead of loading dots
function showTypingIndicator() {
    const typingId = 'typing-' + Date.now();
    const messageWrapper = document.createElement('div');
    messageWrapper.className = 'message assistant';
    messageWrapper.id = typingId;

    const indicatorDiv = document.createElement('div');
    indicatorDiv.className = 'typing-indicator';
    indicatorDiv.innerHTML = `
        <span class="typing-text">InsureAssist is typing</span>
        <div class="typing-dots">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;

    messageWrapper.appendChild(indicatorDiv);
    chatContainer.appendChild(messageWrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return typingId;
}

// Remove typing indicator
function removeTypingIndicator(typingId) {
    const indicator = document.getElementById(typingId);
    if (indicator) {
        indicator.style.opacity = '0';
        indicator.style.transform = 'scale(0.9)';
        setTimeout(() => indicator.remove(), 200);
    }
}

// Clear chat with confirmation
function clearChat() {
    const hasMessages = chatContainer.querySelector('.message');

    if (hasMessages) {
        const confirmText = 'Clear this conversation? This action cannot be undone.';
        if (confirm(confirmText)) {
            // Fade out animation
            chatContainer.style.opacity = '0';
            setTimeout(() => {
                initializeChatWithSuggestions();
                chatContainer.style.opacity = '1';
                messageInput.value = '';
                messageInput.focus();
            }, 200);
        }
    } else {
        initializeChatWithSuggestions();
        messageInput.focus();
    }
}

// Copy message text to clipboard
function copyMessage(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Show toast notification
        showToast('Message copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

// Show toast notification
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        background: var(--gray-800);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: var(--shadow-lg);
        z-index: 1000;
        opacity: 0;
        transition: all 0.3s;
        font-size: 14px;
        font-weight: 500;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    }, 10);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(50px)';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// Event listeners
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Add input animation on focus
messageInput.addEventListener('focus', () => {
    document.querySelector('.input-group').style.transform = 'scale(1.01)';
});

messageInput.addEventListener('blur', () => {
    document.querySelector('.input-group').style.transform = 'scale(1)';
});

sendBtn.addEventListener('click', sendMessage);

if (clearChatBtn) {
    clearChatBtn.addEventListener('click', clearChat);
}

// Initialize on load
window.addEventListener('load', () => {
    initializeChatWithSuggestions();
    messageInput.focus();

    // Add entrance animation
    document.querySelector('.container').style.animation = 'containerEntrance 0.6s ease-out';
});

// Handle window resize
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 250);
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + L to clear chat
    if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        clearChat();
    }

    // Escape to focus input
    if (e.key === 'Escape') {
        messageInput.focus();
        messageInput.select();
    }
});

// Add CSS animation for container entrance
const style = document.createElement('style');
style.textContent = `
    @keyframes containerEntrance {
        from {
            opacity: 0;
            transform: scale(0.95) translateY(20px);
        }
        to {
            opacity: 1;
            transform: scale(1) translateY(0);
        }
    }

    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
`;
document.head.appendChild(style);

// Prevent accidental page refresh
window.addEventListener('beforeunload', (e) => {
    const hasMessages = chatContainer.querySelector('.message');
    if (hasMessages && !chatContainer.querySelector('.empty-state')) {
        e.preventDefault();
        e.returnValue = '';
    }
});
