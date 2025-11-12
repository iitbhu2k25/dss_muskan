# # app/models/population_2011.py
# from sqlalchemy import Column, Integer, String, BigInteger
# from sqlalchemy.orm import relationship
# from app.core.database import Base


# class Population2011(Base):
#     __tablename__ = "population_2011"

#     subdistrict_code = Column(Integer, primary_key=True, index=True)
#     region_name = Column(String(40), nullable=False)

#     population_1951 = Column(BigInteger, nullable=False)
#     population_1961 = Column(BigInteger, nullable=False)
#     population_1971 = Column(BigInteger, nullable=False)
#     population_1981 = Column(BigInteger, nullable=False)
#     population_1991 = Column(BigInteger, nullable=False)
#     population_2001 = Column(BigInteger, nullable=False)
#     population_2011 = Column(BigInteger, nullable=False)

#     # ONE-SIDED relationship + backref
#     villages = relationship(
#         "Village",                     # string name – no import needed
#         backref="subdistrict_pop",     # creates `village.subdistrict_pop` automatically
#         cascade="all, delete-orphan"
#     )

#     def __repr__(self):
#         return f"<Population2011 {self.region_name} ({self.subdistrict_code})>"