var socket = io.connect('http://localhost:8000');


socket.emit('test', { my: 'data' });