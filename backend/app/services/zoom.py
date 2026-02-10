"""
Zoom integration service for fetching recordings.
"""
import os
import base64
import httpx
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta

ZOOM_CLIENT_ID = os.getenv("ZOOM_CLIENT_ID", "")
ZOOM_CLIENT_SECRET = os.getenv("ZOOM_CLIENT_SECRET", "")
ZOOM_ACCOUNT_ID = os.getenv("ZOOM_ACCOUNT_ID", "")  # For Server-to-Server OAuth


def get_zoom_access_token() -> Optional[str]:
    """Get Zoom access token using Server-to-Server OAuth."""
    if not all([ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET, ZOOM_ACCOUNT_ID]):
        print("⚠️ Zoom credentials not configured")
        return None
    
    try:
        # Base64 encode credentials
        credentials = f"{ZOOM_CLIENT_ID}:{ZOOM_CLIENT_SECRET}"
        encoded = base64.b64encode(credentials.encode()).decode()
        
        with httpx.Client() as client:
            response = client.post(
                "https://zoom.us/oauth/token",
                headers={
                    "Authorization": f"Basic {encoded}",
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                data={
                    "grant_type": "account_credentials",
                    "account_id": ZOOM_ACCOUNT_ID,
                },
            )
            
            if response.status_code == 200:
                return response.json()["access_token"]
            else:
                print(f"⚠️ Zoom auth failed: {response.text}")
                return None
    except Exception as e:
        print(f"⚠️ Zoom auth error: {e}")
        return None


def get_user_access_token(auth_code: str, redirect_uri: str) -> Optional[Dict[str, Any]]:
    """Exchange OAuth code for user access token."""
    if not all([ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET]):
        return None
    
    try:
        credentials = f"{ZOOM_CLIENT_ID}:{ZOOM_CLIENT_SECRET}"
        encoded = base64.b64encode(credentials.encode()).decode()
        
        with httpx.Client() as client:
            response = client.post(
                "https://zoom.us/oauth/token",
                headers={
                    "Authorization": f"Basic {encoded}",
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                data={
                    "grant_type": "authorization_code",
                    "code": auth_code,
                    "redirect_uri": redirect_uri,
                },
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"⚠️ Zoom token exchange failed: {response.text}")
                return None
    except Exception as e:
        print(f"⚠️ Zoom token error: {e}")
        return None


def list_recordings(access_token: str, user_id: str = "me", days: int = 30) -> List[Dict[str, Any]]:
    """List cloud recordings for a user."""
    from_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
    to_date = datetime.now().strftime("%Y-%m-%d")
    
    try:
        with httpx.Client() as client:
            response = client.get(
                f"https://api.zoom.us/v2/users/{user_id}/recordings",
                headers={"Authorization": f"Bearer {access_token}"},
                params={
                    "from": from_date,
                    "to": to_date,
                    "page_size": 30,
                },
            )
            
            if response.status_code == 200:
                data = response.json()
                meetings = data.get("meetings", [])
                
                # Format the results
                recordings = []
                for meeting in meetings:
                    for recording in meeting.get("recording_files", []):
                        if recording.get("file_type") in ["MP4", "M4A", "TRANSCRIPT"]:
                            recordings.append({
                                "meeting_id": meeting.get("uuid"),
                                "topic": meeting.get("topic"),
                                "start_time": meeting.get("start_time"),
                                "duration": meeting.get("duration"),
                                "file_type": recording.get("file_type"),
                                "file_size": recording.get("file_size"),
                                "download_url": recording.get("download_url"),
                                "recording_id": recording.get("id"),
                            })
                
                return recordings
            else:
                print(f"⚠️ Failed to list recordings: {response.text}")
                return []
    except Exception as e:
        print(f"⚠️ Zoom API error: {e}")
        return []


def get_recording_transcript(access_token: str, meeting_id: str) -> Optional[str]:
    """Get the transcript for a specific meeting if available."""
    try:
        with httpx.Client() as client:
            # First get the recording details
            response = client.get(
                f"https://api.zoom.us/v2/meetings/{meeting_id}/recordings",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            
            if response.status_code != 200:
                return None
            
            data = response.json()
            
            # Look for transcript file
            for recording in data.get("recording_files", []):
                if recording.get("file_type") == "TRANSCRIPT":
                    download_url = recording.get("download_url")
                    
                    # Download transcript
                    transcript_response = client.get(
                        download_url,
                        headers={"Authorization": f"Bearer {access_token}"},
                        follow_redirects=True,
                    )
                    
                    if transcript_response.status_code == 200:
                        return transcript_response.text
            
            return None
    except Exception as e:
        print(f"⚠️ Transcript fetch error: {e}")
        return None


def download_recording(access_token: str, download_url: str) -> Optional[bytes]:
    """Download a recording file."""
    try:
        with httpx.Client(timeout=300) as client:  # 5 min timeout for large files
            response = client.get(
                download_url,
                headers={"Authorization": f"Bearer {access_token}"},
                follow_redirects=True,
            )
            
            if response.status_code == 200:
                return response.content
            else:
                print(f"⚠️ Download failed: {response.status_code}")
                return None
    except Exception as e:
        print(f"⚠️ Download error: {e}")
        return None