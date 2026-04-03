# SOAP (Simple Object Access Protocol)

## What is SOAP?

Imagine sending a very formal letter with strict formatting rules: specific envelope size, exact placement of sender/receiver addresses, certified stamps, and a standardized way to write the message inside. SOAP is like that – a highly structured protocol for exchanging information between computers.

SOAP is a **protocol** (a set of strict rules) for exchanging structured messages between applications over networks, primarily using XML format.

## How It Came to Be

**Timeline:**
- **1998**: Microsoft created SOAP 0.9 (originally "Simple Object Access Protocol")
- **1999**: SOAP 1.0 submitted to IETF
- **2000**: SOAP 1.1 became W3C Note (with IBM partnership)
- **2003**: SOAP 1.2 became W3C Recommendation
- **Peak Era**: Mid-2000s, dominated enterprise integration
- **Today**: Still used in legacy enterprise systems, financial services, healthcare

**The Problem It Solved:**

In the late 1990s:
- Companies had different systems that couldn't talk to each other
- **CORBA** and **DCOM** were platform-specific (only worked on certain systems)
- No standard way to call remote functions over HTTP
- Firewalls blocked most protocols except HTTP
- Need for formal contracts between services

SOAP promised: "Let's create a universal, platform-independent, firewall-friendly protocol with strict rules!"

## How SOAP Works

### The Anatomy of a SOAP Message

A SOAP message is like a formal business letter:

```xml
<?xml version="1.0"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
  
  <!-- Header: Metadata like authentication, routing -->
  <soap:Header>
    <auth:Authentication xmlns:auth="http://example.com/auth">
      <auth:Token>abc123xyz</auth:Token>
    </auth:Authentication>
  </soap:Header>
  
  <!-- Body: The actual message/request -->
  <soap:Body>
    <m:GetUserInfo xmlns:m="http://example.com/users">
      <m:UserId>12345</m:UserId>
    </m:GetUserInfo>
  </soap:Body>
  
</soap:Envelope>
```

### Key Components

1. **Envelope**: The wrapper (required)
2. **Header**: Metadata like authentication, transaction IDs (optional)
3. **Body**: The actual data/request (required)
4. **Fault**: Error information (appears in Body when errors occur)

### WSDL (Web Services Description Language)

SOAP services come with a contract called WSDL – think of it as a detailed instruction manual:

```xml
<!-- This describes the entire API -->
<definitions>
  <types>
    <!-- Data types: What fields exist, their types -->
  </types>
  
  <message>
    <!-- Messages: What can be sent/received -->
  </message>
  
  <portType>
    <!-- Operations: Available functions -->
  </portType>
  
  <binding>
    <!-- How to format the messages -->
  </binding>
  
  <service>
    <!-- Where to send requests -->
  </service>
</definitions>
```

## Real Example: Weather Service

### Request (SOAP Message)
```xml
POST /WeatherService HTTP/1.1
Host: weather.example.com
Content-Type: text/xml; charset=utf-8
Content-Length: 350
SOAPAction: "http://example.com/GetWeather"

<?xml version="1.0"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
  <soap:Body>
    <m:GetWeather xmlns:m="http://example.com/weather">
      <m:City>New York</m:City>
      <m:Date>2024-01-15</m:Date>
    </m:GetWeather>
  </soap:Body>
</soap:Envelope>
```

### Response
```xml
<?xml version="1.0"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
  <soap:Body>
    <m:GetWeatherResponse xmlns:m="http://example.com/weather">
      <m:Temperature>45</m:Temperature>
      <m:Unit>Fahrenheit</m:Unit>
      <m:Condition>Partly Cloudy</m:Condition>
    </m:GetWeatherResponse>
  </soap:Body>
</soap:Envelope>
```

## Pros and Cons

### ✅ Pros

1. **Strongly Typed with WSDL**: Complete contract/documentation
2. **Built-in Error Handling**: Standardized SOAP Fault mechanism
3. **Language/Platform Independent**: Works on any system
4. **Transport Protocol Agnostic**: Can use HTTP, SMTP, TCP, JMS
5. **Built-in Security**: WS-Security standard for encryption, signatures
6. **Transaction Support**: WS-AtomicTransaction for distributed transactions
7. **Reliable Messaging**: WS-ReliableMessaging ensures delivery
8. **Enterprise Features**: Routing, orchestration (WS-BPEL)
9. **Tool Support**: Auto-generate client code from WSDL

