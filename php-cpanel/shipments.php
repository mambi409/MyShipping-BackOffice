<?php
/**
 * Shipments Registry - Search, Filter, and Manage Parcels
 */
require_once __DIR__ . '/includes/auth.php';
requireLogin();

$pageTitle = 'Shipments Registry';
$db = getDBConnection();
$user = currentUser();

// Handle quick status update via POST
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'update_status') {
    if (verifyCsrfToken($_POST['csrf_token'] ?? '')) {
        $shipmentId = intval($_POST['shipment_id'] ?? 0);
        $newStatus  = $_POST['status'] ?? 'Received';
        $allowedStatuses = ['Received', 'In Transit', 'Out for Delivery', 'Delivered', 'On Hold'];

        if (in_array($newStatus, $allowedStatuses, true)) {
            $stmt = $db->prepare("UPDATE shipments SET status = :status WHERE id = :id");
            $stmt->execute([':status' => $newStatus, ':id' => $shipmentId]);
        }
    }
    header('Location: shipments.php?' . http_build_query($_GET));
    exit;
}

// Search and Filter parameters
$search  = trim($_GET['q'] ?? '');
$status  = trim($_GET['status'] ?? '');
$carrier = trim($_GET['carrier'] ?? '');
$boxId   = trim($_GET['box_id'] ?? '');

$where = [];
$params = [];

if (!empty($search)) {
    $where[] = "(s.tracking_number LIKE :q1 OR s.sender_name LIKE :q2 OR s.receiver_name LIKE :q3 OR s.receiver_city LIKE :q4)";
    $qTerm = "%{$search}%";
    $params[':q1'] = $qTerm;
    $params[':q2'] = $qTerm;
    $params[':q3'] = $qTerm;
    $params[':q4'] = $qTerm;
}

if (!empty($status)) {
    $where[] = "s.status = :status";
    $params[':status'] = $status;
}

if (!empty($carrier)) {
    $where[] = "s.carrier = :carrier";
    $params[':carrier'] = $carrier;
}

if (!empty($boxId)) {
    $where[] = "s.box_id = :box_id";
    $params[':box_id'] = intval($boxId);
}

$whereSql = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

// Query shipments with joined box code and user details
$sql = "SELECT s.*, b.box_code, u.full_name AS creator_name 
        FROM shipments s 
        LEFT JOIN boxes b ON s.box_id = b.id 
        LEFT JOIN users u ON s.created_by = u.id 
        {$whereSql} 
        ORDER BY s.id DESC 
        LIMIT 150";

$stmt = $db->prepare($sql);
$stmt->execute($params);
$shipments = $stmt->fetchAll();

