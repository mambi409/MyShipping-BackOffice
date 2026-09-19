<?php
/**
 * cPanel Logistics System - Diagnostic & Auto-Setup Utility
 * 
 * Visit this file in your browser (e.g., https://yourdomain.com/test.php or https://yourdomain.com/php-cpanel/test.php)
 * to immediately check your database connection, server environment, and automatically install tables if needed.
 */
ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);

require_once __DIR__ . '/config/db.php';

$action = $_POST['action'] ?? '';
$importMessage = null;
$importError = null;

// Database Connection Test
$dbSuccess = false;
$dbError = null;
$pdo = null;
$tablesFound = [];
$requiredTables = ['users', 'shipments', 'boxes', 'routes'];
$adminUserFound = false;

// 1. Attempt connection manually to catch specific error without dying
try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => true,
    ];
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    $dbSuccess = true;

    // Check existing tables
    $stmt = $pdo->query("SHOW TABLES");
    while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
        $tablesFound[] = $row[0];
    }

    // 2. Handle Auto-Install Schema if requested
    if ($action === 'install_schema' && $dbSuccess) {
        $schemaFile = __DIR__ . '/schema.sql';
        if (file_exists($schemaFile)) {
            $sql = file_get_contents($schemaFile);
            $pdo->exec($sql);
            $importMessage = "Database tables and default admin account successfully installed!";
            // Re-fetch tables
            $tablesFound = [];
            $stmt = $pdo->query("SHOW TABLES");
            while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
                $tablesFound[] = $row[0];
            }
        } else {
            $importError = "schema.sql file not found in directory.";
        }
    }

    // 3. Handle Reset Admin Password
    if ($action === 'reset_admin' && $dbSuccess) {
        $newHash = password_hash('Admin@1234', PASSWORD_DEFAULT);
        // Check if admin exists
        $chk = $pdo->query("SELECT id FROM users WHERE username = 'admin' LIMIT 1");
        $adm = $chk->fetch();
        if ($adm) {
            $upd = $pdo->prepare("UPDATE users SET password_hash = :h, status = 'active' WHERE id = :id");
            $upd->execute([':h' => $newHash, ':id' => $adm['id']]);
            $importMessage = "Admin password has been reset to: Admin@1234 (Username: admin)";
        } else {
            $ins = $pdo->prepare("INSERT INTO users (username, full_name, email, password_hash, role, status) VALUES ('admin', 'System Administrator', 'admin@example.com', :h, 'admin', 'active')");
            $ins->execute([':h' => $newHash]);
            $importMessage = "Admin account created with password: Admin@1234 (Username: admin)";
        }
    }

    // Check if admin exists
    if (in_array('users', $tablesFound)) {
        $chk = $pdo->query("SELECT id, username FROM users WHERE username = 'admin' LIMIT 1");
        $adminUserFound = (bool)$chk->fetch();
    }

} catch (PDOException $e) {
    $dbSuccess = false;
    $dbError = $e->getMessage();
}

// Check Uploads Dir
$uploadDir = __DIR__ . '/uploads/packages/';
$uploadWritable = is_dir($uploadDir) && is_writable($uploadDir);

