from flask import Blueprint, request, jsonify
from database import db, User
from encryption import generate_salt
import pyotp
import bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, set_access_cookies, unset_jwt_cookies
from extensions import limiter 
auth_bp = Blueprint('auth', __name__)
@auth_bp.route('/register', methods=['POST'])
@limiter.limit("5 per minute")
def register():
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Missing required fields"}), 400
        
    if User.query.filter_by(username=data['username']).first() or User.query.filter_by(email=data['email']).first():
        return jsonify({"error": "User already exists"}), 409
        
    pwd_bytes = data['password'].encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')
    encryption_salt = generate_salt()
    
    new_user = User(
        username=data['username'],
        email=data['email'],
        password_hash=hashed_password,
        encryption_salt=encryption_salt
    )
    
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "User registered successfully"}), 201
@auth_bp.route('/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({"error": "Missing username or password"}), 400
        
    user = User.query.filter_by(username=data['username']).first()
    if not user:
        return jsonify({"error": "Invalid username or password"}), 401
        
    if not bcrypt.checkpw(data['password'].encode('utf-8'), user.password_hash.encode('utf-8')):
        return jsonify({"error": "Invalid username or password"}), 401
        
    if user.mfa_enabled:
        totp_code = data.get('totp_code')
        if not totp_code:
            return jsonify({"mfa_required": True, "message": "2FA code required"}), 206
        totp = pyotp.TOTP(user.mfa_secret)
        if not totp.verify(totp_code):
            return jsonify({"error": "Invalid 2FA code"}), 401
    access_token = create_access_token(identity=user.id)
    response = jsonify({
        "message": "Login successful", 
        "username": user.username,
        "encryption_salt": user.encryption_salt.hex()
    })
    set_access_cookies(response, access_token)
    return response, 200
@auth_bp.route('/logout', methods=['POST'])
def logout():
    response = jsonify({"message": "logout successful"})
    unset_jwt_cookies(response)
    return response, 200
@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    current_user_id = get_jwt_identity()
    user = db.session.get(User, current_user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    return jsonify({
        "username": user.username,
        "email": user.email,
        "mfa_enabled": user.mfa_enabled
    }), 200
