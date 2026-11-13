import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from tests.helpers import TOKEN, FakeRegistry, make_settings


@pytest.fixture
def auth() -> dict[str, str]:
    return {"Authorization": f"Bearer {TOKEN}"}


@pytest.fixture
def registry() -> FakeRegistry:
    return FakeRegistry()


@pytest.fixture
def client() -> TestClient:
    app = create_app(make_settings())
    app.state.registry = FakeRegistry()
    return TestClient(app)
