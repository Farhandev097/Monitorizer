import { CreateUserSchema, SigninSchema, type CreateUserInput, type SigninInput } from "@repo/common/types";
import { router,  } from "./route";
import type { Request, Response } from "express";
import { prisma } from "@repo/db";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { authMiddleware } from "../middleware/authMiddleware";

export const userRouter = router

userRouter.post("/v1/signup", async (req: Request<{}>, res: Response<{}>) => {
    
    const data = CreateUserSchema.safeParse(req.body)

    
    
    try {
        if(!data.success) {
            return res.status(403).json({
                success : false,
                message : "Please Enter Correct Input",
                error : data.error
            })            
        }
        
        const userInput : CreateUserInput = data.data 
        
        const foundUser = await prisma.user.findFirst({
            where : {
                email : userInput.email
            }
        })

        if(foundUser) {
            return res.status(401).json({
                success: false,
                message : "User is Already Registered"
            })
        }

        const salt = await bcrypt.genSalt(10)

        const hashedPassword : any = await bcrypt.hash(userInput.password, salt)

        const user = await prisma.user.create({
            data : {
                email : userInput.email,
                password : hashedPassword,
                name : userInput.name
            }, select : {
                email : true,
                name : true
            }
        })

        if (user) {
            return res.status(200).json({
                success: true,
                message : "User Registered Successfully",
                user
            })
        } else {
            return res.status(501).json({
                message : "Internal Issue"
            })
        }
        
    } catch (error) {
        return res.status(501).json({
            message : "Internal Error",
            error
        })                
    }
        
})

userRouter.post("/v1/signin", async (req : Request<{}>, res : Response<{}>) => {
    const secret : string | undefined = process.env.JWT_SECRET
    if(!secret) return
    const data = SigninSchema.safeParse(req.body)
    
    try {
            
        if(!data.success) {
            return res.status(403).json({
                message : "Please Enter Correct Inputs",
                error : data.error
            })
        }   

        const userInput : SigninInput = data.data 

        const foundUser : any = await prisma.user.findFirst({
            where : {
                email : userInput.email
            }
        })

        if(foundUser) {
            const isMatch = await bcrypt.compare(userInput.password, foundUser.password)
            
            if(!isMatch) {
                return res.status(401).json({
                    success : false,
                    message : "Please Enter Valid Credentials"
                })
            }

            const token = jwt.sign({userId : foundUser.id}, secret)

            res.status(201).json({
                success : true,
                message : "User is signed in Successfully",
                token
            })
                      
        } else {
            return res.status(404).json({
                success: false,
                message : "User Not Found"
            })
        }       
    } catch (error) {
        return res.status(501).json({
            success: false,
            message : "Internal Error",
            error : error
        })
        
    }


})

userRouter.get('/v1/get-user',authMiddleware, async(req :Request<{}>, res : Response<{}>) => {
    const userId = req.userId
    try {
        const userWithWebsites = await prisma.user.findFirst({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            name: true,
            websites: {
              include: {
                ticks: {
                  orderBy: { createdAt: "desc" },
                  take: 1,
                },
              },
            },
          },
        });

        if(!userWithWebsites) {
            return res.status(403).json({
                success : false,
                message : "Invalid Token Please Relogin"
            })       
        } else {
            res.status(201).json({
                success : true,
                userWithWebsites
            })
        }
        
    } catch (error) {
        return res.status(501).send({
            success : false,
            message : "Internal Server Error",
            error
        })        
    }


})
