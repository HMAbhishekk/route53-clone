from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from database import Base


def gen_id():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_id)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class HostedZone(Base):
    __tablename__ = "hosted_zones"

    id = Column(String, primary_key=True, default=gen_id)
    name = Column(String, nullable=False)
    comment = Column(String, default="")
    private_zone = Column(Boolean, default=False)
    record_count = Column(Integer, default=2)  # NS + SOA by default
    status = Column(String, default="INSYNC")
    caller_reference = Column(String, default=gen_id)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    records = relationship("DNSRecord", back_populates="zone", cascade="all, delete-orphan")


class DNSRecord(Base):
    __tablename__ = "dns_records"

    id = Column(String, primary_key=True, default=gen_id)
    zone_id = Column(String, ForeignKey("hosted_zones.id"), nullable=False)
    name = Column(String, nullable=False)
    record_type = Column(String, nullable=False)   # A, AAAA, CNAME, MX, TXT, NS, PTR, SRV, CAA
    ttl = Column(Integer, default=300)
    value = Column(Text, nullable=False)           # newline-separated for multiple values
    routing_policy = Column(String, default="Simple")
    alias = Column(Boolean, default=False)
    comment = Column(String, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    zone = relationship("HostedZone", back_populates="records")
