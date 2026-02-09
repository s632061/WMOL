from django.urls import path
from . import views

app_name = "landing"

urlpatterns = [
    path("", views.home, name="home"),
    path("domains/", views.domains, name="domains"),
    path("medicine/", views.medicine, name="medicine"),
    path("widgets/", views.widgets, name="widgets"),
    path("lifestyle/", views.lifestyle, name="lifestyle"),

    # tools
    path("tools/", views.tools_hub, name="tools_hub"),
    path("tools/hsk/", views.hsk_page, name="hsk_page"),

    # stripe
    path("create-checkout-session/", views.create_checkout_session, name="create_checkout_session"),
    path("stripe/webhook/", views.stripe_webhook, name="stripe_webhook"),
]
