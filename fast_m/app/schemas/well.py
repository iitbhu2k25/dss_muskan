from pydantic import BaseModel
from typing import Optional

class WellBase(BaseModel):
    FID_clip: Optional[int]
    OBJECTID: Optional[int]
    shapeName: Optional[str]
    SUB_DISTRI: Optional[str]
    DISTRICT_C: Optional[int]
    DISTRICT: Optional[str]
    STATE_CODE: Optional[int]
    STATE: Optional[str]
    population: Optional[int]
    SUBDIS_COD: Optional[int]
    Area: Optional[float]
    DISTRICT_1: Optional[str]
    BLOCK: Optional[str]
    HYDROGRAPH: Optional[str]
    LONGITUDE: Optional[float]
    LATITUDE: Optional[float]
    RL: Optional[float]
    PRE_2011: Optional[float]
    POST_2020: Optional[float]

class Well(WellBase):
    id: int
    village_code: int

    class Config:
        orm_mode = True
