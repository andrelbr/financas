from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date

class UserBase(BaseModel):
    name: str
    email: EmailStr

class UserOut(UserBase):
    id: int
    class Config:
        from_attributes = True

class CategoryBase(BaseModel):
    name: str
    type: str
    color: str

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    color: Optional[str] = None

class CategoryOut(CategoryBase):
    id: int
    class Config:
        from_attributes = True

class TransactionBase(BaseModel):
    description: str
    amount: float
    type: str # 'income', 'expense'
    date: date
    payer: str
    category_id: int

class TransactionCreate(TransactionBase):
    is_installment: bool = False
    total_installments: Optional[int] = None
    is_recurring: bool = False
    recurring_months: Optional[int] = 12 # How many upcoming months to create

class TransactionUpdate(BaseModel):
    description: Optional[str] = None
    amount: Optional[float] = None
    type: Optional[str] = None
    date: Optional[date] = None
    payer: Optional[str] = None
    category_id: Optional[int] = None

class TransactionOut(TransactionBase):
    id: int
    user_id: int
    category: Optional[CategoryOut]
    is_installment: bool
    installment_group_id: Optional[str]
    installment_number: Optional[int]
    total_installments: Optional[int]
    is_recurring: bool
    recurring_group_id: Optional[str]

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
