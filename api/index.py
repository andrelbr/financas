from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from . import models, schemas, crud, database, auth

app = FastAPI(title="Gestão de Finanças", docs_url="/api/docs", openapi_url="/api/openapi.json")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Since it's hosted together or proxied locally
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event to ensure tables and initial data exist
@app.on_event("startup")
def on_startup():
    models.Base.metadata.create_all(bind=database.engine)
    db = database.SessionLocal()
    
    # Initialize default users
    andre = crud.get_user_by_email(db, "andrebaldo71@gmail.com")
    if not andre:
        db_user = models.User(
            name="André Baldo",
            email="andrebaldo71@gmail.com",
            password_hash=crud.get_password_hash("andre2026")
        )
        db.add(db_user)
        
    sofia = crud.get_user_by_email(db, "sofiiapmedina@gmail.com")
    if not sofia:
        db_user = models.User(
            name="Sofia Medina",
            email="sofiiapmedina@gmail.com",
            password_hash=crud.get_password_hash("sofia2026")
        )
        db.add(db_user)
        
    db.commit()
    
    # Initialize default categories if none
    if not db.query(models.Category).first():
        defaults = [
            {"name": "Alimentação", "type": "expense", "color": "#fb923c"},
            {"name": "Moradia", "type": "expense", "color": "#60a5fa"},
            {"name": "Transporte", "type": "expense", "color": "#a78bfa"},
            {"name": "Saúde", "type": "expense", "color": "#f43f5e"},
            {"name": "Lazer", "type": "expense", "color": "#fcd34d"},
            {"name": "Salário", "type": "income", "color": "#34d399"},
        ]
        for cat in defaults:
            db_cat = models.Category(**cat)
            db.add(db_cat)
        db.commit()
    
    db.close()


@app.post("/api/auth/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not crud.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/users/me", response_model=schemas.UserOut)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@app.get("/api/categories", response_model=list[schemas.CategoryOut])
def read_categories(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.get_categories(db)

@app.post("/api/categories", response_model=schemas.CategoryOut)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.create_category(db, category)

@app.post("/api/transactions", response_model=schemas.TransactionOut)
def create_transaction(transaction: schemas.TransactionCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.create_transaction(db, transaction, current_user.id)

@app.get("/api/transactions", response_model=list[schemas.TransactionOut])
def read_transactions(month: int, year: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.get_transactions(db, month, year)

@app.get("/api/dashboard", response_model=dict)
def read_dashboard(month: int, year: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    transactions = crud.get_transactions(db, month, year)
    income = sum(t.amount for t in transactions if t.type == "income")
    expense = sum(t.amount for t in transactions if t.type == "expense")
    balance = income - expense
    
    return {
        "income": income,
        "expense": expense,
        "balance": balance,
        "transactions": [schemas.TransactionOut.model_validate(t).model_dump() for t in transactions[:5]] # Recent 5 of this month
    }
