from sqlalchemy import Column, Integer, String
from ..database import Base

class Migration(Base):
    __tablename__ = 'migrations'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
