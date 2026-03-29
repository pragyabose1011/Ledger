from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends
from sqlalchemy import or_, and_
from sqlalchemy.orm import Session
from jose import JWTError, jwt

from app.db.session import SessionLocal, get_db
from app.db.models.message import Message
from app.db.models.user import User
from app.api.auth import get_current_user, SECRET_KEY, ALGORITHM

router = APIRouter(tags=["chat"])


class ConnectionManager:
    def __init__(self):
        self.connections: dict[str, WebSocket] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.connections[user_id] = websocket

    def disconnect(self, user_id: str):
        self.connections.pop(user_id, None)

    async def send_to_user(self, user_id: str, data: dict):
        ws = self.connections.get(user_id)
        if ws:
            try:
                await ws.send_json(data)
            except Exception:
                self.disconnect(user_id)


manager = ConnectionManager()


@router.websocket("/ws/chat")
async def chat_websocket(websocket: WebSocket, token: str = Query(...)):
    db = SessionLocal()
    user = None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            await websocket.close(code=4001)
            return

        await manager.connect(user.id, websocket)

        while True:
            data = await websocket.receive_json()
            recipient_id = data.get("to")
            content = (data.get("content") or "").strip()
            if not recipient_id or not content:
                continue

            recipient = db.query(User).filter(User.id == recipient_id).first()
            if not recipient:
                continue

            msg = Message(sender_id=user.id, recipient_id=recipient_id, content=content)
            db.add(msg)
            db.commit()
            db.refresh(msg)

            out = {
                "id": msg.id,
                "sender_id": user.id,
                "sender_name": user.name,
                "sender_avatar": user.avatar_url,
                "recipient_id": recipient_id,
                "content": content,
                "created_at": str(msg.created_at),
            }
            await manager.send_to_user(recipient_id, out)
            await manager.send_to_user(user.id, out)

    except WebSocketDisconnect:
        if user:
            manager.disconnect(user.id)
    except JWTError:
        await websocket.close(code=4001)
    finally:
        db.close()


@router.get("/messages/conversations")
def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sent_ids = {uid for (uid,) in db.query(Message.recipient_id).filter(Message.sender_id == current_user.id).distinct()}
    recv_ids = {uid for (uid,) in db.query(Message.sender_id).filter(Message.recipient_id == current_user.id).distinct()}
    all_ids = sent_ids | recv_ids

    if not all_ids:
        return []

    # Batch-load all partner users in one query
    partners = {u.id: u for u in db.query(User).filter(User.id.in_(all_ids)).all()}

    conversations = []
    for uid in all_ids:
        other = partners.get(uid)
        if not other:
            continue
        last = (
            db.query(Message)
            .filter(
                or_(
                    and_(Message.sender_id == current_user.id, Message.recipient_id == uid),
                    and_(Message.sender_id == uid, Message.recipient_id == current_user.id),
                )
            )
            .order_by(Message.created_at.desc())
            .first()
        )
        conversations.append({
            "user_id": other.id,
            "name": other.name,
            "avatar_url": other.avatar_url,
            "last_message": last.content if last else "",
            "last_at": str(last.created_at) if last else "",
        })

    conversations.sort(key=lambda x: x["last_at"], reverse=True)
    return conversations


@router.get("/messages/{user_id}")
def get_messages(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    msgs = (
        db.query(Message)
        .filter(
            or_(
                and_(Message.sender_id == current_user.id, Message.recipient_id == user_id),
                and_(Message.sender_id == user_id, Message.recipient_id == current_user.id),
            )
        )
        .order_by(Message.created_at.asc())
        .all()
    )
    return [
        {
            "id": m.id,
            "sender_id": m.sender_id,
            "recipient_id": m.recipient_id,
            "content": m.content,
            "created_at": str(m.created_at),
        }
        for m in msgs
    ]
