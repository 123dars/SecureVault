import bleach
import base64
from flask import Blueprint, request, jsonify
from database import db, Note
from flask_jwt_extended import jwt_required, get_jwt_identity
notes_bp = Blueprint('notes', __name__)
@notes_bp.route('', strict_slashes=False, methods=['POST'])
@jwt_required()
def add_note():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    ciphertext = data.get('encrypted_content')
    iv = data.get('iv')
    title = data.get('title')
    
    if not data or not title or not ciphertext or not iv:
        return jsonify({"error": "Missing title, encrypted_content, or iv"}), 400
        
    try:
        binary_ciphertext = base64.b64decode(ciphertext)
        binary_iv = base64.b64decode(iv)
        
        safe_title = bleach.clean(title)
        
        new_note = Note(
            user_id=current_user_id,
            title=safe_title,
            encrypted_content=binary_ciphertext,
            iv=binary_iv,
            color=data.get('color', 'slate')
        )
        
        db.session.add(new_note)
        db.session.commit()
        return jsonify({"message": "Note saved successfully", "id": new_note.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
@notes_bp.route('', strict_slashes=False, methods=['GET'])
@jwt_required()
def get_notes():
    current_user_id = get_jwt_identity()
    notes = Note.query.filter_by(user_id=current_user_id).order_by(Note.created_at.desc()).all()
    
    vault = []
    for n in notes:
        item = {
            "id": n.id,
            "title": n.title,
            "encrypted_content": base64.b64encode(n.encrypted_content).decode('utf-8'),
            "iv": base64.b64encode(n.iv).decode('utf-8'),
            "color": n.color,
            "created_at": n.created_at.isoformat(),
            "updated_at": n.updated_at.isoformat()
        }
        vault.append(item)
        
    return jsonify(vault), 200
@notes_bp.route('/<int:note_id>', methods=['DELETE'])
@jwt_required()
def delete_note(note_id):
    current_user_id = get_jwt_identity()
    note = Note.query.filter_by(id=note_id, user_id=current_user_id).first()
    
    if not note:
        return jsonify({"error": "Note not found"}), 404
        
    db.session.delete(note)
    db.session.commit()
    return jsonify({"message": "Note deleted"}), 200
