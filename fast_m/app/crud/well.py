from sqlalchemy.orm import Session
from app.models.well import Well

def get_filtered_wells(db: Session, village_codes=None, subdis_codes=None):
    query = db.query(Well)
    if village_codes:
        query = query.filter(Well.village_code.in_(village_codes))
    if subdis_codes:
        query = query.filter(Well.SUBDIS_COD.in_(subdis_codes))
    wells = query.all()
    wells.sort(key=lambda x: x.HYDROGRAPH or "")
    return wells
