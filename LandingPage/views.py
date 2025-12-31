from django.shortcuts import render

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
