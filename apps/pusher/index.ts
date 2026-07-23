import { prisma } from '@repo/db'
import {xAddBulk} from '@repo/redis/client'
import express from 'express'

async function main () {
    let websites = await prisma.website.findMany({
        select : {
            url : true,
            id : true
        }
    })
    

    const res = await xAddBulk(websites.map(w => ({
        url: w.url,
        id : w.id
    })));

}

setInterval(() => {
    main()
}, 3 * 1000 * 60)

const app = express()

app.get('/', (req, res) => {
    res.send("Welocome to Pusher")    
})

app.get("/health", (_, res) => {
    res.json({
        status: "ok"
    });
});




app.listen(3001)

main()


