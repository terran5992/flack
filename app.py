import os

from flask import Flask, session, render_template, redirect, request, url_for,flash ,abort, jsonify
from flask_session import Session
from flask_socketio import SocketIO, emit, join_room, leave_room, send
from datetime import datetime


import requests


app = Flask(__name__)
app.config['SECRET_KEY'] = 'mysecretkey'
app.config['DEBUG'] = True
socketio = SocketIO(app, manage_session=False)


# Configure session to use filesystem
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

users = {}
rooms = {
    'Green': {'messages':[] }
    }
 

class Message:

    def __init__(self, message, username):
        self.message = message
        self.username = username
        now = datetime.now()
        current_time = now.strftime("%H:%M:%S %d-%b-%y")
        self.timestamp = current_time

    def __repr__(self):
        return "Msg: " + self.message + " By: " + self.username

    


@app.route('/')
def index():
    if session.get('username') == None :
        return redirect(url_for('login'))
    return render_template('index.html', rooms=rooms)

@app.route('/login',methods=["GET","POST"])
def login():
    if request.method == "POST":
        #check if form input is greater than 1 char
        users[request.form.get('username')] = 'Green'
        session['username'] = request.form.get('username')

        


        return redirect(url_for('index'))
    return render_template('login.html')

@app.route('/logout')
def logout():
    """ Log user out """
    # Forget any user ID
    session.clear()
    flash('You have successfully logged out')

    # Redirect user to index page
    return redirect("/")


#What does this line of code do?
@socketio.on('message') # listening for events with the tag of (message)
def handlemessage(data):
    send(data, broadcast=True) # broacasts it to everyone with connected socekt

@socketio.on('new_room')
def receive_room_name(payload):
    name = payload['room_name']
    if name not in rooms:
        rooms[name] = {"messages" : [] }
        emit('receive_new_room', {'name': name})
    else:
        emit('receive_new_room', {'msg': 'Room Already Exists'})
        pass #emit and error message
    



@socketio.on('username', namespace='/private')
def receive_username(payload):
    #users.append({username : request.sid})
    if payload['oldusername'] in users:
        del users[payload['oldusername']]

    if payload['newusername'] in users:
        print('Duplicate, return error')

    users[payload['newusername']] = request.sid
    print('User Added')
    session['username'] = payload['newusername']
    emit('receive_username', {'username': payload['newusername']})





@socketio.on('private_message', namespace='/private')
def private_message(payload): # received a dict object from event
    recipient_session_id = users[payload['username']] 
    message = payload['message']

    print(users)
    print(recipient_session_id)
    print(message)

    emit('new_private_message', message, room=recipient_session_id)


@socketio.on('incoming-msg')
def on_message(data):
    """Broadcast messages"""

    msg = data["msg"]
    username = data["username"]
    room = data["room"]
    #Creating a message object and adding it to the list
    obj = Message(msg,username)
    if len(rooms[room]['messages']) > 100:
        del(rooms[room]['messages'][0])
    rooms[room]['messages'].append(obj)

    
    send({"username": obj.username , "msg": obj.message, "timestamp": obj.timestamp}, room=room)








@socketio.on('join')
def on_join(data):
    username = data['username']
    room = data['room']
    join_room(room)
    # gets the username and change the room that it is in
    users[session.get('username')]=room
    #Gets history and formats it 
    lst = []
    for msg in rooms[room]['messages']:
        lst.append({"msg":msg.message, "username": msg.username, "timestamp": msg.timestamp})
    emit('get_history', {'history': lst})
    send({'msg' :username + ' has entered the '+ room +' chat'}, room=room)

@socketio.on('leave')
def on_leave(data):
    username = data['username']
    room = data['room']
    leave_room(room)
    send({'msg':username + ' has left the chat'}, room=room)

if __name__ == '__main__':
    app.run()

# Do not use flask run as it wont have socketio wrapped