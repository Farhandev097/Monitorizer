import type { NextFunction, Request, Response } from "express";
import jwt from 'jsonwebtoken'
import "dotenv/config";



export const authMiddleware = (req : Request<{}>, res : Response<{}>, next : NextFunction) => {
    const secret : string | undefined = process.env.JWT_SECRET
    if(!secret) return
    const authHeader = req.headers['authorization'] ?? ""
    
    const token : string | undefined = authHeader && authHeader.split(' ')[1]
    
    if(!token) return
  
    

    const decoded : any = jwt.verify(token, secret)
    req.userId = decoded.userId
    
    next()    
}