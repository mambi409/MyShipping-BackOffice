    </main>

    <footer class="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 no-print mt-auto">
        <div class="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                <span class="font-medium text-slate-700">CargoTracker Express</span>
                <span class="text-slate-400">&bull; Native PHP + MySQL Logistics System</span>
            </div>
            <div class="text-slate-400">
                Logged in as <strong><?= htmlspecialchars($user['username'] ?? 'Guest') ?></strong> &bull; <?= date('Y') ?> All Rights Reserved
            </div>
        </div>
    </footer>

    <!-- Initialize Lucide icons on page load -->
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            if (window.lucide) {
                lucide.createIcons();
            }
        });
    </script>
</body>
</html>
