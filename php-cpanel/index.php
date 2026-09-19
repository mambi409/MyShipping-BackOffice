<?php
/**
 * Consignment Intake & New Shipment Form
 */
require_once __DIR__ . '/includes/auth.php';
requireLogin();

$pageTitle = 'New Consignment';
$db = getDBConnection();
$user = currentUser();

$success = null;
$error = null;
$newRecord = null;

// Fetch active open boxes for dropdown
$boxesStmt = $db->query("SELECT id, box_code, destination, carrier FROM boxes WHERE status = 'Open' ORDER BY id DESC");
$openBoxes = $boxesStmt->fetchAll();

// Fetch routes
$routesStmt = $db->query("SELECT * FROM routes ORDER BY name ASC");
$routes = $routesStmt->fetchAll();

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!verifyCsrfToken($_POST['csrf_token'] ?? '')) {
        $error = 'Security session expired. Please refresh and try again.';
    } else {
        $trackingNumber = trim($_POST['tracking_number'] ?? '');
        $senderName     = trim($_POST['sender_name'] ?? '');
        $senderPhone    = trim($_POST['sender_phone'] ?? '');
        $senderCity     = trim($_POST['sender_city'] ?? '');
        $senderCountry  = trim($_POST['sender_country'] ?? 'United States');
        
        $receiverName   = trim($_POST['receiver_name'] ?? '');
        $receiverPhone  = trim($_POST['receiver_phone'] ?? '');
        $receiverAddress= trim($_POST['receiver_address'] ?? '');
        $receiverCity   = trim($_POST['receiver_city'] ?? '');
        $receiverCountry= trim($_POST['receiver_country'] ?? 'United States');
        
        $carrier        = trim($_POST['carrier'] ?? 'FedEx Express');
        $routeRemarks   = trim($_POST['route_remarks'] ?? '');
        $weightKg       = floatval($_POST['weight_kg'] ?? 1.0);
        $dimensions     = trim($_POST['dimensions'] ?? '30x20x15 cm');
        $pieces         = intval($_POST['pieces'] ?? 1);
        $status         = $_POST['status'] ?? 'Received';
        $boxId          = !empty($_POST['box_id']) ? intval($_POST['box_id']) : null;
        $notes          = trim($_POST['notes'] ?? '');

        // Validation
        if (empty($trackingNumber) || empty($senderName) || empty($senderPhone) || empty($receiverName) || empty($receiverPhone) || empty($receiverAddress)) {
            $error = 'Please fill out all required fields (Sender, Receiver, and Tracking details).';
        } else {
            // Check tracking number uniqueness
            $checkStmt = $db->prepare("SELECT id FROM shipments WHERE tracking_number = :tn LIMIT 1");
            $checkStmt->execute([':tn' => $trackingNumber]);
            if ($checkStmt->fetch()) {
                $error = "Tracking number {$trackingNumber} already exists in the registry. Please generate a unique number.";
            } else {
                // Handle Package Photo (Either via direct file upload OR base64 camera snapshot)
                $packageImagePath = null;
                $uploadDir = __DIR__ . '/uploads/packages/';

                if (!is_dir($uploadDir)) {
                    @mkdir($uploadDir, 0755, true);
                }

                // 1. Camera Snapshot (Base64 data URL)
                if (!empty($_POST['camera_snapshot_data'])) {
                    $data = $_POST['camera_snapshot_data'];
                    if (preg_match('/^data:image\/(png|jpeg|jpg|webp);base64,/', $data, $matches)) {
                        $ext = $matches[1] === 'jpeg' ? 'jpg' : $matches[1];
                        $base64 = substr($data, strpos($data, ',') + 1);
                        $decoded = base64_decode($base64);
                        if ($decoded !== false) {
                            $filename = 'pkg_' . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
                            if (file_put_contents($uploadDir . $filename, $decoded)) {
                                $packageImagePath = 'uploads/packages/' . $filename;
                            }
                        }
                    }
                }
                // 2. Standard File Upload
                elseif (isset($_FILES['package_file']) && $_FILES['package_file']['error'] === UPLOAD_ERR_OK) {
                    $fileTmp  = $_FILES['package_file']['tmp_name'];
                    $fileSize = $_FILES['package_file']['size'];
                    $finfo    = new finfo(FILEINFO_MIME_TYPE);
                    $mime     = $finfo->file($fileTmp);
                    $allowedMimes = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];

                    if (isset($allowedMimes[$mime]) && $fileSize <= (8 * 1024 * 1024)) {
                        $ext = $allowedMimes[$mime];
                        $filename = 'pkg_' . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
                        if (move_uploaded_file($fileTmp, $uploadDir . $filename)) {
                            $packageImagePath = 'uploads/packages/' . $filename;
                        }
                    }
                }

                // Insert into Database
                $insertSql = "INSERT INTO shipments (
                    tracking_number, barcode, sender_name, sender_phone, sender_city, sender_country,
                    receiver_name, receiver_phone, receiver_address, receiver_city, receiver_country,
                    carrier, route_remarks, weight_kg, dimensions, pieces, status, box_id,
                    package_image, notes, created_by, created_at
                ) VALUES (
                    :tracking_number, :barcode, :sender_name, :sender_phone, :sender_city, :sender_country,
                    :receiver_name, :receiver_phone, :receiver_address, :receiver_city, :receiver_country,
                    :carrier, :route_remarks, :weight_kg, :dimensions, :pieces, :status, :box_id,
                    :package_image, :notes, :created_by, NOW()
                )";

                try {
                    $insertStmt = $db->prepare($insertSql);
                    $insertStmt->execute([
                        ':tracking_number' => $trackingNumber,
                        ':barcode'         => $trackingNumber,
                        ':sender_name'     => $senderName,
                        ':sender_phone'    => $senderPhone,
                        ':sender_city'     => $senderCity,
                        ':sender_country'  => $senderCountry,
                        ':receiver_name'   => $receiverName,
                        ':receiver_phone'  => $receiverPhone,
                        ':receiver_address'=> $receiverAddress,
                        ':receiver_city'   => $receiverCity,
                        ':receiver_country'=> $receiverCountry,
                        ':carrier'         => $carrier,
                        ':route_remarks'   => $routeRemarks,
                        ':weight_kg'       => $weightKg,
                        ':dimensions'      => $dimensions,
                        ':pieces'          => $pieces,
                        ':status'          => $status,
                        ':box_id'          => $boxId,
                        ':package_image'   => $packageImagePath,
                        ':notes'           => $notes,
                        ':created_by'      => $user['id'],
                    ]);

                    $newShipmentId = $db->lastInsertId();
                    $success = "Shipment registered successfully! Assigned tracking number: {$trackingNumber}";
                    $newRecord = [
                        'id' => $newShipmentId,
                        'tracking_number' => $trackingNumber,
                        'sender_name' => $senderName,
                        'receiver_name' => $receiverName,
                        'weight_kg' => $weightKg,
                    ];
                } catch (PDOException $e) {
                    $error = 'Database error: ' . $e->getMessage();
                }
            }
        }
    }
}

