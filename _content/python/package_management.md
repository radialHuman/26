# Python Package Management

Managing dependencies is crucial for Python projects. This chapter covers pip, venv, poetry, and requirements.txt.

---

## pip
- The standard package installer for Python.
- Install packages: `pip install requests`

---

## Virtual Environments (venv)
- Isolate dependencies per project.
- Create: `python -m venv venv`
- Activate: `source venv/bin/activate` (Linux/macOS) or `venv\Scripts\activate` (Windows)

---

## requirements.txt
- List dependencies for reproducible installs.
- Install: `pip install -r requirements.txt`

---

## Poetry
- Modern dependency and packaging tool.
- Init: `poetry init`
- Add: `poetry add fastapi`
- Run: `poetry run python app.py`

---

## Best Practices
- Use virtual environments for all projects.
- Pin dependencies for reproducibility.
- Regularly update and audit dependencies.

---

Proper package management ensures reliable, maintainable Python applications.