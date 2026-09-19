<?php
/**
 * Bulk Boxes Management & Master Carton Packing
 */
require_once __DIR__ . '/includes/auth.php';
requireLogin();

$pageTitle = 'Bulk Boxes';
$db = getDBConnection();
$user = currentUser();

$success = null;
$error = null;

// 1. Handle New Box Creation
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'create_box') {
    if (verifyCsrfToken($_POST['csrf_token'] ?? '')) {
        $boxCode     = trim($_POST['box_code'] ?? '');
        $carrier     = trim($_POST['carrier'] ?? 'FedEx Express');
        $routeName   = trim($_POST['route_name'] ?? 'Domestic Priority');
        $destination = trim($_POST['destination'] ?? '');
        $maxWeight   = floatval($_POST['max_weight_kg'] ?? 30.0);
        $notes       = trim($_POST['notes'] ?? '');

        if (empty($boxCode) || empty($destination)) {
            $error = 'Please provide both Box Code and Destination.';
        } else {
            // Check uniqueness
            $chk = $db->prepare("SELECT id FROM boxes WHERE box_code = :code LIMIT 1");
            $chk->execute([':code' => $boxCode]);
            if ($chk->fetch()) {
                $error = "Box Code '{$boxCode}' already exists. Please use a unique identifier.";
            } else {
                $ins = $db->prepare("INSERT INTO boxes (box_code, carrier, route_name, destination, status, max_weight_kg, notes, created_by, created_at) 
                                     VALUES (:code, :carrier, :route, :dest, 'Open', :max_wt, :notes, :user_id, NOW())");
                $ins->execute([
                    ':code'    => $boxCode,
                    ':carrier' => $carrier,
                    ':route'   => $routeName,
                    ':dest'    => $destination,
                    ':max_wt'  => $maxWeight,
                    ':notes'   => $notes,
                    ':user_id' => $user['id'],
                ]);
                $success = "Bulk Box '{$boxCode}' created successfully!";
            }
        }
    }
}

// 2. Handle Pack Parcel into Box (Quick Scan)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'pack_parcel') {
    if (verifyCsrfToken($_POST['csrf_token'] ?? '')) {
        $boxId = intval($_POST['target_box_id'] ?? 0);
        $trackingNumber = trim($_POST['parcel_tracking'] ?? '');

        if (!empty($boxId) && !empty($trackingNumber)) {
            // Find parcel
            $find = $db->prepare("SELECT id, tracking_number, weight_kg, box_id FROM shipments WHERE tracking_number = :tn LIMIT 1");
            $find->execute([':tn' => $trackingNumber]);
            $parcel = $find->fetch();

            if (!$parcel) {
                $error = "Parcel '{$trackingNumber}' not found in registry.";
            } else {
                $upd = $db->prepare("UPDATE shipments SET box_id = :box_id WHERE id = :id");
                $upd->execute([':box_id' => $boxId, ':id' => $parcel['id']]);
                $success = "Parcel '{$trackingNumber}' packed into box successfully!";
            }
        }
    }
}

// 3. Handle Status Update (e.g. Seal Box / Dispatch)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'update_box_status') {
    if (verifyCsrfToken($_POST['csrf_token'] ?? '')) {
        $boxId     = intval($_POST['box_id'] ?? 0);
        $newStatus = $_POST['status'] ?? 'Open';
        $allowed   = ['Open', 'Sealed', 'Dispatched'];

        if (in_array($newStatus, $allowed, true)) {
            $sealedAt = ($newStatus === 'Sealed' || $newStatus === 'Dispatched') ? date('Y-m-d H:i:s') : null;
            $upd = $db->prepare("UPDATE boxes SET status = :st, sealed_at = COALESCE(sealed_at, :sealed) WHERE id = :id");
            $upd->execute([':st' => $newStatus, ':sealed' => $sealedAt, ':id' => $boxId]);
            $success = "Box status updated to {$newStatus}.";
        }
    }
}

// Fetch all boxes with aggregated weight and parcel counts
$sql = "SELECT b.*, 
        COUNT(s.id) AS parcel_count, 
        COALESCE(SUM(s.weight_kg), 0) AS current_weight_kg 
        FROM boxes b 
        LEFT JOIN shipments s ON b.id = s.box_id 
        GROUP BY b.id 
        ORDER BY b.id DESC";