// Generate a default auto tracking number (e.g., EXP260918-4921)
$defaultTrackingNumber = 'EXP' . date('ymd') . '-' . str_pad(mt_rand(1000, 9999), 4, '0', STR_PAD_LEFT);

require_once __DIR__ . '/includes/header.php';
?>

<div class="space-y-6">

    <!-- Page Title & Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
            <h1 class="text-xl font-bold text-slate-900 flex items-center gap-2">
                <i data-lucide="package-plus" class="w-6 h-6 text-indigo-600"></i>
                <span>Consignment Intake Form</span>
            </h1>
            <p class="text-xs text-slate-500 mt-0.5">Register new parcel, generate scannable barcode, and print shipping label</p>
        </div>

        <div class="flex items-center gap-2">
            <a href="shipments.php" class="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors shadow-xs">
                <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i>
                <span>View Shipments Registry</span>
            </a>
        </div>
    </div>

    <!-- Success Feedback Banner with Quick Action Buttons -->
    <?php if ($success && $newRecord): ?>
        <div class="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 shadow-sm space-y-3">
            <div class="flex items-start justify-between">
                <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <i data-lucide="check" class="w-5 h-5"></i>
                    </div>
                    <div>
                        <h3 class="text-sm font-bold text-emerald-950">Shipment Registered Successfully</h3>
                        <p class="text-xs text-emerald-800">
                            Assigned Tracking Number: <strong class="font-mono text-emerald-950"><?= htmlspecialchars($newRecord['tracking_number']) ?></strong>
                        </p>
                    </div>
                </div>

                <button onclick="this.closest('.p-5').remove()" class="text-emerald-700 hover:text-emerald-900 text-xs font-medium cursor-pointer">
                    Dismiss
                </button>
            </div>

            <!-- Print Actions -->
            <div class="flex flex-wrap items-center gap-2.5 pt-2 border-t border-emerald-200/60">
                <a 
                    href="print_label.php?id=<?= $newRecord['id'] ?>&type=label" 
                    target="_blank"
                    class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                    <i data-lucide="printer" class="w-4 h-4"></i>
                    <span>Print 4×6" Shipping Label</span>
                </a>

                <a 
                    href="print_label.php?id=<?= $newRecord['id'] ?>&type=receipt" 
                    target="_blank"
                    class="px-4 py-2 rounded-xl bg-white hover:bg-emerald-100/50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                    <i data-lucide="receipt" class="w-4 h-4"></i>
                    <span>Print Customer Receipt</span>
                </a>

                <a 
                    href="index.php" 
                    class="px-3.5 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                    <i data-lucide="plus" class="w-4 h-4"></i>
                    <span>Intake Another Parcel</span>
                </a>
            </div>
        </div>
    <?php endif; ?>

    <!-- Error Alert -->
    <?php if ($error): ?>
        <div class="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
            <i data-lucide="alert-circle" class="w-5 h-5 text-rose-600 shrink-0"></i>
            <span><?= htmlspecialchars($error) ?></span>
        </div>
    <?php endif; ?>

    <!-- Main Intake Form -->
    <form method="POST" action="index.php" enctype="multipart/form-data" id="shipmentForm" class="space-y-6">
        <input type="hidden" name="csrf_token" value="<?= csrfToken() ?>">
        <input type="hidden" name="camera_snapshot_data" id="cameraSnapshotInput" value="">

        <!-- Section 1: Tracking Number & Live Barcode Preview -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-2">
                    <span class="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">1</span>
                    <h2 class="text-sm font-bold text-slate-900">Tracking Code & Scannable Barcode</h2>
                </div>
                <button type="button" onclick="generateNewTrackingNumber()" class="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer">
                    <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
                    <span>Generate New Code</span>
                </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div>
                    <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Tracking Number / Consignment ID <span class="text-rose-500">*</span>
                    </label>
                    <input 
                        type="text" 
                        name="tracking_number" 
                        id="trackingInput"
                        required
                        value="<?= htmlspecialchars($_POST['tracking_number'] ?? $defaultTrackingNumber) ?>"
                        oninput="updateBarcode(this.value)"
                        class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 tracking-wider"
                    >
                    <p class="text-[11px] text-slate-500 mt-1">Accepts standard Code 128 barcodes, custom scanner codes, or auto-generated numbers.</p>
                </div>

                <!-- Live Barcode SVG Display -->
                <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center min-h-[100px]">
                    <svg id="barcodePreview" class="max-w-full"></svg>
                    <span id="barcodeText" class="text-xs font-mono text-slate-600 font-semibold tracking-widest mt-1"></span>
                </div>
            </div>
        </div>

        <!-- Section 2: Sender & Receiver Details (Side by Side) -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <!-- Sender Card -->
            <div class="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
                <div class="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <span class="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">2</span>
                    <h2 class="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <i data-lucide="send" class="w-4 h-4 text-blue-600"></i>
                        <span>Sender Information (Shipper)</span>
                    </h2>
                </div>

                <div>
                    <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Full Name / Business <span class="text-rose-500">*</span>
                    </label>
                    <input type="text" name="sender_name" required value="<?= htmlspecialchars($_POST['sender_name'] ?? '') ?>" placeholder="Acme Logistics LLC" class="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500">
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                            Phone Number <span class="text-rose-500">*</span>
                        </label>
                        <input type="text" name="sender_phone" required value="<?= htmlspecialchars($_POST['sender_phone'] ?? '') ?>" placeholder="+1 (555) 019-2834" class="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono">
                    </div>

                    <div>
                        <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                            Origin City
                        </label>
                        <input type="text" name="sender_city" value="<?= htmlspecialchars($_POST['sender_city'] ?? 'Los Angeles') ?>" class="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500">
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Country
                    </label>
                    <input type="text" name="sender_country" value="<?= htmlspecialchars($_POST['sender_country'] ?? 'United States') ?>" class="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500">
                </div>
            </div>

            <!-- Receiver Card -->
            <div class="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
                <div class="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <span class="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">3</span>
                    <h2 class="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <i data-lucide="map-pin" class="w-4 h-4 text-emerald-600"></i>
                        <span>Receiver Information (Consignee)</span>
                    </h2>
                </div>

                <div>
                    <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Recipient Full Name <span class="text-rose-500">*</span>
                    </label>
                    <input type="text" name="receiver_name" required value="<?= htmlspecialchars($_POST['receiver_name'] ?? '') ?>" placeholder="John Doe" class="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500">
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                            Contact Phone <span class="text-rose-500">*</span>
                        </label>
                        <input type="text" name="receiver_phone" required value="<?= htmlspecialchars($_POST['receiver_phone'] ?? '') ?>" placeholder="+1 (555) 839-2019" class="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono">
                    </div>

                    <div>
                        <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                            Destination City <span class="text-rose-500">*</span>
                        </label>
                        <input type="text" name="receiver_city" required value="<?= htmlspecialchars($_POST['receiver_city'] ?? '') ?>" placeholder="New York" class="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500">
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Delivery Street Address <span class="text-rose-500">*</span>
                    </label>
                    <textarea name="receiver_address" rows="2" required placeholder="1248 Broadway, Suite 400" class="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"><?= htmlspecialchars($_POST['receiver_address'] ?? '') ?></textarea>
                </div>

                <div>
                    <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Destination Country
                    </label>
                    <input type="text" name="receiver_country" value="<?= htmlspecialchars($_POST['receiver_country'] ?? 'United States') ?>" class="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500">
                </div>
            </div>

        </div>

        <!-- Section 3: Shipment Specifications & Logistics -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div class="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span class="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center">4</span>
                <h2 class="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <i data-lucide="scale" class="w-4 h-4 text-purple-600"></i>
                    <span>Package Attributes & Carrier Selection</span>
                </h2>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                    <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Carrier Service <span class="text-rose-500">*</span>
                    </label>
                    <select name="carrier" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500">
                        <option value="FedEx Express" <?= (($_POST['carrier'] ?? '') === 'FedEx Express') ? 'selected' : '' ?>>FedEx Express</option>
                        <option value="UPS Ground" <?= (($_POST['carrier'] ?? '') === 'UPS Ground') ? 'selected' : '' ?>>UPS Ground</option>
                        <option value="DHL Express" <?= (($_POST['carrier'] ?? '') === 'DHL Express') ? 'selected' : '' ?>>DHL Express</option>
                        <option value="USPS Priority" <?= (($_POST['carrier'] ?? '') === 'USPS Priority') ? 'selected' : '' ?>>USPS Priority</option>
                        <option value="Regional Cargo Fleet" <?= (($_POST['carrier'] ?? '') === 'Regional Cargo Fleet') ? 'selected' : '' ?>>Regional Cargo Fleet</option>
                    </select>
                </div>

                <div>
                    <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Gross Weight (kg) <span class="text-rose-500">*</span>
                    </label>
                    <input type="number" step="0.05" min="0.1" name="weight_kg" required value="<?= htmlspecialchars($_POST['weight_kg'] ?? '2.50') ?>" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono">
                </div>

                <div>
                    <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Dimensions (L×W×H cm)
                    </label>
                    <input type="text" name="dimensions" value="<?= htmlspecialchars($_POST['dimensions'] ?? '30x20x15 cm') ?>" placeholder="30x20x15 cm" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono">
                </div>

                <div>
                    <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Pieces / Parcels
                    </label>
                    <input type="number" min="1" max="100" name="pieces" value="<?= htmlspecialchars($_POST['pieces'] ?? '1') ?>" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono">
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                    <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Route / Dispatch Channel
                    </label>
                    <select name="route_remarks" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500">
                        <option value="">-- Direct Hub Dispatch --</option>
                        <?php foreach ($routes as $route): ?>
                            <option value="<?= htmlspecialchars($route['name']) ?>" <?= (($_POST['route_remarks'] ?? '') === $route['name']) ? 'selected' : '' ?>>
                                <?= htmlspecialchars($route['code']) ?> - <?= htmlspecialchars($route['name']) ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div>
                    <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Initial Parcel Status
                    </label>
                    <select name="status" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-semibold">
                        <option value="Received">Received at Sorting Hub</option>
                        <option value="In Transit">In Transit</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="On Hold">On Hold / Inspection</option>
                    </select>
                </div>

                <div>
                    <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Assign to Bulk Box (Optional)
                    </label>
                    <select name="box_id" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono">
                        <option value="">-- No Box (Individual Consignment) --</option>
                        <?php foreach ($openBoxes as $box): ?>
                            <option value="<?= $box['id'] ?>" <?= (($_POST['box_id'] ?? '') == $box['id']) ? 'selected' : '' ?>>
                                <?= htmlspecialchars($box['box_code']) ?> (<?= htmlspecialchars($box['destination']) ?>)
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>
            </div>

            <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Handling Instructions / Notes
                </label>
                <input type="text" name="notes" value="<?= htmlspecialchars($_POST['notes'] ?? '') ?>" placeholder="Fragile, Keep Dry, Handle with Care" class="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500">
            </div>
        </div>

        <!-- Section 4: Package Inspection Photo (Live Camera Snapshot or File Upload) -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                <div class="flex items-center gap-2">
                    <span class="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">5</span>
                    <h2 class="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <i data-lucide="camera" class="w-4 h-4 text-amber-600"></i>
                        <span>Package Inspection Photo <span class="text-slate-400 text-xs font-normal">(Optional)</span></span>
                    </h2>
                </div>
                <span class="text-[11px] text-slate-400">Captured photos are stored securely in <code>uploads/packages/</code></span>
            </div>

            <!-- Dual Choice: Camera Viewfinder OR Computer Upload -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <!-- Camera Button & Live Viewfinder trigger -->
                <div class="p-4 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50 transition-all flex flex-col items-center justify-center text-center space-y-2.5">
                    <div class="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                        <i data-lucide="camera" class="w-6 h-6"></i>
                    </div>
                    <div>
                        <div class="text-xs font-bold text-slate-900">Take a Picture with Camera</div>
                        <div class="text-[11px] text-slate-500">Open webcam or mobile camera to capture package label</div>
                    </div>
                    <button type="button" onclick="openCameraModal()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer">
                        <i data-lucide="aperture" class="w-4 h-4"></i>
                        <span>Open Camera</span>
                    </button>
                </div>

                <!-- File Browser Option -->
                <div class="p-4 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col items-center justify-center text-center space-y-2.5">
                    <div class="w-12 h-12 rounded-2xl bg-slate-200 text-slate-700 flex items-center justify-center">
                        <i data-lucide="upload-cloud" class="w-6 h-6"></i>
                    </div>
                    <div>
                        <div class="text-xs font-bold text-slate-900">Upload Photo from Device</div>
                        <div class="text-[11px] text-slate-500">Select JPG, PNG, or WEBP image file</div>
                    </div>
                    <label class="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer">
                        <i data-lucide="folder" class="w-4 h-4 text-slate-500"></i>
                        <span>Browse Image</span>
                        <input type="file" name="package_file" id="fileUploadInput" accept="image/*" class="hidden" onchange="previewSelectedFile(this)">
                    </label>
                </div>

            </div>

            <!-- Image Preview Box (When either Camera or Uploaded) -->
            <div id="imagePreviewContainer" class="hidden p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                    <img id="imagePreviewImg" src="" alt="Package Inspection Preview" class="w-20 h-20 object-cover rounded-lg border border-slate-700 bg-black">
                    <div>
                        <div class="text-xs font-bold text-white flex items-center gap-1.5">
                            <i data-lucide="check-circle" class="w-4 h-4 text-emerald-400"></i>
                            <span>Inspection Photo Ready</span>
                        </div>
                        <p class="text-[11px] text-slate-400 mt-0.5" id="imagePreviewDesc">Will be linked to this consignment record</p>
                    </div>
                </div>
                <button type="button" onclick="clearPhotoAttachment()" class="px-3 py-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-xs font-semibold text-white transition-colors cursor-pointer">
                    Remove Photo
                </button>
            </div>
        </div>

        <!-- Submit Button -->
        <div class="flex items-center justify-end gap-3 pt-2">
            <button type="reset" class="px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors cursor-pointer">
                Reset Form
            </button>

            <button type="submit" class="px-7 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer">
                <i data-lucide="save" class="w-4 h-4"></i>
                <span>Register Consignment & Generate Label</span>
            </button>
        </div>

    </form>
