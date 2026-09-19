<?php
/**
 * User & Worker Management (Admin Only)
 * 
 * Allows Administrators to create, edit, and assign Worker and Admin accounts.
 */
require_once __DIR__ . '/includes/auth.php';
requireAdmin();

$pageTitle = 'Worker & Staff Management';
$db = getDBConnection();
$adminUser = currentUser();

$success = null;
$error = null;

// 1. Handle New User Creation
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'create_user') {
    if (verifyCsrfToken($_POST['csrf_token'] ?? '')) {
        $username = trim($_POST['username'] ?? '');
        $fullName = trim($_POST['full_name'] ?? '');
        $email    = trim($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';
        $role     = $_POST['role'] ?? 'worker';

        // Validate
        if (empty($username) || empty($fullName) || empty($email) || empty($password)) {
            $error = 'All fields (Username, Full Name, Email, and Password) are required.';
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $error = 'Please enter a valid email address.';
        } elseif (strlen($password) < 6) {
            $error = 'Password must be at least 6 characters long.';
        } else {
            // Check uniqueness
            $chk = $db->prepare("SELECT id FROM users WHERE username = :u OR email = :e LIMIT 1");
            $chk->execute([':u' => $username, ':e' => $email]);
            if ($chk->fetch()) {
                $error = 'A user with that username or email already exists.';
            } else {
                $hash = password_hash($password, PASSWORD_DEFAULT);
                $ins = $db->prepare("INSERT INTO users (username, full_name, email, password_hash, role, status, created_at) 
                                     VALUES (:u, :fn, :e, :p, :r, 'active', NOW())");
                $ins->execute([
                    ':u'  => $username,
                    ':fn' => $fullName,
                    ':e'  => $email,
                    ':p'  => $hash,
                    ':r'  => in_array($role, ['admin', 'worker'], true) ? $role : 'worker',
                ]);
                $success = "User account '{$username}' created successfully as {$role}!";
            }
        }
    }
}

// 2. Handle User Status Toggle (Activate/Deactivate)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'toggle_status') {
    if (verifyCsrfToken($_POST['csrf_token'] ?? '')) {
        $targetId = intval($_POST['user_id'] ?? 0);
        $newStatus = $_POST['new_status'] === 'inactive' ? 'inactive' : 'active';

        // Protect self-deactivation
        if ($targetId === $adminUser['id']) {
            $error = 'You cannot deactivate your own administrative account.';
        } else {
            $stmt = $db->prepare("UPDATE users SET status = :st WHERE id = :id");
            $stmt->execute([':st' => $newStatus, ':id' => $targetId]);
            $success = "User status updated to {$newStatus}.";
        }
    }
}

// 3. Handle Password Reset
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'reset_password') {
    if (verifyCsrfToken($_POST['csrf_token'] ?? '')) {
        $targetId    = intval($_POST['user_id'] ?? 0);
        $newPassword = $_POST['new_password'] ?? '';

        if (strlen($newPassword) < 6) {
            $error = 'New password must be at least 6 characters.';
        } else {
            $hash = password_hash($newPassword, PASSWORD_DEFAULT);
            $stmt = $db->prepare("UPDATE users SET password_hash = :p WHERE id = :id");
            $stmt->execute([':p' => $hash, ':id' => $targetId]);
            $success = "Password reset successfully for user #{$targetId}.";
        }
    }
}

// Fetch all users
$users = $db->query("SELECT id, username, full_name, email, role, status, created_at, last_login FROM users ORDER BY id ASC")->fetchAll();

require_once __DIR__ . '/includes/header.php';
?>

