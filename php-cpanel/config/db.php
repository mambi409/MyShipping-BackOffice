<?php
/**
 * Database Configuration for cPanel MySQL
 * 
 * Edit the credentials below to match your cPanel MySQL Database settings.
 */

// Enable error reporting to prevent blank white screens (WSOD) on cPanel
ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);

// Hostname (usually 'localhost' on cPanel)
define('DB_HOST', 'localhost');

// Your cPanel Database Name (Replace 'cpaneluser_logistics' with your actual cPanel DB name, e.g. 'youruser_logistics')
define('DB_NAME', 'payallcw_logistics');

// Your cPanel Database Username (Replace 'cpaneluser_dbuser' with your actual cPanel DB user, e.g. 'youruser_dbuser')
define('DB_USER', 'payallcw_logisticusers');

// Your cPanel Database User Password
define('DB_PASS', '#123MyShipping321#');

// Character set
define('DB_CHARSET', 'utf8mb4');

/**
 * Returns a singleton PDO instance with prepared statements enabled
 */
function getDBConnection(): PDO {
    static $pdo = null;

    if ($pdo === null) {
        // Warn immediately if placeholders are still present
        if (DB_NAME === 'cpaneluser_logistics' || DB_USER === 'cpaneluser_dbuser') {
            die("<!DOCTYPE html>
            <html lang='en'>
            <head>
                <meta charset='UTF-8'>
                <meta name='viewport' content='width=device-width, initial-scale=1.0'>
                <title>Database Setup Required</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 30px; margin: 0; line-height: 1.6; }
                    .card { max-width: 650px; margin: 40px auto; background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 32px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
                    h2 { color: #f59e0b; margin-top: 0; font-size: 22px; display: flex; align-items: center; gap: 8px; }
                    code { background: #0f172a; color: #38bdf8; padding: 3px 7px; border-radius: 6px; font-size: 13px; font-family: monospace; }
                    .step { background: #0f172a/60; border-left: 3px solid #6366f1; padding: 12px 16px; margin: 12px 0; border-radius: 0 8px 8px 0; font-size: 14px; }
                    .highlight { color: #ef4444; font-weight: bold; }
                    .btn { display: inline-block; background: #4f46e5; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px; margin-top: 15px; }
                    .btn:hover { background: #4338ca; }
                </style>
            </head>
            <body>
                <div class='card'>
                    <h2>⚠️ Action Required: Set Your cPanel Database Name & User</h2>
                    <p>You have updated your database password, but <code>config/db.php</code> is still using the placeholder names: 
                    <span class='highlight'>'cpaneluser_logistics'</span> and <span class='highlight'>'cpaneluser_dbuser'</span>.</p>
                    
                    <p>In cPanel, every MySQL database and user is prefixed with your actual cPanel account username (e.g. <code>yourprefix_logistics</code>).</p>

                    <div class='step'>
                        <strong>Step 1: Check your database in cPanel</strong><br>
                        Log into cPanel &rarr; click <strong>MySQL Databases</strong>.<br>
                        Look at <em>Current Databases</em> for the exact name (e.g. <code>myuser_logistics</code>).<br>
                        Look at <em>Current Users</em> for the exact username (e.g. <code>myuser_dbuser</code>).
                    </div>

                    <div class='step'>
                        <strong>Step 2: Edit <code>config/db.php</code></strong><br>
                        Open <code>config/db.php</code> in cPanel File Manager and update:
                        <pre style='background:#0f172a; padding:12px; border-radius:8px; color:#e2e8f0; font-size:12px; overflow-x:auto;'>define('DB_NAME', 'YOUR_ACTUAL_CPANEL_DB_NAME');\ndefine('DB_USER', 'YOUR_ACTUAL_CPANEL_DB_USER');\ndefine('DB_PASS', '#123MyShipping321#');</pre>
                    </div>

                    <div class='step'>
                        <strong>Step 3: Ensure User Privileges</strong><br>
                        Under <strong>Add User To Database</strong> in cPanel, select your user and database, click <strong>Add</strong>, check <strong>ALL PRIVILEGES</strong>, and click <strong>Make Changes</strong>.
                    </div>

                    <p style='margin-top:20px;'><a href='test.php' class='btn'>Run Connection Diagnostics (test.php) &rarr;</a></p>
                </div>
            </body>
            </html>");
        }

        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => true,
        ];

        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            die("<!DOCTYPE html>
            <html lang='en'>
            <head>
                <meta charset='UTF-8'>
                <meta name='viewport' content='width=device-width, initial-scale=1.0'>
                <title>MySQL Connection Error</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 30px; margin: 0; line-height: 1.6; }
                    .card { max-width: 650px; margin: 40px auto; background: #1e293b; border: 1px solid #dc2626; border-radius: 16px; padding: 32px; }
                    h2 { color: #ef4444; margin-top: 0; font-size: 22px; }
                    .error-box { background: #450a0a; border: 1px solid #7f1d1d; color: #fca5a5; padding: 12px 16px; border-radius: 8px; font-family: monospace; font-size: 13px; margin: 15px 0; word-break: break-all; }
                    code { background: #0f172a; color: #38bdf8; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
                    .btn { display: inline-block; background: #4f46e5; color: white; padding: 10px 18px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px; margin-top: 15px; }
                </style>
            </head>
            <body>
                <div class='card'>
                    <h2>Database Connection Error</h2>
                    <p>Could not connect to the MySQL database on your cPanel server.</p>
                    <div class='error-box'>" . htmlspecialchars($e->getMessage()) . "</div>
                    <p><strong>Troubleshooting tips:</strong></p>
                    <ul>
                        <li>Verify <code>DB_NAME</code> matches the exact database in cPanel.</li>
                        <li>Verify <code>DB_USER</code> matches your cPanel database user.</li>
                        <li>Verify <code>DB_PASS</code> matches the user's password.</li>
                        <li>In cPanel &rarr; <strong>MySQL Databases</strong>, ensure you added the user to the database with <strong>ALL PRIVILEGES</strong>.</li>
                    </ul>
                    <a href='test.php' class='btn'>Run Test Diagnostic Script &rarr;</a>
                </div>
            </body>
            </html>");
        }
    }

    return $pdo;
}

