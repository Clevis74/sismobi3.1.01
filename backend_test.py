#!/usr/bin/env python3
"""
SISMOBI Backend API Test Suite

SYSTEM ARCHITECTURE:
- Backend: FastAPI with MongoDB integration
- Authentication: JWT-based with Bearer tokens
- Database: MongoDB with Motor async driver
- API Version: 3.2.0

APPLICATION CONTEXT:
This is a property management system for rental properties ("SISMOBI - Sistema de Gestão Imobiliária").

ENDPOINTS TO TEST:
1. Health Check: GET /api/health
2. Authentication:
   - POST /api/v1/auth/register
   - POST /api/v1/auth/login
   - GET /api/v1/auth/me
   - GET /api/v1/auth/verify
3. Properties CRUD:
   - GET /api/v1/properties/
   - POST /api/v1/properties/
   - GET /api/v1/properties/{id}
   - PUT /api/v1/properties/{id}
   - DELETE /api/v1/properties/{id}
4. Tenants CRUD:
   - GET /api/v1/tenants/
   - POST /api/v1/tenants/
   - GET /api/v1/tenants/{id}
   - PUT /api/v1/tenants/{id}
   - DELETE /api/v1/tenants/{id}
5. Dashboard:
   - GET /api/v1/dashboard/summary
6. Transactions CRUD:
   - GET /api/v1/transactions/
   - POST /api/v1/transactions/
   - GET /api/v1/transactions/{id}
   - PUT /api/v1/transactions/{id}
   - DELETE /api/v1/transactions/{id}
7. Alerts CRUD:
   - GET /api/v1/alerts/
   - POST /api/v1/alerts/
   - GET /api/v1/alerts/{id}
   - PUT /api/v1/alerts/{id}
   - PUT /api/v1/alerts/{id}/resolve
   - DELETE /api/v1/alerts/{id}
"""

import sys
import json
import requests
from datetime import datetime
from typing import Dict, Any, Optional

