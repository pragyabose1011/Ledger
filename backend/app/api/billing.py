import os

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models.user import User
from app.api.auth import get_current_user

router = APIRouter(prefix="/billing", tags=["billing"])

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
STRIPE_PRICE_ID = os.getenv("STRIPE_PRICE_ID", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY


@router.post("/create-checkout-session")
def create_checkout_session(
    current_user: User = Depends(get_current_user),
):
    if not STRIPE_SECRET_KEY:
        raise HTTPException(503, "Billing is not configured. Add STRIPE_SECRET_KEY to your .env.")
    if not STRIPE_PRICE_ID:
        raise HTTPException(503, "No Stripe price configured. Add STRIPE_PRICE_ID to your .env.")

    try:
        kwargs = {
            "payment_method_types": ["card"],
            "line_items": [{"price": STRIPE_PRICE_ID, "quantity": 1}],
            "mode": "subscription",
            "success_url": f"{FRONTEND_URL}/profile?billing=success&tab=billing",
            "cancel_url": f"{FRONTEND_URL}/profile?tab=billing",
            "metadata": {"user_id": current_user.id},
        }
        if current_user.stripe_customer_id:
            kwargs["customer"] = current_user.stripe_customer_id
        else:
            kwargs["customer_email"] = current_user.email

        session = stripe.checkout.Session.create(**kwargs)
        return {"url": session.url}
    except stripe.error.StripeError as e:
        raise HTTPException(400, str(e))


@router.post("/portal")
def billing_portal(
    current_user: User = Depends(get_current_user),
):
    if not STRIPE_SECRET_KEY:
        raise HTTPException(503, "Billing is not configured.")
    if not current_user.stripe_customer_id:
        raise HTTPException(400, "No billing account found. Please upgrade first.")

    try:
        session = stripe.billing_portal.Session.create(
            customer=current_user.stripe_customer_id,
            return_url=f"{FRONTEND_URL}/profile?tab=billing",
        )
        return {"url": session.url}
    except stripe.error.StripeError as e:
        raise HTTPException(400, str(e))


@router.get("/status")
def billing_status(
    current_user: User = Depends(get_current_user),
):
    if not current_user.stripe_subscription_id:
        return {"plan": "free", "status": "none"}

    if not STRIPE_SECRET_KEY:
        return {"plan": "pro", "status": "active"}

    try:
        sub = stripe.Subscription.retrieve(current_user.stripe_subscription_id)
        return {
            "plan": "pro",
            "status": sub.status,
            "current_period_end": sub.current_period_end,
        }
    except stripe.error.StripeError:
        return {"plan": "free", "status": "none"}


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")

    if not STRIPE_WEBHOOK_SECRET:
        raise HTTPException(503, "Webhook secret not configured.")

    try:
        event = stripe.Webhook.construct_event(payload, sig, STRIPE_WEBHOOK_SECRET)
    except (ValueError, stripe.error.SignatureVerificationError):
        raise HTTPException(400, "Invalid webhook signature")

    if event.type == "checkout.session.completed":
        session_obj = event.data.object
        user_id = (session_obj.get("metadata") or {}).get("user_id")
        if user_id:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.stripe_customer_id = session_obj.get("customer")
                user.stripe_subscription_id = session_obj.get("subscription")
                db.commit()

    elif event.type in ("customer.subscription.deleted", "customer.subscription.paused"):
        sub = event.data.object
        user = db.query(User).filter(User.stripe_subscription_id == sub.id).first()
        if user:
            user.stripe_subscription_id = None
            db.commit()

    return {"received": True}
