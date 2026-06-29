from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from database import get_db
from auth import get_current_user
import models, schemas
import uuid

router = APIRouter(prefix="/api/zones", tags=["hosted-zones"])


def _ensure_zone(zone_id: str, db: Session) -> models.HostedZone:
    zone = db.query(models.HostedZone).filter(models.HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")
    return zone


@router.get("", response_model=schemas.HostedZoneListOut)
def list_zones(
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(models.HostedZone)
    if search:
        q = q.filter(models.HostedZone.name.ilike(f"%{search}%"))
    total = q.count()
    zones = q.order_by(models.HostedZone.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {"zones": zones, "total": total, "page": page, "page_size": page_size}


@router.post("", response_model=schemas.HostedZoneOut, status_code=201)
def create_zone(
    payload: schemas.HostedZoneCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # Ensure name ends with a dot (Route53 convention)
    name = payload.name if payload.name.endswith(".") else payload.name + "."
    if db.query(models.HostedZone).filter(models.HostedZone.name == name).first():
        raise HTTPException(status_code=400, detail="A hosted zone with this name already exists")
    zone = models.HostedZone(
        id=str(uuid.uuid4()),
        name=name,
        comment=payload.comment or "",
        private_zone=payload.private_zone or False,
        caller_reference=str(uuid.uuid4()),
    )
    db.add(zone)
    db.commit()
    db.refresh(zone)
    return zone


@router.get("/{zone_id}", response_model=schemas.HostedZoneOut)
def get_zone(zone_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return _ensure_zone(zone_id, db)


@router.put("/{zone_id}", response_model=schemas.HostedZoneOut)
def update_zone(
    zone_id: str,
    payload: schemas.HostedZoneUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    zone = _ensure_zone(zone_id, db)
    if payload.comment is not None:
        zone.comment = payload.comment
    db.commit()
    db.refresh(zone)
    return zone


@router.delete("/{zone_id}", status_code=204)
def delete_zone(zone_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    zone = _ensure_zone(zone_id, db)
    db.delete(zone)
    db.commit()
