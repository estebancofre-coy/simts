#!/usr/bin/env python3
"""
Script to migrate existing SHA256 password hashes to bcrypt.

This script updates all student passwords that are currently stored as SHA256 hashes
to use bcrypt for better security. It maintains backward compatibility by checking
the hash format before attempting migration.

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


def migrate_passwords(db_path: str):
    """Migrate SHA256 password hashes to bcrypt.
    
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
    
    migrated_count = 0
    skipped_count = 0
    
    print(f"Found {len(students)} students in database")
    print("Starting password migration...\n")
    
    for student_id, username, current_hash in students:
        # Check if already using bcrypt
        if is_bcrypt_hash(current_hash):
            print(f"✓ Skipping {username}: Already using bcrypt")
            skipped_count += 1
            continue
        
        # SHA256 hashes are 64 characters long (hex encoded)
        if len(current_hash) != 64:
            print(f"⚠ Skipping {username}: Unknown hash format (length: {len(current_hash)})")
            skipped_count += 1
            continue
        
        # For security reasons, we cannot reverse SHA256 hashes
        # We need to set a temporary password or prompt for reset
        print(f"⚠ Cannot migrate {username}: SHA256 hash cannot be reversed")
        print(f"  User will need to reset their password or contact an administrator")
        skipped_count += 1
    
    conn.close()
    
    print(f"\nMigration Summary:")
    print(f"  Migrated: {migrated_count}")
    print(f"  Skipped: {skipped_count}")
    print(f"  Total: {len(students)}")
    
    if migrated_count == 0 and skipped_count > 0:
        print("\n⚠ Note: SHA256 hashes cannot be automatically migrated to bcrypt.")
        print("  Options:")
        print("  1. Users can reset their passwords through the application")
        print("  2. Administrators can create new accounts for users")
        print("  3. Use the create_demo_user.py script to create test accounts")
    
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
    
    # Run migration
    migrate_passwords(db_path)
    
    # Offer to create demo user with bcrypt
    print("\n" + "="*60)
    print("Would you like to create a demo user with bcrypt password?")
    print("This is useful for testing the new authentication system.")
    response = input("Create demo user? (y/n): ").strip().lower()
    
    if response == 'y':
        create_demo_user(db_path, "demo", "demo1234", "Demo User")
