import { createClient } from "redis";
import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(import.meta.dir, ".env"),
});


const client = await createClient({
     url : process.env.REDIS_URL 
})
    .on('error', (err) => console.log('Redis Client Error', err))
    .connect()
try {
    await client.xGroupCreate(
        "betteruptime:websites",
        "5704ea46-fc48-4203-b0b4-e22bf447963a",
        "$",
        {MKSTREAM : true}
    )    
} catch (error : any) {
    if(!error.message.includes("BUSYGROUP")) {
        throw error
    }    
}
type WebsiteEvent = {url: string, id: string}


async function xAdd({url, id} : WebsiteEvent) {
    await client.xAdd(
        'betteruptime:websites', '*', {
            url,
            id
        }
    )
} 


export async function xAddBulk(websites: WebsiteEvent[]) {
    for (let i = 0; i < websites.length; i++) {
        await xAdd({
            url : websites[i]?.url!,
            id : websites[i]?.id!
        })
    }
}

export async function xReadGroup (consumerGroup : string, workerId : string) : Promise<any> {
    const res : any = await client.xReadGroup(consumerGroup, workerId,
     [{ key: 'betteruptime:websites', id : '>'}],
      {
        'COUNT': 3
    });
    return res
}

 async function xAck(consumerGroup : string, eventId : string) {
    await client.xAck('betteruptime:websites', consumerGroup, eventId)
}

export async function xAckBulk(consumerGroup : string, eventIds : string[]) {
    eventIds.map(eventId => xAck(consumerGroup, eventId))
}