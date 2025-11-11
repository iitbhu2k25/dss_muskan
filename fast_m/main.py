from fastapi import FastAPI
# main.py
from setting.dbc import test_connection
from api.routes import gwm
 
  # ✅ correct import

app = FastAPI(title="Fast_M Service")

@app.on_event("startup")
def startup_event():
    # optional DB connection check
    test_connection()

# Include your route
app.include_router(gwm.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Fast_M!"}
