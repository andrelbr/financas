import uuid
from sqlalchemy.orm import Session
from dateutil.relativedelta import relativedelta
from passlib.context import CryptContext
from . import models, schemas
from datetime import date

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_categories(db: Session):
    return db.query(models.Category).all()

def create_category(db: Session, category: schemas.CategoryCreate):
    db_category = models.Category(**category.model_dump())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

def create_transaction(db: Session, transaction: schemas.TransactionCreate, user_id: int):
    base_data = transaction.model_dump(exclude={"is_installment", "total_installments", "is_recurring", "recurring_months"})
    base_data["user_id"] = user_id
    
    if transaction.is_installment:
        group_id = str(uuid.uuid4())
        total = transaction.total_installments or 1
        amount_per_installment = round(transaction.amount / total, 2)
        
        # fix rounding error on last item to ensure total amount is exact
        sum_installments = 0
        
        db_transactions = []
        for i in range(1, total + 1):
            cur_amount = amount_per_installment
            if i == total:
                cur_amount = transaction.amount - sum_installments
            sum_installments += cur_amount
            
            t_data = dict(base_data)
            t_data["amount"] = cur_amount
            # Increment month
            t_data["date"] = transaction.date + relativedelta(months=i-1)
            t_data["description"] = f"{transaction.description} ({i}/{total})"
            t_data["is_installment"] = True
            t_data["installment_group_id"] = group_id
            t_data["installment_number"] = i
            t_data["total_installments"] = total
            
            db_t = models.Transaction(**t_data)
            db.add(db_t)
            db_transactions.append(db_t)
            
        db.commit()
        for t in db_transactions: db.refresh(t)
        return db_transactions[0] # Return the first one
        
    elif transaction.is_recurring:
        group_id = str(uuid.uuid4())
        months = transaction.recurring_months or 12
        
        db_transactions = []
        for i in range(months):
            t_data = dict(base_data)
            t_data["date"] = transaction.date + relativedelta(months=i)
            t_data["is_recurring"] = True
            t_data["recurring_group_id"] = group_id
            
            db_t = models.Transaction(**t_data)
            db.add(db_t)
            db_transactions.append(db_t)
            
        db.commit()
        for t in db_transactions: db.refresh(t)
        return db_transactions[0]
    else:
        db_t = models.Transaction(**base_data)
        db.add(db_t)
        db.commit()
        db.refresh(db_t)
        return db_t

def get_transactions(db: Session, month: int, year: int):
    # Basic filtering by month/year
    start_date = date(year, month, 1)
    end_date = start_date + relativedelta(months=1, days=-1)
    
    return db.query(models.Transaction).filter(
        models.Transaction.date >= start_date,
        models.Transaction.date <= end_date
    ).order_by(models.Transaction.date.desc()).all()

def get_recent_transactions(db: Session, limit=10):
    return db.query(models.Transaction).order_by(models.Transaction.date.desc()).limit(limit).all()