### ❌ Cons

1. **Verbose and Heavy**: XML is bulky (10x larger than JSON)
2. **Slow Performance**: Parsing XML is computationally expensive
3. **Complex**: Steep learning curve, many WS-* standards
4. **Tight Coupling**: Clients depend heavily on WSDL
5. **Limited Browser Support**: Not designed for client-side JavaScript
6. **Rigid**: Hard to make changes without breaking clients
7. **Overkill for Simple APIs**: Too complex for basic CRUD operations
8. **Declining Community**: Fewer modern resources and tools
9. **Poor Human Readability**: XML is hard to read/debug

## When to Use SOAP

### ✅ Great For:

- **Enterprise Integration**: Connecting legacy enterprise systems
- **Financial Services**: Banking, payment processing (high security needs)
- **Healthcare**: HIPAA-compliant medical record systems
- **Telecommunications**: Billing, provisioning systems
- **Government Systems**: Where formal contracts are required
- **B2B Integration**: When partners require SOAP
- **Distributed Transactions**: Multi-step operations that must succeed/fail together
- **High Security Requirements**: Defense, finance sectors

### ❌ Not Ideal For:

- **Mobile Apps**: Too heavy, slow parsing
- **Public APIs**: REST/GraphQL are more developer-friendly
- **Microservices**: Too much overhead (use REST or gRPC)
- **Real-time Applications**: WebSockets are better
- **Modern Web Apps**: JSON-based APIs are simpler
- **Startups/Agile Teams**: Too rigid for rapid iteration

## Implementation Examples

### Python Implementation (Using Zeep)

```python
from zeep import Client
from zeep.transports import Transport
from requests import Session
from lxml import etree

# ============================================
# SOAP CLIENT EXAMPLE
# ============================================

def soap_client_example():
    """
    Example: Consuming a SOAP web service
    Using a public SOAP service (country information)
    """
    
    # WSDL URL - the contract/documentation
    wsdl_url = "http://webservices.oorsprong.org/websamples.countryinfo/CountryInfoService.wso?WSDL"
    
    # Create client
    client = Client(wsdl=wsdl_url)
    
    # View available operations
    print("Available operations:")
    for service in client.wsdl.services.values():
        for port in service.ports.values():
            operations = port.binding._operations.values()
            for operation in operations:
                print(f"  - {operation.name}")
    
    # Call a service operation
    print("\n--- Calling CapitalCity operation ---")
    result = client.service.CapitalCity(sCountryISOCode='US')
    print(f"Capital of USA: {result}")
    
    # Another operation
    print("\n--- Calling CurrencyName operation ---")
    result = client.service.CurrencyName(sCurrencyISOCode='USD')
    print(f"Currency name: {result}")
    
    return client


# ============================================
# SOAP SERVER EXAMPLE (Using spyne)
# ============================================

from spyne import Application, rpc, ServiceBase, Integer, Unicode
from spyne.protocol.soap import Soap11
from spyne.server.wsgi import WsgiApplication
from wsgiref.simple_server import make_server

class CalculatorService(ServiceBase):
    """
    A simple SOAP calculator service
    """
    
    @rpc(Integer, Integer, _returns=Integer)
    def add(ctx, a, b):
        """
        Add two numbers
        
        Args:
            a: First number
            b: Second number
        
        Returns:
            Sum of a and b
        """
        return a + b
    
    @rpc(Integer, Integer, _returns=Integer)
    def subtract(ctx, a, b):
        """Subtract b from a"""
        return a - b
    
    @rpc(Integer, Integer, _returns=Integer)
    def multiply(ctx, a, b):
        """Multiply a and b"""
        return a * b
    
    @rpc(Integer, Integer, _returns=Unicode)
    def divide(ctx, a, b):
        """Divide a by b"""
        if b == 0:
            return "Error: Division by zero"
        return str(a / b)


class UserService(ServiceBase):
    """
    User management SOAP service
    """
    
    # In-memory user storage
    users = {
        1: {"id": 1, "name": "Alice", "email": "alice@example.com"},
        2: {"id": 2, "name": "Bob", "email": "bob@example.com"}
    }
    next_id = 3
    
    @rpc(Integer, _returns=Unicode)
    def get_user(ctx, user_id):
        """Get user by ID"""
        user = UserService.users.get(user_id)
        if user:
            return f"User: {user['name']} ({user['email']})"
        return "User not found"
    
    @rpc(Unicode, Unicode, _returns=Integer)
    def create_user(ctx, name, email):
        """Create a new user"""
        user_id = UserService.next_id
        UserService.users[user_id] = {
            "id": user_id,
            "name": name,
            "email": email
        }
        UserService.next_id += 1
        return user_id


def create_soap_server():
    """
    Create and run a SOAP server
    """
    
    # Create SOAP application
    application = Application(
        [CalculatorService, UserService],  # Services to expose
        tns='http://example.com/soap',     # Target namespace
        in_protocol=Soap11(validator='lxml'),
        out_protocol=Soap11()
    )
    
    # Create WSGI application
    wsgi_app = WsgiApplication(application)
    
    # Run server
    print("SOAP Server running on http://localhost:8000")
    print("WSDL available at: http://localhost:8000/?wsdl")
    server = make_server('0.0.0.0', 8000, wsgi_app)
    server.serve_forever()


# ============================================
# ADVANCED: Custom SOAP Headers (Authentication)
# ============================================

from zeep import Client
from zeep.wsse.username import UsernameToken

def soap_with_authentication():
    """
    Example: SOAP with WS-Security authentication
    """
    
    wsdl_url = "https://example.com/secure-service?wsdl"
    
    # Create client with username token authentication
    client = Client(
        wsdl=wsdl_url,
        wsse=UsernameToken('username', 'password')
    )
    
    # Make authenticated request
    result = client.service.SecureOperation(param1='value')
    return result


# ============================================
# TESTING SOAP SERVICES
# ============================================

def test_soap_service():
    """
    Test SOAP service calls
    """
    import unittest
    from zeep import Client
    
    class TestCalculatorService(unittest.TestCase):
        
        @classmethod
        def setUpClass(cls):
            cls.client = Client('http://localhost:8000/?wsdl')
        
        def test_add(self):
            result = self.client.service.add(5, 3)
            self.assertEqual(result, 8)
        
        def test_subtract(self):
            result = self.client.service.subtract(10, 4)
            self.assertEqual(result, 6)
        
        def test_multiply(self):
            result = self.client.service.multiply(6, 7)
            self.assertEqual(result, 42)
        
        def test_divide(self):
            result = self.client.service.divide(10, 2)
            self.assertEqual(result, "5.0")
        
        def test_divide_by_zero(self):
            result = self.client.service.divide(10, 0)
            self.assertIn("Error", result)
    
    # Run tests
    unittest.main()


if __name__ == "__main__":
    # Uncomment to run:
    # soap_client_example()
    # create_soap_server()
    pass
```

