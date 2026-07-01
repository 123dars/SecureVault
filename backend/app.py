import os
from dotenv import load_dotenv
from flask import Flask
from flask_jwt_extended import JWTManager
from datetime import timedelta
from flask_cors import CORS

# 1. Import extensions first
from extensions import db, limiter

# 2. Import blueprints AFTER extensions
from routes.auth import auth_bp
from routes.passwords import passwords_bp
from routes.mfa import mfa_bp

load_dotenv()

def create_app():
    app = Flask(__name__)
    
    # Configure CORS
    CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "https://secure-vault-lake.vercel.app"]}}, supports_credentials=True)
    # Database Configuration (Using Docker-safe instance folder)
    os.makedirs(app.instance_path, exist_ok=True)
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(app.instance_path, "app.db")}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # JWT Security Configuration
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'fallback-dev-key-change-me') 
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
    app.config['JWT_TOKEN_LOCATION'] = ['cookies']
    app.config['JWT_COOKIE_SECURE'] = True 
    app.config['JWT_COOKIE_SAMESITE'] = "None"
    app.config['JWT_COOKIE_CSRF_PROTECT'] = False 
    
    # Initialize extensions with the app
    db.init_app(app)
    limiter.init_app(app)
    jwt = JWTManager(app)
    
    # Register API blueprints
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(passwords_bp, url_prefix='/api/passwords')
    app.register_blueprint(mfa_bp, url_prefix='/api/mfa')
    
    # --- CRITICAL FIX: Import models inside the app context ---
    with app.app_context():
        import database 
        db.create_all()
        
    return app

# Initialize the global app variable for Gunicorn
app = create_app()

if __name__ == '__main__':
    app.run(debug=True, port=5000)
