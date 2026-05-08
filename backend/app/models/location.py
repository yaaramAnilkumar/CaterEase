from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
import enum
from app.db.base import Base


class City(str, enum.Enum):
    bangalore = "Bangalore"
    tirupati = "Tirupati"


class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    city = Column(SAEnum(City), nullable=False)
    area = Column(String(100), nullable=False)
    pincode = Column(String(10), nullable=False)
    is_serviceable = Column(Boolean, default=True)


class Address(Base):
    __tablename__ = "addresses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    label = Column(String(50), default="Home")
    line1 = Column(String(255), nullable=False)
    area = Column(String(100), nullable=False)
    city = Column(SAEnum(City), nullable=False)
    pincode = Column(String(10), nullable=False)
    is_default = Column(Boolean, default=False)

    user = relationship("User", back_populates="addresses")
