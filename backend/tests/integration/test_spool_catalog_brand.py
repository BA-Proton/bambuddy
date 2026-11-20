"""Spool catalogue entries carry the brand they are the default empty spool for."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_catalog_entry_round_trips_a_trimmed_brand(async_client: AsyncClient):
    created = (
        await async_client.post(
            "/api/v1/inventory/catalog", json={"name": "SUNLU bagged", "weight": 203, "brand": " SUNLU "}
        )
    ).json()
    assert created["brand"] == "SUNLU"

    listed = (await async_client.get("/api/v1/inventory/catalog")).json()
    assert next(e for e in listed if e["id"] == created["id"])["brand"] == "SUNLU"


@pytest.mark.asyncio
async def test_catalog_update_keeps_the_brand_unless_sent(async_client: AsyncClient):
    created = (
        await async_client.post(
            "/api/v1/inventory/catalog", json={"name": "Elegoo bagged", "weight": 140, "brand": "Elegoo"}
        )
    ).json()

    kept = (
        await async_client.put(
            f"/api/v1/inventory/catalog/{created['id']}", json={"name": "Elegoo bagged", "weight": 141}
        )
    ).json()
    assert kept["brand"] == "Elegoo"

    cleared = (
        await async_client.put(
            f"/api/v1/inventory/catalog/{created['id']}", json={"name": "Elegoo bagged", "weight": 141, "brand": "  "}
        )
    ).json()
    assert cleared["brand"] is None


@pytest.mark.asyncio
async def test_default_core_weight_setting_round_trips(async_client: AsyncClient):
    assert (await async_client.get("/api/v1/settings/")).json()["default_core_weight"] == 250

    await async_client.put("/api/v1/settings/", json={"default_core_weight": 280})

    assert (await async_client.get("/api/v1/settings/")).json()["default_core_weight"] == 280
    assert (await async_client.get("/api/v1/settings/ui-preferences")).json()["default_core_weight"] == 280
