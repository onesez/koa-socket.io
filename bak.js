var path = require('path');
var koa = require('koa');
var app = new koa();
var static = require('koa-static');

var server = require('http').createServer(app.callback());
var io = require('socket.io')(server);

var numUsers = 0;
io.on('connection', (socket) => {

    console.log('建立新连接', socket)

    // 监听
    socket.on('event', function(data) {
        console.log(data, socket)
        // 触发
        socket.emit('event', '收到监听数据：' + data);
    });

    var addedUser = false;

    // when the client emits 'newMessage', this listens and executes
    socket.on('newMessage', (data) => {
        console.log('newMessage:' + data)
        // we tell the client to execute 'newMessage'
        socket.broadcast.emit('newMessage', {
            to: 'all',
            username: socket.username,
            message: data,
        });
    });

    // 添加用户
    socket.on('addUser', (data) => {
        console.log('有用户加入连接')
        if (addedUser) return;

        // we store the username in the socket session for this client
        socket.username = data.username;
        ++numUsers;
        addedUser = true;
        socket.emit('login', {
            numUsers: numUsers
        });
        // echo globally (all clients) that a person has connected
        console.log('新用户加入')
        socket.broadcast.emit('userJoined', {
            username: socket.username,
            numUsers: numUsers
        });
    });

    // when the client emits 'typing', we broadcast it to others
    socket.on('typing', (data) => {
        console.log('typing' + data)
        socket.broadcast.emit('typing', {
            username: socket.username
        });
    });

    // when the client emits 'stop typing', we broadcast it to others
    socket.on('stop typing', () => {
        console.log('stop typing')
        socket.broadcast.emit('stop typing', {
            username: socket.username
        });
    });

    // when the user disconnects.. perform this
    socket.on('disconnect', () => {
        console.log('客户断开连接或者客户掉线')
        if (addedUser) {
            --numUsers;

            // echo globally that this client has left
            socket.broadcast.emit('user left', {
                username: socket.username,
                numUsers: numUsers
            });
        }
    });
});

app.use(static(path.join(__dirname, 'public')));

server.listen(1923);