class SISMOBIBackendTester:
    def __init__(self, base_url: str = "https://a56b342c-49e4-445e-ad89-b74bcc3c3aff.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.access_token = None
        self.test_user_email = "admin@sismobi.com"
        self.test_user_password = "admin123456"
        self.test_user_name = "SISMOBI Administrator"
        self.created_property_id = None
        self.created_tenant_id = None
        self.created_transaction_id = None
        self.created_alert_id = None

    def run_test(self, name: str, test_func):
        """Run a single test"""
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            result = test_func()
            if result:
                self.tests_passed += 1
                print(f"✅ Passed")
            else:
                print(f"❌ Failed")
            return result
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False

    def make_request(self, method: str, endpoint: str, data: Dict[str, Any] = None, 
                    headers: Dict[str, str] = None, params: Dict[str, Any] = None) -> requests.Response:
        """Make HTTP request to API"""
        url = f"{self.base_url}{endpoint}"
        
        if headers is None:
            headers = {"Content-Type": "application/json"}
        
        if self.access_token and "Authorization" not in headers:
            headers["Authorization"] = f"Bearer {self.access_token}"
        
        if method.upper() == "GET":
            return requests.get(url, headers=headers, params=params)
        elif method.upper() == "POST":
            if endpoint == "/api/v1/auth/login":
                # Login endpoint expects form data
                return requests.post(url, data=data, headers={"Content-Type": "application/x-www-form-urlencoded"})
            else:
                return requests.post(url, json=data, headers=headers)
        elif method.upper() == "PUT":
            return requests.put(url, json=data, headers=headers)
        elif method.upper() == "DELETE":
            return requests.delete(url, headers=headers)
        else:
            raise ValueError(f"Unsupported HTTP method: {method}")

    def test_health_check(self) -> bool:
        """Test health check endpoint"""
        try:
            response = self.make_request("GET", "/api/health")
            print(f"  - Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"  - Status: {data.get('status')}")
                print(f"  - Database Status: {data.get('database_status')}")
                print(f"  - Version: {data.get('version')}")
                return data.get('status') == 'healthy'
            else:
                print(f"  - Error: {response.text}")
                return False
        except Exception as e:
            print(f"  - Exception: {str(e)}")
            return False

    def test_user_registration(self) -> bool:
        """Test user registration"""
        try:
            user_data = {
                "email": self.test_user_email,
                "password": self.test_user_password,
                "full_name": self.test_user_name
            }
            
            response = self.make_request("POST", "/api/v1/auth/register", data=user_data)
            print(f"  - Status Code: {response.status_code}")
            
            if response.status_code in [200, 400]:  # 400 might be "already exists"
                data = response.json()
                print(f"  - Message: {data.get('message')}")
                return True
            else:
                print(f"  - Error: {response.text}")
                return False
        except Exception as e:
            print(f"  - Exception: {str(e)}")
            return False

    def test_user_login(self) -> bool:
        """Test user login and get access token"""
        try:
            login_data = {
                "username": self.test_user_email,
                "password": self.test_user_password
            }
            
            response = self.make_request("POST", "/api/v1/auth/login", data=login_data)
            print(f"  - Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get('access_token')
                print(f"  - Token Type: {data.get('token_type')}")
                print(f"  - Access Token: {'*' * 20}...")
                return self.access_token is not None
            else:
                print(f"  - Error: {response.text}")
                return False
        except Exception as e:
            print(f"  - Exception: {str(e)}")
            return False

    def test_get_current_user(self) -> bool:
        """Test getting current user info"""
        try:
            response = self.make_request("GET", "/api/v1/auth/me")
            print(f"  - Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"  - User Email: {data.get('email')}")
                print(f"  - Full Name: {data.get('full_name')}")
                print(f"  - Is Active: {data.get('is_active')}")
                return data.get('email') == self.test_user_email
            else:
                print(f"  - Error: {response.text}")
                return False
        except Exception as e:
            print(f"  - Exception: {str(e)}")
            return False

    def test_token_verification(self) -> bool:
        """Test token verification"""
        try:
            response = self.make_request("GET", "/api/v1/auth/verify")
            print(f"  - Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"  - Message: {data.get('message')}")
                return data.get('status') == 'success'
            else:
                print(f"  - Error: {response.text}")
                return False
        except Exception as e:
            print(f"  - Exception: {str(e)}")
            return False

    def test_create_property(self) -> bool:
        """Test creating a property"""
        try:
            property_data = {
                "name": "Casa de Teste",
                "address": "Rua das Flores, 123 - São Paulo, SP",
                "type": "Casa",
                "size": 120.5,
                "rooms": 3,
                "rent_value": 2500.00,
                "expenses": 300.00,
                "status": "vacant",
                "description": "Casa para teste de API"
            }
            
            response = self.make_request("POST", "/api/v1/properties/", data=property_data)
            print(f"  - Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                self.created_property_id = data.get('id')
                print(f"  - Property ID: {self.created_property_id}")
                print(f"  - Property Name: {data.get('name')}")
                print(f"  - Rent Value: R$ {data.get('rent_value')}")
                return self.created_property_id is not None
            else:
                print(f"  - Error: {response.text}")
                return False
        except Exception as e:
            print(f"  - Exception: {str(e)}")
            return False

    def test_get_properties(self) -> bool:
        """Test getting properties list"""
        try:
            response = self.make_request("GET", "/api/v1/properties/")
            print(f"  - Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                items = data.get('items', [])
                pagination = data.get('pagination', {})
                print(f"  - Total Properties: {pagination.get('total_count', 0)}")
                print(f"  - Current Page: {pagination.get('current_page', 1)}")
                print(f"  - Items in Response: {len(items)}")
                return True
            else:
                print(f"  - Error: {response.text}")
                return False
        except Exception as e:
            print(f"  - Exception: {str(e)}")
            return False

    def test_get_property_by_id(self) -> bool:
        """Test getting specific property by ID"""
        if not self.created_property_id:
            print("  - No property ID available for testing")
            return False
            
        try:
            response = self.make_request("GET", f"/api/v1/properties/{self.created_property_id}")
            print(f"  - Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"  - Property Name: {data.get('name')}")
                print(f"  - Property Address: {data.get('address')}")
                print(f"  - Property Status: {data.get('status')}")
                return data.get('id') == self.created_property_id
            else:
                print(f"  - Error: {response.text}")
                return False
        except Exception as e:
            print(f"  - Exception: {str(e)}")
            return False

    def test_create_tenant(self) -> bool:
        """Test creating a tenant"""
        try:
            tenant_data = {
                "name": "João Silva",
                "email": "joao.silva@email.com",
                "phone": "(11) 99999-9999",
                "document": "123.456.789-00",
                "property_id": self.created_property_id,
                "rent_value": 2500.00,
                "rent_due_date": 5,
                "status": "active",
                "notes": "Inquilino teste para API"
            }
            
            response = self.make_request("POST", "/api/v1/tenants/", data=tenant_data)
            print(f"  - Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                self.created_tenant_id = data.get('id')
                print(f"  - Tenant ID: {self.created_tenant_id}")
                print(f"  - Tenant Name: {data.get('name')}")
                print(f"  - Tenant Email: {data.get('email')}")
                return self.created_tenant_id is not None
            else:
                print(f"  - Error: {response.text}")
                return False
        except Exception as e:
            print(f"  - Exception: {str(e)}")
            return False

    def test_get_tenants(self) -> bool:
        """Test getting tenants list"""
        try:
            response = self.make_request("GET", "/api/v1/tenants/")
            print(f"  - Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                items = data.get('items', [])
                pagination = data.get('pagination', {})
                print(f"  - Total Tenants: {pagination.get('total_count', 0)}")
                print(f"  - Current Page: {pagination.get('current_page', 1)}")
                print(f"  - Items in Response: {len(items)}")
                return True
            else:
                print(f"  - Error: {response.text}")
                return False
        except Exception as e:
            print(f"  - Exception: {str(e)}")
            return False

    def test_dashboard_summary(self) -> bool:
        """Test dashboard summary endpoint"""
        try:
            response = self.make_request("GET", "/api/v1/dashboard/summary")
            print(f"  - Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"  - Total Properties: {data.get('total_properties', 0)}")
                print(f"  - Total Tenants: {data.get('total_tenants', 0)}")
                print(f"  - Occupied Properties: {data.get('occupied_properties', 0)}")
                print(f"  - Vacant Properties: {data.get('vacant_properties', 0)}")
                print(f"  - Monthly Income: R$ {data.get('total_monthly_income', 0)}")
                print(f"  - Monthly Expenses: R$ {data.get('total_monthly_expenses', 0)}")
                print(f"  - Pending Alerts: {data.get('pending_alerts', 0)}")
                return True
            else:
                print(f"  - Error: {response.text}")
                return False
        except Exception as e:
            print(f"  - Exception: {str(e)}")
            return False

    def test_create_transaction(self) -> bool:
        """Test creating a transaction"""
        if not self.created_property_id:
            print("  - No property ID available for transaction testing")
            return False
            
        try:
            transaction_data = {
                "property_id": self.created_property_id,
                "tenant_id": self.created_tenant_id,
                "description": "Pagamento de aluguel - Janeiro 2025",
                "amount": 2500.00,
                "type": "income",
                "category": "Aluguel",
                "date": "2025-01-15T10:00:00",
                "recurring": True,
                "recurring_day": 5,
                "notes": "Transação de teste para API"
            }
            
            response = self.make_request("POST", "/api/v1/transactions/", data=transaction_data)
            print(f"  - Status Code: {response.status_code}")
            
            if response.status_code == 201:
                data = response.json()
                self.created_transaction_id = data.get('id')
                print(f"  - Transaction ID: {self.created_transaction_id}")
                print(f"  - Description: {data.get('description')}")
                print(f"  - Amount: R$ {data.get('amount')}")
                print(f"  - Type: {data.get('type')}")
                return self.created_transaction_id is not None
            else:
                print(f"  - Error: {response.text}")
                return False
        except Exception as e:
            print(f"  - Exception: {str(e)}")
            return False

    def test_get_transactions(self) -> bool:
        """Test getting transactions list"""
        try:
            response = self.make_request("GET", "/api/v1/transactions/")
            print(f"  - Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                items = data.get('items', [])
                total = data.get('total', 0)
                print(f"  - Total Transactions: {total}")
                print(f"  - Items in Response: {len(items)}")
                print(f"  - Has More: {data.get('has_more', False)}")
                return True
            else:
                print(f"  - Error: {response.text}")
                return False
        except Exception as e:
            print(f"  - Exception: {str(e)}")
            return False

    def test_get_transaction_by_id(self) -> bool:
        """Test getting specific transaction by ID"""
        if not self.created_transaction_id:
            print("  - No transaction ID available for testing")
            return False
            
        try:
            response = self.make_request("GET", f"/api/v1/transactions/{self.created_transaction_id}")
            print(f"  - Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"  - Transaction Description: {data.get('description')}")
                print(f"  - Transaction Amount: R$ {data.get('amount')}")
                print(f"  - Transaction Type: {data.get('type')}")
                return data.get('id') == self.created_transaction_id
            else:
                print(f"  - Error: {response.text}")
                return False
        except Exception as e:
            print(f"  - Exception: {str(e)}")
            return False

    def test_update_transaction(self) -> bool:
        """Test updating a transaction"""
        if not self.created_transaction_id:
            print("  - No transaction ID available for testing")
            return False
            
        try:
            update_data = {
                "description": "Pagamento de aluguel - Janeiro 2025 (Atualizado)",
                "amount": 2600.00,
                "notes": "Transação atualizada via API"
            }
            
            response = self.make_request("PUT", f"/api/v1/transactions/{self.created_transaction_id}", data=update_data)
            print(f"  - Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"  - Updated Description: {data.get('description')}")
                print(f"  - Updated Amount: R$ {data.get('amount')}")
                print(f"  - Updated Notes: {data.get('notes')}")
                return data.get('amount') == 2600.00
            else:
                print(f"  - Error: {response.text}")
                return False
        except Exception as e:
            print(f"  - Exception: {str(e)}")
            return False

    def test_create_alert(self) -> bool:
        """Test creating an alert"""
        if not self.created_property_id:
            print("  - No property ID available for alert testing")
            return False
            
        try:
            alert_data = {
                "property_id": self.created_property_id,
                "tenant_id": self.created_tenant_id,
                "title": "Aluguel em Atraso",
                "message": "O aluguel do mês de Janeiro está em atraso há 5 dias",
                "type": "payment_overdue",
                "priority": "high",
                "resolved": False,
                "due_date": "2025-01-20T23:59:59"
            }
            
            response = self.make_request("POST", "/api/v1/alerts/", data=alert_data)
            print(f"  - Status Code: {response.status_code}")
            
            if response.status_code == 201:
                data = response.json()
                self.created_alert_id = data.get('id')
                print(f"  - Alert ID: {self.created_alert_id}")
                print(f"  - Alert Title: {data.get('title')}")
                print(f"  - Alert Priority: {data.get('priority')}")
                print(f"  - Alert Type: {data.get('type')}")
                return self.created_alert_id is not None
            else:
                print(f"  - Error: {response.text}")
                return False
        except Exception as e:
            print(f"  - Exception: {str(e)}")
            return False

    def test_get_alerts(self) -> bool:
        """Test getting alerts list"""
        try:
            response = self.make_request("GET", "/api/v1/alerts/")
            print(f"  - Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                items = data.get('items', [])
                total = data.get('total', 0)
                print(f"  - Total Alerts: {total}")
                print(f"  - Items in Response: {len(items)}")
                print(f"  - Has More: {data.get('has_more', False)}")
                return True
            else:
                print(f"  - Error: {response.text}")
                return False
        except Exception as e:
            print(f"  - Exception: {str(e)}")
            return False

    def test_get_alert_by_id(self) -> bool:
        """Test getting specific alert by ID"""
        if not self.created_alert_id:
            print("  - No alert ID available for testing")
            return False
            
        try:
            response = self.make_request("GET", f"/api/v1/alerts/{self.created_alert_id}")
            print(f"  - Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"  - Alert Title: {data.get('title')}")
                print(f"  - Alert Message: {data.get('message')}")
                print(f"  - Alert Priority: {data.get('priority')}")
                print(f"  - Alert Resolved: {data.get('resolved')}")
                return data.get('id') == self.created_alert_id
            else:
                print(f"  - Error: {response.text}")
                return False
        except Exception as e:
            print(f"  - Exception: {str(e)}")
            return False

    def test_update_alert(self) -> bool:
        """Test updating an alert"""
        if not self.created_alert_id:
            print("  - No alert ID available for testing")
            return False
            
        try:
            update_data = {
                "title": "Aluguel em Atraso - Crítico",
                "priority": "critical",
                "message": "O aluguel do mês de Janeiro está em atraso há 10 dias - situação crítica"
            }
            
            response = self.make_request("PUT", f"/api/v1/alerts/{self.created_alert_id}", data=update_data)
            print(f"  - Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"  - Updated Title: {data.get('title')}")
                print(f"  - Updated Priority: {data.get('priority')}")
                print(f"  - Updated Message: {data.get('message')}")
                return data.get('priority') == 'critical'
            else:
                print(f"  - Error: {response.text}")
                return False
        except Exception as e:
            print(f"  - Exception: {str(e)}")
            return False

    def test_resolve_alert(self) -> bool:
        """Test resolving an alert using the convenience endpoint"""
        if not self.created_alert_id:
            print("  - No alert ID available for testing")
            return False
            
        try:
            response = self.make_request("PUT", f"/api/v1/alerts/{self.created_alert_id}/resolve")
            print(f"  - Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"  - Alert Resolved: {data.get('resolved')}")
                print(f"  - Resolved At: {data.get('resolved_at')}")
                return data.get('resolved') == True
            else:
                print(f"  - Error: {response.text}")
                return False
        except Exception as e:
            print(f"  - Exception: {str(e)}")
            return False

    def test_transactions_filtering(self) -> bool:
        """Test transactions filtering by property and type"""
        if not self.created_property_id:
            print("  - No property ID available for filtering test")
            return False
            
        try:
            # Test filtering by property_id
            params = {"property_id": self.created_property_id}
            response = self.make_request("GET", "/api/v1/transactions/", params=params)
            print(f"  - Property Filter Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"  - Filtered Transactions: {len(data.get('items', []))}")
                
                # Test filtering by type
                params = {"type": "income"}
                response = self.make_request("GET", "/api/v1/transactions/", params=params)
                print(f"  - Type Filter Status Code: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"  - Income Transactions: {len(data.get('items', []))}")
                    return True
                else:
                    print(f"  - Type Filter Error: {response.text}")
                    return False
            else:
                print(f"  - Property Filter Error: {response.text}")
                return False
        except Exception as e:
            print(f"  - Exception: {str(e)}")
            return False

    def test_alerts_filtering(self) -> bool:
        """Test alerts filtering by priority and resolved status"""
        try:
            # Test filtering by priority
            params = {"priority": "high"}
            response = self.make_request("GET", "/api/v1/alerts/", params=params)
            print(f"  - Priority Filter Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"  - High Priority Alerts: {len(data.get('items', []))}")
                
                # Test filtering by resolved status
                params = {"resolved": "false"}
                response = self.make_request("GET", "/api/v1/alerts/", params=params)
                print(f"  - Resolved Filter Status Code: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"  - Unresolved Alerts: {len(data.get('items', []))}")
                    return True
                else:
                    print(f"  - Resolved Filter Error: {response.text}")
                    return False
            else:
                print(f"  - Priority Filter Error: {response.text}")
                return False
        except Exception as e:
            print(f"  - Exception: {str(e)}")
            return False

    def cleanup_test_data(self) -> bool:
        """Clean up test data"""
        success = True
        
        # Delete test transaction
        if self.created_transaction_id:
            try:
                response = self.make_request("DELETE", f"/api/v1/transactions/{self.created_transaction_id}")
                print(f"  - Transaction deletion status: {response.status_code}")
            except Exception as e:
                print(f"  - Error deleting transaction: {str(e)}")
                success = False
        
        # Delete test alert
        if self.created_alert_id:
            try:
                response = self.make_request("DELETE", f"/api/v1/alerts/{self.created_alert_id}")
                print(f"  - Alert deletion status: {response.status_code}")
            except Exception as e:
                print(f"  - Error deleting alert: {str(e)}")
                success = False
        
        # Delete test tenant
        if self.created_tenant_id:
            try:
                response = self.make_request("DELETE", f"/api/v1/tenants/{self.created_tenant_id}")
                print(f"  - Tenant deletion status: {response.status_code}")
            except Exception as e:
                print(f"  - Error deleting tenant: {str(e)}")
                success = False
        
        # Delete test property
        if self.created_property_id:
            try:
                response = self.make_request("DELETE", f"/api/v1/properties/{self.created_property_id}")
                print(f"  - Property deletion status: {response.status_code}")
            except Exception as e:
                print(f"  - Error deleting property: {str(e)}")
                success = False
        
        return success

def main():
    print("=== SISMOBI BACKEND API TEST SUITE ===")
    print(f"Test run at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("Application: SISMOBI - Sistema de Gestão Imobiliária")
    print("Backend URL: https://a56b342c-49e4-445e-ad89-b74bcc3c3aff.preview.emergentagent.com")
    
    tester = SISMOBIBackendTester()
    
    # Run comprehensive backend tests
    tester.run_test("Health Check", tester.test_health_check)
    tester.run_test("User Registration", tester.test_user_registration)
    tester.run_test("User Login", tester.test_user_login)
    tester.run_test("Get Current User", tester.test_get_current_user)
    tester.run_test("Token Verification", tester.test_token_verification)
    tester.run_test("Create Property", tester.test_create_property)
    tester.run_test("Get Properties List", tester.test_get_properties)
    tester.run_test("Get Property by ID", tester.test_get_property_by_id)
    tester.run_test("Create Tenant", tester.test_create_tenant)
    tester.run_test("Get Tenants List", tester.test_get_tenants)
    
    # NEW TRANSACTION TESTS
    tester.run_test("Create Transaction", tester.test_create_transaction)
    tester.run_test("Get Transactions List", tester.test_get_transactions)
    tester.run_test("Get Transaction by ID", tester.test_get_transaction_by_id)
    tester.run_test("Update Transaction", tester.test_update_transaction)
    tester.run_test("Transactions Filtering", tester.test_transactions_filtering)
    
    # NEW ALERT TESTS
    tester.run_test("Create Alert", tester.test_create_alert)
    tester.run_test("Get Alerts List", tester.test_get_alerts)
    tester.run_test("Get Alert by ID", tester.test_get_alert_by_id)
    tester.run_test("Update Alert", tester.test_update_alert)
    tester.run_test("Resolve Alert", tester.test_resolve_alert)
    tester.run_test("Alerts Filtering", tester.test_alerts_filtering)
    
    tester.run_test("Dashboard Summary", tester.test_dashboard_summary)
    tester.run_test("Cleanup Test Data", tester.cleanup_test_data)
    
    # Print results
    print(f"\n📊 Backend API Test Summary:")
    print(f"✅ Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"🔧 Backend Version: 3.2.0")
    print(f"🎯 FastAPI with MongoDB integration")
    
    if tester.tests_passed == tester.tests_run:
        print(f"\n🎉 ALL BACKEND TESTS PASSED!")
        print(f"✨ Backend APIs are working correctly")
    else:
        print(f"\n⚠️  Some tests failed - Backend needs attention")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())