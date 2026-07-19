/**
 * Pagination helper — pure math, no database logic.
 *
 * Takes the requested page, limit, and total record count,
 * returns everything the controller needs for the response.
 */
function buildPaginationMeta(page, limit, totalRecords) {
    const totalPages = Math.ceil(totalRecords / limit)
    const skip = (page - 1) * limit

    return {
        skip,
        page,
        limit,
        totalRecords,
        totalPages
    }
}

module.exports = { buildPaginationMeta }
