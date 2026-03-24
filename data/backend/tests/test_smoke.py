import uuid

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_root():
    r = client.get("/")
    assert r.status_code == 200


def test_classify_fallback():
    payload = {
        "user_id": 1,
        "trimester": 3,
        "weeks_pregnant": 32,
        "age": 30,
        "bmi": 24.0,
        "heart_rate": 80,
        "has_hypertension": False,
        "has_diabetes": False,
        "pose_name": "supine-twist",
    }
    r = client.post("/api/classify", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert data["pose_label"] in {"safe", "unsafe", "modify"}


def test_recommend():
    r = client.post(
        "/api/recommend",
        json={"trimester": 2, "safe_poses": [], "intensity_preference": "any"},
    )
    assert r.status_code == 200
    assert "recommendations" in r.json()


def test_register_login_profile():
    email = f"test_{uuid.uuid4().hex[:10]}@example.com"
    password = "testpass12"
    reg = client.post(
        "/api/auth/register",
        json={"email": email, "password": password, "full_name": "Test User"},
    )
    assert reg.status_code == 200
    token = reg.json()["access_token"]
    uid = reg.json()["user"]["id"]
    headers = {"Authorization": f"Bearer {token}"}

    me = client.get("/api/auth/me", headers=headers)
    assert me.status_code == 200
    assert me.json()["email"] == email.lower()

    prof = client.post(
        "/api/profile",
        headers=headers,
        json={
            "user_id": uid,
            "trimester": 2,
            "age": 30,
            "weight_kg": 62,
            "height_cm": 165,
            "medical_conditions": ["none"],
            "heart_rate": 78,
            "weeks_pregnant": 20,
        },
    )
    assert prof.status_code == 200
    assert prof.json()["user_id"] == uid
    assert "preprocessed_feature_vector" in prof.json()
