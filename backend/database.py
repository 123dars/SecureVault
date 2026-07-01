# 1. Delete the flask_sqlalchemy import
# 2. Import the shared 'db' from extensions
from extensions import db  
from datetime import datetime

# Notice there is NO 'db = SQLAlchemy()' here anymore!

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    encryption_salt = db.Column(db.LargeBinary, nullable=False)
    mfa_secret = db.Column(db.String(32), nullable=True)
    mfa_enabled = db.Column(db.Boolean, default=False)
    
    # Relationship with Cascade Delete
    passwords = db.relationship('Password', backref='owner', lazy=True, cascade="all, delete-orphan")

class Password(db.Model):
    __tablename__ = 'passwords'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    site_name = db.Column(db.String(100), nullable=False)
    site_url = db.Column(db.String(255))
    username = db.Column(db.String(100))
    
    encrypted_password = db.Column(db.LargeBinary, nullable=False)
    iv = db.Column(db.LargeBinary, nullable=False)
    
    # --- NEW COLUMNS FOR 2FA TOTP ---
    encrypted_totp_secret = db.Column(db.LargeBinary, nullable=True)
    totp_iv = db.Column(db.LargeBinary, nullable=True)
    # --------------------------------
    
    category = db.Column(db.String(50), default='General')
    favorite = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow) # Track record age
    
    history = db.relationship('PasswordHistory', backref='password_ref', lazy=True, cascade="all, delete-orphan")

class PasswordHistory(db.Model):
    __tablename__ = 'password_history'
    
    id = db.Column(db.Integer, primary_key=True)
    password_id = db.Column(db.Integer, db.ForeignKey('passwords.id', ondelete='CASCADE'), nullable=False)
    encrypted_pwd = db.Column(db.LargeBinary, nullable=False)
    iv = db.Column(db.LargeBinary, nullable=False)
    changed_at = db.Column(db.DateTime, default=datetime.utcnow)
