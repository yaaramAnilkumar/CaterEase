from collections import defaultdict
from datetime import datetime, timedelta
from threading import Lock


class _RateLimiter:
    def __init__(self):
        self._store: dict[str, list[datetime]] = defaultdict(list)
        self._lock = Lock()

    def is_allowed(self, key: str, max_requests: int, window_seconds: int) -> bool:
        now = datetime.utcnow()
        cutoff = now - timedelta(seconds=window_seconds)
        with self._lock:
            self._store[key] = [t for t in self._store[key] if t > cutoff]
            if len(self._store[key]) >= max_requests:
                return False
            self._store[key].append(now)
            return True


rate_limiter = _RateLimiter()
