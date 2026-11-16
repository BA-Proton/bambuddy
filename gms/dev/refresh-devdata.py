"""Copy the production Bambuddy database into devdata/ with every outward connection disabled."""

import shutil
import sqlite3
import sys
from pathlib import Path

PROD_DB = Path.home() / "bambuddy/data/bambuddy.db"
DEV_DIR = Path(__file__).resolve().parents[2] / "devdata"
DEV_DB = DEV_DIR / "bambuddy.db"

DISABLE = [
    "UPDATE printers SET is_active = 0",
    "UPDATE virtual_printers SET enabled = 0, auto_dispatch = 0",
    "UPDATE notification_providers SET enabled = 0",
    "UPDATE smart_plugs SET enabled = 0",
    "UPDATE github_backup_config SET enabled = 0, schedule_enabled = 0",
    "UPDATE connected_apps SET enabled = 0",
    "UPDATE oidc_providers SET is_enabled = 0",
    "DELETE FROM spoolbuddy_devices",
    "UPDATE settings SET value = 'false' WHERE key IN "
    "('mqtt_enabled', 'ha_enabled', 'spoolman_enabled', 'prometheus_enabled', 'user_notifications_enabled', 'use_slicer_api')",
    "UPDATE settings SET value = '' WHERE key IN ('ha_token', 'ha_url', 'prometheus_token', 'mqtt_password')",
]


def main() -> int:
    if DEV_DIR.exists():
        shutil.rmtree(DEV_DIR)
    (DEV_DIR / "logs").mkdir(parents=True)
    src = sqlite3.connect(f"file:{PROD_DB}?mode=ro", uri=True)
    dst = sqlite3.connect(DEV_DB)
    src.backup(dst)
    src.close()
    with dst:
        for stmt in DISABLE:
            dst.execute(stmt)
    checks = {
        "integrity": dst.execute("PRAGMA integrity_check").fetchone()[0],
        "active_printers": dst.execute("SELECT count(*) FROM printers WHERE is_active").fetchone()[0],
        "enabled_vps": dst.execute("SELECT count(*) FROM virtual_printers WHERE enabled").fetchone()[0],
        "enabled_notifiers": dst.execute("SELECT count(*) FROM notification_providers WHERE enabled").fetchone()[0],
        "spoolbuddy_devices": dst.execute("SELECT count(*) FROM spoolbuddy_devices").fetchone()[0],
        "spools": dst.execute("SELECT count(*) FROM spool").fetchone()[0],
    }
    dst.close()
    print(checks)
    ok = checks["integrity"] == "ok" and not any(
        checks[k] for k in ("active_printers", "enabled_vps", "enabled_notifiers", "spoolbuddy_devices")
    )
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
