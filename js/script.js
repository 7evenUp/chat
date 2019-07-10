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
    userKey = '',
    socket = io.connect('http://localhost:3000/');

;['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, preventDefaults)
})

function preventDefaults (evt) {
  evt.preventDefault()
  evt.stopPropagation()
}

;['dragenter', 'dragover'].forEach(eventName => {
  dropArea.addEventListener(eventName, () => dropArea.classList.add('highlight'))
})

;['dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, () => dropArea.classList.remove('highlight'))
})

dropArea.addEventListener('drop', handleDrop)

function handleDrop(evt) {
  let dt = evt.dataTransfer
  let file = dt.files[0]
  handleFile(file)
}

function validateFileExtension(file) {
  const allowedExtensions = ['jpeg', 'jpg'];
  const fileExtension = file.name.split('.').pop().toLowerCase();
  let isValid = false;

  allowedExtensions.forEach((extension) => {
    if (fileExtension === extension) {
      isValid = true;
    }
  })  

  return isValid;
}

function handleFile(file) {
  if (validateFileExtension(file) && (file.size / 1024 <= 250)) {
    previewFile(file)
    sendPhoto.addEventListener('click', uploadFile.bind(null, file))
  } else {
    alert('Разрешены форматы: jpeg, jpg\nРазмер не должен превышать 250KB');
  }
}

function uploadFile(file) {
  fileLoadPopup.style.display = 'none';

  let localStorageUsers = JSON.parse(localStorage.getItem('users'));
  let reader = new FileReader()
  reader.readAsDataURL(file)
  reader.onloadend = () => {
    document.querySelector('#avatarImage').src = reader.result;
    socket.emit('load image', reader.result)

    localStorageUsers[userKey].avatar = reader.result;
    localStorage.setItem('users', JSON.stringify(localStorageUsers))
  }
}

socket.on('refresh message-images', (userInfo) => {
  let localStorageMessages = JSON.parse(localStorage.getItem('messages'));
  messages.innerHTML = '';
  for (const message of localStorageMessages) {
    if (message.userkey === userInfo.userKey) {
      message.image = userInfo.image;
    }
    addMessage(message);
  }
  localStorage.setItem('messages', JSON.stringify(localStorageMessages))
})

function previewFile(file) {
  document.getElementById('preview').innerHTML = '';

  let reader = new FileReader()
  reader.readAsDataURL(file)
  reader.onloadend = () => {
    let img = document.createElement('img')
    img.src = reader.result
    document.getElementById('preview').appendChild(img)
  }
}

function onAuthFormSubmit(evt) {
  evt.preventDefault();

  connected = true;

  const userInfo = {
    name: name.value.trim(),
    nickname: nickname.value.trim()
  }

  userKey = `${userInfo.name}${userInfo.nickname}`;

  if (!localStorage.getItem('users')) {
    localStorage.setItem('users', '{}')
  }

  if (!localStorage.getItem('messages')) {
    localStorage.setItem('messages', '[]')
  }

  let localStorageUsers = JSON.parse(localStorage.getItem('users'));
  let localStorageMessages = JSON.parse(localStorage.getItem('messages'));

  if (!(userKey in localStorageUsers)) {
    localStorageUsers[userKey] = { avatar: '' };
    localStorage.setItem('users', JSON.stringify(localStorageUsers))
  }

  if (localStorageUsers[userKey].avatar) {
    document.querySelector('#avatarImage').src = localStorageUsers[userKey].avatar;
    userInfo.image = localStorageUsers[userKey].avatar;
  }

  for (const message of localStorageMessages) {
    addMessage(message);
  }

  socket.emit('add user', userInfo)

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
  if (connected) {
    const messageDiv = document.createElement('div')
    messageDiv.innerHTML = renderMessage(messageInfo);
    messageDiv.classList.add('message__item')
    messages.appendChild(messageDiv);
  }
}

function showUsers(users) {
  if (connected) usersList.innerHTML = renderUsers(users);
}

authForm.addEventListener('submit', onAuthFormSubmit)
sendMessageForm.addEventListener('submit', onSendMessageFormSubmit)
loadPhoto.addEventListener('click', onLoadPhotoClick)
cancel.addEventListener('click', onCancelBtnClick)

socket.on('same-user-error', (userInfo) => {
  authPopup.style.display = 'block';
  alert(`Пользователь с именем ${userInfo.name} и никнеймом ${userInfo.nickname} уже онлайн`);
})

socket.on('login', (data) => {
  document.querySelector('.users__block_name').textContent = data.userInfo.name;
  showUsers(data.users);
})

socket.on('user joined', (data) => {
  if (connected) showUsers(data.users);
})

socket.on('new message', (messageInfo) => {
  if (connected) {
    
    if (messageInfo.userkey === userKey) {
      let localStorageMessages = JSON.parse(localStorage.getItem('messages'));
      localStorageMessages.push(messageInfo)
      localStorage.setItem('messages', JSON.stringify(localStorageMessages))
    }

    addMessage(messageInfo);
  }
});

socket.on('refresh image', (users) => {
  showUsers(users);
})

socket.on('user left', (users) => {
  if (connected) showUsers(users);
})