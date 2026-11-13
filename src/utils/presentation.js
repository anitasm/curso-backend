const link = (base, query, page) => {
  const params = new URLSearchParams(query);
  params.set('page', page);
  return base + '?' + params;
};
const paginated = (result, base, query) => ({
  status: 'success', payload: result.docs,
  totalPages: result.totalPages, prevPage: result.prevPage, nextPage: result.nextPage,
  page: result.page, hasPrevPage: result.hasPrevPage, hasNextPage: result.hasNextPage,
  prevLink: result.hasPrevPage ? link(base, query, result.prevPage) : null,
  nextLink: result.hasNextPage ? link(base, query, result.nextPage) : null,
});
module.exports = { link, paginated };
