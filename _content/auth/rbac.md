# Role-Based Access Control (RBAC): Comprehensive Guide

## What is RBAC?
Role-Based Access Control (RBAC) is a method of restricting system access based on predefined roles assigned to users. It is widely used in enterprise systems to enforce security policies and manage user permissions efficiently.

### Key Features:
- **Role-Centric:** Permissions are tied to roles, not individual users.
- **Scalable:** Simplifies management in large systems.
- **Policy-Driven:** Enforces organizational rules.

---

## Core Concepts

1. **Roles:**
   - Define a set of permissions.
   - Example: `Admin`, `Editor`, `Viewer`.

2. **Permissions:**
   - Actions allowed for a role.
   - Example: `read`, `write`, `delete`.

3. **Users:**
   - Assigned one or more roles.

4. **Policies:**
   - Rules that govern access.

5. **Attributes:**
   - Used in Attribute-Based Access Control (ABAC) for fine-grained permissions.

---

## How RBAC Works

1. **Role Assignment:**
   - Users are assigned roles based on their responsibilities.

2. **Permission Evaluation:**
   - System checks if the user’s role includes the required permissions.

3. **Policy Enforcement:**
   - Contextual rules (e.g., time, location) are evaluated.

4. **Access Decision:**
   - Access is granted or denied.

---

## RBAC vs ABAC

| Feature         | RBAC                          | ABAC                          |
|-----------------|-------------------------------|-------------------------------|
| **Granularity** | Role-based                    | Attribute-based               |
| **Flexibility** | Less flexible                 | Highly flexible               |
| **Use Case**    | Enterprise systems            | Dynamic, context-aware access |

---

## Security Best Practices

1. **Principle of Least Privilege:**
   - Assign only the permissions necessary for a role.

2. **Regular Audits:**
   - Review roles and permissions periodically.

3. **Logging and Monitoring:**
   - Track access attempts and detect anomalies.

4. **Granular Roles:**
   - Avoid overly broad roles.

5. **Automate Role Assignment:**
   - Use identity management tools.

---

## Example: RBAC in Node.js

### Defining Roles and Permissions:
```javascript
const roles = {
  admin: ['read', 'write', 'delete'],
  editor: ['read', 'write'],
  viewer: ['read']
};
```

### Checking Permissions:
```javascript
function checkPermission(role, action) {
  const permissions = roles[role];
  return permissions.includes(action);
}

const userRole = 'editor';
const action = 'delete';

if (checkPermission(userRole, action)) {
  console.log('Access granted');
} else {
  console.log('Access denied');
}
```

---

## Further Reading
- [RBAC Overview](https://docs.microsoft.com/en-us/azure/role-based-access-control/overview)
- [ABAC Explained](https://cloud.google.com/iam/docs/overview#attribute-based_access_control)
- [Best Practices for Access Control](https://www.cisa.gov/access-control)