/**
 * Tiny validation helper.
 * Usage: validate(req.body, ['name', 'cost_price']) — throws a 400 error if any field is missing.
 */
function validate(data, requiredFields) {
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      const err = new Error(`Missing required field: ${field}`);
      err.status = 400;
      throw err;
    }
  }
}

module.exports = validate;
