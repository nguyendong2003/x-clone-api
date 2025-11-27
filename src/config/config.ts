// Kiểm tra xem có tham số --production trong command line không
import argv from 'minimist'

const options = argv(process.argv.slice(2))

export const isProduction = Boolean(options.production)
