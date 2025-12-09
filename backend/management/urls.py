from django.urls import path
from .views import RegisterAdminView, LoginAdminView, LogoutAdminView, PersonalAdminListView, RegisterEmployeeView, LoginEmployeeView, LogoutEmployeeView, EmployeeStatusView, FilterEmployeesByProjectView

urlpatterns = [
    path('register', RegisterAdminView.as_view()),
    path('login', LoginAdminView.as_view(), name="admin-login"),
    path('logout', LogoutAdminView.as_view(), name="admin-logout"),
    path('admindata', PersonalAdminListView.as_view(), name="admin-list"),
    path('register/employee', RegisterEmployeeView.as_view(), name='register_employee'),
    path('login/employee', LoginEmployeeView.as_view(), name='login_employee'),
    path('logout/employee', LogoutEmployeeView.as_view(), name='logout_employee'),
    path('status/employee', EmployeeStatusView.as_view(), name='employee_status'),
    path('filter-employees', FilterEmployeesByProjectView.as_view(), name='employee_list'),
]