$boxes = $db->query($sql)->fetchAll();

// Default new box code (e.g. BOX-2609-84)
$defaultBoxCode = 'BOX-' . date('ymd') . '-' . mt_rand(10, 99);

require_once __DIR__ . '/includes/header.php';
?>

<div class="space-y-6">

    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
            <h1 class="text-xl font-bold text-slate-900 flex items-center gap-2">
                <i data-lucide="box" class="w-6 h-6 text-indigo-600"></i>
                <span>Bulk Master Boxes & Consolidation</span>
            </h1>
            <p class="text-xs text-slate-500 mt-0.5">Consolidate multiple parcels into master shipping cartons for batch dispatch</p>
        </div>

        <button onclick="document.getElementById('newBoxModal').classList.remove('hidden')" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer">
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>Create New Box</span>
        </button>
    </div>

    <!-- Feedback Alerts -->
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

    <!-- Quick Scan Barcode to Pack Parcel into Open Box -->
    <div class="bg-indigo-900 text-white rounded-2xl p-5 shadow-md shadow-indigo-950/20">
        <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
                <h3 class="text-sm font-bold text-white flex items-center gap-2">
                    <i data-lucide="scan-barcode" class="w-4 h-4 text-indigo-300"></i>
                    <span>Quick Scan Parcel into Box</span>
                </h3>
                <p class="text-xs text-indigo-200 mt-0.5">Scan tracking barcode on physical parcel to assign it immediately to an open bulk box</p>
            </div>

            <form method="POST" action="boxes.php" class="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <input type="hidden" name="action" value="pack_parcel">
                <input type="hidden" name="csrf_token" value="<?= csrfToken() ?>">

                <select name="target_box_id" required class="px-3 py-2 bg-indigo-950 border border-indigo-700 text-white rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    <option value="">-- Choose Open Box --</option>
                    <?php foreach ($boxes as $b): ?>
                        <?php if ($b['status'] === 'Open'): ?>
                            <option value="<?= $b['id'] ?>">
                                <?= htmlspecialchars($b['box_code']) ?> &bull; <?= htmlspecialchars($b['destination']) ?>
                            </option>
                        <?php endif; ?>
                    <?php endforeach; ?>
                </select>

                <input 
                    type="text" 
                    name="parcel_tracking" 
                    required 
                    placeholder="Scan Tracking Number..." 
                    class="px-3.5 py-2 bg-white text-slate-900 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-400 w-48"
                >

                <button type="submit" class="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer">
                    <i data-lucide="package-check" class="w-4 h-4"></i>
                    <span>Pack Parcel</span>
                </button>
            </form>
        </div>
    </div>

    <!-- Boxes Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <?php if (empty($boxes)): ?>
            <div class="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                <i data-lucide="box" class="w-10 h-10 mx-auto text-slate-300 mb-2"></i>
                <h3 class="text-sm font-bold text-slate-700">No Bulk Boxes Created Yet</h3>
                <p class="text-xs text-slate-400 mt-1">Create your first box to consolidate individual parcels into master shipments</p>
            </div>
        <?php else: ?>
            <?php foreach ($boxes as $box): ?>
                <?php
                $pct = $box['max_weight_kg'] > 0 ? min(100, round(($box['current_weight_kg'] / $box['max_weight_kg']) * 100)) : 0;
                $statusColors = [
                    'Open' => 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    'Sealed' => 'bg-amber-50 text-amber-700 border-amber-200',
                    'Dispatched' => 'bg-purple-50 text-purple-700 border-purple-200',
                ];
                ?>
                <div class="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all">
                    
                    <!-- Top Bar -->
                    <div class="flex items-start justify-between">
                        <div>
                            <span class="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Master Box</span>
                            <h3 class="text-base font-extrabold text-slate-900 font-mono tracking-wider"><?= htmlspecialchars($box['box_code']) ?></h3>
                            <div class="text-xs text-slate-500 mt-0.5"><?= htmlspecialchars($box['destination']) ?></div>
                        </div>

                        <!-- Status Badge & Form -->
                        <form method="POST" action="boxes.php">
                            <input type="hidden" name="action" value="update_box_status">
                            <input type="hidden" name="csrf_token" value="<?= csrfToken() ?>">
                            <input type="hidden" name="box_id" value="<?= $box['id'] ?>">

                            <select name="status" onchange="this.form.submit()" class="text-[11px] font-bold px-2.5 py-1 rounded-full border <?= $statusColors[$box['status']] ?? '' ?> cursor-pointer focus:outline-none">
                                <option value="Open" <?= $box['status'] === 'Open' ? 'selected' : '' ?>>Open</option>
                                <option value="Sealed" <?= $box['status'] === 'Sealed' ? 'selected' : '' ?>>Sealed</option>
                                <option value="Dispatched" <?= $box['status'] === 'Dispatched' ? 'selected' : '' ?>>Dispatched</option>
                            </select>
                        </form>
                    </div>

                    <!-- Specs & Weight Bar -->
                    <div class="space-y-2">
                        <div class="flex items-center justify-between text-xs">
                            <span class="text-slate-500">Weight Capacity:</span>
                            <span class="font-bold text-slate-800 font-mono">
                                <?= number_format($box['current_weight_kg'], 2) ?> / <?= number_format($box['max_weight_kg'], 2) ?> kg
                            </span>
                        </div>

                        <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div class="h-2 rounded-full transition-all <?= $pct >= 90 ? 'bg-rose-500' : ($pct >= 70 ? 'bg-amber-500' : 'bg-indigo-600') ?>" style="width: <?= $pct ?>%"></div>
                        </div>

                        <div class="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                            <span><?= htmlspecialchars($box['carrier']) ?></span>
                            <span class="font-bold text-slate-700"><?= $box['parcel_count'] ?> parcels packed</span>
                        </div>
                    </div>

                    <!-- Footer Actions -->
                    <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <a href="shipments.php?box_id=<?= $box['id'] ?>" class="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1">
                            <i data-lucide="eye" class="w-3.5 h-3.5"></i>
                            <span>View Parcels (<?= $box['parcel_count'] ?>)</span>
                        </a>

                        <span class="text-[10px] text-slate-400">
                            Created <?= date('M d', strtotime($box['created_at'])) ?>
                        </span>
                    </div>

                </div>
            <?php endforeach; ?>
        <?php endif; ?>
    </div>

