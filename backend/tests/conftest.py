import pytest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db


@pytest.fixture(scope="session")
def app():
    """
    create and configure a new app instance for each test
    """
    app = create_app('testing')
    
    with app.app_context():
        yield app

@pytest.fixture
def client(app):
    """
    create a test client for the app
    """
    return app.test_client()

@pytest.fixture
def runner(app):
    """
    create a test runner for the app's Click commands
    """
    return app.test_cli_runner()

@pytest.fixture
def db_transaction(app):
    """
    create a database transaction that gets rolled back after each test

    provides a way to make changes to the testing database and then undo them
    so the inserted data does not cause conflicts
    """
    with app.app_context():
        connection = db.engine.connect()
        transaction = connection.begin()
        
        # configure session to use this connection
        db.session.configure(bind=connection, binds={})
        
        yield db.session
        
        transaction.rollback()
        connection.close()