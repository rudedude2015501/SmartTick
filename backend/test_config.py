import os 

class TestConfig:
    '''
    testing environment configuration
    '''
    TESTING = True 
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL"
        "postgresql://user:password@localhost:5432/testing_db"
    )

    SQLALCHEMY_TRACK_MODIFICATIONS = False 

    FINNHUB_API_KEY = "testing_key"
    TIINGO_API_KEY = "testing_key" 

    SECRET_KEY = "testing_secret_key"
    WTF_CSRF_ENABLED = False
