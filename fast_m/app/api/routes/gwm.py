# app/api/routes/gwm.py
from fastapi import APIRouter, Query
from app.api.views.test_view import TestView


router = APIRouter(prefix="/test", tags=["Test"])

# Create instance of class
test_view = TestView()

@router.get("/sum")
def get_sum(a: int = Query(...), b: int = Query(...)):
    
    return test_view.sum_numbers(a, b)
