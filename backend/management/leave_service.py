import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from .models import LeaveEmployee, PersonalEmployee


from django.core.mail import EmailMessage

def send_leave_email_to_admins(admin_emails, subject, message):
    try:
        email = EmailMessage(
            subject=subject,
            body=message,
            from_email=None,            # Uses EMAIL_HOST_USER
            to=admin_emails             # ✅ LIST of admins
        )
        email.send()
        return True
    except Exception as e:
        print("EMAIL ERROR:", e)
        return False


def apply_leave_service(data):
    try:
        employee = PersonalEmployee.objects.get(email=data['employee_email'])

        leave = LeaveEmployee.objects.create(
            employee_email=employee,
            employee_name=data['employee_name'],
            supervisor_email=data['supervisor_email'],
            from_date=data['from_date'],
            to_date=data['to_date'],
            total_days=data['total_days'],
            reason=data['reason'],
            leave_type=data['leave_type'],
        )

        # ✅ SEND MAIL TO SUPERVISOR (NO ROLE FIELD USED)
        admin_emails = [leave.supervisor_email]   # ✅ WORKING 100%

        # ✅ OPTIONAL: ADD FIXED HR / ADMIN EMAILS
        fixed_admins = [
            "hr@company.com",
            "admin@company.com"
        ]

        admin_emails.extend(fixed_admins)

        subject = "New Leave Request"
        message = f"""
Employee Name: {leave.employee_name}
Employee Email: {employee.email}

From: {leave.from_date}
To: {leave.to_date}
Total Days: {leave.total_days}

Reason:
{leave.reason}
"""

        email_sent = send_leave_email_to_admins(
            admin_emails=admin_emails,
            subject=subject,
            message=message
        )

        return True, leave, email_sent

    except PersonalEmployee.DoesNotExist:
        return False, "Employee email not registered", False

    except Exception as e:
        return False, str(e), False






def get_leaves_by_employee_email(employee_email):
    leave_data = LeaveEmployee.objects.filter(
        employee_email__email=employee_email
    ).order_by('-created_at')

    return leave_data



def update_leave_approval_status(leave_id, approval_status):
    try:
        leave = LeaveEmployee.objects.get(id=leave_id)
        leave.approval_status = approval_status
        leave.save()
        return True, leave
    except LeaveEmployee.DoesNotExist:
        return False, None
