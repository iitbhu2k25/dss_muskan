from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from . import Base
# -----------------------
# State
# -----------------------
class State(Base):
    __tablename__ = "state"

    state_code = Column(Integer, primary_key=True)
    state_name = Column(String(40), nullable=False)

    districts = relationship("District", back_populates="state")

    def __repr__(self):
        return f"{self.state_name}"


# -----------------------
# District
# -----------------------
class District(Base):
    __tablename__ = "district"

    district_code = Column(Integer, primary_key=True)
    district_name = Column(String(40), nullable=False)
    state_code = Column(Integer, ForeignKey("state.state_code"), nullable=False)

    state = relationship("State", back_populates="districts")
    subdistricts = relationship("Subdistrict", back_populates="district")

    def __repr__(self):
        return f"{self.district_name}"


# -----------------------
# Subdistrict
# -----------------------
class Subdistrict(Base):
    __tablename__ = "subdistrict"

    subdistrict_code = Column(Integer, primary_key=True)
    subdistrict_name = Column(String(40), nullable=False)
    district_code = Column(Integer, ForeignKey("district.district_code"), nullable=False)

    district = relationship("District", back_populates="subdistricts")
    villages = relationship("Village", back_populates="subdistrict")

    def __repr__(self):
        return f"{self.subdistrict_name}"


# -----------------------
# Village
# -----------------------
class Village(Base):
    __tablename__ = "village"

    village_code = Column(Integer, primary_key=True)
    village_name = Column(String(100), nullable=False)
    population_2011 = Column(Integer, nullable=False)
    subdistrict_code = Column(Integer, ForeignKey("subdistrict.subdistrict_code"), nullable=False)

    subdistrict = relationship("Subdistrict", back_populates="villages")
    wells = relationship("Well", back_populates="village")

    def __repr__(self):
        return f"{self.village_name} ({self.population_2011})"


# -----------------------
# Well
# -----------------------
class Well(Base):
    __tablename__ = "well"

    FID_clip = Column(Integer, primary_key=True, autoincrement=True)  # <- primary key
    OBJECTID = Column(Integer, nullable=False)
    village_code = Column(Integer, ForeignKey("village.village_code"), nullable=False)

    shapeName = Column(String(100), nullable=True)
    SUB_DISTRI = Column(String(100), nullable=True)
    DISTRICT_C = Column(Integer, nullable=True)
    DISTRICT = Column(String(100), nullable=True)
    STATE_CODE = Column(Integer, nullable=True)
    STATE = Column(String(100), nullable=True)
    population = Column(Integer, nullable=True)
    SUBDIS_COD = Column(Integer, nullable=True)
    Area = Column(Float, nullable=True)
    DISTRICT_1 = Column(String(100), nullable=True)
    BLOCK = Column(String(100), nullable=True)
    HYDROGRAPH = Column(String(100), nullable=True)
    LONGITUDE = Column(Float, nullable=True)
    LATITUDE = Column(Float, nullable=True)
    RL = Column(Float, nullable=True)

    PRE_2011 = Column(Float, nullable=True)
    POST_2011 = Column(Float, nullable=True)
    PRE_2012 = Column(Float, nullable=True)
    POST_2012 = Column(Float, nullable=True)
    PRE_2013 = Column(Float, nullable=True)
    POST_2013 = Column(Float, nullable=True)
    PRE_2014 = Column(Float, nullable=True)
    POST_2014 = Column(Float, nullable=True)
    PRE_2015 = Column(Float, nullable=True)
    POST_2015 = Column(Float, nullable=True)
    PRE_2016 = Column(Float, nullable=True)
    POST_2016 = Column(Float, nullable=True)
    PRE_2017 = Column(Float, nullable=True)
    POST_2017 = Column(Float, nullable=True)
    PRE_2018 = Column(Float, nullable=True)
    POST_2018 = Column(Float, nullable=True)
    PRE_2019 = Column(Float, nullable=True)
    POST_2019 = Column(Float, nullable=True)
    PRE_2020 = Column(Float, nullable=True)
    POST_2020 = Column(Float, nullable=True)

    village = relationship("Village", back_populates="wells")

    def __repr__(self):
        return f"Well FID {self.FID_clip} in village {self.village_code}"


# -----------------------
# Crop
# -----------------------
class Crop(Base):
    __tablename__ = "crop"

    id = Column(Integer, primary_key=True, index=True)
    season = Column(String(100), nullable=False)
    crop = Column(String(100), nullable=False)
    stage = Column(String(100), nullable=False)
    period = Column(String(100), nullable=False)
    crop_factor = Column(Float, nullable=False)

    def __repr__(self):
        return f"{self.crop}"
