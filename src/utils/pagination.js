function paginate(items, page, pageSize) {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return {
    data: items.slice(start, end),
    page,
    page_size: pageSize,
    total: items.length
  };
}

function buildPageResponse(pageResult, serializer) {
  return {
    data: pageResult.data.map(serializer),
    page: pageResult.page,
    page_size: pageResult.page_size,
    total: pageResult.total
  };
}

module.exports = {
  paginate,
  buildPageResponse
};
