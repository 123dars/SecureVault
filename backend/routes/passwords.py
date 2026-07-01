import bleach
import base64
from flask import Blueprint, request, jsonify
from database import db, Password, User
from flask_jwt_extended import jwt_required, get_jwt_identity

passwords_bp = Blueprint('passwords', __name__)

@passwords_bp.route('', strict_slashes=False, methods=['POST'])
@jwt_required()
def add_password():
    current_user_id = get_jwt_identity()
    user = db.session.get(User, current_user_id)
    data = request.get_json()
    
    ciphertext = data.get('encrypted_password')
    iv = data.get('iv')
    
    if not data or not data.get('site_name') or not ciphertext or not iv:
        return jsonify({"error": "Missing site_name, ciphertext, or iv"}), 400
        
    try:
        binary_ciphertext = base64.b64decode(ciphertext)
        binary_iv = base64.b64decode(iv)
        
        # --- NEW: Process TOTP Secret safely ---
        totp_secret_b64 = data.get('encrypted_totp_secret')
        totp_iv_b64 = data.get('totp_iv')
        
        binary_totp_secret = base64.b64decode(totp_secret_b64) if totp_secret_b64 else None
        binary_totp_iv = base64.b64decode(totp_iv_b64) if totp_iv_b64 else None
        # ---------------------------------------

        safe_site_name = bleach.clean(data['site_name'])
        safe_username = bleach.clean(data.get('username', ''))
        safe_site_url = bleach.clean(data.get('site_url', ''))

        new_pwd = Password(
            user_id=user.id,
            site_name=safe_site_name,
            site_url=safe_site_url,
            username=safe_username,
            encrypted_password=binary_ciphertext,
            iv=binary_iv,
            encrypted_totp_secret=binary_totp_secret,
            totp_iv=binary_totp_iv,
            category=data.get('category', 'General')
        )
        
        db.session.add(new_pwd)
        db.session.commit()
        return jsonify({"message": "Ciphertext saved securely", "id": new_pwd.id}), 201
    except Exception as e:
        return jsonify({"error": "Database error", "details": str(e)}), 500

@passwords_bp.route('', strict_slashes=False, methods=['GET'])
@jwt_required()
def get_passwords():
    current_user_id = get_jwt_identity()
    passwords = Password.query.filter_by(user_id=current_user_id).all()
    vault_data = []
    for p in passwords:
        vault_data.append({
            "id": p.id,
            "site_name": p.site_name,
            "site_url": p.site_url,
            "username": p.username,
            "encrypted_password": base64.b64encode(p.encrypted_password).decode('utf-8'),
            "iv": base64.b64encode(p.iv).decode('utf-8'),
            # --- NEW: Return encrypted TOTP fields ---
            "encrypted_totp_secret": base64.b64encode(p.encrypted_totp_secret).decode('utf-8') if p.encrypted_totp_secret else None,
            "totp_iv": base64.b64encode(p.totp_iv).decode('utf-8') if p.totp_iv else None,
            # -----------------------------------------
            "category": p.category,
            "favorite": p.favorite
        })
    return jsonify(vault_data), 200

@passwords_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_password(id):
    current_user_id = get_jwt_identity()
    password_entry = Password.query.get(id)
    
    if not password_entry:
        return jsonify({"error": "Credential not found"}), 404
        
    # Debug log to see the mismatch if it happens
    print(f"DEBUG: Deleting {id}. DB user_id: {password_entry.user_id}, Token user_id: {current_user_id}")
    
    # Cast to int to ensure comparison works even if types differ
    if int(password_entry.user_id) != int(current_user_id):
        return jsonify({"error": "Unauthorized: You do not own this credential"}), 403
        
    try:
        db.session.delete(password_entry)
        db.session.commit()
        return jsonify({"message": "Credential deleted successfully!"}), 200
    except Exception as e:
        return jsonify({"error": "Failed to delete", "details": str(e)}), 500
