"""
Flask extensions initialization
Separate file to avoid circular imports
"""
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO

# Initialize extensions
db = SQLAlchemy()
jwt = JWTManager()
socketio = SocketIO()
