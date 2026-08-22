# Local-only overrides. Everything NOT listed here is left to the backend's own .env, which the
# repo's loader reads with `override: false` — so these win and nothing else is touched.
export DATABASE_URL="postgresql://spoon:spoon_local_dev@127.0.0.1:5433/spoon"
export REDIS_URL="redis://127.0.0.1:6380"
export LOGIN_OTP_PROVIDER=fake
export LOGIN_OTP_DEV_ECHO=true
export BOOKING_ALLOWED_DURATION_MINUTES=30,45,60,90,120,150
export NODE_ENV=development
export MSG91_AUTH_KEY=placeholder-not-a-real-key
export MSG91_TEMPLATE_ID=placeholder-template
# RAZORPAY_* deliberately NOT overridden: the repo's own value is a `rzp_test` key, which is
# Razorpay's sandbox. Orders created against it move no money, and using it is the only way to
# prove the order contract end to end.
# Only the WEBHOOK secret is a placeholder: the repo's .env carries none, and it is used solely
# to verify inbound Razorpay webhooks, which nothing in this local run exercises. The key id and
# key secret stay the repo's real sandbox pair so order creation is genuine.
export RAZORPAY_WEBHOOK_SECRET=local-development-webhook-secret-not-real
