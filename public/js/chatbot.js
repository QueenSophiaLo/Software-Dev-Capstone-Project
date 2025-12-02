document.addEventListener('DOMContentLoaded', () => {
    // Get the elements
    const chatToggle = document.getElementById('fin-chat-toggle');
    const chatWindow = document.getElementById('fin-chat-window');
    const chatInput = document.getElementById('fin-chat-input');
    const chatSend = document.getElementById('fin-chat-send');
    const chatMessages = document.getElementById('fin-chat-messages');
    
    // Define the URL mappings for navigation (Crucial for the "guide" function)
    const urlMap = {
        'budget': '/financials/budget',
        'goals': '/financials/goals',
        'reports': '/financials/reports',
        'expense tracker': '/financials/expenses',
        'login': '/users/log-in',
        'sign up': '/users/sign-up',
        // Add any other pages your bot should navigate to here
    };

    // 1. Toggle Functionality (Show/Hide Chat Window)
    chatToggle.addEventListener('click', () => {
        chatWindow.classList.toggle('hidden');
    });

    // 2. Send Message Function
    const sendMessage = async () => {
        const userMessage = chatInput.value.trim();
        if (userMessage === '') return; // Don't send empty messages

        // Display user message immediately
        displayMessage(userMessage, 'user');
        chatInput.value = ''; // Clear input
        chatInput.disabled = true; // Disable input while waiting for response
        chatSend.disabled = true; // Disable send button

        // Display a loading indicator
        const loadingMessage = displayMessage('...', 'bot');

        try {
            // Send message to your backend API
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: userMessage })
            });

            if (!response.ok) {
                throw new Error(`API request failed with status: ${response.status}`);
            }

            const data = await response.json();
            
            // Re-enable input fields
            chatInput.disabled = false;
            chatSend.disabled = false;
            
            // Remove the loading indicator
            chatMessages.removeChild(loadingMessage);

            // 💡 FINAL STEP LOGIC: Check for a navigation action
            if (data.action === 'navigate' && data.target) {
                // The bot asked to navigate the user
                const targetKey = data.target.toLowerCase();
                const targetPath = urlMap[targetKey];

                // 1. Display the bot's confirmation message (Gemini's response.text)
                displayMessage(data.response, 'bot');

                if (targetPath) {
                    // 2. Perform the actual page redirect after a short, smooth delay
                    setTimeout(() => {
                        window.location.href = targetPath;
                    }, 1000); 
                } else {
                    // Handle cases where the target name doesn't match a defined URL
                    displayMessage(`I was going to navigate to "${data.target}", but I don't have a URL for that page defined.`, 'bot');
                }
            } else {
                // Default: Display the bot's standard text response
                displayMessage(data.response, 'bot');
            }

        } catch (error) {
            console.error('Chat error:', error);
            // Re-enable input fields
            chatInput.disabled = false;
            chatSend.disabled = false;
            
            // Attempt to remove loading indicator
            if (chatMessages.contains(loadingMessage)) {
                chatMessages.removeChild(loadingMessage);
            }
            displayMessage('Sorry, I am having trouble connecting to the financial service. Please check the console for details.', 'bot');
        }
    };

    // Helper function to render a new message
    const displayMessage = (text, sender) => {
        const messageElement = document.createElement('p');
        messageElement.classList.add(sender + '-message');
        messageElement.textContent = text;
        chatMessages.appendChild(messageElement);
        // Scroll to the bottom of the chat window
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return messageElement;
    };

    // Event listeners for sending
    chatSend.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !chatInput.disabled) {
            sendMessage();
        }
    });
});