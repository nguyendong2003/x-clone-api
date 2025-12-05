import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary, Query } from 'express-serve-static-core'

/**
 * Hàm bao bọc Request Handler để xử lý lỗi bất đồng bộ (Async Error Handling).
 * Sử dụng Generics (P, ResBody, ReqBody, ReqQuery) để giữ nguyên kiểu dữ liệu
 * tùy chỉnh của Request/Response mà controller định nghĩa.
 */
export const wrapRequestHandler = <P = ParamsDictionary, ResBody = any, ReqBody = any, ReqQuery = Query>(
  // Định nghĩa kiểu cho controller function (func) với các generics đã truyền vào
  func: (req: Request<P, ResBody, ReqBody, ReqQuery>, res: Response<ResBody>, next: NextFunction) => Promise<any> // Đổi Promise<void> thành Promise<any> hoặc giữ nguyên nếu controller trả về Response
) => {
  // Trả về một Express Request Handler
  return async (req: Request<P, ResBody, ReqBody, ReqQuery>, res: Response<ResBody>, next: NextFunction) => {
    try {
      // Gọi controller function
      await func(req, res, next)
    } catch (error) {
      // Chuyển lỗi sang Express Error Handler
      next(error)
    }
  }
}
