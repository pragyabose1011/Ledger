"""WebRTC signaling and room management for built-in meetings."""
import uuid
from datetime import datetime
from typing import Dict

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query, HTTPException
from jose import JWTError, jwt
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import SessionLocal, get_db
from app.db.models.user import User
from app.api.auth import get_current_user, SECRET_KEY, ALGORITHM

room_router = APIRouter(prefix="/rooms", tags=["rooms"])
ws_router = APIRouter(tags=["rooms"])

# In-memory state — rooms are ephemeral, cleared on server restart
_rooms: Dict[str, dict] = {}
_participants: Dict[str, Dict[str, dict]] = {}
_ws_connections: Dict[str, Dict[str, WebSocket]] = {}


class CreateRoomRequest(BaseModel):
    title: str = ""


@room_router.post("/create")
def create_room(
    payload: CreateRoomRequest,
    current_user: User = Depends(get_current_user),
):
    room_id = str(uuid.uuid4())[:8].upper()
    _rooms[room_id] = {
        "id": room_id,
        "title": payload.title.strip() or f"{current_user.name}'s Meeting",
        "created_by": current_user.id,
        "created_at": datetime.utcnow().isoformat(),
    }
    _participants[room_id] = {}
    return {"room_id": room_id, "title": _rooms[room_id]["title"]}


@room_router.get("/{room_id}")
def get_room(
    room_id: str,
    current_user: User = Depends(get_current_user),
):
    rid = room_id.upper()
    if rid not in _rooms:
        raise HTTPException(404, "Room not found")
    return {
        **_rooms[rid],
        "participants": list(_participants.get(rid, {}).values()),
    }


@ws_router.websocket("/ws/room/{room_id}")
async def room_ws(
    websocket: WebSocket,
    room_id: str,
    token: str = Query(...),
):
    db = SessionLocal()
    user = None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            await websocket.close(code=4001)
            return
    except JWTError:
        await websocket.close(code=4001)
        return
    finally:
        db.close()

    await websocket.accept()

    rid = room_id.upper()
    if rid not in _rooms:
        # Auto-create room on first join
        _rooms[rid] = {
            "id": rid,
            "title": f"{user.name}'s Meeting",
            "created_by": user.id,
            "created_at": datetime.utcnow().isoformat(),
        }
        _participants[rid] = {}
        _ws_connections[rid] = {}

    if rid not in _ws_connections:
        _ws_connections[rid] = {}

    user_info = {
        "id": user.id,
        "name": user.name,
        "avatar_url": user.avatar_url,
    }

    # Tell new joiner about existing participants (they should send offers)
    for uid, info in list(_participants.get(rid, {}).items()):
        await websocket.send_json({
            "type": "peer_joined",
            "user": info,
            "should_offer": True,
        })

    # Register this user
    _ws_connections[rid][user.id] = websocket
    _participants[rid][user.id] = user_info

    # Broadcast to existing participants that new user joined (they wait for offer)
    await _broadcast(rid, {
        "type": "peer_joined",
        "user": user_info,
        "should_offer": False,
    }, exclude=user.id)

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            if msg_type in ("offer", "answer", "ice"):
                target_id = data.get("to")
                if target_id and target_id in _ws_connections.get(rid, {}):
                    await _ws_connections[rid][target_id].send_json({
                        **data,
                        "from": user.id,
                    })

            elif msg_type == "chat":
                await _broadcast(rid, {
                    "type": "chat",
                    "from": user.id,
                    "name": user.name,
                    "content": (data.get("content") or "").strip(),
                    "ts": datetime.utcnow().isoformat(),
                })

            elif msg_type == "reaction":
                await _broadcast(rid, {
                    "type": "reaction",
                    "from": user.id,
                    "name": user.name,
                    "emoji": data.get("emoji", "👍"),
                })

            elif msg_type == "media_state":
                await _broadcast(rid, {
                    "type": "media_state",
                    "from": user.id,
                    "audio": bool(data.get("audio", True)),
                    "video": bool(data.get("video", True)),
                }, exclude=user.id)

    except WebSocketDisconnect:
        pass
    finally:
        _ws_connections.get(rid, {}).pop(user.id, None)
        _participants.get(rid, {}).pop(user.id, None)
        await _broadcast(rid, {"type": "peer_left", "user_id": user.id})
        # Clean up empty rooms
        if not _ws_connections.get(rid):
            _rooms.pop(rid, None)
            _participants.pop(rid, None)
            _ws_connections.pop(rid, None)


async def _broadcast(room_id: str, msg: dict, exclude: str = None):
    dead = []
    for uid, ws in list(_ws_connections.get(room_id, {}).items()):
        if uid == exclude:
            continue
        try:
            await ws.send_json(msg)
        except Exception:
            dead.append(uid)
    for uid in dead:
        _ws_connections.get(room_id, {}).pop(uid, None)