</div>

<!-- Camera Viewfinder Modal -->
<div id="cameraModal" class="hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
    <div class="bg-slate-900 text-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col">
        <div class="flex items-center justify-between px-5 py-3 border-b border-slate-800">
            <div class="flex items-center gap-2">
                <i data-lucide="camera" class="w-4 h-4 text-indigo-400"></i>
                <h3 class="text-xs font-bold text-white">Live Camera Inspection</h3>
            </div>
            <button type="button" onclick="closeCameraModal()" class="text-slate-400 hover:text-white p-1 rounded-lg">
                <i data-lucide="x" class="w-4 h-4"></i>
            </button>
        </div>

        <div class="relative bg-black min-h-[320px] flex items-center justify-center overflow-hidden">
            <video id="cameraVideo" autoplay playsinline class="w-full h-full object-contain"></video>
            <div class="absolute inset-8 pointer-events-none border-2 border-white/30 rounded-xl flex items-center justify-center">
                <span class="bg-black/50 text-white/70 text-[11px] px-3 py-1 rounded font-mono">Align package or shipping label here</span>
            </div>
        </div>

        <div class="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
            <button type="button" onclick="closeCameraModal()" class="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white">
                Cancel
            </button>

            <button type="button" onclick="snapCameraPhoto()" class="px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer">
                <i data-lucide="aperture" class="w-4 h-4"></i>
                <span>Capture Snapshot</span>
            </button>
        </div>
    </div>
