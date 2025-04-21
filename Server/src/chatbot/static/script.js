$(document).ready(function() {
    const chatMessages = $('#chatMessages');
    const userQuestion = $('#userQuestion');
    const chatForm = $('#chatForm');
    const typingIndicator = $('#typingIndicator');
    
    // Function to add a message to the chat
    function addMessage(message, isUser = false) {
        const messageDiv = $('<div>').addClass(`message ${isUser ? 'user' : 'bot'}`);
        const messageContent = $('<div>').addClass('message-content').html(message);
        messageDiv.append(messageContent);
        chatMessages.append(messageDiv);
        chatMessages.scrollTop(chatMessages[0].scrollHeight);
    }
    
    // Handle form submission
    chatForm.on('submit', function(e) {
        e.preventDefault();
        
        const question = userQuestion.val().trim();
        if (!question) return;
        
        // Add user message
        addMessage(question, true);
        
        // Clear input
        userQuestion.val('');
        
        // Show typing indicator
        typingIndicator.show();
        
        // Send request to server
        $.ajax({
            url: '/ask',
            type: 'POST',
            data: { question: question },
            success: function(data) {
                // Hide typing indicator
                typingIndicator.hide();
                
                // Format the answer with line breaks
                const formattedAnswer = data.answer.replace(/\n/g, '<br>');
                
                // Add bot response
                addMessage(formattedAnswer);
            },
            error: function() {
                // Hide typing indicator
                typingIndicator.hide();
                
                // Add error message
                addMessage('Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.');
            }
        });
    });
    
    // Function to suggest common questions
    function addSuggestedQuestions() {
        const suggestedQuestions = [
            'Thực phẩm sạch là gì?',
            'Làm thế nào để đặt hàng trên website?',
            'Các phương thức thanh toán nào được chấp nhận?',
            'Thời gian giao hàng là bao lâu?',
            'Chính sách đổi trả hàng như thế nào?'
        ];
        
        const suggestionsDiv = $('<div>').addClass('suggested-questions');
        const suggestionsTitle = $('<p>').text('Các câu hỏi phổ biến:');
        suggestionsDiv.append(suggestionsTitle);
        
        const suggestionsList = $('<div>').addClass('suggestions-list');
        suggestedQuestions.forEach(question => {
            const questionBtn = $('<button>')
                .addClass('suggestion-btn')
                .text(question)
                .on('click', function() {
                    userQuestion.val(question);
                    chatForm.submit();
                });
            suggestionsList.append(questionBtn);
        });
        
        suggestionsDiv.append(suggestionsList);
        chatMessages.append(suggestionsDiv);
    }
    
    // Add suggested questions after initial greeting
    addSuggestedQuestions();
}); 