<div class="space-y-6">

    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
            <h1 class="text-xl font-bold text-slate-900 flex items-center gap-2">
                <i data-lucide="shield-check" class="w-6 h-6 text-indigo-600"></i>
                <span>Worker Roles & Staff Accounts</span>
            </h1>
            <p class="text-xs text-slate-500 mt-0.5">Admin control panel to provision and manage worker roles and logins</p>
        </div>

        <button onclick="document.getElementById('newUserModal').classList.remove('hidden')" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer">
            <i data-lucide="user-plus" class="w-4 h-4"></i>
            <span>Add New Worker / Staff</span>
        </button>
    </div>

    <!-- Alerts -->
    <?php if ($success): ?>
        <div class="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <i data-lucide="check-circle" class="w-4 h-4 text-emerald-600 shrink-0"></i>
            <span><?= htmlspecialchars($success) ?></span>
        </div>
    <?php endif; ?>

    <?php if ($error): ?>
        <div class="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <i data-lucide="alert-circle" class="w-4 h-4 text-rose-600 shrink-0"></i>
            <span><?= htmlspecialchars($error) ?></span>
        </div>
    <?php endif; ?>

    <!-- User Roles Explanation Card -->
    <div class="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div class="space-y-1">
            <div class="font-bold text-indigo-950">Role Permissions:</div>
            <div class="text-indigo-800 flex flex-wrap items-center gap-3">
                <span class="inline-flex items-center gap-1">
                    <strong class="font-mono bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded text-[10px]">admin</strong>
                    Full system access, staff creation, box dispatch, settings
                </span>
                <span>&bull;</span>
                <span class="inline-flex items-center gap-1">
                    <strong class="font-mono bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded text-[10px]">worker</strong>
                    Intake consignments, take package inspection photos, print labels, pack boxes
                </span>
            </div>
        </div>
    </div>

    <!-- Users Table -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
                <thead>
                    <tr class="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px] tracking-wider">
                        <th class="py-3 px-4">User</th>
                        <th class="py-3 px-4">Email</th>
                        <th class="py-3 px-4">Assigned Role</th>
                        <th class="py-3 px-4">Status</th>
                        <th class="py-3 px-4">Last Login</th>
                        <th class="py-3 px-4">Created Date</th>
                        <th class="py-3 px-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    <?php foreach ($users as $u): ?>
                        <tr class="hover:bg-slate-50/80 transition-colors">
                            <td class="py-3.5 px-4 align-middle">
                                <div class="font-bold text-slate-900"><?= htmlspecialchars($u['full_name']) ?></div>
                                <div class="text-[11px] font-mono text-slate-400">@<?= htmlspecialchars($u['username']) ?></div>
                            </td>

                            <td class="py-3.5 px-4 align-middle font-mono text-slate-600">
                                <?= htmlspecialchars($u['email']) ?>
                            </td>

                            <td class="py-3.5 px-4 align-middle">
                                <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider <?= $u['role'] === 'admin' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-slate-100 text-slate-700 border border-slate-200' ?>">
                                    <?= htmlspecialchars($u['role']) ?>
                                </span>
                            </td>

                            <td class="py-3.5 px-4 align-middle">
                                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider <?= $u['status'] === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200' ?>">
                                    <span class="w-1.5 h-1.5 rounded-full <?= $u['status'] === 'active' ? 'bg-emerald-500' : 'bg-rose-500' ?>"></span>
                                    <?= htmlspecialchars($u['status']) ?>
                                </span>
                            </td>

                            <td class="py-3.5 px-4 align-middle text-slate-500">
                                <?= $u['last_login'] ? date('M d, Y H:i', strtotime($u['last_login'])) : '<span class="text-slate-300 italic">Never</span>' ?>
                            </td>

                            <td class="py-3.5 px-4 align-middle text-slate-400 text-[11px]">
                                <?= date('M d, Y', strtotime($u['created_at'])) ?>
                            </td>

                            <td class="py-3.5 px-4 align-middle text-right whitespace-nowrap">
                                <div class="flex items-center justify-end gap-2">
                                    
                                    <!-- Reset Password Trigger -->
                                    <button 
                                        type="button" 
                                        onclick="openResetModal(<?= $u['id'] ?>, '<?= htmlspecialchars($u['username']) ?>')"
                                        title="Reset Password"
                                        class="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                                    >
                                        <i data-lucide="key-round" class="w-3.5 h-3.5"></i>
                                    </button>

                                    <!-- Status Toggle Form -->
                                    <?php if ($u['id'] !== $adminUser['id']): ?>
                                        <form method="POST" action="users.php" class="inline-block">
                                            <input type="hidden" name="action" value="toggle_status">
                                            <input type="hidden" name="csrf_token" value="<?= csrfToken() ?>">
                                            <input type="hidden" name="user_id" value="<?= $u['id'] ?>">
                                            <input type="hidden" name="new_status" value="<?= $u['status'] === 'active' ? 'inactive' : 'active' ?>">
                                            <button 
                                                type="submit" 
                                                title="<?= $u['status'] === 'active' ? 'Deactivate Account' : 'Activate Account' ?>"
                                                class="p-1.5 rounded-lg border border-slate-200 transition-colors <?= $u['status'] === 'active' ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50' : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50' ?> cursor-pointer"
                                            >
                                                <i data-lucide="<?= $u['status'] === 'active' ? 'user-x' : 'user-check' ?>" class="w-3.5 h-3.5"></i>
                                            </button>
                                        </form>
                                    <?php endif; ?>

                                </div>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>