</div>

<script>
    // Real-time Barcode Renderer using JsBarcode
    function updateBarcode(value) {
        const cleanValue = (value || '').trim();
        document.getElementById('barcodeText').textContent = cleanValue;
        if (!cleanValue) return;

        try {
            JsBarcode("#barcodePreview", cleanValue, {
                format: "CODE128",
                lineColor: "#0f172a",
                width: 1.8,
                height: 48,
                displayValue: false,
                margin: 0
            });
        } catch (e) {
            console.warn('Barcode rendering error:', e);
        }
    }

    // Auto-generate fresh tracking number
    function generateNewTrackingNumber() {
        const today = new Date();
        const yy = String(today.getFullYear()).slice(-2);
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const rand = Math.floor(1000 + Math.random() * 9000);
        const code = `EXP${yy}${mm}${dd}-${rand}`;
        
        const input = document.getElementById('trackingInput');
        input.value = code;
        updateBarcode(code);
    }

    // Initial Barcode rendering on page load
    document.addEventListener('DOMContentLoaded', () => {
        const input = document.getElementById('trackingInput');
        if (input && input.value) {
            updateBarcode(input.value);
        }
    });

    // Camera handling
    let cameraStream = null;

    async function openCameraModal() {
        const modal = document.getElementById('cameraModal');
        const video = document.getElementById('cameraVideo');
        modal.classList.remove('hidden');

        try {
            cameraStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
                audio: false
            });
            video.srcObject = cameraStream;
            await video.play();
        } catch (err) {
            alert('Unable to access camera: ' + (err.message || 'Please grant camera permission'));
            closeCameraModal();
        }
    }

    function closeCameraModal() {
        const modal = document.getElementById('cameraModal');
        modal.classList.add('hidden');
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            cameraStream = null;
        }
    }

    function snapCameraPhoto() {
        const video = document.getElementById('cameraVideo');
        if (!video.videoWidth) return;

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        document.getElementById('cameraSnapshotInput').value = dataUrl;

        // Display preview
        const container = document.getElementById('imagePreviewContainer');
        const img = document.getElementById('imagePreviewImg');
        const desc = document.getElementById('imagePreviewDesc');

        img.src = dataUrl;
        desc.textContent = 'Camera snapshot captured (' + video.videoWidth + '×' + video.videoHeight + 'px)';
        container.classList.remove('hidden');

        closeCameraModal();
    }

    function previewSelectedFile(input) {
        if (input.files && input.files[0]) {
            const file = input.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                const container = document.getElementById('imagePreviewContainer');
                const img = document.getElementById('imagePreviewImg');
                const desc = document.getElementById('imagePreviewDesc');

                img.src = e.target.result;
                desc.textContent = file.name + ' (' + (file.size / 1024).toFixed(1) + ' KB)';
                container.classList.remove('hidden');

                // Clear camera input if file was chosen
                document.getElementById('cameraSnapshotInput').value = '';
            };
            reader.readAsDataURL(file);
        }
    }

    function clearPhotoAttachment() {
        document.getElementById('cameraSnapshotInput').value = '';
        const fileInput = document.getElementById('fileUploadInput');
        if (fileInput) fileInput.value = '';
        document.getElementById('imagePreviewContainer').classList.add('hidden');
    }
</script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
