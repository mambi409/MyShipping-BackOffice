<?php
/**
 * Global Header Component for Native PHP Logistics System
 */
require_once __DIR__ . '/auth.php';
$user = currentUser();
$currentPage = basename($_SERVER['PHP_SELF']);
?>
<!DOCTYPE html>
<html lang="en" class="h-full bg-slate-50">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= isset($pageTitle) ? htmlspecialchars($pageTitle) . ' - ' : '' ?>CargoTracker Express</title>
    
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        brand: {
                            50: '#eef2ff',
                            100: '#e0e7ff',
                            500: '#6366f1',
                            600: '#4f46e5',
                            700: '#4338ca',
                            900: '#312e81',
                        }
                    }
                }
            }
        }
    </script>
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>
    
    <!-- JsBarcode for real-time barcode rendering -->
    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>

    <style>
        body {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        .font-mono {
            font-family: 'JetBrains Mono', monospace;
        }
        @media print {
            .no-print {
                display: none !important;
            }
        }
    </style>
</head>
<body class="h-full flex flex-col text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">

    <!-- Top Navigation Bar -->
    <header class="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs no-print">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-16">
                
                <!-- Logo & Brand -->
                <div class="flex items-center gap-6">
                    <a href="index.php" class="flex items-center gap-2.5 group">
                        <div class="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 group-hover:bg-indigo-700 transition-colors">
                            <i data-lucide="package-check" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <div class="text-base font-bold text-slate-900 tracking-tight leading-none group-hover:text-indigo-600 transition-colors">MyShipping CargoTracker</div>
                            <div class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Express Logistics</div>
                        </div>
                    </a>

                    <!-- Nav Links -->
                    <nav class="hidden md:flex items-center gap-1">
                        <a href="index.php" class="px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors <?= $currentPage === 'index.php' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' ?>">
                            <i data-lucide="plus-circle" class="w-4 h-4"></i>
                            <span>New Consignment</span>
                        </a>

                        <a href="shipments.php" class="px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors <?= $currentPage === 'shipments.php' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' ?>">
                            <i data-lucide="list" class="w-4 h-4"></i>
                            <span>Shipments Registry</span>
                        </a>

                        <a href="boxes.php" class="px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors <?= $currentPage === 'boxes.php' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' ?>">
                            <i data-lucide="box" class="w-4 h-4"></i>
                            <span>Bulk Boxes</span>
                        </a>

                        <?php if (isAdmin()): ?>
                        <a href="users.php" class="px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors <?= $currentPage === 'users.php' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' ?>">
                            <i data-lucide="users" class="w-4 h-4"></i>
                            <span>Worker Roles & Staff</span>
                        </a>
                        <?php endif; ?>
                    </nav>
                </div>

                <!-- User Profile & Actions -->
                <div class="flex items-center gap-3">
                    <?php if ($user): ?>
                        <div class="hidden sm:flex flex-col items-end">
                            <div class="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <span><?= htmlspecialchars($user['full_name']) ?></span>
                                <span class="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider <?= $user['role'] === 'admin' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-slate-100 text-slate-600 border border-slate-200' ?>">
                                    <?= htmlspecialchars($user['role']) ?>
                                </span>
                            </div>
                            <span class="text-[11px] text-slate-400 font-mono"><?= htmlspecialchars($user['email']) ?></span>
                        </div>

                        <a href="logout.php" title="Sign Out" class="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors">
                            <i data-lucide="log-out" class="w-4 h-4"></i>
                        </a>
                    <?php else: ?>
                        <a href="login.php" class="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5">
                            <i data-lucide="log-in" class="w-4 h-4"></i>
                            <span>Sign In</span>
                        </a>
                    <?php endif; ?>
                </div>

            </div>
        </div>

        <!-- Mobile Sub-Nav -->
        <div class="md:hidden border-t border-slate-200 bg-slate-50 px-4 py-2 flex items-center justify-around text-xs">
            <a href="index.php" class="flex flex-col items-center gap-1 py-1 font-semibold <?= $currentPage === 'index.php' ? 'text-indigo-600' : 'text-slate-600' ?>">
                <i data-lucide="plus-circle" class="w-4 h-4"></i>
                <span>New</span>
            </a>
            <a href="shipments.php" class="flex flex-col items-center gap-1 py-1 font-semibold <?= $currentPage === 'shipments.php' ? 'text-indigo-600' : 'text-slate-600' ?>">
                <i data-lucide="list" class="w-4 h-4"></i>
                <span>Parcels</span>
            </a>
            <a href="boxes.php" class="flex flex-col items-center gap-1 py-1 font-semibold <?= $currentPage === 'boxes.php' ? 'text-indigo-600' : 'text-slate-600' ?>">
                <i data-lucide="box" class="w-4 h-4"></i>
                <span>Boxes</span>
            </a>
            <?php if (isAdmin()): ?>
            <a href="users.php" class="flex flex-col items-center gap-1 py-1 font-semibold <?= $currentPage === 'users.php' ? 'text-indigo-600' : 'text-slate-600' ?>">
                <i data-lucide="users" class="w-4 h-4"></i>
                <span>Workers</span>
            </a>
            <?php endif; ?>
        </div>
    </header>

    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
