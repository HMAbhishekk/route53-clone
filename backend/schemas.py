from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ── Auth ──────────────────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserOut(BaseModel):
    id: str
    username: str
    email: str
    created_at: datetime
    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


# ── Hosted Zones ──────────────────────────────────────────────────────────────
class HostedZoneCreate(BaseModel):
    name: str
    comment: Optional[str] = ""
    private_zone: Optional[bool] = False

class HostedZoneUpdate(BaseModel):
    comment: Optional[str] = None

class HostedZoneOut(BaseModel):
    id: str
    name: str
    comment: str
    private_zone: bool
    record_count: int
    status: str
    caller_reference: str
    created_at: datetime
    class Config:
        from_attributes = True

class HostedZoneListOut(BaseModel):
    zones: List[HostedZoneOut]
    total: int
    page: int
    page_size: int


# ── DNS Records ───────────────────────────────────────────────────────────────
class DNSRecordCreate(BaseModel):
    name: str
    record_type: str
    ttl: Optional[int] = 300
    value: str
    routing_policy: Optional[str] = "Simple"
    alias: Optional[bool] = False
    comment: Optional[str] = ""

class DNSRecordUpdate(BaseModel):
    name: Optional[str] = None
    ttl: Optional[int] = None
    value: Optional[str] = None
    routing_policy: Optional[str] = None
    alias: Optional[bool] = None
    comment: Optional[str] = None

class DNSRecordOut(BaseModel):
    id: str
    zone_id: str
    name: str
    record_type: str
    ttl: int
    value: str
    routing_policy: str
    alias: bool
    comment: str
    created_at: datetime
    class Config:
        from_attributes = True

class DNSRecordListOut(BaseModel):
    records: List[DNSRecordOut]
    total: int
    page: int
    page_size: int
