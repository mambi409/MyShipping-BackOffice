<?php
/**
 * Printable Thermal 4x6" Shipping Label & Customer Receipt
 */
require_once __DIR__ . '/includes/auth.php';
requireLogin();

$db = getDBConnection();
$shipmentId = intval($_GET['id'] ?? 0);
$type       = $_GET['type'] ?? 'label'; // 'label' or 'receipt'

$stmt = $db->prepare("SELECT s.*, b.box_code, u.full_name as dispatcher_name 
                      FROM shipments s 
                      LEFT JOIN boxes b ON s.box_id = b.id 
                      LEFT JOIN users u ON s.created_by = u.id 
                      WHERE s.id = :id LIMIT 1");
$stmt->execute([':id' => $shipmentId]);
$shipment = $stmt->fetch();

if (!$shipment) {
    die("Shipment record not found.");
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $type === 'receipt' ? 'Receipt' : 'Shipping Label' ?> - <?= htmlspecialchars($shipment['tracking_number']) ?></title>
    
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@500;700;800&display=swap" rel="stylesheet">

    <style>
        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background-color: #f1f5f9;
        }
        .font-mono {
            font-family: 'JetBrains Mono', monospace;
        }
        @media print {
            body {
                background: none;
                margin: 0;
                padding: 0;
            }
            .no-print {
                display: none !important;
            }
            .print-page {
                border: none !important;
                box-shadow: none !important;
                margin: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                page-break-after: avoid;
            }
            @page {
                margin: 0;
                size: <?= $type === 'receipt' ? '80mm auto' : '4in 6in' ?>;
            }
        }
    </style>
</head>
<body class="p-4 sm:p-8 flex flex-col items-center justify-start min-h-screen">

    <!-- Top Action Bar (hidden on print) -->
    <div class="max-w-md w-full mb-4 flex items-center justify-between no-print">
        <a href="shipments.php" class="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1">
            &larr; Back to Shipments
        </a>

        <div class="flex items-center gap-2">
            <button onclick="window.print()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                <span>Print <?= $type === 'receipt' ? 'Receipt' : 'Label' ?></span>
            </button>
        </div>
    </div>

    <?php if ($type === 'label'): ?>
        <!-- ========================================== -->
        <!-- 4x6" STANDARD LOGISTICS SHIPPING LABEL     -->
        <!-- ========================================== -->
        <div class="print-page w-[384px] bg-white border-2 border-black rounded-lg p-5 text-black shadow-lg">
            
            <!-- Carrier & Priority Header -->
            <div class="border-b-2 border-black pb-3 flex items-center justify-between">
                <div>
                    <span class="text-[11px] font-bold uppercase tracking-widest block font-mono">EXPRESS LOGISTICS</span>
                    <h1 class="text-2xl font-extrabold uppercase tracking-tight leading-none mt-0.5"><?= htmlspecialchars($shipment['carrier']) ?></h1>
                </div>
                <div class="text-right">
                    <span class="inline-block border-2 border-black px-2 py-1 text-xs font-black uppercase tracking-wider font-mono">
                        PRIORITY
                    </span>
                    <div class="text-[10px] font-bold font-mono mt-1"><?= htmlspecialchars($shipment['route_remarks'] ?: 'AIR/SURFACE') ?></div>
                </div>
            </div>

            <!-- SHIP FROM -->
            <div class="border-b border-black py-2.5 text-[11px] leading-tight">
                <div class="text-[9px] font-bold font-mono uppercase text-slate-600">SHIP FROM:</div>
                <div class="font-bold text-xs mt-0.5"><?= htmlspecialchars($shipment['sender_name']) ?></div>
                <div><?= htmlspecialchars($shipment['sender_city']) ?>, <?= htmlspecialchars($shipment['sender_country']) ?></div>
                <div class="font-mono text-[10px] mt-0.5">TEL: <?= htmlspecialchars($shipment['sender_phone']) ?></div>
            </div>

            <!-- SHIP TO (Large Delivery Destination Block) -->
            <div class="border-b-2 border-black py-4">
                <div class="text-[10px] font-bold font-mono uppercase text-slate-700">SHIP TO:</div>
                <div class="text-base font-extrabold tracking-tight mt-0.5 uppercase">
                    <?= htmlspecialchars($shipment['receiver_name']) ?>
                </div>
                <div class="text-xs font-medium mt-1 leading-snug">
                    <?= nl2br(htmlspecialchars($shipment['receiver_address'])) ?>
                </div>
                <div class="text-sm font-bold uppercase mt-1">
                    <?= htmlspecialchars($shipment['receiver_city']) ?>, <?= htmlspecialchars($shipment['receiver_country']) ?>
                </div>
                <div class="font-mono text-xs font-semibold mt-1">
                    TEL: <?= htmlspecialchars($shipment['receiver_phone']) ?>
                </div>
            </div>

            <!-- Key Specs: Weight, Pieces, Date -->
            <div class="border-b-2 border-black py-2.5 grid grid-cols-3 text-center text-xs font-mono">
                <div class="border-r border-black pr-2">
                    <span class="block text-[9px] text-slate-600 font-bold uppercase">WEIGHT</span>
                    <strong class="text-sm"><?= number_format($shipment['weight_kg'], 2) ?> KG</strong>
                </div>
                <div class="border-r border-black px-2">
                    <span class="block text-[9px] text-slate-600 font-bold uppercase">PIECES</span>
                    <strong class="text-sm"><?= $shipment['pieces'] ?> PC</strong>
                </div>
                <div class="pl-2">
                    <span class="block text-[9px] text-slate-600 font-bold uppercase">DIMENSIONS</span>
                    <strong class="text-[11px]"><?= htmlspecialchars($shipment['dimensions'] ?: 'STD') ?></strong>
                </div>
            </div>

            <!-- Master Scannable Barcode -->
            <div class="py-4 text-center">
                <svg id="labelBarcode" class="max-w-full mx-auto"></svg>
                <div class="text-xs font-mono font-bold tracking-widest mt-1">
                    <?= htmlspecialchars($shipment['tracking_number']) ?>
                </div>
            </div>

            <!-- Footer Meta & Box ID -->
            <div class="border-t border-black pt-2 flex items-center justify-between text-[10px] font-mono">
                <div>
                    <?php if (!empty($shipment['box_code'])): ?>
                        <span>BOX: <strong><?= htmlspecialchars($shipment['box_code']) ?></strong></span>
                    <?php else: ?>
                        <span>STATUS: <?= htmlspecialchars($shipment['status']) ?></span>
                    <?php endif; ?>
                </div>
                <div><?= date('Y-m-d H:i', strtotime($shipment['created_at'])) ?></div>
            </div>

        </div>

    <?php else: ?>
        <!-- ========================================== -->
        <!-- 80mm THERMAL RECEIPT (CUSTOMER COPY)       -->
        <!-- ========================================== -->
        <div class="print-page w-[300px] bg-white border border-slate-300 rounded-lg p-5 text-slate-900 shadow-lg text-xs">
            <div class="text-center pb-3 border-b border-dashed border-slate-300">
                <div class="font-extrabold text-base tracking-tight">CARGOTRACKER EXPRESS</div>
                <div class="text-[10px] text-slate-500 mt-0.5">Official Consignment Receipt</div>
                <div class="text-[10px] font-mono text-slate-400 mt-1"><?= date('M d, Y H:i:s', strtotime($shipment['created_at'])) ?></div>
            </div>

            <div class="py-3 border-b border-dashed border-slate-300 space-y-1 font-mono text-[11px]">
                <div class="flex justify-between">
                    <span class="text-slate-500">Tracking:</span>
                    <strong class="text-slate-900"><?= htmlspecialchars($shipment['tracking_number']) ?></strong>
                </div>
                <div class="flex justify-between">
                    <span class="text-slate-500">Carrier:</span>
                    <span><?= htmlspecialchars($shipment['carrier']) ?></span>
                </div>
                <div class="flex justify-between">
                    <span class="text-slate-500">Weight:</span>
                    <span><?= number_format($shipment['weight_kg'], 2) ?> kg</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-slate-500">Pieces:</span>
                    <span><?= $shipment['pieces'] ?></span>
                </div>
                <div class="flex justify-between">
                    <span class="text-slate-500">Status:</span>
                    <span class="font-bold text-slate-900"><?= htmlspecialchars($shipment['status']) ?></span>
                </div>
            </div>

            <div class="py-3 border-b border-dashed border-slate-300 space-y-2 text-[11px]">
                <div>
                    <span class="text-[9px] font-bold uppercase text-slate-400 block font-mono">Shipper (From):</span>
                    <strong><?= htmlspecialchars($shipment['sender_name']) ?></strong> (<?= htmlspecialchars($shipment['sender_city']) ?>)
                </div>
                <div>
                    <span class="text-[9px] font-bold uppercase text-slate-400 block font-mono">Consignee (To):</span>
                    <strong><?= htmlspecialchars($shipment['receiver_name']) ?></strong><br>
                    <?= htmlspecialchars($shipment['receiver_city']) ?>, <?= htmlspecialchars($shipment['receiver_country']) ?>
                </div>
            </div>

            <div class="py-4 text-center">
                <svg id="labelBarcode" class="max-w-full mx-auto"></svg>
                <div class="text-[10px] font-mono text-slate-600 mt-1"><?= htmlspecialchars($shipment['tracking_number']) ?></div>
            </div>

            <div class="text-center text-[10px] text-slate-400 pt-2 border-t border-dashed border-slate-300">
                Thank you for choosing CargoTracker Express.<br>
                Keep this receipt for package collection.
            </div>
        </div>
    <?php endif; ?>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            try {
                JsBarcode("#labelBarcode", "<?= addslashes($shipment['tracking_number']) ?>", {
                    format: "CODE128",
                    lineColor: "#000000",
                    width: <?= $type === 'receipt' ? '1.5' : '2.0' ?>,
                    height: <?= $type === 'receipt' ? '40' : '55' ?>,
                    displayValue: false,
                    margin: 0
                });
            } catch (e) {
                console.error(e);
            }
        });
    </script>
</body>
</html>
