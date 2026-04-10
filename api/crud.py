import uuid
from sqlalchemy.orm import Session, joinedload
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

# Categories
def get_categories(db: Session):
    return db.query(models.Category).all()

def create_category(db: Session, category: schemas.CategoryCreate):
    db_category = models.Category(**category.model_dump())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

def update_category(db: Session, category_id: int, category: schemas.CategoryUpdate):
    db_category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not db_category:
        return None
    for key, value in category.model_dump(exclude_unset=True).items():
        setattr(db_category, key, value)
    db.commit()
    db.refresh(db_category)
    return db_category

def delete_category(db: Session, category_id: int):
    db_category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not db_category:
        return False
    db.delete(db_category)
    db.commit()
    return True

# Accounts
def get_accounts(db: Session):
    return db.query(models.Account).all()

def create_account(db: Session, account: schemas.AccountCreate):
    db_account = models.Account(**account.model_dump())
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account

def update_account(db: Session, account_id: int, account: schemas.AccountUpdate):
    db_account = db.query(models.Account).filter(models.Account.id == account_id).first()
    if not db_account:
        return None
    for key, value in account.model_dump(exclude_unset=True).items():
        setattr(db_account, key, value)
    db.commit()
    db.refresh(db_account)
    return db_account

def delete_account(db: Session, account_id: int):
    db_account = db.query(models.Account).filter(models.Account.id == account_id).first()
    if not db_account:
        return False
    db.delete(db_account)
    db.commit()
    return True

# Payment Methods
def get_payment_methods(db: Session):
    return db.query(models.PaymentMethod).all()

def create_payment_method(db: Session, method: schemas.PaymentMethodCreate):
    db_method = models.PaymentMethod(**method.model_dump())
    db.add(db_method)
    db.commit()
    db.refresh(db_method)
    return db_method

def update_payment_method(db: Session, method_id: int, method: schemas.PaymentMethodUpdate):
    db_method = db.query(models.PaymentMethod).filter(models.PaymentMethod.id == method_id).first()
    if not db_method:
        return None
    for key, value in method.model_dump(exclude_unset=True).items():
        setattr(db_method, key, value)
    db.commit()
    db.refresh(db_method)
    return db_method

def delete_payment_method(db: Session, method_id: int):
    db_method = db.query(models.PaymentMethod).filter(models.PaymentMethod.id == method_id).first()
    if not db_method:
        return False
    db.delete(db_method)
    db.commit()
    return True

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

def get_transactions(db: Session, month: int, year: int, category_id: int = None, payer: str = None, account_id: int = None, payment_method_id: int = None):
    # Basic filtering by month/year
    start_date = date(year, month, 1)
    end_date = start_date + relativedelta(months=1, days=-1)
    
    query = db.query(models.Transaction).options(
        joinedload(models.Transaction.category),
        joinedload(models.Transaction.account),
        joinedload(models.Transaction.payment_method)
    ).filter(
        models.Transaction.date >= start_date,
        models.Transaction.date <= end_date
    )
    
    if category_id:
        query = query.filter(models.Transaction.category_id == category_id)
    if payer:
        query = query.filter(models.Transaction.payer == payer)
    if account_id:
        query = query.filter(models.Transaction.account_id == account_id)
    if payment_method_id:
        query = query.filter(models.Transaction.payment_method_id == payment_method_id)
        
    return query.order_by(models.Transaction.date.desc()).all()

def get_recent_transactions(db: Session, limit=10):
    return db.query(models.Transaction).options(
        joinedload(models.Transaction.category),
        joinedload(models.Transaction.account),
        joinedload(models.Transaction.payment_method)
    ).order_by(models.Transaction.date.desc()).limit(limit).all()

def update_transaction(db: Session, transaction_id: int, transaction: schemas.TransactionUpdate):
    db_transaction = db.query(models.Transaction).options(
        joinedload(models.Transaction.category),
        joinedload(models.Transaction.account),
        joinedload(models.Transaction.payment_method)
    ).filter(models.Transaction.id == transaction_id).first()
    
    if not db_transaction:
        return None
    for key, value in transaction.model_dump(exclude_unset=True).items():
        setattr(db_transaction, key, value)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

def delete_transaction(db: Session, transaction_id: int):
    db_transaction = db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()
    if not db_transaction:
        return False
    db.delete(db_transaction)
    db.commit()
    return True