### Go Implementation (Using gsoap or native)

```go
package main

import (
	"bytes"
	"encoding/xml"
	"fmt"
	"io"
	"net/http"
	"strconv"
)

// ============================================
// SOAP Message Structures
// ============================================

// SOAPEnvelope represents the SOAP envelope
type SOAPEnvelope struct {
	XMLName xml.Name `xml:"http://schemas.xmlsoap.org/soap/envelope/ Envelope"`
	Body    SOAPBody
}

// SOAPBody represents the SOAP body
type SOAPBody struct {
	XMLName xml.Name `xml:"http://schemas.xmlsoap.org/soap/envelope/ Body"`
	Content interface{}
}

// SOAPFault represents a SOAP error
type SOAPFault struct {
	XMLName xml.Name `xml:"http://schemas.xmlsoap.org/soap/envelope/ Fault"`
	Code    string   `xml:"faultcode"`
	String  string   `xml:"faultstring"`
	Detail  string   `xml:"detail"`
}

// ============================================
// Calculator Service Structures
// ============================================

// AddRequest represents an addition request
type AddRequest struct {
	XMLName xml.Name `xml:"http://example.com/calculator Add"`
	A       int      `xml:"a"`
	B       int      `xml:"b"`
}

// AddResponse represents an addition response
type AddResponse struct {
	XMLName xml.Name `xml:"http://example.com/calculator AddResponse"`
	Result  int      `xml:"result"`
}

// ============================================
// SOAP CLIENT
// ============================================

// SOAPClient is a simple SOAP client
type SOAPClient struct {
	URL       string
	Namespace string
}

// NewSOAPClient creates a new SOAP client
func NewSOAPClient(url, namespace string) *SOAPClient {
	return &SOAPClient{
		URL:       url,
		Namespace: namespace,
	}
}

// Call makes a SOAP request
func (c *SOAPClient) Call(action string, request, response interface{}) error {
	// Create envelope
	envelope := SOAPEnvelope{
		Body: SOAPBody{
			Content: request,
		},
	}
	
	// Marshal to XML
	xmlData, err := xml.MarshalIndent(envelope, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal request: %w", err)
	}
	
	// Create HTTP request
	req, err := http.NewRequest("POST", c.URL, bytes.NewReader(xmlData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	
	// Set headers
	req.Header.Set("Content-Type", "text/xml; charset=utf-8")
	req.Header.Set("SOAPAction", action)
	
	// Send request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()
	
	// Read response
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response: %w", err)
	}
	
	// Parse response envelope
	var respEnvelope SOAPEnvelope
	respEnvelope.Body.Content = response
	
	err = xml.Unmarshal(body, &respEnvelope)
	if err != nil {
		return fmt.Errorf("failed to unmarshal response: %w", err)
	}
	
	return nil
}

// ============================================
// SOAP SERVER
// ============================================

// CalculatorService handles calculator operations
type CalculatorService struct{}

// HandleSOAP processes SOAP requests
func (s *CalculatorService) HandleSOAP(w http.ResponseWriter, r *http.Request) {
	// Read request body
	body, err := io.ReadAll(r.Body)
	if err != nil {
		s.sendFault(w, "Server", "Failed to read request")
		return
	}
	
	// Parse SOAP envelope
	var envelope SOAPEnvelope
	err = xml.Unmarshal(body, &envelope)
	if err != nil {
		s.sendFault(w, "Client", "Invalid SOAP message")
		return
	}
	
	// Route to appropriate handler based on SOAPAction header
	action := r.Header.Get("SOAPAction")
	
	var response interface{}
	
	switch action {
	case "Add":
		response = s.handleAdd(envelope)
	case "Subtract":
		response = s.handleSubtract(envelope)
	default:
		s.sendFault(w, "Client", "Unknown operation: "+action)
		return
	}
	
	// Send response
	s.sendResponse(w, response)
}

// handleAdd processes addition requests
func (s *CalculatorService) handleAdd(envelope SOAPEnvelope) *AddResponse {
	// Parse request (simplified - in reality, you'd unmarshal properly)
	// For demo purposes, returning hardcoded response
	return &AddResponse{
		Result: 42,
	}
}

// handleSubtract processes subtraction requests
func (s *CalculatorService) handleSubtract(envelope SOAPEnvelope) interface{} {
	// Implementation similar to handleAdd
	return nil
}

// sendResponse sends a SOAP response
func (s *CalculatorService) sendResponse(w http.ResponseWriter, content interface{}) {
	envelope := SOAPEnvelope{
		Body: SOAPBody{
			Content: content,
		},
	}
	
	xmlData, err := xml.MarshalIndent(envelope, "", "  ")
	if err != nil {
		s.sendFault(w, "Server", "Failed to create response")
		return
	}
	
	w.Header().Set("Content-Type", "text/xml; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(xml.Header))
	w.Write(xmlData)
}

// sendFault sends a SOAP fault
func (s *CalculatorService) sendFault(w http.ResponseWriter, code, message string) {
	fault := SOAPFault{
		Code:   code,
		String: message,
	}
	
	envelope := SOAPEnvelope{
		Body: SOAPBody{
			Content: fault,
		},
	}
	
	xmlData, _ := xml.MarshalIndent(envelope, "", "  ")
	
	w.Header().Set("Content-Type", "text/xml; charset=utf-8")
	w.WriteHeader(http.StatusInternalServerError)
	w.Write([]byte(xml.Header))
	w.Write(xmlData)
}

// ServeWSDL serves the WSDL document
func (s *CalculatorService) ServeWSDL(w http.ResponseWriter, r *http.Request) {
	wsdl := `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://schemas.xmlsoap.org/wsdl/"
             xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/"
             xmlns:tns="http://example.com/calculator"
             targetNamespace="http://example.com/calculator">
  
  <types>
    <schema xmlns="http://www.w3.org/2001/XMLSchema"
            targetNamespace="http://example.com/calculator">
      
      <element name="Add">
        <complexType>
          <sequence>
            <element name="a" type="int"/>
            <element name="b" type="int"/>
          </sequence>
        </complexType>
      </element>
      
      <element name="AddResponse">
        <complexType>
          <sequence>
            <element name="result" type="int"/>
          </sequence>
        </complexType>
      </element>
      
    </schema>
  </types>
  
  <message name="AddRequest">
    <part name="parameters" element="tns:Add"/>
  </message>
  
  <message name="AddResponse">
    <part name="parameters" element="tns:AddResponse"/>
  </message>
  
  <portType name="CalculatorPortType">
    <operation name="Add">
      <input message="tns:AddRequest"/>
      <output message="tns:AddResponse"/>
    </operation>
  </portType>
  
  <binding name="CalculatorBinding" type="tns:CalculatorPortType">
    <soap:binding transport="http://schemas.xmlsoap.org/soap/http"/>
    <operation name="Add">
      <soap:operation soapAction="Add"/>
      <input>
        <soap:body use="literal"/>
      </input>
      <output>
        <soap:body use="literal"/>
      </output>
    </operation>
  </binding>
  
  <service name="CalculatorService">
    <port name="CalculatorPort" binding="tns:CalculatorBinding">
      <soap:address location="http://localhost:8080/calculator"/>
    </port>
  </service>
  
