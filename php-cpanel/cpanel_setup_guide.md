# cPanel & MySQL Deployment Guide for CargoTracker Express

This native PHP application is 100% compatible with standard cPanel web hosting and MySQL / MariaDB databases. Follow these quick steps to launch it live on your cPanel account.

---

## Step 1: Create the MySQL Database & User in cPanel

1. Log into your **cPanel Dashboard**.
2. Under the **Databases** section, click on **MySQL Database Wizard**.
3. **Create Database**:
   - Enter a database name (e.g. `logistics`). Your full DB name will look like `yourcpaneluser_logistics`.
   - Click **Next Step**.
4. **Create Database Users**:
   - Enter a username (e.g. `dbuser`).
   - Click **Password Generator** to create a strong password (copy this down safely).
   - Click **Create User**.
5. **Add User to Database**:
   - Check the **ALL PRIVILEGES** box.
   - Click **Make Changes**.

---

## Step 2: Import the Database Schema in phpMyAdmin

1. Return to the cPanel home and open **phpMyAdmin**.
2. Select your newly created database from the left sidebar.
3. Click the **Import** tab in the top navigation bar.
4. Click **Choose File** and select the `schema.sql` file included in this directory.
5. Click **Import** (or **Go**) at the bottom.
6. You will see success notices for the `users`, `shipments`, `boxes`, and `routes` tables.

---

## Step 3: Upload the PHP Files to cPanel

1. In cPanel, open **File Manager**.
2. Navigate to `public_html/` (or a subfolder such as `public_html/tracker/`).
3. Upload all files from the `php-cpanel/` folder:
   ```text
   public_html/
   ├── config/
   │   └── db.php
   ├── includes/
   │   ├── auth.php
   │   ├── header.php
   │   └── footer.php
   ├── uploads/
   │   └── packages/
   │       └── .htaccess
   ├── index.php
   ├── shipments.php
   ├── boxes.php
   ├── users.php
   ├── print_label.php
   ├── login.php
   ├── logout.php
   └── schema.sql
   ```
4. Verify that the `uploads/packages/` directory has write permissions (`0755` or `0775`) so camera inspection photos can be saved.

---

## Step 4: Configure Database Credentials

1. In cPanel File Manager, right-click on `config/db.php` and choose **Edit**.
2. Update the credentials with the database name, username, and password you created in Step 1:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'yourcpaneluser_logistics');
   define('DB_USER', 'yourcpaneluser_dbuser');
   define('DB_PASS', 'YourCopiedPassword');
   ```
3. Click **Save Changes**.

---

## Step 5: Log in with Default Admin Account

Visit your domain (e.g., `https://yourdomain.com/` or `https://yourdomain.com/tracker/`):

* **Login Page**: `login.php`
* **Username**: `admin`
* **Password**: `Admin@1234`

*(Note: Change your password right away via the Worker Roles & Staff page or directly in phpMyAdmin).*

---

## Step 6: Creating Worker Roles

1. As an administrator, navigate to **Worker Roles & Staff** in the top navigation bar (`users.php`).
2. Click **Add New Worker / Staff**.
3. Fill in:
   * **Username**
   * **Full Name**
   * **Email Address**
   * **Initial Password**
   * **Role**: Select `Worker`
4. Click **Save Account**.
5. Workers can now log into the portal with their own credentials. They can register consignments, take package photos, generate barcodes, print labels, and pack bulk boxes!
