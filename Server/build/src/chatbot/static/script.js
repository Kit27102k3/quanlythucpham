"use strict";

$(document).ready(function () {
  var chatMessages = $('#chatMessages');
  var userQuestion = $('#userQuestion');
  var chatForm = $('#chatForm');
  var typingIndicator = $('#typingIndicator');

  // Function to add a message to the chat
  function addMessage(message) {
    var isUser = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    var messageDiv = $('<div>').addClass("message ".concat(isUser ? 'user' : 'bot'));
    var messageContent = $('<div>').addClass('message-content').html(message);
    messageDiv.append(messageContent);
    chatMessages.append(messageDiv);
    chatMessages.scrollTop(chatMessages[0].scrollHeight);
  }

  // Handle form submission
  chatForm.on('submit', function (e) {
    e.preventDefault();
    var question = userQuestion.val().trim();
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
      data: {
        question: question
      },
      success: function success(data) {
        // Hide typing indicator
        typingIndicator.hide();

        // Format the answer with line breaks
        var formattedAnswer = data.answer.replace(/\n/g, '<br>');

        // Add bot response
        addMessage(formattedAnswer);
      },
      error: function error() {
        // Hide typing indicator
        typingIndicator.hide();

        // Add error message
        addMessage('Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.');
      }
    });
  });

  // Function to suggest common questions
  function addSuggestedQuestions() {
    var suggestedQuestions = ['Thực phẩm sạch là gì?', 'Làm thế nào để đặt hàng trên website?', 'Các phương thức thanh toán nào được chấp nhận?', 'Thời gian giao hàng là bao lâu?', 'Chính sách đổi trả hàng như thế nào?'];
    var suggestionsDiv = $('<div>').addClass('suggested-questions');
    var suggestionsTitle = $('<p>').text('Các câu hỏi phổ biến:');
    suggestionsDiv.append(suggestionsTitle);
    var suggestionsList = $('<div>').addClass('suggestions-list');
    suggestedQuestions.forEach(function (question) {
      var questionBtn = $('<button>').addClass('suggestion-btn').text(question).on('click', function () {
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