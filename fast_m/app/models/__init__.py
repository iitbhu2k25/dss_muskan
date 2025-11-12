# app/models/__init__.py
from app.models.state import State
from app.models.district import District
from app.models.subdistrict import Subdistrict
from app.models.village import Village
from app.models.well import Well
# from .population_2011 import Population2011

__all__ = [
    "District",
    "State",
    "Subdistrict",
    "Village",
    "Well"
    # "Population2011"  
]