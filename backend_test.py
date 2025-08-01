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
    def __init__(self, base_url: str = "http://localhost:8001"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.access_token = None
        self.test_user_email = "admin@sismobi.com"
        self.test_user_password = "admin123456"
        self.test_user_name = "SISMOBI Administrator"
        self.created_property_id = None
        self.created_tenant_id = None

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

    def cleanup_test_data(self) -> bool:
        """Clean up test data"""
        success = True
        
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
    print("Backend URL: http://localhost:8001")
    
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