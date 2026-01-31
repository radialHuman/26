# Security Monitoring: Internal Working & Deep Dive

## 1. What is Security Monitoring?
Security monitoring tracks system activity to detect and respond to threats.

## 2. Internal Architecture
- **Intrusion Detection Systems (IDS):** Monitor for malicious activity
- **Security Information and Event Management (SIEM):** Aggregate and analyze logs
- **Alerting:** Notify teams of suspicious events

## 3. Incident Response
- **Preparation:** Define response plans
- **Detection:** Identify incidents
- **Containment:** Limit damage
- **Eradication:** Remove threats
- **Recovery:** Restore systems
- **Lessons Learned:** Improve future response

## 4. Best Practices
- Centralize logging
- Automate alerting
- Regularly test response plans

## 5. Further Resources
- [Security Monitoring](https://www.sans.org/white-papers/36707/)
- [SIEM Explained](https://www.ibm.com/topics/siem)
- [Incident Response](https://www.cisa.gov/news-events/news/incident-response)

---

## 6. Decision-Making Guidance

### When to Use Security Monitoring
- **Real-Time Threat Detection:** Essential for identifying and responding to threats as they occur.
- **Compliance Requirements:** Necessary for meeting standards like GDPR, HIPAA, or PCI-DSS.
- **Complex Environments:** Ideal for systems with multiple entry points and integrations.
- **Incident Response Readiness:** Crucial for organizations with defined response plans.

### When Not to Use Security Monitoring
- **Low-Risk Systems:** May not be necessary for simple, low-value setups.
- **Resource Constraints:** Not suitable if the organization lacks the budget or expertise.
- **Static Environments:** Less critical for systems with minimal changes or exposure.

### Alternatives
- **Periodic Audits:** For less frequent, manual security checks.
- **Managed Detection and Response (MDR):** Outsource monitoring to third-party providers.
- **Endpoint Detection and Response (EDR):** Focus on endpoint-specific threats.

### How to Decide
1. **Assess Threat Landscape:** Understand the types of threats your organization faces.
2. **Evaluate Resources:** Ensure you have the tools and expertise to implement effectively.
3. **Understand Compliance Needs:** Check if regulations mandate security monitoring.
4. **Start Small:** Begin with critical systems and expand coverage over time.