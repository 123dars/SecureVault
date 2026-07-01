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
        
        new_pwd = Password(
            user_id=current_user_id,
            site_name=safe_site_name,
            username=safe_username,
            encrypted_password=binary_ciphertext,
            iv=binary_iv,
            encrypted_totp_secret=binary_totp_secret,
            totp_iv=binary_totp_iv,
            category=data.get('category', 'General')
        )
        
        db.session.add(new_pwd)
        db.session.commit()
        return jsonify({"message": "Password saved successfully", "id": new_pwd.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
@passwords_bp.route('', strict_slashes=False, methods=['GET'])
@jwt_required()
def get_passwords():
    current_user_id = get_jwt_identity()
    passwords = Password.query.filter_by(user_id=current_user_id).all()
    
    vault = []
    for p in passwords:
        item = {
            "id": p.id,
            "site_name": p.site_name,
            "username": p.username,
            "encrypted_password": base64.b64encode(p.encrypted_password).decode('utf-8'),
            "iv": base64.b64encode(p.iv).decode('utf-8'),
            "category": p.category,
            "created_at": p.created_at.isoformat()
        }
        
        # --- NEW: Send TOTP data if it exists ---
        if p.encrypted_totp_secret and p.totp_iv:
            item["encrypted_totp_secret"] = base64.b64encode(p.encrypted_totp_secret).decode('utf-8')
            item["totp_iv"] = base64.b64encode(p.totp_iv).decode('utf-8')
            
        vault.append(item)
        
    return jsonify(vault), 200
@passwords_bp.route('/<int:pwd_id>', methods=['DELETE'])
@jwt_required()
def delete_password(pwd_id):
    current_user_id = get_jwt_identity()
    pwd = Password.query.filter_by(id=pwd_id, user_id=current_user_id).first()
    
    if not pwd:
        return jsonify({"error": "Password not found"}), 404
        
    db.session.delete(pwd)
    db.session.commit()
    return jsonify({"message": "Password deleted"}), 200
