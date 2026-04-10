from sqlalchemy import Column, Integer, String, Float, Boolean, Date, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    type = Column(String) # 'income', 'expense'
    color = Column(String, default="#cccccc")

class Account(Base):
    __tablename__ = "accounts"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    color = Column(String, default="#cccccc")

class PaymentMethod(Base):
    __tablename__ = "payment_methods"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    description = Column(String)
    amount = Column(Float)
    type = Column(String) # 'income', 'expense'
    date = Column(Date)
    
    # André, Sofia, or Casal
    payer = Column(String, default="Casal")
    
    category_id = Column(Integer, ForeignKey("categories.id"))
    category = relationship("Category")
    
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)
    account = relationship("Account")
    
    payment_method_id = Column(Integer, ForeignKey("payment_methods.id"), nullable=True)
    payment_method = relationship("PaymentMethod")
    
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # For installments
    is_installment = Column(Boolean, default=False)
    installment_group_id = Column(String, nullable=True) # UUID to group them
    installment_number = Column(Integer, nullable=True)
    total_installments = Column(Integer, nullable=True)
    
    # For recurring
    is_recurring = Column(Boolean, default=False)
    recurring_group_id = Column(String, nullable=True) # UUID to group them