</definitions>`
	
	w.Header().Set("Content-Type", "text/xml; charset=utf-8")
	w.Write([]byte(wsdl))
}

// ============================================
// MAIN
// ============================================

func main() {
	service := &CalculatorService{}
	
	// SOAP endpoint
	http.HandleFunc("/calculator", service.HandleSOAP)
	
	// WSDL endpoint
	http.HandleFunc("/calculator/wsdl", service.ServeWSDL)
	
	fmt.Println("SOAP Server running on http://localhost:8080")
	fmt.Println("WSDL: http://localhost:8080/calculator/wsdl")
	
	http.ListenAndServe(":8080", nil)
}

// ============================================
// CLIENT USAGE EXAMPLE
// ============================================

func clientExample() {
	client := NewSOAPClient(
		"http://localhost:8080/calculator",
		"http://example.com/calculator",
	)
	
	request := &AddRequest{
		A: 10,
		B: 20,
	}
	
	response := &AddResponse{}
	
	err := client.Call("Add", request, response)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}
	
	fmt.Printf("Result: %d\n", response.Result)
}
```

## Key Differences: SOAP vs REST

| Aspect | SOAP | REST |
|--------|------|------|
| **Type** | Protocol (strict rules) | Architectural style (guidelines) |
| **Format** | XML only | JSON, XML, HTML, plain text |
| **Complexity** | Complex, many standards | Simple, easy to learn |
| **Contract** | WSDL (formal contract) | Optional (OpenAPI/Swagger) |
| **State** | Can be stateful or stateless | Stateless |
| **Caching** | Complex | Built-in HTTP caching |
| **Security** | WS-Security | HTTPS, OAuth, JWT |
| **Error Handling** | SOAP Fault | HTTP status codes |
| **Performance** | Slower (XML parsing) | Faster (JSON, less overhead) |

