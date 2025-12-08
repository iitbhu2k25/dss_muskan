from django.urls import path
from .views import RegisterAdminView, LoginAdminView

urlpatterns = [
    path('register', RegisterAdminView.as_view()),
    path('login', LoginAdminView.as_view(), name="admin-login"),
]
