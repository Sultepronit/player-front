const messagesDisplay = document.getElementById('messages');
const msgBoard = document.getElementById('msg-board');

export function addMessage(message) {
    msgBoard.innerHTML += `<p>${message}</p>`;
    messagesDisplay.classList.remove('hidden');
}

// addMessage('testing 4');

document.getElementById('hide-messages').addEventListener('click', () => {
    msgBoard.innerHTML = '';
    messagesDisplay.classList.add('hidden');
});