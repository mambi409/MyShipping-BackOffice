<?php
/**
 * Database Configuration for cPanel MySQL
 * 
 * Edit the credentials below to match your cPanel MySQL Database settings.
 */

// Hostname (usually 'localhost' on cPanel)
define('DB_HOST', 'localhost');

// Your cPanel Database Name (e.g., 'cpaneluser_logistics')
define('DB_NAME', 'cpaneluser_logistics');

// Your cPanel Database Username (e.g., 'cpaneluser_dbuser')
define('DB_USER', 'cpaneluser_dbuser');

// Your cPanel Database User Password
define('DB_PASS', 'YourStrongPasswordHere');

// Character set
define('DB_CHARSET', 'utf8mb4');

/**
 * Returns a singleton PDO instance with prepared statements enabled
 */
function getDBConnection(): PDO {
    static $pdo = null;

    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            // Friendly error message for configuration
            die("<div style='font-family:sans-serif; max-width:600px; margin:50px auto; padding:25px; border:1px solid #f87171; background:#fef2f2; border-radius:12px; color:#991b1b;'>
                <h3 style='margin-top:0;'>Database Connection Error</h3>
                <p>Could not connect to the MySQL database on cPanel.</p>
                <p style='font-size:13px; color:#b91c1c;'><strong>Details:</strong> " . htmlspecialchars($e->getMessage()) . "</p>
                <hr style='border:0; border-top:1px solid #fecaca; margin:15px 0;'>
                <p style='font-size:12px;'>Please open <code>config/db.php</code> and verify your <strong>DB_NAME</strong>, <strong>DB_USER</strong>, and <strong>DB_PASS</strong> settings.</p>
            </div>");
        }
    }

    return $pdo;
}
