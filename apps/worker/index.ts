import { xAckBulk, xReadGroup } from "@repo/redis/client"
import axios from 'axios'
import { prisma } from "@repo/db"
import express from 'express'

const app = express()



const REGION_ID = "5704ea46-fc48-4203-b0b4-e22bf447963a"
const WORKER_ID = "worker-1"

if(!REGION_ID) {
     throw new Error("Region not provided")
}

if(!WORKER_ID) {
    throw new Error("Worker not provided")
}

async function main () {
while(1) {

        const res : any = await xReadGroup(REGION_ID, WORKER_ID)
        if(!res) {
          continue
        }
        const messages = res[0].messages;

        const promises = messages.map(({ message } : {message : any}) =>
            fetchWebsite(message.url, message.id)
          );
        await Promise.all(promises)        
        
        const eventIds = res[0].messages.map((item: any) => item.id);

        xAckBulk(REGION_ID!, eventIds);

         }
}

async function fetchWebsite(url : string, websiteId : string) {
  return new Promise<void>((resolve, reject) => {
    const startTime = Date.now()

  axios.get(url)
    .then(async () => {
      const endtime = Date.now()
      await prisma.website_tick.create({
        data: {
          response_time_ms : endtime - startTime,
          status: "Up",
          website_id : websiteId,
          region_id : REGION_ID
        }
      })
      resolve()      
    })
    .catch(async () => {
      const endTime = Date.now()
      await prisma.website_tick.create({
        data : {
          response_time_ms : startTime - endTime,
          status: 'Down',
          website_id : websiteId,
          region_id : REGION_ID
        }
      })
      resolve()
    })
  })  
}

app.get('/', (req, res) => {
     res.send("Welcome to Worker")
})

app.listen(3002)

main()
