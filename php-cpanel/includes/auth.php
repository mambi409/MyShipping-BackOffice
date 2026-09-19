<?php
/**
 * Authentication & Role Management
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../config/db.php';

/**
 * Check if the visitor is logged in
 */
function isLoggedIn(): bool {
    return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
}

/**
 * Returns current authenticated user record
 */
function currentUser(): ?array {
    if (!isLoggedIn()) {
        return null;
    }
    return [
        'id'        => $_SESSION['user_id'] ?? null,
        'username'  => $_SESSION['username'] ?? '',
        'full_name' => $_SESSION['full_name'] ?? '',
        'email'     => $_SESSION['email'] ?? '',
        'role'      => $_SESSION['role'] ?? 'worker',
    ];
}

/**
 * Check if current user is an Admin
 */
function isAdmin(): bool {
    return isLoggedIn() && (($_SESSION['role'] ?? '') === 'admin');
}

/**
 * Enforce authentication: redirect to login if guest
 */
function requireLogin(): void {
    if (!isLoggedIn()) {
        header('Location: login.php?redirect=' . urlencode($_SERVER['REQUEST_URI'] ?? 'index.php'));
        exit;
    }
}

/**
 * Enforce Admin role: block workers with 403 Forbidden
 */
function requireAdmin(): void {
    requireLogin();
    if (!isAdmin()) {
        http_response_code(403);
        die("<div style='font-family:sans-serif; text-align:center; padding:60px 20px;'>
            <h2 style='color:#dc2626;'>403 - Access Denied</h2>
            <p style='color:#4b5563;'>This section is restricted to Administrators only.</p>
            <p><a href='index.php' style='color:#4f46e5; text-decoration:none; font-weight:bold;'>&larr; Return to Dashboard</a></p>
        </div>");
    }
}

/**
 * Login user by username or email
 */
function loginUser(string $login, string $password): array {
    $db = getDBConnection();
    $stmt = $db->prepare("SELECT * FROM users WHERE (username = :login OR email = :login) AND status = 'active' LIMIT 1");
    $stmt->execute([':login' => trim($login)]);
    $user = $stmt->fetch();

    if (!$user) {
        return ['success' => false, 'error' => 'Invalid username/email or inactive account.'];
    }

    if (!password_verify($password, $user['password_hash'])) {
        return ['success' => false, 'error' => 'Incorrect password.'];
    }

    // Update last_login
    $updateStmt = $db->prepare("UPDATE users SET last_login = NOW() WHERE id = :id");
    $updateStmt->execute([':id' => $user['id']]);

    // Regenerate session ID to prevent session fixation
    session_regenerate_id(true);

    $_SESSION['user_id']   = (int)$user['id'];
    $_SESSION['username']  = $user['username'];
    $_SESSION['full_name'] = $user['full_name'];
    $_SESSION['email']     = $user['email'];
    $_SESSION['role']      = $user['role'];

    return ['success' => true, 'user' => $user];
}

/**
 * Logout
 */
function logoutUser(): void {
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    session_destroy();
}

/**
 * CSRF Token Generator & Validator
 */
function csrfToken(): string {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function verifyCsrfToken(?string $token): bool {
    if (empty($_SESSION['csrf_token']) || empty($token)) {
        return false;
    }
    return hash_equals($_SESSION['csrf_token'], $token);
}
