from flask import Blueprint, request, jsonify
from database import db, User
from encryption import generate_salt
import pyotp
import bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, set_access_cookies, unset_jwt_cookies

# --- Import the limiter from your main app ---
from extensions import limiter 

# Create the blueprint
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
@limiter.limit("5 per minute")  # Protect against spam account creation
def register():
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Missing required fields"}), 400
        
    if not isinstance(data.get('username'), str) or not isinstance(data.get('email'), str) or not isinstance(data.get('password'), str):
        return jsonify({"error": "Invalid input types. Strings required."}), 400
        
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
@limiter.limit("5 per minute")  # Protect against brute-force attacks
def login():
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({"error": "Missing username or password"}), 400
        
    if not isinstance(data.get('username'), str) or not isinstance(data.get('password'), str):
        return jsonify({"error": "Invalid input types. Strings required."}), 400
        
    user = User.query.filter_by(username=data['username']).first()
    
    if not user or not bcrypt.checkpw(data['password'].encode('utf-8'), user.password_hash.encode('utf-8')):
        return jsonify({"error": "Invalid credentials"}), 401
        
    if user.mfa_enabled:
        totp_code = data.get('totp_code')
        if not totp_code:
            return jsonify({"mfa_required": True, "message": "MFA code required"}), 206
            
        if not isinstance(totp_code, str):
            return jsonify({"error": "Invalid MFA code format"}), 400
            
        totp = pyotp.TOTP(user.mfa_secret)
        if not totp.verify(totp_code):
            return jsonify({"error": "Invalid MFA code"}), 401
    
    access_token = create_access_token(identity=str(user.id))
    
    response = jsonify({
        "message": "Login successful",
        "username": user.username,
        "email": user.email,
        "mfa_enabled": user.mfa_enabled
    })
    set_access_cookies(response, access_token)
    
    return response, 200


@auth_bp.route('/logout', methods=['POST'])
def logout():
    response = jsonify({"message": "Logout successful"})
    unset_jwt_cookies(response)
    return response, 200


# --- CRITICAL FIX: Bypass the rate limiter entirely for this specific route ---
@auth_bp.route('/me', methods=['GET'])
@limiter.exempt  
@jwt_required()
def get_current_user():
    current_user_id = get_jwt_identity()
    user = db.session.get(User, current_user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    return jsonify({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "mfa_enabled": user.mfa_enabled
    }), 200


@auth_bp.route('/rotate-key', methods=['POST'])
@jwt_required()
def rotate_key():
    current_user_id = get_jwt_identity()
    user = db.session.get(User, current_user_id)
    data = request.get_json()

    new_password = data.get('new_password')
    updated_passwords = data.get('updated_passwords')

    if not new_password or updated_passwords is None:
        return jsonify({"error": "Missing required data"}), 400

    try:
        pwd_bytes = new_password.encode('utf-8')
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')
        user.password_hash = hashed_password

        password_dict = {p.id: p for p in user.passwords}

        for p_data in updated_passwords:
            pwd_id = p_data.get('id')
            if pwd_id in password_dict:
                pwd_record = password_dict[pwd_id]
                pwd_record.encrypted_password = p_data['encrypted_password'].encode('utf-8')
                pwd_record.iv = p_data['iv'].encode('utf-8')
                
        db.session.commit()
        return jsonify({"message": "Cryptographic key rotated successfully!"}), 200

    except Exception as e:
        db.session.rollback() 
        print("Key rotation error:", e)
        return jsonify({"error": "Failed to rotate cryptographic keys"}), 500


@auth_bp.route('/mfa/setup', methods=['POST'])
@jwt_required()
def setup_mfa():
    current_user_id = get_jwt_identity()
    user = db.session.get(User, current_user_id)
    
    if not user.mfa_secret:
        user.mfa_secret = pyotp.random_base32()
        db.session.commit()
        
    totp = pyotp.TOTP(user.mfa_secret)
    uri = totp.provisioning_uri(name=user.email, issuer_name="SecureVault")
    
    return jsonify({"secret": user.mfa_secret, "uri": uri}), 200


@auth_bp.route('/mfa/verify', methods=['POST'])
@jwt_required()
def verify_mfa():
    current_user_id = get_jwt_identity()
    user = db.session.get(User, current_user_id)
    data = request.get_json()
    
    code = data.get('code')
    if not code:
        return jsonify({"error": "Verification code required"}), 400
        
    totp = pyotp.TOTP(user.mfa_secret)
    if totp.verify(code):
        user.mfa_enabled = True
        db.session.commit()
        return jsonify({"message": "MFA successfully enabled!"}), 200
        
    return jsonify({"error": "Invalid verification code. Try again."}), 400


# ─────────────────────────────────────────────
#  FORGOT PASSWORD — Step 1: Verify email
# ─────────────────────────────────────────────
@auth_bp.route('/forgot-password/verify', methods=['POST'])
@limiter.limit("5 per minute")
def forgot_password_verify():
    data = request.get_json()
    email = data.get('email', '').strip().lower() if data else ''

    if not email:
        return jsonify({"error": "Email is required"}), 400

    # Always return 200 so we don't leak which emails are registered
    # (the frontend will still proceed to step 2)
    user = User.query.filter_by(email=email).first()
    if not user:
        # Use a generic message to avoid user enumeration
        return jsonify({"error": "No account found with this email address."}), 404

    return jsonify({"message": "Email verified"}), 200


# ─────────────────────────────────────────────
#  FORGOT PASSWORD — Step 2: Reset password
# ─────────────────────────────────────────────
@auth_bp.route('/forgot-password/reset', methods=['POST'])
@limiter.limit("5 per minute")
def forgot_password_reset():
    data = request.get_json()

    if not data:
        return jsonify({"error": "No data provided"}), 400

    email = data.get('email', '').strip().lower()
    new_password = data.get('new_password', '')

    if not email or not new_password:
        return jsonify({"error": "Email and new password are required"}), 400

    if len(new_password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "No account found with this email address."}), 404

    try:
        pwd_bytes = new_password.encode('utf-8')
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')
        user.password_hash = hashed_password
        db.session.commit()
        return jsonify({"message": "Password reset successfully"}), 200
    except Exception as e:
        db.session.rollback()
        print("Password reset error:", e)
        return jsonify({"error": "Failed to reset password"}), 500