# backend/management/models.py
from django.db import models
from django.contrib.auth.hashers import make_password


class PersonalAdmin(models.Model):
    name = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=100, unique=True)
    password = models.CharField(max_length=200)
    department = models.CharField(max_length=100)
    projects = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        if not self.pk:
            self.password = make_password(self.password)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.username


class PersonalEmployee(models.Model):
    name = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=100, unique=True)
    password = models.CharField(max_length=200)
    department = models.CharField(max_length=100)

    # ✅ Supervisor Name (Simple Text)
    supervisor_name = models.CharField(max_length=100)

    # ✅ Supervisor Email (Foreign Key)
    supervisor_email = models.ForeignKey(
        PersonalAdmin,
        to_field="email",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="employees"
    )

    project_name = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.username

    class Meta:
        db_table = 'personal_employee'
        verbose_name = 'Personal Employee'
        verbose_name_plural = 'Personal Employees'
        
        
        
        
class LeaveEmployee(models.Model):
    APPROVAL_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    # Foreign Key to PersonalEmployee
    employee_email = models.ForeignKey(
        PersonalEmployee,
        to_field="email",
        on_delete=models.CASCADE,
        related_name="leave_requests"
    )
    
    employee_name = models.CharField(max_length=150)
    supervisor_email = models.EmailField()
    
    from_date = models.DateField()
    to_date = models.DateField()
    total_days = models.IntegerField()
    
    reason = models.TextField()
    leave_type = models.CharField(max_length=100)  # ✅ User enters any string
    approval_status = models.CharField(
        max_length=20, 
        choices=APPROVAL_STATUS_CHOICES, 
        default='pending'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.employee_name} - {self.leave_type} ({self.from_date} to {self.to_date})"

    class Meta:
        db_table = 'leave_employee'
        verbose_name = 'Leave Request'
        verbose_name_plural = 'Leave Requests'
        ordering = ['-created_at']        