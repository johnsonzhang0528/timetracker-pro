export const notFound = (req, res, next) => {
  const error = new Error(`找不到路由: ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: error.message
  });
};
