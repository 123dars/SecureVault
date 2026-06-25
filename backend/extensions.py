from flask_sqlalchemy import SQLAlchemy
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

db = SQLAlchemy()
limiter = Limiter(
    key_func=get_remote_address,
    # --- FIX: Dramatically increase defaults so React doesn't get blocked ---
    default_limits=["5000 per day", "1000 per hour"], 
    storage_uri="memory://"
)