## Common SOAP Standards (WS-* Stack)

- **WS-Security**: Authentication, encryption, signatures
- **WS-ReliableMessaging**: Guaranteed delivery
- **WS-AtomicTransaction**: Distributed transactions
- **WS-Coordination**: Multi-party coordination
- **WS-Policy**: Service capabilities and requirements
- **WS-Addressing**: Routing information

## Migration from SOAP to REST

Many organizations are moving from SOAP to REST:

```
SOAP Service → REST API Migration Strategy:

1. Analyze WSDL → Create OpenAPI spec
2. Map operations → REST endpoints
3. Convert XML schemas → JSON schemas
4. Implement REST API
5. Run both in parallel
6. Migrate clients gradually
7. Deprecate SOAP service
```

## Real-World SOAP Services Still in Use

- **PayPal API** (legacy, now also REST)
- **Salesforce API** (supports both SOAP and REST)
- **SAP Enterprise Services**
- **Microsoft Dynamics**
- **Banking/Financial systems** (SWIFT, ACH)
- **Healthcare HL7 interfaces**

## Key Takeaway

SOAP is like using a formal, certified mail system with strict packaging rules and receipts. It's powerful, secure, and reliable – but also slow and complex. Modern applications usually prefer the simplicity of REST or the efficiency of gRPC, but SOAP remains important in enterprise and regulated industries where its formal contracts and extensive standards are valued.

If you're building something new, you probably don't want SOAP. But if you're working with banks, healthcare, or enterprise systems, you'll likely encounter it!
