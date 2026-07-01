

from flask import Blueprint, request, jsonify
from database import db, User
from flask_jwt_extended import jwt_required, get_jwt_identity
import pyotp
mfa_bp = Blueprint('mfa', __name__)
@mfa_bp.route('/setup', methods=['POST'])
@jwt_required()
def setup_mfa():
    current_user_id = get_jwt_identity()
    user = db.session.get(User, current_user_id)
    if user.mfa_enabled:
        return jsonify({"error": "MFA is already enabled"}), 400
    # Generate a new 32-character base32 secret
    secret = pyotp.random_base32()
    user.mfa_secret = secret
    db.session.commit()
    # Generate the URI for Google Authenticator / Authy
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(name=user.email, issuer_name="MyVault")
    return jsonify({"secret": secret, "uri": provisioning_uri}), 200
@mfa_bp.route('/verify', methods=['POST'])
@jwt_required()
def verify_mfa():
    current_user_id = get_jwt_identity()
    user = db.session.get(User, current_user_id)
    data = request.get_json()
    if not data or not data.get('code'):
        return jsonify({"error": "Verification code required"}), 400
    totp = pyotp.TOTP(user.mfa_secret)
    if totp.verify(data['code']):
        user.mfa_enabled = True
        db.session.commit()
        return jsonify({"message": "MFA enabled successfully"}), 200
    else:
        return jsonify({"error": "Invalid verification code"}), 400
