from django.shortcuts import render

# Create your views here.
# LandingPage/views.py
from django.shortcuts import render

def home(request):
    return render(request, 'landing/home.html')     # see template path note below

def medicine(request):
    return render(request, 'landing/medicine.html')

def widgets(request):
    return render(request, 'landing/widgets.html')

