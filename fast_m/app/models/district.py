from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class District(Base):
    __tablename__ = "district"

    district_code = Column(Integer, primary_key=True, index=True)
    district_name = Column(String(40), nullable=False)
    state_code = Column(Integer, ForeignKey("state.state_code", ondelete="CASCADE"))

    state = relationship("State", backref="districts")
