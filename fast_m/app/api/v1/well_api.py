from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.schemas.well import Well
from app.crud import well as crud_well

router = APIRouter()

@router.post("/wells", response_model=List[Well])
def get_wells(
    payload: dict,
    db: Session = Depends(get_db)
):
    village_codes = payload.get("village_code", [])
    subdis_codes = payload.get("subdis_cod", [])

    if not village_codes and not subdis_codes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="village_code or subdis_cod is required",
        )

    wells = crud_well.get_filtered_wells(db, village_codes, subdis_codes)
    return wells
