from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse, PlainTextResponse
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
import models
import json
import re

router = APIRouter(prefix="/api/zones", tags=["import-export"])


# ── Export zone as JSON ───────────────────────────────────────────────────────
@router.get("/{zone_id}/export/json")
def export_json(zone_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    zone = db.query(models.HostedZone).filter(models.HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")

    records = db.query(models.DNSRecord).filter(models.DNSRecord.zone_id == zone_id).all()

    payload = {
        "zone": {
            "id": zone.id,
            "name": zone.name,
            "comment": zone.comment,
            "private_zone": zone.private_zone,
            "created_at": zone.created_at.isoformat(),
        },
        "records": [
            {
                "name": r.name,
                "type": r.record_type,
                "ttl": r.ttl,
                "value": r.value,
                "routing_policy": r.routing_policy,
                "alias": r.alias,
                "comment": r.comment,
            }
            for r in records
        ],
    }
    return JSONResponse(content=payload, headers={
        "Content-Disposition": f'attachment; filename="{zone.name.rstrip(".")}.json"'
    })


# ── Export zone as BIND format ────────────────────────────────────────────────
@router.get("/{zone_id}/export/bind", response_class=PlainTextResponse)
def export_bind(zone_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    zone = db.query(models.HostedZone).filter(models.HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")

    records = db.query(models.DNSRecord).filter(models.DNSRecord.zone_id == zone_id).all()

    lines = [
        f"; Zone file for {zone.name}",
        f"; Exported by Route53 Clone",
        f"; Comment: {zone.comment or 'none'}",
        "",
        f"$ORIGIN {zone.name}",
        f"$TTL 300",
        "",
    ]

    for r in records:
        for val in r.value.strip().splitlines():
            val = val.strip()
            if val:
                lines.append(f"{r.name}\t{r.ttl}\tIN\t{r.record_type}\t{val}")

    content = "\n".join(lines)
    return PlainTextResponse(content=content, headers={
        "Content-Disposition": f'attachment; filename="{zone.name.rstrip(".")}.zone"'
    })


# ── Import DNS records from BIND zone file ────────────────────────────────────
@router.post("/{zone_id}/import/bind")
async def import_bind(
    zone_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    zone = db.query(models.HostedZone).filter(models.HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")

    content = (await file.read()).decode("utf-8")
    lines = content.splitlines()

    VALID_TYPES = {"A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA"}
    imported = 0
    skipped = 0
    import uuid

    for line in lines:
        line = line.strip()
        if not line or line.startswith(";") or line.startswith("$"):
            continue

        parts = line.split()
        if len(parts) < 4:
            skipped += 1
            continue

        try:
            name = parts[0]
            if parts[1].isdigit():
                ttl = int(parts[1])
                rest = parts[2:]
            else:
                ttl = 300
                rest = parts[1:]

            if rest[0].upper() == "IN":
                rest = rest[1:]

            if len(rest) < 2:
                skipped += 1
                continue

            record_type = rest[0].upper()
            value = " ".join(rest[1:])

            if record_type not in VALID_TYPES:
                skipped += 1
                continue

            record = models.DNSRecord(
                id=str(uuid.uuid4()),
                zone_id=zone_id,
                name=name,
                record_type=record_type,
                ttl=ttl,
                value=value,
                routing_policy="Simple",
                alias=False,
                comment="Imported from BIND file",
            )
            db.add(record)
            imported += 1
        except Exception:
            skipped += 1
            continue

    db.commit()
    zone.record_count = db.query(models.DNSRecord).filter(models.DNSRecord.zone_id == zone_id).count()
    db.commit()

    return {"imported": imported, "skipped": skipped, "total": imported + skipped}