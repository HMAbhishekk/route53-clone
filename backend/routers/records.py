from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from auth import get_current_user
import models, schemas
import uuid

router = APIRouter(prefix="/api/zones/{zone_id}/records", tags=["dns-records"])

VALID_TYPES = {"A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA"}


def _ensure_zone(zone_id: str, db: Session) -> models.HostedZone:
    zone = db.query(models.HostedZone).filter(models.HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")
    return zone


def _ensure_record(record_id: str, zone_id: str, db: Session) -> models.DNSRecord:
    record = db.query(models.DNSRecord).filter(
        models.DNSRecord.id == record_id,
        models.DNSRecord.zone_id == zone_id,
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="DNS record not found")
    return record


@router.get("", response_model=schemas.DNSRecordListOut)
def list_records(
    zone_id: str,
    search: Optional[str] = Query(None),
    record_type: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _ensure_zone(zone_id, db)
    q = db.query(models.DNSRecord).filter(models.DNSRecord.zone_id == zone_id)
    if search:
        q = q.filter(models.DNSRecord.name.ilike(f"%{search}%"))
    if record_type:
        q = q.filter(models.DNSRecord.record_type == record_type.upper())
    total = q.count()
    records = q.order_by(models.DNSRecord.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {"records": records, "total": total, "page": page, "page_size": page_size}


@router.post("", response_model=schemas.DNSRecordOut, status_code=201)
def create_record(
    zone_id: str,
    payload: schemas.DNSRecordCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    zone = _ensure_zone(zone_id, db)
    if payload.record_type.upper() not in VALID_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid record type. Must be one of: {', '.join(VALID_TYPES)}")

    record = models.DNSRecord(
        id=str(uuid.uuid4()),
        zone_id=zone_id,
        name=payload.name,
        record_type=payload.record_type.upper(),
        ttl=payload.ttl or 300,
        value=payload.value,
        routing_policy=payload.routing_policy or "Simple",
        alias=payload.alias or False,
        comment=payload.comment or "",
    )
    db.add(record)
    zone.record_count = db.query(models.DNSRecord).filter(models.DNSRecord.zone_id == zone_id).count() + 1
    db.commit()
    db.refresh(record)
    return record


@router.get("/{record_id}", response_model=schemas.DNSRecordOut)
def get_record(zone_id: str, record_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    _ensure_zone(zone_id, db)
    return _ensure_record(record_id, zone_id, db)


@router.put("/{record_id}", response_model=schemas.DNSRecordOut)
def update_record(
    zone_id: str,
    record_id: str,
    payload: schemas.DNSRecordUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _ensure_zone(zone_id, db)
    record = _ensure_record(record_id, zone_id, db)
    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(record, field, val)
    db.commit()
    db.refresh(record)
    return record


@router.delete("/{record_id}", status_code=204)
def delete_record(
    zone_id: str,
    record_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    zone = _ensure_zone(zone_id, db)
    record = _ensure_record(record_id, zone_id, db)
    db.delete(record)
    zone.record_count = max(0, zone.record_count - 1)
    db.commit()