// Quick statistics
$statsStmt = $db->query("SELECT 
    COUNT(*) AS total,
    SUM(CASE WHEN status = 'Received' THEN 1 ELSE 0 END) AS received_count,
    SUM(CASE WHEN status = 'In Transit' THEN 1 ELSE 0 END) AS transit_count,
    SUM(CASE WHEN status = 'Out for Delivery' THEN 1 ELSE 0 END) AS delivery_count,
    SUM(CASE WHEN status = 'Delivered' THEN 1 ELSE 0 END) AS delivered_count
    FROM shipments");
$stats = $statsStmt->fetch();

require_once __DIR__ . '/includes/header.php';
?>

<div class="space-y-6">

    <!-- Page Title & Metrics -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
            <h1 class="text-xl font-bold text-slate-900 flex items-center gap-2">
                <i data-lucide="package" class="w-6 h-6 text-indigo-600"></i>
                <span>Shipments & Consignments Registry</span>
            </h1>
            <p class="text-xs text-slate-500 mt-0.5">Tracking, status monitoring, and label re-printing for all logged parcels</p>
        </div>

        <div class="flex items-center gap-2">
            <a href="index.php" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5">
                <i data-lucide="plus-circle" class="w-4 h-4"></i>
                <span>New Consignment</span>
            </a>
        </div>
    </div>

    <!-- Metric Counters (Anti-Slop Clean Metrics) -->
    <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <a href="shipments.php" class="p-3.5 rounded-xl border bg-white hover:border-indigo-400 transition-colors <?= empty($status) ? 'border-indigo-500 shadow-xs' : 'border-slate-200' ?>">
            <span class="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Logged</span>
            <span class="text-xl font-extrabold text-slate-900 mt-1 block"><?= number_format($stats['total'] ?? 0) ?></span>
        </a>

        <a href="shipments.php?status=Received" class="p-3.5 rounded-xl border bg-white hover:border-blue-400 transition-colors <?= $status === 'Received' ? 'border-blue-500 shadow-xs' : 'border-slate-200' ?>">
            <span class="block text-[11px] font-semibold uppercase tracking-wider text-blue-600">Received at Hub</span>
            <span class="text-xl font-extrabold text-blue-900 mt-1 block"><?= number_format($stats['received_count'] ?? 0) ?></span>
        </a>

        <a href="shipments.php?status=In+Transit" class="p-3.5 rounded-xl border bg-white hover:border-amber-400 transition-colors <?= $status === 'In Transit' ? 'border-amber-500 shadow-xs' : 'border-slate-200' ?>">
            <span class="block text-[11px] font-semibold uppercase tracking-wider text-amber-600">In Transit</span>
            <span class="text-xl font-extrabold text-amber-900 mt-1 block"><?= number_format($stats['transit_count'] ?? 0) ?></span>
        </a>

        <a href="shipments.php?status=Out+for+Delivery" class="p-3.5 rounded-xl border bg-white hover:border-purple-400 transition-colors <?= $status === 'Out for Delivery' ? 'border-purple-500 shadow-xs' : 'border-slate-200' ?>">
            <span class="block text-[11px] font-semibold uppercase tracking-wider text-purple-600">Out for Delivery</span>
            <span class="text-xl font-extrabold text-purple-900 mt-1 block"><?= number_format($stats['delivery_count'] ?? 0) ?></span>
        </a>

        <a href="shipments.php?status=Delivered" class="p-3.5 rounded-xl border bg-white hover:border-emerald-400 transition-colors <?= $status === 'Delivered' ? 'border-emerald-500 shadow-xs' : 'border-slate-200' ?>">
            <span class="block text-[11px] font-semibold uppercase tracking-wider text-emerald-600">Delivered</span>
            <span class="text-xl font-extrabold text-emerald-900 mt-1 block"><?= number_format($stats['delivered_count'] ?? 0) ?></span>
        </a>
    </div>

    <!-- Search & Filter Filterbar -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
        <form method="GET" action="shipments.php" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            
            <div>
                <label class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Search Keywords</label>
                <div class="relative">
                    <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-2.5"></i>
                    <input 
                        type="text" 
                        name="q" 
                        value="<?= htmlspecialchars($search) ?>" 
                        placeholder="Tracking, Sender, Receiver..." 
                        class="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    >
                </div>
            </div>

            <div>
                <label class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Status Filter</label>
                <select name="status" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500">
                    <option value="">All Statuses</option>
                    <option value="Received" <?= $status === 'Received' ? 'selected' : '' ?>>Received</option>
                    <option value="In Transit" <?= $status === 'In Transit' ? 'selected' : '' ?>>In Transit</option>
                    <option value="Out for Delivery" <?= $status === 'Out for Delivery' ? 'selected' : '' ?>>Out for Delivery</option>
                    <option value="Delivered" <?= $status === 'Delivered' ? 'selected' : '' ?>>Delivered</option>
                    <option value="On Hold" <?= $status === 'On Hold' ? 'selected' : '' ?>>On Hold</option>
                </select>
            </div>

            <div>
                <label class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Carrier</label>
                <select name="carrier" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500">
                    <option value="">All Carriers</option>
                    <option value="FedEx Express" <?= $carrier === 'FedEx Express' ? 'selected' : '' ?>>FedEx Express</option>
                    <option value="UPS Ground" <?= $carrier === 'UPS Ground' ? 'selected' : '' ?>>UPS Ground</option>
                    <option value="DHL Express" <?= $carrier === 'DHL Express' ? 'selected' : '' ?>>DHL Express</option>
                    <option value="USPS Priority" <?= $carrier === 'USPS Priority' ? 'selected' : '' ?>>USPS Priority</option>
                </select>
            </div>

            <div class="flex items-end gap-2">
                <button type="submit" class="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                    <i data-lucide="filter" class="w-3.5 h-3.5"></i>
                    <span>Apply Filter</span>
                </button>
                <a href="shipments.php" class="px-3 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 rounded-xl transition-colors">
                    Reset
                </a>
            </div>
        </form>
    </div>

    <!-- Data Table -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
                <thead>
                    <tr class="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px] tracking-wider">
                        <th class="py-3 px-4">Tracking Code</th>
                        <th class="py-3 px-4">Consignment Info</th>
                        <th class="py-3 px-4">Sender & Receiver</th>
                        <th class="py-3 px-4">Carrier / Route</th>
                        <th class="py-3 px-4">Status</th>
                        <th class="py-3 px-4">Photo</th>
                        <th class="py-3 px-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    <?php if (empty($shipments)): ?>
                        <tr>
                            <td colspan="7" class="py-12 text-center text-slate-400">
                                <i data-lucide="package-x" class="w-8 h-8 mx-auto text-slate-300 mb-2"></i>
                                <p class="font-medium text-slate-600">No shipments found matching your filters</p>
                                <p class="text-[11px] text-slate-400 mt-1">Try clearing your search query or log a new consignment</p>
                            </td>
                        </tr>
                    <?php else: ?>
                        <?php foreach ($shipments as $item): ?>
                            <?php
                            // Status color pill
                            $statusColors = [
                                'Received' => 'bg-blue-50 text-blue-700 border-blue-200',
                                'In Transit' => 'bg-amber-50 text-amber-700 border-amber-200',
                                'Out for Delivery' => 'bg-purple-50 text-purple-700 border-purple-200',
                                'Delivered' => 'bg-emerald-50 text-emerald-700 border-emerald-200',
                                'On Hold' => 'bg-rose-50 text-rose-700 border-rose-200',
                            ];
                            $statusClass = $statusColors[$item['status']] ?? 'bg-slate-50 text-slate-700 border-slate-200';
                            ?>
                            <tr class="hover:bg-slate-50/80 transition-colors">
                                <!-- Tracking -->
                                <td class="py-3.5 px-4 align-top font-mono">
                                    <div class="font-bold text-slate-900 tracking-wider">
                                        <?= htmlspecialchars($item['tracking_number']) ?>
                                    </div>
                                    <div class="text-[10px] text-slate-400 mt-0.5">
                                        <?= date('M d, Y H:i', strtotime($item['created_at'])) ?>
                                    </div>
                                    <?php if (!empty($item['box_code'])): ?>
                                        <a href="boxes.php?search=<?= urlencode($item['box_code']) ?>" class="inline-flex items-center gap-1 mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 hover:underline">
                                            <i data-lucide="box" class="w-3 h-3"></i>
                                            <span>Box: <?= htmlspecialchars($item['box_code']) ?></span>
                                        </a>
                                    <?php endif; ?>
                                </td>

                                <!-- Specs -->
                                <td class="py-3.5 px-4 align-top">
                                    <div class="font-bold text-slate-800"><?= number_format($item['weight_kg'], 2) ?> kg</div>
                                    <div class="text-[11px] text-slate-500"><?= htmlspecialchars($item['pieces']) ?> pcs &bull; <?= htmlspecialchars($item['dimensions']) ?></div>
                                    <?php if (!empty($item['notes'])): ?>
                                        <div class="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mt-1 border border-amber-200 max-w-[180px] truncate" title="<?= htmlspecialchars($item['notes']) ?>">
                                            <?= htmlspecialchars($item['notes']) ?>
                                        </div>
                                    <?php endif; ?>
                                </td>

                                <!-- Sender & Receiver -->
                                <td class="py-3.5 px-4 align-top space-y-1">
                                    <div>
                                        <span class="text-[10px] font-semibold uppercase text-slate-400">To:</span>
                                        <strong class="text-slate-900"><?= htmlspecialchars($item['receiver_name']) ?></strong>
                                        <span class="text-slate-500 font-normal">(<?= htmlspecialchars($item['receiver_city']) ?>)</span>
                                    </div>
                                    <div class="text-[11px] text-slate-500">
                                        <span class="text-[10px] font-semibold uppercase text-slate-400">From:</span>
                                        <?= htmlspecialchars($item['sender_name']) ?> &bull; <?= htmlspecialchars($item['sender_city']) ?>
                                    </div>
                                </td>

                                <!-- Carrier / Route -->
                                <td class="py-3.5 px-4 align-top">
                                    <div class="font-semibold text-slate-800"><?= htmlspecialchars($item['carrier']) ?></div>
                                    <div class="text-[11px] text-slate-500"><?= htmlspecialchars($item['route_remarks'] ?: 'Standard Dispatch') ?></div>
                                </td>

                                <!-- Status & Quick Update Form -->
                                <td class="py-3.5 px-4 align-top">
                                    <form method="POST" action="shipments.php" class="inline-block">
                                        <input type="hidden" name="action" value="update_status">
                                        <input type="hidden" name="csrf_token" value="<?= csrfToken() ?>">
                                        <input type="hidden" name="shipment_id" value="<?= $item['id'] ?>">
                                        
                                        <select 
                                            name="status" 
                                            onchange="this.form.submit()" 
                                            class="text-[11px] font-bold px-2 py-1 rounded-lg border <?= $statusClass ?> cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        >
                                            <option value="Received" <?= $item['status'] === 'Received' ? 'selected' : '' ?>>Received</option>
                                            <option value="In Transit" <?= $item['status'] === 'In Transit' ? 'selected' : '' ?>>In Transit</option>
                                            <option value="Out for Delivery" <?= $item['status'] === 'Out for Delivery' ? 'selected' : '' ?>>Out for Delivery</option>
                                            <option value="Delivered" <?= $item['status'] === 'Delivered' ? 'selected' : '' ?>>Delivered</option>
                                            <option value="On Hold" <?= $item['status'] === 'On Hold' ? 'selected' : '' ?>>On Hold</option>
                                        </select>
                                    </form>
                                </td>

                                <!-- Photo Thumbnail -->
                                <td class="py-3.5 px-4 align-top">
                                    <?php if (!empty($item['package_image']) && file_exists(__DIR__ . '/' . $item['package_image'])): ?>
                                        <a href="<?= htmlspecialchars($item['package_image']) ?>" target="_blank" title="Click to view full photo" class="block w-11 h-11 rounded-lg overflow-hidden border border-slate-300 hover:scale-105 transition-transform bg-slate-900 shadow-xs">
                                            <img src="<?= htmlspecialchars($item['package_image']) ?>" alt="Package" class="w-full h-full object-cover">
                                        </a>
                                    <?php else: ?>
                                        <span class="text-slate-300 italic text-[11px]">None</span>
                                    <?php endif; ?>
                                </td>

                                <!-- Actions -->
                                <td class="py-3.5 px-4 align-top text-right whitespace-nowrap">
                                    <div class="flex items-center justify-end gap-1.5">
                                        <a 
                                            href="print_label.php?id=<?= $item['id'] ?>&type=label" 
                                            target="_blank"
                                            title="Print 4x6 Thermal Label"
                                            class="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200 transition-colors"
                                        >
                                            <i data-lucide="printer" class="w-4 h-4"></i>
                                        </a>

                                        <a 
                                            href="print_label.php?id=<?= $item['id'] ?>&type=receipt" 
                                            target="_blank"
                                            title="Print Customer Receipt"
                                            class="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg border border-slate-200 transition-colors"
                                        >
                                            <i data-lucide="receipt" class="w-4 h-4"></i>
                                        </a>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>

</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
