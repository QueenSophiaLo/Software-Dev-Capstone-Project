document.addEventListener('DOMContentLoaded', () => {
    // Get the elements
    const chatToggle = document.getElementById('fin-chat-toggle');
    const chatWindow = document.getElementById('fin-chat-window');
    const chatInput = document.getElementById('fin-chat-input');
    const chatSend = document.getElementById('fin-chat-send');
    const chatMessages = document.getElementById('fin-chat-messages');
    
    // Set initial message class for aesthetic consistency (if it exists)
    const initialMessage = chatMessages.querySelector('p');
    if (initialMessage) {
        initialMessage.classList.add('bot-message');
    }
    
    // Define the URL mappings for navigation (Crucial for the "guide" function)
    const urlMap = {
        'budget': '/financials/budget',
        'goals': '/financials/goals',
        'reports': '/financials/reports',
        'expense tracker': '/financials/expenses',
        'login': '/users/log-in',
        'sign up': '/users/sign-up',
        'home': '/',
    };

    // Converts complex Markdown (bolding, lists, line breaks) to HTML.
    
    const markdownToHtml = (markdown) => {
        let html = markdown;

        // 1. Convert bold (**text** or __text__) to <b>
        html = html.replace(/(\*\*|__)(.*?)\1/g, '<b>$2</b>');
        
        // 2. Handle Lists (Crucial for structured advice)
        let isListActive = false;
        let listType = null;
        let finalHtml = [];

        const lines = html.split('\n');

        lines.forEach(line => {
            const trimmedLine = line.trim();
            const isListItem = trimmedLine.match(/^(\*|\d+\.)\s/);

            if (isListItem) {
                const currentType = trimmedLine.startsWith('*') ? 'ul' : 'ol';
                const listItemContent = trimmedLine.replace(/^(\* |\d+\.)\s/, '');
                
                if (!isListActive) {
                    finalHtml.push(`<${currentType}>`);
                    isListActive = true;
                    listType = currentType;
                } else if (listType !== currentType) {
                    finalHtml.push(`</${listType}><${currentType}>`);
                    listType = currentType;
                }

                finalHtml.push(`<li>${listItemContent}</li>`);

            } else {
                // Not a list item
                if (isListActive) {
                    finalHtml.push(`</${listType}>`);
                    isListActive = false;
                    listType = null;
                }

                // Treat as a regular paragraph, converting line breaks
                if (trimmedLine.length > 0) {
                   finalHtml.push(`<p>${trimmedLine.replace(/\\n/g, '<br>')}</p>`);
                }
            }
        });

        // Close any trailing active list
        if (isListActive) {
            finalHtml.push(`</${listType}>`);
        }
        
        let resultHtml = finalHtml.join('');
        
        // Clean up empty paragraph tags that may result from line breaks
        resultHtml = resultHtml.replace(/<p><\/p>/g, '');
        
        // Re-apply bolding just in case list parsing removed some formatting
        resultHtml = resultHtml.replace(/(\*\*|__)(.*?)\1/g, '<b>$2</b>');
        
        return resultHtml;
    };

    // 1. Toggle Functionality (Show/Hide Chat Window)
    chatToggle.addEventListener('click', () => {
        chatWindow.classList.toggle('hidden');
    });

    // 2. Send Message Function
    const sendMessage = async () => {
        const userMessage = chatInput.value.trim();
        if (userMessage === '') return; 

        displayMessage(userMessage, 'user');
        chatInput.value = ''; 
        chatInput.disabled = true; 
        chatSend.disabled = true; 

        const loadingMessage = displayMessage('...', 'bot');

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage })
            });

            if (!response.ok) {
                throw new Error(`API request failed with status: ${response.status}`);
            }

            const data = await response.json();
            
            chatInput.disabled = false;
            chatSend.disabled = false;
            
            if (chatMessages.contains(loadingMessage)) {
                chatMessages.removeChild(loadingMessage);
            }

            // Check for a navigation action
            if (data.action === 'navigate' && data.target) {
                const targetKey = data.target.toLowerCase();
                const targetPath = urlMap[targetKey];

                displayMessage(data.response, 'bot');

                if (targetPath) {
                    setTimeout(() => {
                        window.location.href = targetPath;
                    }, 1000); 
                } else {
                    displayMessage(`I was instructed to navigate to "${data.target}", but that page is not yet defined in my navigation map.`, 'bot');
                }
            } else {
                // Default: Display the bot's standard text response
                displayMessage(data.response, 'bot');
            }

        } catch (error) {
            console.error('Chat error:', error);
            chatInput.disabled = false;
            chatSend.disabled = false;
            
            if (chatMessages.contains(loadingMessage)) {
                chatMessages.removeChild(loadingMessage);
            }
            displayMessage('Sorry, I am having trouble connecting to the financial service. Please try again.', 'bot');
        }
    };

    // Helper function to render a new message
    const displayMessage = (text, sender) => {
        const messageWrapper = document.createElement('div'); // Wrapper to hold lists/paragraphs
        messageWrapper.classList.add(sender + '-message-wrapper'); 

        const messageContent = document.createElement('div'); // Inner container for the actual bubble styling
        messageContent.classList.add(sender + '-message'); 

        // CRITICAL CHANGE: Use innerHTML for the bot message to render lists and bolding
        if (sender === 'bot') {
            messageContent.innerHTML = markdownToHtml(text);
        } else {
            // Use textContent for user messages for security/simplicity
            messageContent.textContent = text;
        }

        messageWrapper.appendChild(messageContent);
        chatMessages.appendChild(messageWrapper);
        
        // Scroll to the bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return messageWrapper;
    };

    // Event listeners for sending
    chatSend.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !chatInput.disabled) {
            sendMessage();
        }
    });
});