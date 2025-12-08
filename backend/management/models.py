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

    def save(self, *args, **kwargs):
        if not self.pk:  # hash only on CREATE
            self.password = make_password(self.password)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.username
