const messagesDisplay = document.getElementById('messages');
const msgBoard = document.getElementById('msg-board');

export function addMessage(message) {
    msgBoard.innerHTML += `<p>${message}</p>`;
    messagesDisplay.classList.remove('hidden');
}

document.getElementById('hide-messages').addEventListener('click', () => {
    messagesDisplay.classList.add('hidden');
});