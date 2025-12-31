from django.shortcuts import render
import stripe
from django.conf import settings
from django.core.mail import send_mail
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt


# Create your views here.
# LandingPage/views.py
from django.shortcuts import render
import os
import stripe

from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt

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
    return render(request, 'landing/medicine.html')

def widgets(request):
    return render(request, 'landing/widgets.html')

def domains(request):
    return render(request, 'landing/domains.html')


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
