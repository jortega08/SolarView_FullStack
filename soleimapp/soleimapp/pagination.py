"""
P2 — Cursor-based pagination for time-series endpoints.

Cursor pagination is the only safe option for high-cardinality, append-only
tables like Consumo and Bateria: offset-based pagination degrades to O(N) on
Postgres as pages increase, because the DB must scan all N preceding rows.
Cursor pagination jumps directly to the right position using a keyset index.

Usage (in a ViewSet):
    from soleimapp.pagination import TimeSeriesCursorPagination
    pagination_class = TimeSeriesCursorPagination

The cursor is an opaque base64-encoded string so clients never need to
construct it manually — they just follow `next` and `previous` links.
"""

from rest_framework.pagination import CursorPagination


class TimeSeriesCursorPagination(CursorPagination):
    """
    Cursor paginator for time-ordered telemetry data.
    Sorts by descending primary timestamp (most recent first).
    """

    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 500
    ordering = "-fecha"  # Consumo.fecha — override per view if needed


class BateriaTimeSeriesCursorPagination(CursorPagination):
    """Same pattern for Bateria (different timestamp field name)."""

    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 500
    ordering = "-fecha_registro"
