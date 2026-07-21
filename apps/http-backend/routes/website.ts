import type { Request, Response } from "express";
import { router } from "./route";
import { prisma } from "@repo/db";
import { authMiddleware } from "../middleware/authMiddleware";


export const websiteRouter = router

interface WebsiteId {
    websiteId : string
}

websiteRouter.post('/v1/add-website', authMiddleware, async (req : Request<{}>, res : Response<{}>) => {
    if(!req.body.url) {
        return res.status(402).json({
            success: false,
            messaeg : "Please Enter URL First"
        })
    }
    if(!req.userId) {
        return res.status(402).json({
            success : false,
            message : "You are not authorized"
        })
    }

    try {
                
        const website = await prisma.website.create({
            data : {
                url : req.body.url,
                user_id : req.userId,
                time_added : new Date()
            }
        })

        res.status(201).json({
            success: true,
            message : "Website Added Successfully",
            website
        })
    } catch (error) {
        res.status(503).json({
            success: false,
            message : "Internal Error",
            error
        })        
    }

    


})

websiteRouter.get('/v1/status/:websiteId', authMiddleware, async (req: Request<WebsiteId>, res : Response<{}>) => {
    if(!req.userId) {
        return res.status(401).json({
            success: false,
            messaeg : "You are not authorized"
        })
    }
    
     const websiteid = req.params.websiteId 


    try {
        const website = await prisma.website.findFirst({
            where : {
                id : websiteid,
                user_id : req.userId
            }, 
            include : {
                ticks : {
                    orderBy : [{
                        createdAt : 'desc'
                    }],
                    take : 10
                }
            }
        })

        
        if(!website) {
            return res.status(404).json({
                success: false,
                message : "Website Not Found"
            })
        }

        res.status(201).json({
            success: true,
            website
        })
    } catch (error) {
        res.status(501).json({
            success: false,
            messaege : "Internal Error",
            error
        })        
    }
})

