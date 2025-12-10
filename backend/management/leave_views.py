# backend/management/leave_views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .leave_service import apply_leave_service, get_leaves_by_employee_email, update_leave_approval_status
from .serializers import ApplyLeaveSerializer, ApprovalSerializer
from .models import LeaveEmployee
from rest_framework.permissions import AllowAny

class ApplyLeaveAPIView(APIView):
    permission_classes = [AllowAny]  

    def post(self, request):
        serializer = ApplyLeaveSerializer(data=request.data)

        if serializer.is_valid():
            success, result, mail_sent = apply_leave_service(serializer.validated_data)

            if success:
                return Response({
                    "message": "Leave applied successfully",
                    "leave_id": result.id,
                    "email_sent": mail_sent
                }, status=201)

            return Response({"error": result}, status=400)

        return Response(serializer.errors, status=400)


class LeaveApprovalAPIView(APIView):
    def post(self, request):
        serializer = ApprovalSerializer(data=request.data)

        if serializer.is_valid():
            leave_id = serializer.validated_data['leave_id']
            approval_status = serializer.validated_data['approval_status']

            leave = LeaveEmployee.objects.filter(id=leave_id).first()

            if not leave:
                return Response({"error": "Leave request not found"}, status=404)

            leave.approval_status = approval_status
            leave.save()

            return Response({
                "message": f"Leave {approval_status} successfully"
            })

        return Response(serializer.errors, status=400)






class LeaveByEmployeeEmailView(APIView):
    permission_classes = [AllowAny]  

    def post(self, request):
        employee_email = request.data.get("employee_email")

        if not employee_email:
            return Response(
                {"message": "Employee email is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        leave_records = get_leaves_by_employee_email(employee_email)

        if not leave_records.exists():
            return Response(
                {"message": "No leave records found"},
                status=status.HTTP_404_NOT_FOUND
            )

        data = []
        for leave in leave_records:
            data.append({
                "id": leave.id,
                "employee_name": leave.employee_name,
                "employee_email": leave.employee_email.email,
                "supervisor_email": leave.supervisor_email,
                "from_date": leave.from_date,
                "to_date": leave.to_date,
                "total_days": leave.total_days,
                "reason": leave.reason,
                "leave_type": leave.leave_type,
                "approval_status": leave.approval_status,
                "created_at": leave.created_at,
            })

        return Response(
            {
                "message": "Leave records fetched successfully",
                "total_leaves": len(data),
                "data": data
            },
            status=status.HTTP_200_OK
        )


class LeaveByEmployeeEmailGetView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, email):
        if not email:
            return Response(
                {"message": "Employee email is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        leave_records = get_leaves_by_employee_email(email)

        if not leave_records.exists():
            return Response(
                {"message": "No leave records found"},
                status=status.HTTP_404_NOT_FOUND
            )

        data = []
        for leave in leave_records:
            data.append({
                "id": leave.id,
                "employee_name": leave.employee_name,
                "employee_email": leave.employee_email.email,
                "supervisor_email": leave.supervisor_email,
                "from_date": leave.from_date,
                "to_date": leave.to_date,
                "total_days": leave.total_days,
                "reason": leave.reason,
                "leave_type": leave.leave_type,
                "approval_status": leave.approval_status,
                "created_at": leave.created_at,
            })

        return Response(
            {
                "message": "Leave records fetched successfully",
                "total_leaves": len(data),
                "data": data
            },
            status=status.HTTP_200_OK
        )




class UpdateLeaveApprovalStatusView(APIView):
    permission_classes = [AllowAny] 
    def post(self, request):
        leave_id = request.data.get("leave_id")
        approval_status = request.data.get("approval_status")

        # ✅ Validation
        if not leave_id or not approval_status:
            return Response(
                {
                    "success": False,
                    "message": "leave_id and approval_status are required"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if approval_status not in ["approved", "rejected"]:
            return Response(
                {
                    "success": False,
                    "message": "approval_status must be either 'approved' or 'rejected'"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        success, leave = update_leave_approval_status(leave_id, approval_status)

        if not success:
            return Response(
                {
                    "success": False,
                    "message": "Leave request not found"
                },
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(
            {
                "success": True,
                "message": f"Leave {approval_status} successfully",
                "data": {
                    "leave_id": leave.id,
                    "employee_name": leave.employee_name,
                    "approval_status": leave.approval_status,
                    "updated_at": leave.updated_at
                }
            },
            status=status.HTTP_200_OK
        )        