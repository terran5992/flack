


$(document).ready(function(){ // When document is loaded and ready, run this function


    // connect to the socket, can use either a dynamic or harcoded url
    var socket = io.connect('https://' + document.domain + ':' + location.port);
    console.log('HELLO U FUCK')

    //declaring global 'room' variable
    let room = "Green";
    joinRoom("Green");


    // When user connects to the web socket ^^, send the event to server
    /* socket.on('connect', function(){
        socket.send({'msg':'User has Connected!'});
    }); */

    // When a broadcasted message is received, append to the list
    socket.on('message', function(data){

        if (data.username){
            $('#display_message').append(
                "<div class='speech-wrapper'>" +
                    "<div class='bubble'>"+
                        "<div class='txt'>"+
                        // Message parameters go here
                        "<p class='name'>"+data.username+"</p>"+
                        "<p class='message'>"+data.msg+"</p>"+
                        "<span class='timestamp'>"+data.timestamp+"</span>"+
                        "</div>"+
                        "<div class='bubble-arrow'>"+"</div>"+
                    "</div>"+
                "</div>"
            );
        }
        else{
            printSysMsg(data.msg)
        }
        scrollDownChatWindow();
    });

    socket.on('get_history', function(data){
        console.log('Recevied History')
        // For each item in data
        // append data.history to #display_message
        let hist = data.history;
        for( let i = 0, len=hist.length; i<len; i++){

            $('#display_message').append(
                "<div class='speech-wrapper'>" +
                    "<div class='bubble'>"+
                        "<div class='txt'>"+
                        // Message parameters go here
                        "<p class='name'>"+hist[i].username+"</p>"+
                        "<p class='message'>"+hist[i].msg+"</p>"+
                        "<span class='timestamp'>"+hist[i].timestamp+"</span>"+
                        "</div>"+
                        "<div class='bubble-arrow'>"+"</div>"+
                    "</div>"+
                "</div>"
            );}
        scrollDownChatWindow();

        
    });

    function changeRoom(){
            let newroom = li.innerHTML;
            if (newroom == room){
                msg = `You are already in ${room} room.`
                printSysMsg(msg);
            } else {
                leaveRoom(room);
                joinRoom(newroom);
                room = newroom;
            };
    };


    socket.on('receive_new_room', function(name){ // when room name is sent from the server
        if (name.name){
        const li = document.createElement('a');
        li.setAttribute('class','select-room list-group-item list-group-item-action bg-light');
        li.setAttribute('href','#')
        li.innerHTML = name.name;
        li.addEventListener('click', function(){
            let newroom = li.innerHTML;
            if (newroom == room){
                msg = `You are already in ${room} room.`
                printSysMsg(msg);
            } else{
                leaveRoom(room);
                joinRoom(newroom);
                room = newroom;
            };

        });
        $('#room_list').append(li); // append it to the list of rooms
        leaveRoom(room);
        joinRoom(name.name);
        room = name.name;
        }
        else {
            printSysMsg(name.msg)
        };

    });

    $('#send_button').on('click', function() { // what happens when button is clicked
        message = $('#user_message').val();
        socket.emit('incoming-msg',{'msg':message, 'room': room, 'username': username}); // sends the message to server // how does that link w top func??
        $('#user_message').val(''); // emptys out the input field after submit
    });

    $('#create_room_btn').on('click', function() { // what happens when button is clicked
        if ($.trim($('#inlineFormInputGroup').val()) != ""){
            var newroomname = $('#inlineFormInputGroup').val();
            socket.emit('new_room', {'room_name': newroomname}); // sends the message to server // how does that link w top func??
            $('#inlineFormInputGroup').val(''); // emptys out the input field after submit
        }else{
            printSysMsg("Please Enter a Valid Room Name")
            scrollDownChatWindow();
        }


    });

    // Creates a private socket to connect to 
    var private_socket = io('http://' + document.domain + ':' + location.port + '/private'); 

    // What happens when you click the button to change username
    $('#send_username').on('click',function(){
        var newusername = $('#username').val();
        var oldusername = document.getElementById("change_username_btn").innerHTML;
        private_socket.emit('username',{'newusername' : newusername, 'oldusername': oldusername});
        $('#username').val('');
    });

    // When the client receives "receive_username" event
    private_socket.on('receive_username', function(data){
        var newusername = data.username;
        $("#logout_btn").attr("hidden", false);

        document.getElementById("change_username_btn").innerHTML = newusername;

    });

    // When the client clicks to send a private message
    $('#send_private_message').on('click', function(){
        var recipient = $('#send_to_username').val();
        var message_to_send = $('#private_message').val();
        var sender = document.getElementById("username-navbar").innerHTML;
        private_socket.emit('private_message', {'username': recipient , 'message' : message_to_send, 'sender': sender});

    });

    private_socket.on('new_private_message', function(msg){
        alert(msg);
    });


    document.querySelectorAll('.select-room').forEach(a => {
        a.addEventListener('click', () => {
            let newroom = a.innerHTML;
            if (newroom == room){
                msg = `You are already in ${room} room.`
                printSysMsg(msg);
            } else {
                leaveRoom(room);
                joinRoom(newroom);
                room = newroom;
            }
        })
    });


    // Leave Room Function
    function leaveRoom(room){
        socket.emit('leave', {'username': username, 'room': room});
    };

     // Join Room Function
    function joinRoom(room){
        socket.emit('join', {'username': username, 'room': room});

        // Clears Message Area
        document.querySelector('#display_message').innerHTML = '';

        // Autofocus on text box
        document.querySelector("#user_message").focus();        
        
    };

    // Prints System Messages
    function printSysMsg(msg){
        const p = document.createElement('p');
        p.innerHTML = msg;
        document.querySelector('#display_message').append(p);
    }

    // Make 'enter' key submit message
    let msg = document.getElementById("user_message");
    msg.addEventListener("keyup", function(event) {
        event.preventDefault();
            if(document.getElementById('user_message').value===""){
                document.getElementById("send_button").disabled = true;
            }else{
                document.getElementById("send_button").disabled = false;
                if (event.keyCode === 13) {
                document.getElementById("send_button").click();
                document.getElementById("send_button").disabled = true;
            }
        }
    });

    // Scroll chat window down
    function scrollDownChatWindow() {
        const chatWindow = document.querySelector("#display_message");
        chatWindow.scrollTop = chatWindow.scrollHeight;
    };

    // Sends Delete Request to server
    $('#conf_delete').on('click', function() { // what happens when button is clicked
        const current_room = room;
        // Clears Message Area
        document.querySelector('#display_message').innerHTML = '';

        // Autofocus on text box
        document.querySelector("#user_message").focus();  
        socket.emit('delete',{'current_room':current_room, 'username': username}); // sends the message to server // how does that link w top func??
    });

    // Receives From Server Delete Confirmation removes it from Site
    socket.on('conf_delete', function(data){
        const newroom = data.room
        const oldroom = data.oldroom
        room = newroom; 
        // Room not reassigned 
        $(".select-room:contains('"+oldroom+"')").remove();

    });


});
