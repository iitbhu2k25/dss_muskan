# app/api/routes/gwm.py
from fastapi import APIRouter, Query
from api.views.test_view import TestView # ✅ corrected import

router = APIRouter(prefix="/test", tags=["Test"])

# Create instance of class
test_view = TestView()

@router.get("/sum")
def get_sum(a: int = Query(...), b: int = Query(...)):
    """
    Add two numbers using the TestView class.
    Example: /test/sum?a=5&b=7
    """
    return test_view.sum_numbers(a, b)
