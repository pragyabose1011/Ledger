import os

os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["JWT_SECRET_KEY"] = "test-secret"
os.environ["USE_OLLAMA"] = "false"


def test_app_imports():
    from app.main import app
    assert app is not None
