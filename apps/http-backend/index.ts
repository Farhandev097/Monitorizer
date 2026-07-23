import express from 'express'
import { userRouter } from './routes/user'
import { websiteRouter } from './routes/website'
import cors from 'cors'

const app = express()

app.use(cors())
app.use(express.json())
app.get('/', (req, res) => {
     res.send("Welcome to Backend")
})

app.get("/health", (_, res) => {
    res.json({
        status: "ok"
    });
});

app.use(userRouter)
app.use(websiteRouter)

app.listen(3003)
