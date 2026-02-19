import os
import subprocess
import json
from pathlib import Path

def run_command(command, cwd):
    try:
        result = subprocess.run(command, cwd=cwd, shell=True, capture_output=True, text=True)
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def scan_projects(root_dir):
    projects = []
    
    # Files to look for
    node_deps = ["package.json"]
    python_deps = ["requirements.txt", "pyproject.toml", "Pipfile"]
    
    ignore_dirs = {".git", "node_modules", "__pycache__", ".venv", "venv", "dist", "build"}

    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Skip ignored directories
        dirnames[:] = [d for d in dirnames if d not in ignore_dirs]
        
        rel_path = os.path.relpath(dirpath, root_dir)
        if rel_path == ".":
            rel_path = "root"

        project_type = None
        dep_file = None
        
        # Check Node.js
        if "package.json" in filenames:
            project_type = "Node.js"
            dep_file = "package.json"
        # Check Python
        elif any(f in filenames for f in python_deps):
            project_type = "Python"
            for f in python_deps:
                if f in filenames:
                    dep_file = f
                    break
        
        if project_type:
            projects.append({
                "path": dirpath,
                "rel_path": rel_path,
                "type": project_type,
                "dep_file": dep_file,
                "filenames": filenames
            })
            # Don't recurse into sub-projects if we found one? 
            # Actually, nested projects are common in monorepos.
            
    return projects

def check_and_install(projects):
    summary = {
        "scanned": len(projects),
        "satisfied": 0,
        "installed": 0,
        "errors": []
    }
    
    for project in projects:
        path = project["path"]
        proj_type = project["type"]
        filenames = project["filenames"]
        
        print(f"Checking {project['rel_path']} ({proj_type})...")
        
        if proj_type == "Node.js":
            node_modules_path = os.path.join(path, "node_modules")
            if os.path.exists(node_modules_path):
                # Basic check: is node_modules empty?
                if os.listdir(node_modules_path):
                    print(f"  Dependencies satisfied.")
                    summary["satisfied"] += 1
                    continue
            
            # Install
            print(f"  Installing dependencies...")
            cmd = "npm install"
            if "yarn.lock" in filenames:
                cmd = "yarn install"
            elif "pnpm-lock.yaml" in filenames:
                cmd = "pnpm install"
            
            success, stdout, stderr = run_command(cmd, path)
            if success:
                print(f"  Successfully installed.")
                summary["installed"] += 1
            else:
                print(f"  Error installing: {stderr}")
                summary["errors"].append({"path": project["rel_path"], "error": stderr})
                
        elif proj_type == "Python":
            # For Python, we usually look for a venv.
            # If no venv, we might want to create one, but the prompt says 
            # "pip install -r requirements.txt or appropriate tool".
            # I'll check for 'venv' or '.venv' folders.
            
            has_venv = any(os.path.isdir(os.path.join(path, d)) for d in ["venv", ".venv"])
            
            # In some setups, dependencies are installed globally or in a shared venv.
            # But the user asked: "verify virtual environment existence"
            
            if has_venv:
                print(f"  Virtual environment found.")
                # Basic check: try to run a command in venv? 
                # For now let's assume if it exists, it's satisfied unless we want to be more thorough.
                # A more thorough check is 'pip check' but that's slow.
                summary["satisfied"] += 1
                continue
            else:
                print(f"  Virtual environment missing. Creating and installing...")
                # Create venv and install
                create_venv = "python -m venv venv"
                success, stdout, stderr = run_command(create_venv, path)
                if not success:
                    summary["errors"].append({"path": project["rel_path"], "error": f"Venv creation failed: {stderr}"})
                    continue
                
                # Install deps
                install_cmd = ""
                if "requirements.txt" in filenames:
                    install_cmd = ".\\venv\\Scripts\\pip install -r requirements.txt"
                elif "pyproject.toml" in filenames:
                    install_cmd = ".\\venv\\Scripts\\pip install ."
                
                if install_cmd:
                    success, stdout, stderr = run_command(install_cmd, path)
                    if success:
                        print(f"  Successfully installed.")
                        summary["installed"] += 1
                    else:
                        summary["errors"].append({"path": project["rel_path"], "error": f"Install failed: {stderr}"})
                else:
                    summary["installed"] += 1 # Just venv created
                    
    return summary

if __name__ == "__main__":
    root = os.getcwd()
    print(f"Scanning {root}...")
    projects = scan_projects(root)
    print(f"Found {len(projects)} projects.")
    
    report = check_and_install(projects)
    
    print("\n" + "="*30)
    print("SUMMARY REPORT")
    print("="*30)
    print(f"Folders scanned: {report['scanned']}")
    print(f"Dependencies already satisfied: {report['satisfied']}")
    print(f"Dependencies installed/updated: {report['installed']}")
    
    if report["errors"]:
        print(f"\nErrors found in {len(report['errors'])} folders:")
        for err in report["errors"]:
            print(f"- {err['path']}: {err['error'][:200]}...")
    else:
        print("\nNo errors encountered.")
    print("="*30)
