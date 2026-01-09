from django.urls import path
from . import views

app_name = "landing"

urlpatterns = [
    path("", views.home, name="home"),
    path("domains/", views.domains, name="domains"),
    path("medicine/", views.medicine, name="medicine"),
    path("widgets/", views.widgets, name="widgets"),
    path("create-checkout-session/", views.create_checkout_session, name="create_checkout_session"),
    path("stripe/webhook/", views.stripe_webhook, name="stripe_webhook"),
    path("lifestyle/", views.lifestyle, name="lifestyle"),
]
