from fastapi import FastAPI
import os
app = FastAPI()
PORT = os.getenv("PORT", "unknown")
@app.get("/{path:path}")
def ok(path: str):
    return {"backend": PORT}