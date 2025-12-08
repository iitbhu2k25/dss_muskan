from django.urls import path
from .views import RegisterAdminView, LoginAdminView, LogoutAdminView, PersonalAdminListView

urlpatterns = [
    path('register', RegisterAdminView.as_view()),
    path('login', LoginAdminView.as_view(), name="admin-login"),
    path('logout', LogoutAdminView.as_view(), name="admin-logout"),
     path('admindata', PersonalAdminListView.as_view(), name="admin-list"),
]
