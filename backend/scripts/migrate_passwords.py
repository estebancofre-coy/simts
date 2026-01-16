#!/usr/bin/env python3
"""
Script to migrate existing SHA256 password hashes to bcrypt.

IMPORTANT: SHA256 hashes cannot be automatically migrated because hashes are one-way.
However, this system automatically migrates passwords to bcrypt when users successfully log in.

This script provides information about migration status and tools to help.

Usage:
    python migrate_passwords.py [db_path]
    
    db_path: Optional path to the database file (default: ../cases.db)
"""

import sys
import os
import sqlite3
from pathlib import Path

# Add parent directory to path to import security module
sys.path.insert(0, str(Path(__file__).parent.parent))

from security import hash_password, is_bcrypt_hash


def check_migration_status(db_path: str):
    """Check migration status of all students.
    
    Args:
        db_path: Path to the SQLite database file
    """
    if not os.path.exists(db_path):
        print(f"Error: Database file not found at {db_path}")
        return False
    
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    # Get all students with their current password hashes
    cur.execute("SELECT id, username, password_hash FROM students")
    students = cur.fetchall()
    
    bcrypt_count = 0
    sha256_count = 0
    unknown_count = 0
    
    print(f"Found {len(students)} students in database")
    print("\nMigration Status:")
    print("-" * 60)
    
    for student_id, username, current_hash in students:
        # Check if already using bcrypt
        if is_bcrypt_hash(current_hash):
            status = "✓ bcrypt (secure)"
            bcrypt_count += 1
        elif len(current_hash) == 64:
            status = "⚠ SHA256 (will auto-migrate on next login)"
            sha256_count += 1
        else:
            status = "? Unknown format"
            unknown_count += 1
        
        print(f"  {username:20s} {status}")
    
    conn.close()
    
    print("\n" + "=" * 60)
    print(f"Summary:")
    print(f"  ✓ Secure (bcrypt):     {bcrypt_count}")
    print(f"  ⚠ Legacy (SHA256):     {sha256_count}")
    print(f"  ? Unknown:             {unknown_count}")
    print(f"  Total:                 {len(students)}")
    print("=" * 60)
    
    if sha256_count > 0:
        print("\n📝 Migration Strategy:")
        print("  1. AUTOMATIC: Users with SHA256 passwords will be automatically")
        print("     migrated to bcrypt when they next successfully log in.")
        print("  2. MANUAL: Use create_demo_user() below to create new users")
        print("     with bcrypt passwords immediately.")
        print("  3. RESET: For users who cannot log in, reset their password")
        print("     using set_user_password() function.")
    
    return True


def set_user_password(db_path: str, username: str, new_password: str):
    """Set a new bcrypt password for a user (password reset).
    
    Args:
        db_path: Path to the SQLite database file
        username: Username of the user
        new_password: New plain text password (will be hashed)
    """
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    # Check if user exists
    cur.execute("SELECT id FROM students WHERE username = ?", (username,))
    if not cur.fetchone():
        print(f"✗ User {username} not found")
        conn.close()
        return False
    
    # Set new bcrypt password
    pw_hash = hash_password(new_password)
    cur.execute(
        "UPDATE students SET password_hash = ? WHERE username = ?",
        (pw_hash, username)
    )
    conn.commit()
    conn.close()
    
    print(f"✓ Password reset for user {username} with bcrypt hash")
    return True


def create_demo_user(db_path: str, username: str, password: str, name: str):
    """Create a demo user with bcrypt hashed password.
    
    Args:
        db_path: Path to the SQLite database file
        username: Username for the new user
        password: Plain text password (will be hashed)
        name: Display name for the user
    """
    from datetime import datetime
    
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    # Check if user already exists
    cur.execute("SELECT id FROM students WHERE username = ?", (username,))
    if cur.fetchone():
        print(f"✗ User {username} already exists")
        conn.close()
        return False
    
    # Create user with bcrypt hashed password
    pw_hash = hash_password(password)
    created_at = datetime.utcnow().isoformat()
    
    cur.execute(
        "INSERT INTO students (username, password_hash, name, created_at, status) VALUES (?, ?, ?, ?, ?)",
        (username, pw_hash, name, created_at, "active")
    )
    conn.commit()
    conn.close()
    
    print(f"✓ Created user {username} with bcrypt password")
    return True


if __name__ == "__main__":
    # Get database path from command line or use default
    if len(sys.argv) > 1:
        db_path = sys.argv[1]
    else:
        db_path = os.path.join(os.path.dirname(__file__), "..", "cases.db")
    
    print(f"Database path: {db_path}\n")
    
    # Check migration status
    check_migration_status(db_path)
    
    print("\n" + "=" * 60)
    print("Options:")
    print("  1. Create a new user with bcrypt password")
    print("  2. Reset password for existing user")
    print("  3. Exit")
    
    choice = input("\nSelect option (1-3): ").strip()
    
    if choice == "1":
        username = input("Username: ").strip()
        password = input("Password: ").strip()
        name = input("Full name: ").strip()
        create_demo_user(db_path, username, password, name)
    elif choice == "2":
        username = input("Username: ").strip()
        password = input("New password: ").strip()
        set_user_password(db_path, username, password)
    else:
        print("Exiting...")
