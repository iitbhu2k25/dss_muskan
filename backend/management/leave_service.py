import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from .models import LeaveEmployee, PersonalEmployee


def send_dynamic_email(sender_email, sender_password, receiver_email, subject, message):
    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = receiver_email
    msg['Subject'] = subject

    msg.attach(MIMEText(message, 'plain'))

    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, receiver_email, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print("EMAIL ERROR:", str(e))
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

        # ✅ DYNAMIC EMAIL SEND
        subject = "New Leave Request"
        message = f"""
Employee Name: {leave.employee_name}
From Date: {leave.from_date}
To Date: {leave.to_date}
Days: {leave.total_days}

Reason:
{leave.reason}
"""

        email_sent = send_dynamic_email(
            sender_email=data['employee_email'],           # ✅ employee email
            sender_password=data['employee_email_pass'],  # ✅ employee email password
            receiver_email=leave.supervisor_email,
            subject=subject,
            message=message
        )

        return True, leave, email_sent

    except Exception as e:
        return False, str(e), False
