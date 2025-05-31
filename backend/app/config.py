import os

class Config:
    '''
    base configuration
    '''
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY")
    TIINGO_API_KEY = os.getenv("TIINGO_API_KEY")
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')

class DevConfig(Config):
    '''
    development configuration
    '''
    DEBUG = True
    FLASK_ENV = 'development'

class TestingConfig(Config):
    '''
    testing configuration
    '''
    TESTING = True 
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "postgresql://user:password@localhost:5432/testing_db"
    )

    FINNHUB_API_KEY = "testing_key"
    TIINGO_API_KEY = "testing_key" 
    SECRET_KEY = "testing_secret_key"
    WTF_CSRF_ENABLED = False


config = {
    'development': DevConfig,
    'testing': TestingConfig,
    'default': DevConfig
}