</div>

<!-- Modal: Create New Bulk Box -->
<div id="newBoxModal" class="hidden fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
    <div class="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
                <i data-lucide="box" class="w-4 h-4 text-indigo-600"></i>
                <span>Create New Bulk Master Box</span>
            </h3>
            <button onclick="document.getElementById('newBoxModal').classList.add('hidden')" class="text-slate-400 hover:text-slate-600">
                <i data-lucide="x" class="w-4 h-4"></i>
            </button>
        </div>

        <form method="POST" action="boxes.php" class="p-6 space-y-4">
            <input type="hidden" name="action" value="create_box">
            <input type="hidden" name="csrf_token" value="<?= csrfToken() ?>">

            <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Box Code / Barcode <span class="text-rose-500">*</span>
                </label>
                <input type="text" name="box_code" required value="<?= htmlspecialchars($defaultBoxCode) ?>" class="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500">
            </div>

            <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Destination Hub / City <span class="text-rose-500">*</span>
                </label>
                <input type="text" name="destination" required placeholder="e.g. Chicago Central Hub" class="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500">
            </div>

            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Carrier Service
                    </label>
                    <select name="carrier" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900">
                        <option value="FedEx Express">FedEx Express</option>
                        <option value="UPS Ground">UPS Ground</option>
                        <option value="DHL Express">DHL Express</option>
                        <option value="Regional Cargo Fleet">Regional Cargo Fleet</option>
                    </select>
                </div>

                <div>
                    <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Max Capacity (kg)
                    </label>
                    <input type="number" step="0.5" name="max_weight_kg" value="30.0" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono">
                </div>
            </div>

            <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Route / Flight Number
                </label>
                <input type="text" name="route_name" value="Domestic Priority Trunkline" class="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900">
            </div>

            <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onclick="document.getElementById('newBoxModal').classList.add('hidden')" class="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800">
                    Cancel
                </button>
                <button type="submit" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors">
                    Create Box
                </button>
            </div>
        </form>
    </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
