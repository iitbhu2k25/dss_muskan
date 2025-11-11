# app/api/views/test_view.py
# api/views/test_view.py
from api.script.test import add_numbers


class TestView:
    def sum_numbers(self, a: int, b: int):
        return {"result": add_numbers(a, b)}