$hasPlaceholders = (DB_NAME === 'cpaneluser_logistics' || DB_USER === 'cpaneluser_dbuser');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Diagnostics & Setup - CargoTracker</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
    </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen p-4 sm:p-8">

    <div class="max-w-3xl mx-auto space-y-6">

        <!-- Top Header -->
        <div class="flex items-center justify-between border-b border-slate-800 pb-5">
            <div>
                <span class="text-xs font-mono uppercase tracking-widest text-indigo-400 font-bold">CargoTracker Express</span>
                <h1 class="text-2xl font-black text-white mt-0.5">cPanel System Diagnostics</h1>
            </div>
            <a href="login.php" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all">
                Open Login Page &rarr;
            </a>
        </div>

        <?php if ($importMessage): ?>
            <div class="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs font-bold">
                ✓ <?= htmlspecialchars($importMessage) ?>
            </div>
        <?php endif; ?>

        <?php if ($importError): ?>
            <div class="p-4 rounded-xl bg-rose-950/80 border border-rose-500 text-rose-200 text-xs font-bold">
                ✕ <?= htmlspecialchars($importError) ?>
            </div>
        <?php endif; ?>

        <!-- Critical Notice if Placeholders Still Present -->
        <?php if ($hasPlaceholders): ?>
            <div class="p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/50 text-amber-200 space-y-3">
                <div class="flex items-center gap-2 text-base font-bold text-amber-400">
                    <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    <span>Action Required: Set your cPanel Database Name & User</span>
                </div>
                <p class="text-xs text-slate-300 leading-relaxed">
                    You have updated your password, but in <code class="bg-slate-900 px-1.5 py-0.5 rounded text-amber-300 font-mono">config/db.php</code>, the database name and username are still using the sample placeholders: <strong class="text-amber-300 font-mono">cpaneluser_logistics</strong> and <strong class="text-amber-300 font-mono">cpaneluser_dbuser</strong>.
                </p>
                <div class="text-xs bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div class="font-bold text-white">How to fix in 1 minute:</div>
                    <ol class="list-decimal list-inside space-y-1 text-slate-300">
                        <li>In cPanel, click <strong>MySQL Databases</strong>.</li>
                        <li>Find your actual database name (e.g. <code class="text-indigo-400">youruser_logistics</code>) and database user (e.g. <code class="text-indigo-400">youruser_dbuser</code>).</li>
                        <li>Open <code class="text-indigo-400">config/db.php</code> in cPanel File Manager and replace the placeholders.</li>
                    </ol>
                </div>
            </div>
        <?php endif; ?>

        <!-- Diagnostic Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

            <!-- Card 1: PHP Environment -->
            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h3 class="text-sm font-bold text-white uppercase tracking-wider font-mono">1. Server Environment</h3>
                <div class="space-y-2 text-xs">
                    <div class="flex justify-between py-1 border-b border-slate-800">
                        <span class="text-slate-400">PHP Version:</span>
                        <span class="font-bold font-mono text-emerald-400"><?= phpversion() ?></span>
                    </div>
                    <div class="flex justify-between py-1 border-b border-slate-800">
                        <span class="text-slate-400">PDO Extension:</span>
                        <span class="font-bold font-mono <?= extension_loaded('pdo') ? 'text-emerald-400' : 'text-rose-400' ?>">
                            <?= extension_loaded('pdo') ? 'Enabled ✓' : 'Missing ✕' ?>
                        </span>
                    </div>
                    <div class="flex justify-between py-1 border-b border-slate-800">
                        <span class="text-slate-400">PDO MySQL Driver:</span>
                        <span class="font-bold font-mono <?= extension_loaded('pdo_mysql') ? 'text-emerald-400' : 'text-rose-400' ?>">
                            <?= extension_loaded('pdo_mysql') ? 'Enabled ✓' : 'Missing ✕' ?>
                        </span>
                    </div>
                    <div class="flex justify-between py-1">
                        <span class="text-slate-400">Uploads Folder:</span>
                        <span class="font-bold font-mono <?= $uploadWritable ? 'text-emerald-400' : 'text-amber-400' ?>">
                            <?= $uploadWritable ? 'Writable (0755) ✓' : 'uploads/packages/' ?>
                        </span>
                    </div>
                </div>
            </div>

            <!-- Card 2: Configuration Values -->
            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h3 class="text-sm font-bold text-white uppercase tracking-wider font-mono">2. Current db.php Settings</h3>
                <div class="space-y-2 text-xs font-mono">
                    <div class="flex justify-between py-1 border-b border-slate-800">
                        <span class="text-slate-400">DB_HOST:</span>
                        <span class="text-slate-200"><?= htmlspecialchars(DB_HOST) ?></span>
                    </div>
                    <div class="flex justify-between py-1 border-b border-slate-800">
                        <span class="text-slate-400">DB_NAME:</span>
                        <span class="<?= $hasPlaceholders ? 'text-amber-400 font-bold' : 'text-indigo-400 font-bold' ?>">
                            <?= htmlspecialchars(DB_NAME) ?>
                        </span>
                    </div>
                    <div class="flex justify-between py-1 border-b border-slate-800">
                        <span class="text-slate-400">DB_USER:</span>
                        <span class="<?= $hasPlaceholders ? 'text-amber-400 font-bold' : 'text-indigo-400 font-bold' ?>">
                            <?= htmlspecialchars(DB_USER) ?>
                        </span>
                    </div>
                    <div class="flex justify-between py-1">
                        <span class="text-slate-400">DB_PASS:</span>
                        <span class="text-slate-400">
                            <?= strlen(DB_PASS) > 0 ? str_repeat('•', min(12, strlen(DB_PASS))) . ' (' . strlen(DB_PASS) . ' chars)' : '<span class="text-rose-400 font-bold">Empty</span>' ?>
                        </span>
                    </div>
                </div>
            </div>

        </div>

        <!-- Card 3: MySQL Connection Test Result -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 class="text-sm font-bold text-white uppercase tracking-wider font-mono">3. MySQL Connection Result</h3>

            <?php if ($dbSuccess): ?>
                <div class="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 flex items-start gap-3">
                    <div class="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">✓</div>
                    <div class="text-xs space-y-1">
                        <div class="text-emerald-300 font-bold text-sm">Successfully connected to MySQL!</div>
                        <div class="text-slate-400">Your database host, name, username, and password are correctly configured.</div>
                    </div>
                </div>

                <!-- Check Tables -->
                <div class="pt-3 border-t border-slate-800 space-y-3">
                    <div class="flex items-center justify-between">
                        <div class="text-xs font-bold text-white uppercase font-mono">Database Tables Status:</div>
                        <span class="text-xs text-slate-400 font-mono"><?= count($tablesFound) ?> tables detected</span>
                    </div>

                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <?php foreach ($requiredTables as $tbl): ?>
                            <?php $exists = in_array($tbl, $tablesFound); ?>
                            <div class="p-2.5 rounded-xl border text-xs flex items-center justify-between <?= $exists ? 'bg-slate-950/60 border-slate-800 text-emerald-400' : 'bg-rose-950/30 border-rose-800/50 text-rose-400' ?>">
                                <span class="font-mono"><?= $tbl ?></span>
                                <span class="font-bold"><?= $exists ? '✓' : 'Missing' ?></span>
                            </div>
                        <?php endforeach; ?>
                    </div>

                    <?php 
                    $missingTables = array_diff($requiredTables, $tablesFound);
                    ?>

                    <?php if (!empty($missingTables)): ?>
                        <div class="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs space-y-3">
                            <div class="font-bold text-amber-300">Database connected, but tables are missing!</div>
                            <p class="text-slate-300">You have connected to the database, but <code class="text-amber-300">schema.sql</code> has not been imported yet.</p>
                            
                            <form method="POST" action="test.php">
                                <input type="hidden" name="action" value="install_schema">
                                <button type="submit" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-colors shadow-lg shadow-emerald-600/20">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                                    <span>One-Click Install Tables & Admin Account Now</span>
                                </button>
                            </form>
                        </div>
                    <?php else: ?>
                        <div class="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div>
                                <span class="text-emerald-400 font-bold">All 4 required tables installed and ready!</span>
                                <div class="text-slate-400 mt-0.5">Default login: <strong class="text-white font-mono">admin</strong> / <strong class="text-white font-mono">Admin@1234</strong></div>
                            </div>
                            <div class="flex items-center gap-2">
                                <form method="POST" action="test.php" class="inline">
                                    <input type="hidden" name="action" value="reset_admin">
                                    <button type="submit" class="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs border border-slate-700 cursor-pointer transition-colors" title="Re-generates password hash for admin to Admin@1234">
                                        Reset Admin Password
                                    </button>
                                </form>
                                <a href="login.php" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-center shadow-lg shadow-indigo-600/30">
                                    Launch CargoTracker &rarr;
                                </a>
                            </div>
                        </div>
                    <?php endif; ?>
                </div>

            <?php else: ?>
                <div class="p-4 rounded-xl bg-rose-950/60 border border-rose-500/50 flex items-start gap-3">
                    <div class="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">✕</div>
                    <div class="text-xs space-y-1.5 overflow-hidden">
                        <div class="text-rose-300 font-bold text-sm">Connection Failed</div>
                        <div class="font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-rose-300 text-[11px] break-all">
                            <?= htmlspecialchars($dbError) ?>
                        </div>
                    </div>
                </div>

                <div class="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2 text-slate-300">
                    <div class="font-bold text-white">Common Solutions for this Error:</div>
                    <ul class="list-disc list-inside space-y-1.5 text-slate-400">
                        <?php if (strpos($dbError, 'Access denied') !== false): ?>
                            <li><strong class="text-amber-400">Access Denied:</strong> Double check that the username in <code>DB_USER</code> matches your cPanel database username, that the password is correct, and that you added the user to the database in cPanel with <strong>ALL PRIVILEGES</strong>.</li>
                        <?php elseif (strpos($dbError, 'Unknown database') !== false): ?>
                            <li><strong class="text-amber-400">Unknown Database:</strong> The database specified in <code>DB_NAME</code> does not exist. Remember to include your cPanel prefix (e.g. <code>yourcpaneluser_logistics</code>).</li>
                        <?php else: ?>
                            <li>Verify your cPanel MySQL host is <code>localhost</code> (or <code>127.0.0.1</code>).</li>
                            <li>Ensure database name and user include your cPanel account username prefix.</li>
                        <?php endif; ?>
                    </ul>
                </div>
            <?php endif; ?>
        </div>

    </div>

</body>
</html>
