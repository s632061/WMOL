import hashlib
import logging
import os

import stripe

from django.conf import settings
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.core.mail import EmailMessage, send_mail
from django.core.validators import validate_email
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST


logger = logging.getLogger(__name__)

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")


PRICE_STANDARD = os.environ.get("STRIPE_PRICE_STANDARD", "")
PRICE_EXTENDED = os.environ.get("STRIPE_PRICE_EXTENDED", "")

SITE_URL = os.environ.get("SITE_URL", "https://www.wangmethodoflearning.com")


@csrf_exempt  # simplest to get you live fast. We can lock this down with CSRF after.
@require_POST
def create_checkout_session(request):
    package = request.POST.get("package")

    if package == "standard":
        price_id = PRICE_STANDARD
    elif package == "extended":
        price_id = PRICE_EXTENDED
    else:
        return JsonResponse({"error": "Invalid package"}, status=400)

    if not price_id:
        return JsonResponse({"error": "Missing Stripe price id"}, status=500)

    # ✅ Choose ONE:
    MODE = "subscription"   # monthly recurring
    # MODE = "payment"      # one-time purchase

    session = stripe.checkout.Session.create(
        mode=MODE,
        line_items=[{"price": price_id, "quantity": 1}],
        success_url=f"{SITE_URL}/medicine/?success=1",
        cancel_url=f"{SITE_URL}/medicine/?canceled=1",
        metadata={"package": package},
    )

    return JsonResponse({"url": session.url})



def home(request):
    return render(request, 'landing/home.html')     # see template path note below

def medicine(request):
    return render(request, "landing/medicine.html")


def _get_client_ip(request):
    """
    Prefer Cloudflare's connecting-IP header when available.
    Fall back to Django's remote address.
    """
    return (
        request.META.get("HTTP_CF_CONNECTING_IP")
        or request.META.get("REMOTE_ADDR")
        or "unknown"
    )


@require_POST
def pass_interest(request):
    """
    Receive an institutional email address and notify WMOL.

    Security controls:
    - Django CSRF protection
    - Server-side email validation
    - Hidden honeypot field
    - Email-length limit
    - Basic IP rate limiting
    - No attachments or user-controlled email subject
    """

    email = (request.POST.get("email") or "").strip().lower()
    honeypot = (request.POST.get("website") or "").strip()

    # Bots often fill hidden fields. Return success without sending anything.
    if honeypot:
        return JsonResponse(
            {
                "ok": True,
                "message": "Thank you. We’ll reach out shortly.",
            }
        )

    if not email or len(email) > 254:
        return JsonResponse(
            {
                "ok": False,
                "error": "Enter a valid institutional email address.",
            },
            status=400,
        )

    try:
        validate_email(email)
    except ValidationError:
        return JsonResponse(
            {
                "ok": False,
                "error": "Enter a valid institutional email address.",
            },
            status=400,
        )

    # Allow up to five submissions from one IP address per hour.
    client_ip = _get_client_ip(request)
    hashed_ip = hashlib.sha256(client_ip.encode("utf-8")).hexdigest()
    rate_limit_key = f"pass-interest:{hashed_ip}"

    attempts = cache.get(rate_limit_key, 0)

    if attempts >= 5:
        response = JsonResponse(
            {
                "ok": False,
                "error": (
                    "Too many requests were submitted. "
                    "Please try again later or contact us directly."
                ),
            },
            status=429,
        )
        response["Retry-After"] = "3600"
        return response

    cache.set(rate_limit_key, attempts + 1, timeout=3600)

    notify_to = getattr(settings, "NOTIFY_EMAIL_TO", "")
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "")

    if not notify_to or not from_email:
        logger.error(
            "PASS inquiry email settings are incomplete. "
            "NOTIFY_EMAIL_TO or DEFAULT_FROM_EMAIL is missing."
        )
        return JsonResponse(
            {
                "ok": False,
                "error": (
                    "The contact form is temporarily unavailable. "
                    "Please contact us directly by email."
                ),
            },
            status=503,
        )

    notification = EmailMessage(
        subject="New WMOL PASS institutional inquiry",
        body=(
            "A visitor requested an institutional discussion about WMOL PASS.\n\n"
            f"Institutional email: {email}\n"
            f"Submission IP: {client_ip}\n\n"
            "You can reply directly to this notification."
        ),
        from_email=from_email,
        to=[notify_to],
        reply_to=[email],
    )

    try:
        notification.send(fail_silently=False)
    except Exception:
        logger.exception("Failed to send the WMOL PASS inquiry notification.")
        return JsonResponse(
            {
                "ok": False,
                "error": (
                    "Your request could not be sent. "
                    "Please contact us directly by email."
                ),
            },
            status=500,
        )

    return JsonResponse(
        {
            "ok": True,
            "message": "Thank you. We’ll reach out shortly.",
        }
    )


def widgets(request):
    return render(request, "landing/widgets.html")

def domains(request):
    return render(request, 'landing/domains.html')

def lifestyle(request):
    return render(request, "landing/lifestyle.html")

def tools_hub(request):
    return render(request, "landing/tools.html")

def hsk_page(request):
    return render(request, "landing/hsk.html")





@csrf_exempt
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")
    whsec = getattr(settings, "STRIPE_WEBHOOK_SECRET", "")

    if not whsec:
        return HttpResponse("Missing STRIPE_WEBHOOK_SECRET", status=500)

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, whsec)
    except ValueError:
        return HttpResponse("Invalid payload", status=400)
    except stripe.error.SignatureVerificationError:
        return HttpResponse("Invalid signature", status=400)

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]

        email = (
            (session.get("customer_details") or {}).get("email")
            or session.get("customer_email")
            or ""
        )
        package = (session.get("metadata") or {}).get("package", "unknown")
        session_id = session.get("id", "")

        notify_to = getattr(settings, "NOTIFY_EMAIL_TO", "")
        if notify_to:
            send_mail(
                subject=f"New WMOL purchase: {package}",
                message=f"Email: {email}\nPackage: {package}\nSession: {session_id}",
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
                recipient_list=[notify_to],
                fail_silently=False,
            )

    return HttpResponse(status=200)


