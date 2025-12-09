from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .leave_service import apply_leave_service
from .serializers import ApplyLeaveSerializer, ApprovalSerializer
from .models import LeaveEmployee


class ApplyLeaveAPIView(APIView):
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
