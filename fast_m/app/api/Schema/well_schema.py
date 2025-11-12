from pydantic import BaseModel
from typing import Optional

# -----------------------
# State schemas
# -----------------------
class StateBase(BaseModel):
    state_code: int
    state_name: str

class StateCreate(StateBase):
    pass

class StateResponse(StateBase):
    class Config:
        orm_mode = True


# -----------------------
# District schemas
# -----------------------
class DistrictBase(BaseModel):
    district_code: int
    district_name: str
    state_code: int  # FK

class DistrictCreate(DistrictBase):
    pass

class DistrictResponse(DistrictBase):
    class Config:
        orm_mode = True


# -----------------------
# Subdistrict schemas
# -----------------------
class SubdistrictBase(BaseModel):
    subdistrict_code: int
    subdistrict_name: str
    district_code: int  # FK

class SubdistrictCreate(SubdistrictBase):
    pass

class SubdistrictResponse(SubdistrictBase):
    class Config:
        orm_mode = True


# -----------------------
# Village schemas
# -----------------------
class VillageBase(BaseModel):
    village_code: int
    village_name: str
    population_2011: int
    subdistrict_code: int  # FK

class VillageCreate(VillageBase):
    pass

class VillageResponse(VillageBase):
    class Config:
        orm_mode = True


# -----------------------
# Well schemas
# -----------------------
class WellBase(BaseModel):
    FID_clip: int
    OBJECTID: int
    village_code: int  # FK

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
    POST_2011: Optional[float]
    PRE_2012: Optional[float]
    POST_2012: Optional[float]
    PRE_2013: Optional[float]
    POST_2013: Optional[float]
    PRE_2014: Optional[float]
    POST_2014: Optional[float]
    PRE_2015: Optional[float]
    POST_2015: Optional[float]
    PRE_2016: Optional[float]
    POST_2016: Optional[float]
    PRE_2017: Optional[float]
    POST_2017: Optional[float]
    PRE_2018: Optional[float]
    POST_2018: Optional[float]
    PRE_2019: Optional[float]
    POST_2019: Optional[float]
    PRE_2020: Optional[float]
    POST_2020: Optional[float]

class WellCreate(WellBase):
    pass

class WellResponse(WellBase):
    class Config:
        orm_mode = True


# -----------------------
# Crop schemas
# -----------------------
class CropBase(BaseModel):
    season: str
    crop: str
    stage: str
    period: str
    crop_factor: float

class CropCreate(CropBase):
    pass

class CropResponse(CropBase):
    class Config:
        orm_mode = True
