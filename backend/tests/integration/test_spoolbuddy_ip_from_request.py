"""SPOOLBUDDY_IP_FROM_REQUEST: store the request's source address, not the reported one."""

from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from backend.app.models.spoolbuddy_device import SpoolBuddyDevice

API = "/api/v1/spoolbuddy"
# httpx's ASGITransport presents every request as coming from 127.0.0.1.
REQUEST_SOURCE = "127.0.0.1"


async def _register(client: AsyncClient, device_id: str, reported: str):
    with patch("backend.app.api.routes.spoolbuddy.ws_manager") as mock_ws:
        mock_ws.broadcast = AsyncMock()
        return await client.post(
            f"{API}/devices/register",
            json={"device_id": device_id, "hostname": device_id, "ip_address": reported, "firmware_version": "1.3.0"},
        )


async def _heartbeat(client: AsyncClient, device_id: str, reported: str):
    with patch("backend.app.api.routes.spoolbuddy.ws_manager") as mock_ws:
        mock_ws.broadcast = AsyncMock()
        return await client.post(
            f"{API}/devices/{device_id}/heartbeat",
            json={"nfc_ok": True, "scale_ok": True, "uptime_s": 60, "ip_address": reported},
        )


async def _stored_ip(db_session, device_id: str) -> str:
    result = await db_session.execute(
        select(SpoolBuddyDevice.ip_address).where(SpoolBuddyDevice.device_id == device_id)
    )
    return result.scalar_one()


@pytest.mark.asyncio
@pytest.mark.integration
async def test_reported_ip_is_stored_by_default(async_client: AsyncClient, db_session, monkeypatch):
    monkeypatch.delenv("SPOOLBUDDY_IP_FROM_REQUEST", raising=False)

    assert (await _register(async_client, "sb-default", "192.168.4.25")).json()["ip_address"] == "192.168.4.25"
    assert (await _heartbeat(async_client, "sb-default", "192.168.4.26")).status_code == 200
    assert await _stored_ip(db_session, "sb-default") == "192.168.4.26"


@pytest.mark.asyncio
@pytest.mark.integration
async def test_request_source_is_stored_when_enabled(async_client: AsyncClient, db_session, monkeypatch):
    monkeypatch.setenv("SPOOLBUDDY_IP_FROM_REQUEST", "true")

    assert (await _register(async_client, "sb-source", "192.168.4.25")).json()["ip_address"] == REQUEST_SOURCE
    assert (await _heartbeat(async_client, "sb-source", "192.168.4.26")).status_code == 200
    assert await _stored_ip(db_session, "sb-source") == REQUEST_SOURCE


@pytest.mark.asyncio
@pytest.mark.integration
async def test_unrecognised_value_keeps_reported_ip(async_client: AsyncClient, monkeypatch):
    monkeypatch.setenv("SPOOLBUDDY_IP_FROM_REQUEST", "maybe")

    assert (await _register(async_client, "sb-typo", "192.168.4.25")).json()["ip_address"] == "192.168.4.25"
