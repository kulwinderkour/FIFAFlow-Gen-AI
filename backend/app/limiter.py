from slowapi import Limiter
from slowapi.util import get_remote_address

# Define rate limiter with default limits (though specific endpoints will override this)
limiter = Limiter(key_func=get_remote_address)
