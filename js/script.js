let name = document.querySelector('#name'),
    nickname = document.querySelector('#nickname'),
    authForm = document.querySelector('#authPopup'),
    sendMessageForm = document.querySelector('.message__form'),
    messageText = document.querySelector('#messageText'),
    messages = document.querySelector('#messages');
    messageContainer = document.querySelector('.message__container'),
    authPopup = document.querySelector('#authPopup'),
    loadPhoto = document.querySelector('#loadPhoto'),
    fileLoadPopup = document.querySelector('#fileLoadPopup'),
    dropArea = document.getElementById('drop-area'),
    cancel = document.querySelector('#cancel'),
    sendPhoto = document.querySelector('#sendPhoto'),
    usersList = document.querySelector('#usersList'),
    templateOfMessage = document.querySelector('#messageList').textContent,
    templateOfUsers = document.querySelector('#listOfUsers').textContent,
    renderUsers = Handlebars.compile(templateOfUsers),
    renderMessage = Handlebars.compile(templateOfMessage),
    connected = false,
    socket = io.connect('http://localhost:3000/');

;['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, preventDefaults)
})

function preventDefaults (evt) {
  evt.preventDefault()
  evt.stopPropagation()
}

;['dragenter', 'dragover'].forEach(eventName => {
  dropArea.addEventListener(eventName, highlight)
})

;['dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, unhighlight)
})

function highlight(evt) {
  dropArea.classList.add('highlight')
}
function unhighlight(evt) {
  dropArea.classList.remove('highlight')
}

dropArea.addEventListener('drop', handleDrop)

function handleDrop(evt) {
  let dt = evt.dataTransfer
  let file = dt.files[0]
  handleFile(file)
}

function handleFile(file) {
  previewFile(file)
  sendPhoto.addEventListener('click', uploadFile.bind(null, file))
}

function uploadFile(file) {
  fileLoadPopup.style.display = 'none';

  let reader = new FileReader()
  reader.readAsDataURL(file)
  reader.onloadend = function() {
    document.querySelector('#avatarImage').src = reader.result;
    socket.emit('load image', reader.result)
  }
}

function previewFile(file) {
  document.getElementById('preview').innerHTML = '';

  let reader = new FileReader()
  reader.readAsDataURL(file)
  reader.onloadend = function() {
    let img = document.createElement('img')
    img.src = reader.result
    document.getElementById('preview').appendChild(img)
  }
}

function onAuthFormSubmit(evt) {
  evt.preventDefault();

  socket.emit('add user', {
    name: name.value.trim(),
    nickname: nickname.value.trim()
  })

  authPopup.style.display = 'none'
}

function onSendMessageFormSubmit(evt) {
  evt.preventDefault();

  let messageData = messageText.value.trim();
  socket.emit('new message', messageData);
  messageText.value = '';
}

function onLoadPhotoClick(evt) {
  evt.preventDefault();
  
  if (!connected) return

  fileLoadPopup.style.display = 'block';
}

function onCancelBtnClick(evt) {
  evt.preventDefault();

  fileLoadPopup.style.display = 'none';
}

function addMessage(messageInfo){
  if (!connected) return;

  const messageDiv = document.createElement('div')
  messageDiv.innerHTML = renderMessage(messageInfo);
  messageDiv.classList.add('message__item')
  messages.appendChild(messageDiv);
  messageContainer.scrollTop = messageContainer.scrollHeight;
}

function showUsers(users) {
  usersList.innerHTML = renderUsers(users);
}

authForm.addEventListener('submit', onAuthFormSubmit)
sendMessageForm.addEventListener('submit', onSendMessageFormSubmit)
loadPhoto.addEventListener('click', onLoadPhotoClick)
cancel.addEventListener('click', onCancelBtnClick)

socket.on('login', (data) => {
  connected = true;
  document.querySelector('.users__block_name').textContent = data.userInfo.name;
  showUsers(data.users);

  let div = document.createElement('div');
  div.innerHTML = '<b>You are WELCOME!</b>'

  messages.appendChild(div)
})

socket.on('user joined', (data) => {
  if (!connected) return;

  showUsers(data.users);

  let div = document.createElement('div');
  div.innerHTML = `<b>${data.userInfo.name}</b> has just joined the chat`

  messages.appendChild(div)
})

socket.on('new message', addMessage);

socket.on('refresh image', (users) => {
  showUsers(users);
})

socket.on('user left', (data) => {
  if (!connected) return;

  showUsers(data.users);

  let div = document.createElement('div');
  div.innerHTML = `<b>${data.userInfo.name}</b> has just left the chat`

  messages.appendChild(div)
})