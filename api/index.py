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
    
    # Initialize default accounts
    if not db.query(models.Account).first():
        db.add(models.Account(name="Carteira André", color="#4ade80"))
        db.add(models.Account(name="Nubank Sofia", color="#a855f7"))
        db.add(models.Account(name="Itaú Casal", color="#f97316"))
        db.commit()

    # Initialize default payment methods
    if not db.query(models.PaymentMethod).first():
        for m in ["Pix", "Crédito", "Débito", "Dinheiro"]:
            db.add(models.PaymentMethod(name=m))
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

@app.put("/api/categories/{category_id}", response_model=schemas.CategoryOut)
def update_category(category_id: int, category: schemas.CategoryUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_category = crud.update_category(db, category_id, category)
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")
    return db_category

@app.delete("/api/categories/{category_id}")
def delete_category(category_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")
        
    if db_category.name == "Geral":
        raise HTTPException(status_code=400, detail="Cannot delete the 'Geral' category")

    # Check if category is used
    transactions_count = db.query(models.Transaction).filter(models.Transaction.category_id == category_id).count()
    if transactions_count > 0:
        # Reassign to "Geral"
        general_cat = db.query(models.Category).filter(models.Category.name == "Geral", models.Category.type == db_category.type).first()
        if not general_cat:
            general_cat = models.Category(name="Geral", type=db_category.type, color="#cccccc")
            db.add(general_cat)
            db.commit()
            db.refresh(general_cat)
        
        db.query(models.Transaction).filter(models.Transaction.category_id == category_id).update({"category_id": general_cat.id})
        db.commit()

    if not crud.delete_category(db, category_id):
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted and transactions moved to General"}

# Account Routes
@app.get("/api/accounts", response_model=list[schemas.AccountOut])
def read_accounts(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.get_accounts(db)

@app.post("/api/accounts", response_model=schemas.AccountOut)
def create_account(account: schemas.AccountCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.create_account(db, account)

@app.put("/api/accounts/{account_id}", response_model=schemas.AccountOut)
def update_account(account_id: int, account: schemas.AccountUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_account = crud.update_account(db, account_id, account)
    if not db_account: raise HTTPException(status_code=404, detail="Account not found")
    return db_account

@app.delete("/api/accounts/{account_id}")
def delete_account(account_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not crud.delete_account(db, account_id): raise HTTPException(status_code=404, detail="Account not found")
    return {"message": "Account deleted"}

# Payment Method Routes
@app.get("/api/payment-methods", response_model=list[schemas.PaymentMethodOut])
def read_payment_methods(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.get_payment_methods(db)

@app.post("/api/payment-methods", response_model=schemas.PaymentMethodOut)
def create_payment_method(method: schemas.PaymentMethodCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.create_payment_method(db, method)

@app.put("/api/payment-methods/{method_id}", response_model=schemas.PaymentMethodOut)
def update_payment_method(method_id: int, method: schemas.PaymentMethodUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_method = crud.update_payment_method(db, method_id, method)
    if not db_method: raise HTTPException(status_code=404, detail="Method not found")
    return db_method

@app.delete("/api/payment-methods/{method_id}")
def delete_payment_method(method_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not crud.delete_payment_method(db, method_id): raise HTTPException(status_code=404, detail="Method not found")
    return {"message": "Payment method deleted"}

@app.post("/api/transactions", response_model=schemas.TransactionOut)
def create_transaction(transaction: schemas.TransactionCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.create_transaction(db, transaction, current_user.id)

@app.get("/api/transactions", response_model=list[schemas.TransactionOut])
def read_transactions(month: int, year: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.get_transactions(db, month, year)

@app.put("/api/transactions/{transaction_id}", response_model=schemas.TransactionOut)
def update_transaction(transaction_id: int, transaction: schemas.TransactionUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_transaction = crud.update_transaction(db, transaction_id, transaction)
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return db_transaction

@app.delete("/api/transactions/{transaction_id}")
def delete_transaction(transaction_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not crud.delete_transaction(db, transaction_id):
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"message": "Transaction deleted"}

@app.get("/api/dashboard", response_model=dict)
def read_dashboard(month: int, year: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    transactions = crud.get_transactions(db, month, year)
    income = sum(t.amount for t in transactions if t.type == "income")
    expense = sum(t.amount for t in transactions if t.type == "expense")
    balance = income - expense
    
    # Category Distribution for Expenses
    cat_distribution = {}
    for t in transactions:
        if t.type == "expense" and t.category:
            cat_name = t.category.name
            if cat_name not in cat_distribution:
                cat_distribution[cat_name] = {"name": cat_name, "value": 0, "color": t.category.color}
            cat_distribution[cat_name]["value"] += t.amount
            
    # Payer Distribution for Expenses
    payer_distribution = {}
    for t in transactions:
        if t.type == "expense":
            payer = t.payer
            if payer not in payer_distribution:
                payer_distribution[payer] = {"name": payer, "value": 0}
            payer_distribution[payer]["value"] += t.amount

    return {
        "income": income,
        "expense": expense,
        "balance": balance,
        "category_data": list(cat_distribution.values()),
        "payer_data": list(payer_distribution.values()),
        "transactions": [schemas.TransactionOut.model_validate(t).model_dump() for t in transactions[:5]]
    }