</div>

<!-- Modal: Add New Worker / User -->
<div id="newUserModal" class="hidden fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
    <div class="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
                <i data-lucide="user-plus" class="w-4 h-4 text-indigo-600"></i>
                <span>Add Staff User Account</span>
            </h3>
            <button onclick="document.getElementById('newUserModal').classList.add('hidden')" class="text-slate-400 hover:text-slate-600">
                <i data-lucide="x" class="w-4 h-4"></i>
            </button>
        </div>

        <form method="POST" action="users.php" class="p-6 space-y-4">
            <input type="hidden" name="action" value="create_user">
            <input type="hidden" name="csrf_token" value="<?= csrfToken() ?>">

            <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Username <span class="text-rose-500">*</span>
                </label>
                <input type="text" name="username" required placeholder="e.g. john_worker" class="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500">
            </div>

            <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name <span class="text-rose-500">*</span>
                </label>
                <input type="text" name="full_name" required placeholder="e.g. John Doe" class="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500">
            </div>

            <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address <span class="text-rose-500">*</span>
                </label>
                <input type="email" name="email" required placeholder="john@example.com" class="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500">
            </div>

            <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Initial Password <span class="text-rose-500">*</span>
                </label>
                <input type="password" name="password" required minlength="6" placeholder="At least 6 characters" class="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono">
            </div>

            <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Account Role
                </label>
                <select name="role" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-semibold">
                    <option value="worker" selected>Worker (Consignment Intake, Camera, Labels)</option>
                    <option value="admin">Administrator (Full Access & User Management)</option>
                </select>
            </div>

            <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onclick="document.getElementById('newUserModal').classList.add('hidden')" class="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800">
                    Cancel
                </button>
                <button type="submit" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors">
                    Save Account
                </button>
            </div>
        </form>
    </div>
</div>

<!-- Modal: Reset Password -->
<div id="resetModal" class="hidden fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
    <div class="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
                <i data-lucide="key" class="w-4 h-4 text-indigo-600"></i>
                <span>Reset User Password</span>
            </h3>
            <button onclick="document.getElementById('resetModal').classList.add('hidden')" class="text-slate-400 hover:text-slate-600">
                <i data-lucide="x" class="w-4 h-4"></i>
            </button>
        </div>

        <form method="POST" action="users.php" class="p-6 space-y-4">
            <input type="hidden" name="action" value="reset_password">
            <input type="hidden" name="csrf_token" value="<?= csrfToken() ?>">
            <input type="hidden" name="user_id" id="resetUserId" value="">

            <p class="text-xs text-slate-600">Set a new password for user <strong id="resetUsernameDisplay" class="font-mono"></strong>:</p>

            <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    New Password
                </label>
                <input type="password" name="new_password" required minlength="6" placeholder="At least 6 characters" class="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono">
            </div>

            <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onclick="document.getElementById('resetModal').classList.add('hidden')" class="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800">
                    Cancel
                </button>
                <button type="submit" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors">
                    Update Password
                </button>
            </div>
        </form>
    </div>
</div>

<script>
    function openResetModal(userId, username) {
        document.getElementById('resetUserId').value = userId;
        document.getElementById('resetUsernameDisplay').textContent = '@' + username;
        document.getElementById('resetModal').classList.remove('hidden');
    }
</script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
