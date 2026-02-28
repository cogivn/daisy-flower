// Any setup scripts you might need go here

// Load .env files
import 'dotenv/config'

// Use a separate test database so schema push doesn't require interactive input
process.env.DATABASE_URL = 'file:./test-voucher-system.db'
