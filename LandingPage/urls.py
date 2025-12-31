from django.urls import path
from . import views

app_name = "landing"

urlpatterns = [
    path("", views.home, name="home"),
    path("domains/", views.domains, name="domains"),
    path("medicine/", views.medicine, name="medicine"),
    path("widgets/", views.widgets, name="widgets"),
]
