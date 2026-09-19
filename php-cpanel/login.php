<?php
/**
 * User Login (Admin & Worker)
 */
require_once __DIR__ . '/includes/auth.php';

// Redirect if already logged in
if (isLoggedIn()) {
    header('Location: index.php');
    exit;
}

$error = null;
$redirect = $_GET['redirect'] ?? 'index.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $login = trim($_POST['login'] ?? '');
    $password = $_POST['password'] ?? '';

    if (empty($login) || empty($password)) {
        $error = 'Please enter both username/email and password.';
    } else {
        $result = loginUser($login, $password);
        if ($result['success']) {
            $dest = filter_var($redirect, FILTER_SANITIZE_URL);
            header('Location: ' . (!empty($dest) ? $dest : 'index.php'));
            exit;
        } else {
            $error = $result['error'];
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en" class="h-full bg-slate-100">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign In - CargoTracker Express</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>body { font-family: 'Plus Jakarta Sans', sans-serif; }</style>
</head>
<body class="h-full flex items-center justify-center p-4">

    <div class="max-w-md w-full">
        <!-- Logo Header -->
        <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 mb-3">
                <i data-lucide="package-check" class="w-7 h-7"></i>
            </div>
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">CargoTracker Express</h1>
            <p class="text-xs text-slate-500 mt-1">Consignment Dispatch & Logistics Portal</p>
        </div>

        <!-- Login Card -->
        <div class="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-8 space-y-6">
            <div>
                <h2 class="text-lg font-bold text-slate-900">Sign In to Your Account</h2>
                <p class="text-xs text-slate-500 mt-0.5">Admin and worker access credentials</p>
            </div>

            <?php if ($error): ?>
                <div class="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <i data-lucide="alert-circle" class="w-4 h-4 shrink-0 text-rose-600"></i>
                    <span><?= htmlspecialchars($error) ?></span>
                </div>
            <?php endif; ?>

            <form method="POST" action="login.php?redirect=<?= urlencode($redirect) ?>" class="space-y-4">
                <div>
                    <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Username or Email
                    </label>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <i data-lucide="user" class="w-4 h-4"></i>
                        </div>
                        <input
                            type="text"
                            name="login"
                            required
                            value="<?= htmlspecialchars($_POST['login'] ?? '') ?>"
                            placeholder="admin or worker_username"
                            autocomplete="username"
                            class="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
                        >
                    </div>
                </div>

                <div>
                    <div class="flex items-center justify-between mb-1.5">
                        <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                            Password
                        </label>
                    </div>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <i data-lucide="lock" class="w-4 h-4"></i>
                        </div>
                        <input
                            type="password"
                            name="password"
                            required
                            placeholder="••••••••••••"
                            autocomplete="current-password"
                            class="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
                        >
                    </div>
                </div>

                <button
                    type="submit"
                    class="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                    <i data-lucide="log-in" class="w-4 h-4"></i>
                    <span>Sign In</span>
                </button>
            </form>

            <!-- Default Credentials Note -->
            <div class="pt-4 border-t border-slate-100 bg-slate-50/80 -mx-8 -mb-8 p-6 rounded-b-2xl">
                <div class="text-[11px] text-slate-500 space-y-1">
                    <p class="font-semibold text-slate-700">Default Admin Credentials:</p>
                    <p>Username: <code class="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-800 font-mono">admin</code></p>
                    <p>Password: <code class="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-800 font-mono">Admin@1234</code></p>
                    <p class="text-[10px] text-slate-400 mt-2">Admins can create and manage worker logins inside the dashboard.</p>
                </div>
            </div>
        </div>
    </div>

    <script>
        lucide.createIcons();
    </script>
</body>
</html>
