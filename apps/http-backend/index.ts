import express from 'express'
import { prisma } from '@repo/db'
import { userRouter } from './routes/user'
import { authMiddleware } from './middleware/authMiddleware'
import { websiteRouter } from './routes/website'
import cors from 'cors'

const app = express()

app.use(cors())
app.use(express.json())
// app.get('/', async (req, res) => {
//     const data = await prisma.user.create({
//         data : {
//             name : "farhan",
//             email : "farhan2005etw@gmail.com"
//         }
//     })
//     res.send(data)
// }) 

app.use(userRouter)
app.use(websiteRouter)

app.listen(3003)