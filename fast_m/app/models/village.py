from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Village(Base):
    __tablename__ = "village"

    village_code = Column(Integer, primary_key=True, index=True)
    village_name = Column(String(100), nullable=False)
    population_2011 = Column(Integer, nullable=False)
    subdistrict_code = Column(Integer, ForeignKey("subdistrict.subdistrict_code", ondelete="CASCADE"))

    subdistrict = relationship("Subdistrict", backref="villages")
