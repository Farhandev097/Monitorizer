import { prisma } from '@repo/db'
import {xAddBulk} from '@repo/redis/client'

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

main()


