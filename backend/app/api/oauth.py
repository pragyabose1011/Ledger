"""OAuth authentication with Google, Zoom, Microsoft, Slack."""
import os
import httpx
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from urllib.parse import urlencode

from app.db.session import SessionLocal
from app.db.models.user import User
from app.api.auth import create_access_token

router = APIRouter(prefix="/oauth", tags=["oauth"])

# OAuth Configuration - Set these in your .env file
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
ZOOM_CLIENT_ID = os.getenv("ZOOM_CLIENT_ID")
ZOOM_CLIENT_SECRET = os.getenv("ZOOM_CLIENT_SECRET")
MICROSOFT_CLIENT_ID = os.getenv("MICROSOFT_CLIENT_ID")
MICROSOFT_CLIENT_SECRET = os.getenv("MICROSOFT_CLIENT_SECRET")
SLACK_CLIENT_ID = os.getenv("SLACK_CLIENT_ID")
SLACK_CLIENT_SECRET = os.getenv("SLACK_CLIENT_SECRET")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/status")
def oauth_status():
    """Check which OAuth providers are configured."""
    return {
        "google": bool(GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET),
        "zoom": bool(ZOOM_CLIENT_ID and ZOOM_CLIENT_SECRET),
        "microsoft": bool(MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET),
        "slack": bool(SLACK_CLIENT_ID and SLACK_CLIENT_SECRET),
    }


# ============== GOOGLE ==============
@router.get("/google/login")
def google_login():
    """Redirect to Google OAuth consent screen."""
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Google OAuth not configured")
    
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": f"{BACKEND_URL}/oauth/google/callback",
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
    }
    url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    return RedirectResponse(url)


@router.get("/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    """Handle Google OAuth callback."""
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": f"{BACKEND_URL}/oauth/google/callback",
            },
        )
        tokens = token_response.json()
        
        if "error" in tokens:
            return RedirectResponse(f"{FRONTEND_URL}/login?error={tokens.get('error_description', 'OAuth failed')}")
        
        # Get user info
        userinfo_response = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
        )
        userinfo = userinfo_response.json()
    
    # Find or create user
    user = db.query(User).filter(User.email == userinfo["email"]).first()
    if not user:
        user = User(
            email=userinfo["email"],
            name=userinfo.get("name", userinfo["email"]),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # Create JWT token
    token = create_access_token({"sub": user.id})
    
    # Redirect to frontend with token
    return RedirectResponse(f"{FRONTEND_URL}/oauth-callback?token={token}")


# ============== ZOOM ==============
@router.get("/zoom/login")
def zoom_login():
    """Redirect to Zoom OAuth consent screen."""
    if not ZOOM_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Zoom OAuth not configured")
    
    params = {
        "client_id": ZOOM_CLIENT_ID,
        "redirect_uri": f"{BACKEND_URL}/oauth/zoom/callback",
        "response_type": "code",
    }
    url = f"https://zoom.us/oauth/authorize?{urlencode(params)}"
    return RedirectResponse(url)


@router.get("/zoom/callback")
async def zoom_callback(code: str, db: Session = Depends(get_db)):
    """Handle Zoom OAuth callback."""
    import base64
    
    credentials = base64.b64encode(f"{ZOOM_CLIENT_ID}:{ZOOM_CLIENT_SECRET}".encode()).decode()
    
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            "https://zoom.us/oauth/token",
            headers={"Authorization": f"Basic {credentials}"},
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": f"{BACKEND_URL}/oauth/zoom/callback",
            },
        )
        tokens = token_response.json()
        
        if "error" in tokens:
            return RedirectResponse(f"{FRONTEND_URL}/login?error={tokens.get('reason', 'OAuth failed')}")
        
        # Get user info
        userinfo_response = await client.get(
            "https://api.zoom.us/v2/users/me",
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
        )
        userinfo = userinfo_response.json()
    
    email = userinfo.get("email")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            name=f"{userinfo.get('first_name', '')} {userinfo.get('last_name', '')}".strip() or email,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    token = create_access_token({"sub": user.id})
    return RedirectResponse(f"{FRONTEND_URL}/oauth-callback?token={token}")


# ============== MICROSOFT (Teams) ==============
@router.get("/microsoft/login")
def microsoft_login():
    """Redirect to Microsoft OAuth consent screen."""
    if not MICROSOFT_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Microsoft OAuth not configured")
    
    params = {
        "client_id": MICROSOFT_CLIENT_ID,
        "redirect_uri": f"{BACKEND_URL}/oauth/microsoft/callback",
        "response_type": "code",
        "scope": "openid email profile User.Read",
        "response_mode": "query",
    }
    url = f"https://login.microsoftonline.com/common/oauth2/v2.0/authorize?{urlencode(params)}"
    return RedirectResponse(url)


@router.get("/microsoft/callback")
async def microsoft_callback(code: str, db: Session = Depends(get_db)):
    """Handle Microsoft OAuth callback."""
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            "https://login.microsoftonline.com/common/oauth2/v2.0/token",
            data={
                "client_id": MICROSOFT_CLIENT_ID,
                "client_secret": MICROSOFT_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": f"{BACKEND_URL}/oauth/microsoft/callback",
                "scope": "openid email profile User.Read",
            },
        )
        tokens = token_response.json()
        
        if "error" in tokens:
            return RedirectResponse(f"{FRONTEND_URL}/login?error={tokens.get('error_description', 'OAuth failed')}")
        
        # Get user info from Microsoft Graph
        userinfo_response = await client.get(
            "https://graph.microsoft.com/v1.0/me",
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
        )
        userinfo = userinfo_response.json()
    
    email = userinfo.get("mail") or userinfo.get("userPrincipalName")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            name=userinfo.get("displayName", email),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    token = create_access_token({"sub": user.id})
    return RedirectResponse(f"{FRONTEND_URL}/oauth-callback?token={token}")


# ============== SLACK ==============
@router.get("/slack/login")
def slack_login():
    """Redirect to Slack OAuth consent screen."""
    if not SLACK_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Slack OAuth not configured")
    
    params = {
        "client_id": SLACK_CLIENT_ID,
        "redirect_uri": f"{BACKEND_URL}/oauth/slack/callback",
        "user_scope": "identity.basic,identity.email",
    }
    url = f"https://slack.com/oauth/v2/authorize?{urlencode(params)}"
    return RedirectResponse(url)


@router.get("/slack/callback")
async def slack_callback(code: str, db: Session = Depends(get_db)):
    """Handle Slack OAuth callback."""
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            "https://slack.com/api/oauth.v2.access",
            data={
                "client_id": SLACK_CLIENT_ID,
                "client_secret": SLACK_CLIENT_SECRET,
                "code": code,
                "redirect_uri": f"{BACKEND_URL}/oauth/slack/callback",
            },
        )
        data = token_response.json()
        
        if not data.get("ok"):
            return RedirectResponse(f"{FRONTEND_URL}/login?error={data.get('error', 'OAuth failed')}")
        
        user_token = data.get("authed_user", {}).get("access_token")
        
        # Get user identity
        identity_response = await client.get(
            "https://slack.com/api/users.identity",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        identity = identity_response.json()
    
    email = identity.get("user", {}).get("email")
    name = identity.get("user", {}).get("name", email)
    
    if not email:
        return RedirectResponse(f"{FRONTEND_URL}/login?error=No email from Slack")
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(email=email, name=name)
        db.add(user)
        db.commit()
        db.refresh(user)
    
    token = create_access_token({"sub": user.id})
    return RedirectResponse(f"{FRONTEND_URL}/oauth-callback?token={token}")