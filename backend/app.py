import os
from dotenv import load_dotenv
from flask import Flask
from flask_jwt_extended import JWTManager
from datetime import timedelta
from flask_cors import CORS
from extensions import db, limiter
from routes.auth import auth_bp
from routes.passwords import passwords_bp
from routes.notes import notes_bp
from routes.mfa import mfa_bp
load_dotenv()
def create_app():
    app = Flask(__name__)
    
    CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "https://secure-vault-lake.vercel.app"]}}, supports_credentials=True)
    
    os.makedirs(app.instance_path, exist_ok=True)
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(app.instance_path, "app.db")}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'fallback-super-secret-key-123')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(minutes=60)
    app.config['JWT_TOKEN_LOCATION'] = ['cookies', 'headers']
    app.config['JWT_COOKIE_SECURE'] = True
    app.config['JWT_COOKIE_SAMESITE'] = 'None'
    app.config['JWT_COOKIE_CSRF_PROTECT'] = False
    
    db.init_app(app)
    limiter.init_app(app)
    JWTManager(app)
    
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(passwords_bp, url_prefix='/api/passwords')
    app.register_blueprint(notes_bp, url_prefix='/api/notes')
    app.register_blueprint(mfa_bp, url_prefix='/auth/mfa')
    
    with app.app_context():
        db.create_all()
        
    return app
app = create_app()
if __name__ == '__main__':
    app.run(debug=True, port=5000)
