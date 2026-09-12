const asyncHandler = (fn) => async(req, res, next) => {
      try {
        await fn(req, res, next);
      } catch (error) {
        res.status(error.statusCode || 500).json({
          success: false,
          message: error.message || "something went wrong",
          error: error || "Unknown error"
        });
        //    return(req, res, next) => {
        //        return Promise.resolve(fn(req, res, next)).catch((err) => next(err));
        //    };
      }
};  

export { asyncHandler }