const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

server.listen(3000, () => {
  console.log('listening on *:3000');
});

let users = [];

app.use(express.static(__dirname));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

let numUsers = 0;

io.on('connection', function (socket) {
  let addedUser = false;

  socket.on('add user', (userInfo) => {
    if (addedUser) return;

    socket.userInfo = userInfo;
    users.push(socket.userInfo);

    ++numUsers;
    addedUser = true;

    socket.emit('login', { 
      userInfo: socket.userInfo,
      numUsers: numUsers,
      users: users 
    })

    socket.broadcast.emit('user joined', {
      userInfo: socket.userInfo,
      numUsers: numUsers,
      users: users
    })
  })

  socket.on('load image', (image) => {
    socket.userInfo.image = image;
    io.emit('refresh image', users);
  })

  socket.on('new message', (message) => {
    io.emit('new message', {
      date: getDate(),
      content: message,
      username: socket.userInfo.name,
      image: socket.userInfo.image
    })
  })

  socket.on('disconnect', () => {
    if (addedUser) {
      --numUsers;

      users.splice(users.indexOf(socket.userInfo), 1);

      socket.broadcast.emit('user left', {
        userInfo: socket.userInfo,
        numUsers: numUsers,
        users: users
      })
    }
  })

  socket.on('receiveHistory', ()=>{
    // localStorage
  })
});

// io.on('send mess', (data) => {
//   io.socket.emit('new mess', messageData);
// });
//localhost:3000

function getDate() {
  const date    = new Date();
  const hours   = (date.getHours() < 10) ? '0' + date.getHours() : date.getHours();
  const minutes = (date.getMinutes() < 10) ? '0' + date.getMinutes() : date.getMinutes();

  return `${hours}:${minutes}`;
}